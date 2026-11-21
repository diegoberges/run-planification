import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearOAuthStateCookie, readOAuthStateCookie, writeSession } from '../_lib/session'
import { exchangeCodeForToken } from '../_lib/strava'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query

  if (error) {
    res.redirect(302, '/?stravaError=' + encodeURIComponent(String(error)))
    return
  }

  const expectedState = readOAuthStateCookie(req)
  clearOAuthStateCookie(res)

  if (!code || typeof code !== 'string' || !state || state !== expectedState) {
    res.redirect(302, '/?stravaError=state_mismatch')
    return
  }

  try {
    const token = await exchangeCodeForToken(code)
    await writeSession(res, {
      athleteId: token.athlete?.id ?? 0,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
    })
    res.redirect(302, '/?stravaConnected=1')
  } catch (err) {
    console.error('Strava OAuth callback failed:', err)
    res.redirect(302, '/?stravaError=token_exchange_failed')
  }
}
