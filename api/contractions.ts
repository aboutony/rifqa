import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readNumber, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const averageFrequencyMinutes = readNumber(body.averageFrequencyMinutes, 0)
  const averageDurationSeconds = readNumber(body.averageDurationSeconds, 0)
  const sessionCount = readNumber(body.sessionCount, 0)
  const urgentPattern =
    sessionCount >= 6 && averageFrequencyMinutes > 0 && averageFrequencyMinutes <= 5 && averageDurationSeconds >= 45
  const id = crypto.randomUUID()
  const level = urgentPattern ? 'urgent' : 'watch'
  const guidance = urgentPattern
    ? lang === 'ar'
      ? 'النمط قد يكون منتظما. اتصلي بطبيبتك أو توجهي للرعاية حسب تعليمات خطتك.'
      : 'The pattern may be regular. Contact your clinician or follow your care plan now.'
    : lang === 'ar'
      ? 'استمري في التسجيل وركزي على الراحة والسوائل. اطلبي الرعاية عند الألم الشديد أو النزيف.'
      : 'Keep timing and prioritize rest and fluids. Seek care for severe pain or bleeding.'

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('contraction_sessions').insert({
      id,
      user_id: context.userId,
      contraction_count: sessionCount,
      average_frequency_minutes: averageFrequencyMinutes,
      average_duration_seconds: averageDurationSeconds,
      safety_level: level,
      guidance,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      averageFrequencyMinutes,
      averageDurationSeconds,
      sessionCount,
      level,
      guidance,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
