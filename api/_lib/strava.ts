import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readSession, writeSession, type StravaSession } from './session'

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
const STRAVA_OAUTH_TOKEN_URL = 'https://www.strava.com/oauth/token'

interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete?: { id: number }
}

function requireEnv(name: 'STRAVA_CLIENT_ID' | 'STRAVA_CLIENT_SECRET'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} env var is not set.`)
  return value
}

export async function exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: requireEnv('STRAVA_CLIENT_ID'),
      client_secret: requireEnv('STRAVA_CLIENT_SECRET'),
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as StravaTokenResponse
}

async function refreshToken(refreshToken: string): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: requireEnv('STRAVA_CLIENT_ID'),
      client_secret: requireEnv('STRAVA_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as StravaTokenResponse
}

const EXPIRY_SKEW_SECONDS = 120

/** Reads the session cookie and, if the access token is at/near expiry, refreshes it and
 * re-seals the cookie before returning. Returns null if there's no valid session at all —
 * callers should respond 401 in that case. */
export async function getValidSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<StravaSession | null> {
  const session = await readSession(req)
  if (!session) return null

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (session.expiresAt - nowSeconds > EXPIRY_SKEW_SECONDS) return session

  const refreshed = await refreshToken(session.refreshToken)
  const next: StravaSession = {
    athleteId: session.athleteId,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: refreshed.expires_at,
  }
  await writeSession(res, next)
  return next
}

export interface StravaActivitySummary {
  id: number
  name: string
  type: string
  distanceMeters: number
  startDate: string
}

export async function fetchAthleteActivities(accessToken: string): Promise<StravaActivitySummary[]> {
  const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=30`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Strava activities request failed: ${res.status}`)
  const activities = (await res.json()) as {
    id: number
    name: string
    type: string
    distance: number
    start_date: string
    start_latlng?: [number, number] | []
  }[]

  return activities
    .filter((a) => Array.isArray(a.start_latlng) && a.start_latlng.length === 2)
    .map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      distanceMeters: a.distance,
      startDate: a.start_date,
    }))
}

export async function fetchActivityStreams(
  accessToken: string,
  activityId: number,
): Promise<{ latlng?: { data: [number, number][] }; altitude?: { data: number[] } }> {
  const res = await fetch(
    `${STRAVA_API_BASE}/activities/${activityId}/streams?keys=latlng,altitude&key_by_type=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) throw new Error(`Strava streams request failed: ${res.status}`)
  return (await res.json()) as { latlng?: { data: [number, number][] }; altitude?: { data: number[] } }
}
