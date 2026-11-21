import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getValidSession } from '../_lib/strava.js'
import { fetchAthleteActivities } from '../_lib/strava.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await getValidSession(req, res)
  if (!session) {
    res.status(401).json({ error: 'not_connected' })
    return
  }

  try {
    const activities = await fetchAthleteActivities(session.accessToken)
    res.status(200).json(activities)
  } catch (err) {
    console.error('Failed to fetch Strava activities:', err)
    res.status(502).json({ error: 'strava_request_failed' })
  }
}
