import { extent } from 'd3-array'
import { scaleLinear, type ScaleLinear } from 'd3-scale'
import type { TrackPoint } from '../../types/track'

export const PROFILE_VIEW_WIDTH = 1000
export const PROFILE_VIEW_HEIGHT = 260
export const PROFILE_MARGIN = { top: 16, right: 16, bottom: 28, left: 46 }

export type LinearScale = ScaleLinear<number, number>

export interface ProfileScales {
  x: LinearScale
  y: LinearScale
}

export function buildProfileScales(points: TrackPoint[], totalDistanceMeters: number): ProfileScales {
  const [minEle, maxEle] = extent(points, (p) => p.ele) as [number | undefined, number | undefined]
  const lo = minEle ?? 0
  const hi = maxEle ?? 0
  // A touch of vertical padding so the line never touches the top/bottom edge, with a floor
  // so flat routes (lo === hi) still get a sane, non-zero-height domain.
  const pad = Math.max((hi - lo) * 0.1, 5)

  const x = scaleLinear()
    .domain([0, Math.max(totalDistanceMeters, 1)])
    .range([PROFILE_MARGIN.left, PROFILE_VIEW_WIDTH - PROFILE_MARGIN.right])

  const y = scaleLinear()
    .domain([lo - pad, hi + pad])
    .range([PROFILE_VIEW_HEIGHT - PROFILE_MARGIN.bottom, PROFILE_MARGIN.top])

  return { x, y }
}

/** Converts a pointer event's clientX/clientY into the SVG's internal viewBox coordinate
 * space, accounting for the element being stretched to fill its responsive container
 * (viewBox has a fixed size, rendered size varies, preserveAspectRatio="none"). */
export function clientPointToViewBox(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = svg.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * PROFILE_VIEW_WIDTH
  const y = ((clientY - rect.top) / rect.height) * PROFILE_VIEW_HEIGHT
  return { x, y }
}
