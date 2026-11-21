import { useState } from 'react'

/** Tracks whether the user is connected to Strava by reading the non-httpOnly
 * `strava_connected` flag cookie set by the OAuth callback — the real session/token stays
 * httpOnly and is never read from client JS. Read once synchronously on first render (no
 * SSR here, so `document.cookie` is always available); subsequent connect/disconnect actions
 * update it directly via the returned setter. */
export function useStravaConnected(): [boolean, (value: boolean) => void] {
  const [connected, setConnected] = useState(() => readFlagCookie())
  return [connected, setConnected]
}

function readFlagCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c === 'strava_connected=1')
}
