import { useMemo } from 'react'
import type { TrackPoint } from '../../types/track'
import { PROFILE_MARGIN, PROFILE_VIEW_HEIGHT, type ProfileScales } from './scales'

export function ElevationPath({ points, scales }: { points: TrackPoint[]; scales: ProfileScales }) {
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' }

    const coords = points.map((p) => `${scales.x(p.distance).toFixed(1)},${scales.y(p.ele).toFixed(1)}`)
    const line = `M${coords.join('L')}`

    const baseline = PROFILE_VIEW_HEIGHT - PROFILE_MARGIN.bottom
    const firstX = scales.x(points[0].distance).toFixed(1)
    const lastX = scales.x(points[points.length - 1].distance).toFixed(1)
    const area = `M${firstX},${baseline}L${coords.join('L')}L${lastX},${baseline}Z`

    return { linePath: line, areaPath: area }
  }, [points, scales])

  return (
    <g>
      <path d={areaPath} fill="#3b82f6" fillOpacity={0.12} stroke="none" />
      <path d={linePath} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" />
    </g>
  )
}
