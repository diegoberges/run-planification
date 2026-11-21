/** A single point of a track, after it has gone through the shared build pipeline
 * (haversine distance + elevation smoothing) — see `src/lib/geo.ts`. */
export interface TrackPoint {
  lat: number
  lon: number
  /** Smoothed elevation in meters. This is what the rest of the app renders/computes with. */
  ele: number
  /** Original, unsmoothed elevation in meters, kept around for debugging. */
  eleRaw?: number
  /** Cumulative distance in meters from the start of the track. */
  distance: number
}

export type TrackSource = 'gpx' | 'strava'

export interface Track {
  id: string
  name: string
  source: TrackSource
  /** Present when source === 'strava'. */
  sourceActivityId?: number
  /** Sorted ascending by `distance`. */
  points: TrackPoint[]
  totalDistanceMeters: number
  totalElevationGainMeters: number
  createdAt: string
}

export type FeedMarkerType = 'food' | 'drink'

export interface FeedMarker {
  id: string
  type: FeedMarkerType
  distanceMeters: number
  label?: string
}

export interface PaceZone {
  id: string
  startDistanceMeters: number
  endDistanceMeters: number
  paceSecPerKm: number
  label?: string
}

export type MapStyleId = 'road' | 'trail'

export interface AppSettings {
  globalPaceSecPerKm: number | null
  mapStyle: MapStyleId
}

export interface AppUiState {
  importPanelOpen: boolean
  /** When set, the next click on the elevation profile places a marker of this type. */
  placingMarkerType: FeedMarkerType | null
}

export interface AppState {
  track: Track | null
  zones: PaceZone[]
  markers: FeedMarker[]
  settings: AppSettings
  /** Cumulative distance in meters currently hovered on the map or the elevation profile.
   * Transient — never persisted to localStorage. */
  hoverDistanceMeters: number | null
  ui: AppUiState
}

/** The subset of AppState that gets written to localStorage. */
export type PersistedAppState = Pick<AppState, 'track' | 'zones' | 'markers' | 'settings'>

/** A raw lat/lon/elevation point, before distance/smoothing processing — the shared shape
 * produced by both the GPX parser and the Strava streams converter. */
export interface RawPoint {
  lat: number
  lon: number
  ele: number | null
}
