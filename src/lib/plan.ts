import type { PaceZone } from '../types/track'

/** Pace (sec/km) that applies at a given distance: the zone covering it, or the global pace
 * outside any zone. Null when the distance falls outside every zone and there's no global
 * pace, which means the plan can't be timed there. */
export function paceAtDistance(
  distanceMeters: number,
  zones: PaceZone[],
  globalPaceSecPerKm: number | null,
): number | null {
  const zone = zones.find((z) => distanceMeters >= z.startDistanceMeters && distanceMeters < z.endDistanceMeters)
  return zone ? zone.paceSecPerKm : globalPaceSecPerKm
}

/** Elapsed seconds to reach `distanceMeters` from the start, integrating zone paces where
 * zones apply and the global pace everywhere else. Returns null if some stretch before that
 * distance has no pace at all (no zone and no global pace). */
export function elapsedSecondsAt(
  distanceMeters: number,
  zones: PaceZone[],
  globalPaceSecPerKm: number | null,
): number | null {
  const sorted = [...zones]
    .filter((z) => z.endDistanceMeters > z.startDistanceMeters)
    .sort((a, b) => a.startDistanceMeters - b.startDistanceMeters)

  let cursor = 0
  let seconds = 0

  const addSegment = (from: number, to: number, pace: number | null): boolean => {
    if (to <= from) return true
    if (pace === null) return false
    seconds += ((to - from) / 1000) * pace
    return true
  }

  for (const zone of sorted) {
    if (cursor >= distanceMeters) break
    const zoneStart = Math.max(zone.startDistanceMeters, cursor)
    // Gap before this zone runs at the global pace.
    if (!addSegment(cursor, Math.min(zoneStart, distanceMeters), globalPaceSecPerKm)) return null
    const zoneEnd = Math.min(zone.endDistanceMeters, distanceMeters)
    if (zoneEnd > zoneStart) {
      addSegment(zoneStart, zoneEnd, zone.paceSecPerKm)
      cursor = zoneEnd
    } else {
      cursor = Math.max(cursor, Math.min(zoneStart, distanceMeters))
    }
  }

  if (!addSegment(cursor, distanceMeters, globalPaceSecPerKm)) return null
  return seconds
}

/** Formats seconds as "H:MM:SS" or "M:SS". */
export function formatClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = hours > 0 ? minutes.toString().padStart(2, '0') : String(minutes)
  const ss = seconds.toString().padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}
