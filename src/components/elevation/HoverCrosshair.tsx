import { findNearestIndexByDistance } from '../../lib/geo'
import type { TrackPoint } from '../../types/track'
import { PROFILE_MARGIN, PROFILE_VIEW_HEIGHT, type ProfileScales } from './scales'

export function HoverCrosshair({
  points,
  hoverDistanceMeters,
  scales,
}: {
  points: TrackPoint[]
  hoverDistanceMeters: number | null
  scales: ProfileScales
}) {
  if (hoverDistanceMeters === null || points.length === 0) return null

  const idx = findNearestIndexByDistance(points, hoverDistanceMeters)
  const point = points[idx]
  const x = scales.x(point.distance)
  const y = scales.y(point.ele)

  return (
    <g className="pointer-events-none">
      <line
        x1={x}
        x2={x}
        y1={PROFILE_MARGIN.top}
        y2={PROFILE_VIEW_HEIGHT - PROFILE_MARGIN.bottom}
        stroke="#1d4ed8"
        strokeDasharray="4 3"
        strokeWidth={1}
      />
      <circle cx={x} cy={y} r={4} fill="#1d4ed8" stroke="white" strokeWidth={1.5} />
    </g>
  )
}
