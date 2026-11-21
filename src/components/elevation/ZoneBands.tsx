import { useRef } from 'react'
import { useTrackContext } from '../../state/TrackContext'
import { comparePace, PACE_COMPARISON_COLORS } from '../../lib/pace'
import type { PaceZone } from '../../types/track'
import { clientPointToViewBox, PROFILE_MARGIN, PROFILE_VIEW_HEIGHT, type ProfileScales } from './scales'

const MIN_ZONE_LENGTH_METERS = 20
const HANDLE_HIT_WIDTH = 10

export function ZoneBands({
  zones,
  totalDistanceMeters,
  globalPaceSecPerKm,
  scales,
}: {
  zones: PaceZone[]
  totalDistanceMeters: number
  globalPaceSecPerKm: number | null
  scales: ProfileScales
}) {
  const { dispatch } = useTrackContext()
  const sortedZones = [...zones].sort((a, b) => a.startDistanceMeters - b.startDistanceMeters)

  return (
    <g>
      {sortedZones.map((zone, index) => {
        const prevZone = sortedZones[index - 1]
        const nextZone = sortedZones[index + 1]
        const lowerBound = prevZone ? prevZone.endDistanceMeters : 0
        const upperBound = nextZone ? nextZone.startDistanceMeters : totalDistanceMeters

        return (
          <ZoneBand
            key={zone.id}
            zone={zone}
            lowerBound={lowerBound}
            upperBound={upperBound}
            globalPaceSecPerKm={globalPaceSecPerKm}
            scales={scales}
            dispatch={dispatch}
          />
        )
      })}
    </g>
  )
}

function ZoneBand({
  zone,
  lowerBound,
  upperBound,
  globalPaceSecPerKm,
  scales,
  dispatch,
}: {
  zone: PaceZone
  lowerBound: number
  upperBound: number
  globalPaceSecPerKm: number | null
  scales: ProfileScales
  dispatch: ReturnType<typeof useTrackContext>['dispatch']
}) {
  const draggingEdgeRef = useRef<'start' | 'end' | null>(null)

  const comparison = comparePace(zone.paceSecPerKm, globalPaceSecPerKm)
  const colors = PACE_COMPARISON_COLORS[comparison]

  const x1 = scales.x(zone.startDistanceMeters)
  const x2 = scales.x(zone.endDistanceMeters)
  const top = PROFILE_MARGIN.top
  const bottom = PROFILE_VIEW_HEIGHT - PROFILE_MARGIN.bottom

  function startDrag(edge: 'start' | 'end', e: React.PointerEvent<SVGElement>) {
    e.stopPropagation()
    const svg = e.currentTarget.ownerSVGElement
    if (!svg) return
    draggingEdgeRef.current = edge
    ;(e.target as Element).setPointerCapture(e.pointerId)

    function handleMove(moveEvent: PointerEvent) {
      const { x } = clientPointToViewBox(svg!, moveEvent.clientX, moveEvent.clientY)
      const distance = scales.x.invert(x)

      if (edge === 'start') {
        const clamped = Math.min(Math.max(distance, lowerBound), zone.endDistanceMeters - MIN_ZONE_LENGTH_METERS)
        dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { startDistanceMeters: Math.max(0, clamped) } })
      } else {
        const clamped = Math.max(Math.min(distance, upperBound), zone.startDistanceMeters + MIN_ZONE_LENGTH_METERS)
        dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { endDistanceMeters: clamped } })
      }
    }

    function handleUp() {
      draggingEdgeRef.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <g>
      <rect x={x1} y={top} width={Math.max(x2 - x1, 0)} height={bottom - top} fill={colors.fill} stroke={colors.border} strokeWidth={1} />
      {/* Drag handles at each edge — narrow hit targets, stop propagation so dragging a
          handle never also triggers the root's click-to-place-marker behavior. */}
      <rect
        x={x1 - HANDLE_HIT_WIDTH / 2}
        y={top}
        width={HANDLE_HIT_WIDTH}
        height={bottom - top}
        fill="transparent"
        className="cursor-ew-resize"
        onPointerDown={(e) => startDrag('start', e)}
        onClick={(e) => e.stopPropagation()}
      />
      <rect
        x={x2 - HANDLE_HIT_WIDTH / 2}
        y={top}
        width={HANDLE_HIT_WIDTH}
        height={bottom - top}
        fill="transparent"
        className="cursor-ew-resize"
        onPointerDown={(e) => startDrag('end', e)}
        onClick={(e) => e.stopPropagation()}
      />
    </g>
  )
}
