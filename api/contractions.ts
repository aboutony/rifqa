import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readNumber, sendJson, sendMethodNotAllowed } from './_lib/http'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const averageFrequencyMinutes = readNumber(body.averageFrequencyMinutes, 0)
  const averageDurationSeconds = readNumber(body.averageDurationSeconds, 0)
  const sessionCount = readNumber(body.sessionCount, 0)
  const urgentPattern =
    sessionCount >= 6 && averageFrequencyMinutes > 0 && averageFrequencyMinutes <= 5 && averageDurationSeconds >= 45

  return sendJson(res, 201, {
    data: {
      id: crypto.randomUUID(),
      averageFrequencyMinutes,
      averageDurationSeconds,
      sessionCount,
      level: urgentPattern ? 'urgent' : 'watch',
      guidance: urgentPattern
        ? lang === 'ar'
          ? 'النمط قد يكون منتظما. اتصلي بطبيبتك أو توجهي للرعاية حسب تعليمات خطتك.'
          : 'The pattern may be regular. Contact your clinician or follow your care plan now.'
        : lang === 'ar'
          ? 'استمري في التسجيل وركزي على الراحة والسوائل. اطلبي الرعاية عند الألم الشديد أو النزيف.'
          : 'Keep timing and prioritize rest and fluids. Seek care for severe pain or bleeding.',
      stored: false,
    },
  })
}

