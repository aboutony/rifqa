import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildCareRoute } from './_lib/maternal-os.js'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const concern = readString(body.concern, 'routine pregnancy question')
  const rawStage = readString(body.stage, 'pregnancy')
  const country = readString(body.country, 'SA')
  const stage = rawStage === 'postpartum' || rawStage === 'baby_0_3' ? rawStage : 'pregnancy'

  return sendJson(res, 200, {
    data: {
      ...buildCareRoute({ concern, lang, stage }),
      country,
    },
  })
}
