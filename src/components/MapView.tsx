import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { findNearestIndexByLatLng, interpolateAtDistance } from '../lib/geo'
import { MAP_STYLES } from '../lib/mapStyles'
import { comparePace, PACE_COMPARISON_COLORS } from '../lib/pace'
import { useTrackContext } from '../state/TrackContext'
import type { FeedMarker } from '../types/track'
import { MapStyleSwitch } from './MapStyleSwitch'

const FEED_ICONS: Record<FeedMarker['type'], L.DivIcon> = {
  food: L.divIcon({
    html: '<div class="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs shadow">🍌</div>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  drink: L.divIcon({
    html: '<div class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs shadow">💧</div>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
}

/** Fits the map view to the track's bounds whenever a new track is loaded. */
function FitBoundsOnLoad({ trackId }: { trackId: string | null }) {
  const map = useMap()
  const { state } = useTrackContext()

  useEffect(() => {
    if (!state.track || state.track.points.length === 0) return
    const bounds = L.latLngBounds(state.track.points.map((p) => [p.lat, p.lon] as [number, number]))
    map.fitBounds(bounds, { padding: [24, 24] })
    // Only re-fit when the track identity changes, not on every point/state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId])

  return null
}

/** Draws the route as a Polyline and syncs hover state map -> profile: mousemove over the
 * line finds the nearest track point and dispatches SET_HOVER_DISTANCE, throttled to one
 * dispatch per animation frame since Leaflet fires mousemove far more often than that. */
function RoutePolyline() {
  const { state, dispatch } = useTrackContext()
  const rafPendingRef = useRef(false)
  const latestLatLngRef = useRef<{ lat: number; lng: number } | null>(null)

  const positions = useMemo<[number, number][]>(
    () => state.track?.points.map((p) => [p.lat, p.lon]) ?? [],
    [state.track],
  )

  if (!state.track || positions.length === 0) return null

  return (
    <Polyline
      positions={positions}
      pathOptions={{ color: '#2563eb', weight: 4 }}
      eventHandlers={{
        mousemove: (e) => {
          latestLatLngRef.current = e.latlng
          if (rafPendingRef.current) return
          rafPendingRef.current = true
          requestAnimationFrame(() => {
            rafPendingRef.current = false
            const latlng = latestLatLngRef.current
            if (!latlng || !state.track) return
            const idx = findNearestIndexByLatLng(state.track.points, latlng.lat, latlng.lng)
            dispatch({ type: 'SET_HOVER_DISTANCE', distanceMeters: state.track.points[idx].distance })
          })
        },
        mouseout: () => dispatch({ type: 'SET_HOVER_DISTANCE', distanceMeters: null }),
      }}
    />
  )
}

/** Re-draws each pace zone's stretch of the route on top of the base line, colored by
 * whether it's faster/slower than the global pace — same colors as the profile bands. */
function ZoneSegments() {
  const { state } = useTrackContext()
  const track = state.track
  const segments = useMemo(() => {
    if (!track) return []
    return state.zones.map((zone) => {
      const positions: [number, number][] = []
      const start = interpolateAtDistance(track.points, zone.startDistanceMeters)
      if (start) positions.push([start.lat, start.lon])
      for (const p of track.points) {
        if (p.distance > zone.startDistanceMeters && p.distance < zone.endDistanceMeters) positions.push([p.lat, p.lon])
      }
      const end = interpolateAtDistance(track.points, zone.endDistanceMeters)
      if (end) positions.push([end.lat, end.lon])
      const color = PACE_COMPARISON_COLORS[comparePace(zone.paceSecPerKm, state.settings.globalPaceSecPerKm)].border
      return { id: zone.id, positions, color }
    })
  }, [track, state.zones, state.settings.globalPaceSecPerKm])

  return (
    <>
      {segments.map((s) => (
        <Polyline key={s.id} positions={s.positions} interactive={false} pathOptions={{ color: s.color, weight: 6, opacity: 0.9 }} />
      ))}
    </>
  )
}

/** Highlights the point on the map matching the current hoverDistanceMeters, whichever side
 * (map or profile) originated the hover. */
function HoverPositionMarker() {
  const { state } = useTrackContext()
  if (!state.track || state.hoverDistanceMeters === null) return null

  const position = interpolateAtDistance(state.track.points, state.hoverDistanceMeters)
  if (!position) return null

  return (
    <CircleMarker
      center={[position.lat, position.lon]}
      radius={7}
      pathOptions={{ color: '#1d4ed8', fillColor: '#60a5fa', fillOpacity: 1, weight: 2 }}
    />
  )
}

function FeedMarkerPins() {
  const { state } = useTrackContext()
  if (!state.track) return null

  return (
    <>
      {state.markers.map((marker) => {
        const position = interpolateAtDistance(state.track!.points, marker.distanceMeters)
        if (!position) return null
        return (
          <Marker
            key={marker.id}
            position={[position.lat, position.lon]}
            icon={FEED_ICONS[marker.type]}
            alt={marker.label ?? marker.type}
          />
        )
      })}
    </>
  )
}

export function MapView() {
  const { state } = useTrackContext()
  const style = MAP_STYLES[state.settings.mapStyle]

  return (
    <div className="relative isolate z-0 h-80 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 sm:h-96">
      <MapContainer center={[40.4168, -3.7038]} zoom={6} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          key={state.settings.mapStyle}
          url={style.url}
          attribution={style.attribution}
          maxZoom={style.maxZoom}
          maxNativeZoom={style.maxNativeZoom}
          subdomains={style.subdomains}
        />
        <FitBoundsOnLoad trackId={state.track?.id ?? null} />
        <RoutePolyline />
        <ZoneSegments />
        <HoverPositionMarker />
        <FeedMarkerPins />
      </MapContainer>
      <MapStyleSwitch />
    </div>
  )
}
