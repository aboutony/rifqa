import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { createMaternalCompanionResponse } from './_lib/openai.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const notes = readString(body.notes, 'Mood steady. Sleep interrupted. No urgent symptoms reported.')
  const fallback =
    lang === 'ar'
      ? `ملخص للزيارة: ${notes}\nأسئلة مقترحة: ما أفضل خطة نوم وحركة آمنة لهذا الأسبوع؟`
      : `Visit summary: ${notes}\nSuggested question: What sleep and safe-movement plan should I follow this week?`
  const aiResponse = await createMaternalCompanionResponse({
    message: `Create a concise clinician visit summary from these user-owned notes. Do not diagnose. Notes: ${notes}`,
    lang,
    safetyMessage: 'Visit summaries must be factual and user-verifiable.',
  })

  return sendJson(res, 200, {
    data: {
      summary: aiResponse?.text || fallback,
      model: aiResponse?.model ?? 'safe-rules-fallback',
      requestId: aiResponse?.requestId ?? null,
    },
  })
}

