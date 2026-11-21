import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getValidSession, fetchActivityStreams } from '../../../_lib/strava.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const activityId = Number.parseInt(String(req.query.id), 10)
  if (!Number.isInteger(activityId) || activityId <= 0) {
    res.status(400).json({ error: 'invalid_activity_id' })
    return
  }

  const session = await getValidSession(req, res)
  if (!session) {
    res.status(401).json({ error: 'not_connected' })
    return
  }

  try {
    const streams = await fetchActivityStreams(session.accessToken, activityId)
    res.status(200).json(streams)
  } catch (err) {
    console.error('Failed to fetch Strava activity streams:', err)
    res.status(502).json({ error: 'strava_request_failed' })
  }
}
