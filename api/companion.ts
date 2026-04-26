import type { VercelRequest, VercelResponse } from '@vercel/node'
import { assessText } from './_lib/safety'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const message = readString(body.message)
  const assessment = assessText(message, lang)

  const reply =
    lang === 'ar'
      ? `${assessment.message} تذكير مهم: رفيقة لا تستبدل الطبيبة، لكنها تساعدك على ترتيب الخطوة التالية.`
      : `${assessment.message} Important reminder: RIFQA does not replace your clinician, but it can help organize the next step.`

  return sendJson(res, 200, {
    data: {
      id: crypto.randomUUID(),
      role: 'assistant',
      reply,
      assessment,
      model: 'safe-rules-stub',
      persisted: false,
    },
  })
}

