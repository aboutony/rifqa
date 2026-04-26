import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readNumber, sendJson, sendMethodNotAllowed } from './_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const count = readNumber(body.count, 0)
  const minutes = readNumber(body.minutes, 0)
  const concerning = minutes >= 120 && count < 10

  return sendJson(res, 201, {
    data: {
      id: crypto.randomUUID(),
      count,
      minutes,
      level: concerning ? 'urgent' : 'normal',
      guidance: concerning
        ? lang === 'ar'
          ? 'إذا بقيت الحركة أقل من المعتاد بعد جلسة العد، تواصلي مع طبيبتك أو الطوارئ الآن.'
          : 'If movement remains lower than usual after counting, contact your clinician or emergency care now.'
        : lang === 'ar'
          ? 'تم حفظ الجلسة. تابعي النمط المعتاد لحركة طفلك.'
          : "Session logged. Keep watching your baby's usual movement pattern.",
      stored: false,
    },
  })
}
