import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getBootstrapContent } from './_lib/content'
import { getLang, sendJson, sendMethodNotAllowed } from './_lib/http'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  return sendJson(res, 200, {
    data: getBootstrapContent(getLang(req)),
  })
}

