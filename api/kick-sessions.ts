import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readNumber, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const count = readNumber(body.count, 0)
  const minutes = readNumber(body.minutes, 0)
  const concerning = minutes >= 120 && count < 10
  const id = crypto.randomUUID()
  const level = concerning ? 'urgent' : 'normal'
  const guidance = concerning
    ? lang === 'ar'
      ? 'إذا بقيت الحركة أقل من المعتاد بعد جلسة العد، تواصلي مع طبيبتك أو الطوارئ الآن.'
      : 'If movement remains lower than usual after counting, contact your clinician or emergency care now.'
    : lang === 'ar'
      ? 'تم حفظ الجلسة. تابعي النمط المعتاد لحركة طفلك.'
      : "Session logged. Keep watching your baby's usual movement pattern."

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('kick_sessions').insert({
      id,
      user_id: context.userId,
      kick_count: count,
      duration_minutes: minutes,
      safety_level: level,
      guidance,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      count,
      minutes,
      level,
      guidance,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
