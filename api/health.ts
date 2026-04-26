import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendJson, sendMethodNotAllowed } from './_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  return sendJson(res, 200, {
    ok: true,
    service: 'rifqa-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  })
}
