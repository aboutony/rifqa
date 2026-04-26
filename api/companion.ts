import type { VercelRequest, VercelResponse } from '@vercel/node'
import { assessText } from './_lib/safety.js'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { createMaternalCompanionResponse } from './_lib/openai.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const message = readString(body.message)
  const assessment = assessText(message, lang)

  const fallbackReply =
    lang === 'ar'
      ? `${assessment.message} تذكير مهم: رفقة لا تستبدل الطبيبة، لكنها تساعدك على ترتيب الخطوة التالية.`
      : `${assessment.message} Important reminder: RIFQA does not replace your clinician, but it can help organize the next step.`
  const aiResponse =
    assessment.level === 'urgent'
      ? null
      : await createMaternalCompanionResponse({
          message,
          lang,
          safetyMessage: assessment.message,
        })
  const reply = aiResponse?.text || fallbackReply

  return sendJson(res, 200, {
    data: {
      id: crypto.randomUUID(),
      role: 'assistant',
      reply,
      assessment,
      model: aiResponse?.model ?? 'safe-rules-fallback',
      requestId: aiResponse?.requestId ?? null,
      persisted: false,
    },
  })
}
