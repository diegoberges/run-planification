import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSession } from '../_lib/session.js'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  clearSession(res)
  res.status(200).json({ ok: true })
}
