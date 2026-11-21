import { useTrackContext } from '../../state/TrackContext'
import type { FeedMarker } from '../../types/track'
import { clientPointToViewBox, PROFILE_MARGIN, type ProfileScales } from './scales'

const PIN_GLYPH: Record<FeedMarker['type'], string> = { food: '🍌', drink: '💧' }
const PIN_COLOR: Record<FeedMarker['type'], string> = { food: '#f59e0b', drink: '#0ea5e9' }

export function MarkerPins({
  markers,
  totalDistanceMeters,
  scales,
}: {
  markers: FeedMarker[]
  totalDistanceMeters: number
  scales: ProfileScales
}) {
  const { dispatch } = useTrackContext()

  function startDrag(marker: FeedMarker, e: React.PointerEvent<SVGElement>) {
    e.stopPropagation()
    const svg = e.currentTarget.ownerSVGElement
    if (!svg) return
    ;(e.target as Element).setPointerCapture(e.pointerId)

    function handleMove(moveEvent: PointerEvent) {
      const { x } = clientPointToViewBox(svg!, moveEvent.clientX, moveEvent.clientY)
      const distance = Math.min(Math.max(scales.x.invert(x), 0), totalDistanceMeters)
      dispatch({ type: 'UPDATE_MARKER', id: marker.id, patch: { distanceMeters: distance } })
    }

    function handleUp() {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <g>
      {markers.map((marker) => {
        const x = scales.x(marker.distanceMeters)
        return (
          <g
            key={marker.id}
            transform={`translate(${x}, ${PROFILE_MARGIN.top})`}
            className="cursor-grab"
            onPointerDown={(e) => startDrag(marker, e)}
            onClick={(e) => e.stopPropagation()}
          >
            <title>{marker.label ?? (marker.type === 'food' ? 'Avituallamiento' : 'Agua')}</title>
            <circle r={9} fill={PIN_COLOR[marker.type]} stroke="white" strokeWidth={1.5} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={10}>
              {PIN_GLYPH[marker.type]}
            </text>
          </g>
        )
      })}
    </g>
  )
}
