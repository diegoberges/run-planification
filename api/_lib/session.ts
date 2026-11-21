import { sealData, unsealData } from 'iron-session'
import { parseCookie, stringifySetCookie } from 'cookie'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export interface StravaSession {
  athleteId: number
  accessToken: string
  refreshToken: string
  /** Unix seconds, as returned by Strava's token endpoint. */
  expiresAt: number
}

const SESSION_COOKIE_NAME = 'app_session'
const CONNECTED_FLAG_COOKIE_NAME = 'strava_connected'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function sessionPassword(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET env var is missing or shorter than 32 characters (required by iron-session).',
    )
  }
  return secret
}

export async function readSession(req: VercelRequest): Promise<StravaSession | null> {
  const cookies = parseCookie(req.headers.cookie ?? '')
  const seal = cookies[SESSION_COOKIE_NAME]
  if (!seal) return null
  try {
    const data = await unsealData<StravaSession>(seal, { password: sessionPassword() })
    if (!data || typeof data.accessToken !== 'string') return null
    return data
  } catch {
    return null
  }
}

export async function writeSession(res: VercelResponse, session: StravaSession): Promise<void> {
  const seal = await sealData(session, { password: sessionPassword(), ttl: SESSION_MAX_AGE_SECONDS })
  const isProd = process.env.NODE_ENV === 'production'
  appendSetCookie(
    res,
    stringifySetCookie({
      name: SESSION_COOKIE_NAME,
      value: seal,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    }),
  )
  // Non-sensitive flag so client-side JS can show "connected" UI without ever reading the
  // actual token/session cookie (which stays httpOnly).
  appendSetCookie(
    res,
    stringifySetCookie({
      name: CONNECTED_FLAG_COOKIE_NAME,
      value: '1',
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    }),
  )
}

export function clearSession(res: VercelResponse): void {
  const isProd = process.env.NODE_ENV === 'production'
  for (const name of [SESSION_COOKIE_NAME, CONNECTED_FLAG_COOKIE_NAME]) {
    appendSetCookie(res, stringifySetCookie({ name, value: '', path: '/', maxAge: 0, secure: isProd, sameSite: 'lax' }))
  }
}

/** Sets a short-lived cookie carrying the OAuth `state` CSRF token. */
export function writeOAuthStateCookie(res: VercelResponse, state: string): void {
  const isProd = process.env.NODE_ENV === 'production'
  appendSetCookie(
    res,
    stringifySetCookie({
      name: 'strava_oauth_state',
      value: state,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    }),
  )
}

export function readOAuthStateCookie(req: VercelRequest): string | undefined {
  return parseCookie(req.headers.cookie ?? '')['strava_oauth_state']
}

export function clearOAuthStateCookie(res: VercelResponse): void {
  const isProd = process.env.NODE_ENV === 'production'
  appendSetCookie(
    res,
    stringifySetCookie({ name: 'strava_oauth_state', value: '', path: '/', maxAge: 0, secure: isProd, sameSite: 'lax' }),
  )
}

/** Appends a Set-Cookie header without clobbering ones already set on this response
 * (writeSession sets two cookies, callback.ts also clears the oauth-state cookie). */
function appendSetCookie(res: VercelResponse, cookie: string): void {
  const existing = res.getHeader('Set-Cookie')
  if (!existing) {
    res.setHeader('Set-Cookie', cookie)
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie])
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookie])
  }
}
