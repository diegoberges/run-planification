import { buildTrackPoints, totalElevationGain } from './geo'
import type { RawPoint, Track } from '../types/track'

export interface StravaActivitySummary {
  id: number
  name: string
  type: string
  distanceMeters: number
  startDate: string
}

interface StravaStreamsResponse {
  latlng?: { data: [number, number][] }
  altitude?: { data: number[] }
}

/** Fetches the list of the connected athlete's recent activities. Returns `null` when the
 * user isn't connected to Strava (server responds 401) so callers can show a "Connect"
 * button instead of treating it as a hard error. */
export async function fetchStravaActivities(): Promise<StravaActivitySummary[] | null> {
  const res = await fetch('/api/strava/activities', { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error('No se pudieron cargar las actividades de Strava.')
  return res.json()
}

/** Fetches one activity's lat/lng + altitude streams and converts them into a Track, running
 * the raw points through the exact same build pipeline (`buildTrackPoints`) used for GPX
 * uploads — so the rest of the app never needs to know a track came from Strava. */
export async function importStravaActivityAsTrack(
  activity: StravaActivitySummary,
): Promise<Track> {
  const res = await fetch(`/api/strava/activities/${activity.id}/streams`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('No se pudieron cargar los datos de la actividad.')
  const streams: StravaStreamsResponse = await res.json()

  const latlng = streams.latlng?.data ?? []
  const altitude = streams.altitude?.data ?? []

  const rawPoints: RawPoint[] = latlng.map(([lat, lon], i) => ({
    lat,
    lon,
    ele: altitude[i] ?? null,
  }))

  const points = buildTrackPoints(rawPoints)

  return {
    id: crypto.randomUUID(),
    name: activity.name,
    source: 'strava',
    sourceActivityId: activity.id,
    points,
    totalDistanceMeters: points.length > 0 ? points[points.length - 1].distance : 0,
    totalElevationGainMeters: totalElevationGain(points),
    createdAt: new Date().toISOString(),
  }
}

export async function disconnectStrava(): Promise<void> {
  await fetch('/api/strava/logout', { credentials: 'include' })
}
