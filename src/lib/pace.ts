/** Formats a pace in seconds/km as "m:ss" (e.g. 330 -> "5:30"). */
export function formatPace(secPerKm: number): string {
  const totalSeconds = Math.round(secPerKm)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** Parses a "m:ss" or "mm:ss" pace string into seconds/km. Returns null if unparseable. */
export function parsePace(text: string): number | null {
  const match = text.trim().match(/^(\d{1,2}):([0-5]\d)$/)
  if (!match) return null
  const minutes = Number.parseInt(match[1], 10)
  const seconds = Number.parseInt(match[2], 10)
  return minutes * 60 + seconds
}

export type PaceComparison = 'faster' | 'slower' | 'even' | 'unknown'

/** Classifies a zone's pace relative to the global pace, with a small deadband around "even"
 * so near-identical paces don't flicker between faster/slower. */
export function comparePace(
  zonePaceSecPerKm: number,
  globalPaceSecPerKm: number | null,
  deadbandSeconds = 3,
): PaceComparison {
  if (globalPaceSecPerKm === null) return 'unknown'
  const delta = zonePaceSecPerKm - globalPaceSecPerKm
  if (Math.abs(delta) <= deadbandSeconds) return 'even'
  // A lower pace (sec/km) means running faster.
  return delta < 0 ? 'faster' : 'slower'
}

/** Tailwind-friendly color tokens for each pace comparison, used for zone bands/badges. */
export const PACE_COMPARISON_COLORS: Record<PaceComparison, { fill: string; border: string; text: string }> = {
  faster: { fill: 'rgba(34,197,94,0.25)', border: '#22c55e', text: '#15803d' },
  slower: { fill: 'rgba(249,115,22,0.25)', border: '#f97316', text: '#c2410c' },
  even: { fill: 'rgba(148,163,184,0.25)', border: '#94a3b8', text: '#475569' },
  unknown: { fill: 'rgba(148,163,184,0.2)', border: '#cbd5e1', text: '#64748b' },
}

/** Formats meters as a human-friendly distance label (e.g. 1234 -> "1.23 km"). */
export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`
}

/** Formats meters as elevation in whole meters (e.g. 123.4 -> "123 m"). */
export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`
}

/** Estimated time to run a given distance at a given pace, formatted as "H:MM:SS" or "M:SS". */
export function formatDuration(distanceMeters: number, paceSecPerKm: number): string {
  const totalSeconds = Math.round((distanceMeters / 1000) * paceSecPerKm)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
