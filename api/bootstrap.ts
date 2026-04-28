import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { getBootstrapContent } from './_lib/content.js'
import { getLang, sendJson, sendMethodNotAllowed } from './_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  return sendJson(res, 200, {
    data: getBootstrapContent(getLang(req)),
  })
}
