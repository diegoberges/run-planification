import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'node:crypto'
import { writeOAuthStateCookie } from '../_lib/session'

function appBaseUrl(req: VercelRequest): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL
  const proto = req.headers['x-forwarded-proto'] ?? 'http'
  return `${proto}://${req.headers.host}`
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) {
    res.status(500).send('STRAVA_CLIENT_ID env var is not set.')
    return
  }

  const state = randomBytes(16).toString('hex')
  writeOAuthStateCookie(res, state)

  const redirectUri = `${appBaseUrl(req)}/api/strava/callback`
  const authorizeUrl = new URL('https://www.strava.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('approval_prompt', 'auto')
  authorizeUrl.searchParams.set('scope', 'read,activity:read_all')
  authorizeUrl.searchParams.set('state', state)

  res.redirect(302, authorizeUrl.toString())
}
