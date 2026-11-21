import type { RawPoint, TrackPoint } from '../types/track'

const EARTH_RADIUS_METERS = 6_371_000

/** Great-circle distance between two lat/lon points, in meters. */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

/** Smooths a series of (distance, elevation) samples with a centered moving average over a
 * distance window (meters), rather than a fixed point count — robust to tracks with uneven
 * point density (GPS vs. barometric sources, different recording devices). Points with no
 * elevation data (null) are skipped when averaging and left as `null` in the output. */
function smoothElevations(
  distances: number[],
  elevations: (number | null)[],
  windowMeters: number,
): (number | null)[] {
  const n = distances.length
  const result: (number | null)[] = new Array(n)
  const halfWindow = windowMeters / 2

  let lo = 0
  let hi = 0
  for (let i = 0; i < n; i++) {
    while (distances[i] - distances[lo] > halfWindow) lo++
    if (hi < i) hi = i
    while (hi < n - 1 && distances[hi + 1] - distances[i] <= halfWindow) hi++

    let sum = 0
    let count = 0
    for (let j = lo; j <= hi; j++) {
      const e = elevations[j]
      if (e !== null) {
        sum += e
        count++
      }
    }
    result[i] = count > 0 ? sum / count : null
  }

  return result
}

/** Converts raw lat/lon/elevation points (from a GPX file or a Strava streams response) into
 * the TrackPoint[] shape the rest of the app renders/computes with: cumulative haversine
 * distance plus smoothed elevation. Shared by both import paths so GPX- and Strava-sourced
 * tracks are processed identically. */
export function buildTrackPoints(
  rawPoints: RawPoint[],
  smoothingWindowMeters = 30,
): TrackPoint[] {
  if (rawPoints.length === 0) return []

  const distances: number[] = [0]
  for (let i = 1; i < rawPoints.length; i++) {
    const prev = rawPoints[i - 1]
    const curr = rawPoints[i]
    const step = haversineMeters(prev.lat, prev.lon, curr.lat, curr.lon)
    distances.push(distances[i - 1] + step)
  }

  const rawElevations = rawPoints.map((p) => p.ele)
  const smoothed = smoothElevations(distances, rawElevations, smoothingWindowMeters)

  return rawPoints.map((p, i) => ({
    lat: p.lat,
    lon: p.lon,
    // Fall back to 0 only when there is truly no elevation data anywhere nearby; this keeps
    // the elevation profile renderable without fabricating a misleading non-flat shape.
    ele: smoothed[i] ?? 0,
    eleRaw: p.ele ?? undefined,
    distance: distances[i],
  }))
}

export function totalElevationGain(points: TrackPoint[]): number {
  let gain = 0
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].ele - points[i - 1].ele
    if (delta > 0) gain += delta
  }
  return gain
}

/** Finds the index of the TrackPoint whose cumulative distance is closest to `distanceMeters`,
 * via binary search (points are sorted ascending by distance). */
export function findNearestIndexByDistance(points: TrackPoint[], distanceMeters: number): number {
  if (points.length === 0) return -1
  let lo = 0
  let hi = points.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (points[mid].distance < distanceMeters) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && Math.abs(points[lo - 1].distance - distanceMeters) < Math.abs(points[lo].distance - distanceMeters)) {
    return lo - 1
  }
  return lo
}

/** Linearly interpolates a lat/lon position at an arbitrary distance along the track. */
export function interpolateAtDistance(
  points: TrackPoint[],
  distanceMeters: number,
): { lat: number; lon: number } | null {
  if (points.length === 0) return null
  const clamped = Math.max(points[0].distance, Math.min(points[points.length - 1].distance, distanceMeters))

  const idx = findNearestIndexByDistance(points, clamped)
  const a = points[idx]
  const b = clamped >= a.distance ? points[idx + 1] : points[idx - 1]
  if (!b || b.distance === a.distance) return { lat: a.lat, lon: a.lon }

  const t = (clamped - a.distance) / (b.distance - a.distance)
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lon: a.lon + (b.lon - a.lon) * t,
  }
}

/** Finds the nearest TrackPoint to an arbitrary lat/lon (e.g. the cursor position while
 * hovering the route on the map). Uses simple squared-degree distance — precision is
 * irrelevant at map-interaction zoom scales, so geodesic math isn't needed here. */
export function findNearestIndexByLatLng(points: TrackPoint[], lat: number, lon: number): number {
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < points.length; i++) {
    const dLat = points[i].lat - lat
    const dLon = points[i].lon - lon
    const d = dLat * dLat + dLon * dLon
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return bestIdx
}
