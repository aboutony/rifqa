import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { assessText } from './_lib/safety.js'
import { getLang, readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type PostpartumRow = {
  id: string
  recovery_day: number | null
  bleeding: string
  pain_level: number
  mood: string
  feeding_stress: number
  c_section: boolean
  sleep_hours: number | null
  feeding_method: string | null
  note: string | null
  safety_level: string
  created_at: string
}

function mapPostpartumLog(row: PostpartumRow) {
  return {
    id: row.id,
    recoveryDay: row.recovery_day,
    bleeding: row.bleeding,
    painLevel: row.pain_level,
    mood: row.mood,
    feedingStress: row.feeding_stress,
    cSection: row.c_section,
    sleepHours: row.sleep_hours === null ? null : Number(row.sleep_hours),
    feedingMethod: row.feeding_method,
    note: row.note ?? '',
    level: row.safety_level,
    createdAt: row.created_at,
    stored: true,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const context = await getRequestContext(req)
  const lang = getLang(req)

  if (req.method === 'GET') {
    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('postpartum_logs')
        .select('id, recovery_day, bleeding, pain_level, mood, feeding_stress, c_section, sleep_hours, feeding_method, note, safety_level, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(40)

      if (error) throw error
      return sendJson(res, 200, { data: (data ?? []).map(mapPostpartumLog), meta: { persisted: true } })
    }

    return sendJson(res, 200, {
      data: [{
        id: 'demo-postpartum-1',
        recoveryDay: 7,
        bleeding: 'light',
        painLevel: 2,
        mood: 'steady',
        feedingStress: 2,
        cSection: false,
        sleepHours: 4.5,
        feedingMethod: 'mixed',
        note: '',
        level: 'normal',
        createdAt: new Date().toISOString(),
        stored: false,
      }],
      meta: { persisted: false },
    })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const recoveryDay = Math.max(1, Math.min(40, readNumber(body.recoveryDay, 1)))
  const bleeding = readString(body.bleeding, 'light')
  const painLevel = Math.max(1, Math.min(5, readNumber(body.painLevel, 2)))
  const mood = readString(body.mood, 'steady')
  const feedingStress = Math.max(1, Math.min(5, readNumber(body.feedingStress, 2)))
  const cSection = body.cSection === true
  const sleepHours = Math.max(0, Math.min(24, readNumber(body.sleepHours, 4)))
  const feedingMethod = ['breastfeeding', 'formula', 'mixed', 'pumping'].includes(readString(body.feedingMethod))
    ? readString(body.feedingMethod)
    : 'mixed'
  const note = readString(body.note)
  const assessment = assessText([bleeding, mood, note].join(' '), lang)
  const level = bleeding === 'heavy' || painLevel >= 5 ? 'urgent' : painLevel >= 4 || feedingStress >= 4 || sleepHours < 3 ? 'watch' : assessment.level
  const id = crypto.randomUUID()

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('postpartum_logs').insert({
      id,
      user_id: context.userId,
      recovery_day: recoveryDay,
      bleeding,
      pain_level: painLevel,
      mood,
      feeding_stress: feedingStress,
      c_section: cSection,
      sleep_hours: sleepHours,
      feeding_method: feedingMethod,
      note: note || null,
      safety_level: level,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      recoveryDay,
      bleeding,
      painLevel,
      mood,
      feedingStress,
      cSection,
      sleepHours,
      feedingMethod,
      level,
      guidance:
        level === 'urgent'
          ? lang === 'ar'
            ? 'اطلبي دعما طبيا عاجلا الآن، خصوصا مع النزيف الشديد أو الألم العالي.'
            : 'Seek urgent medical support now, especially with heavy bleeding or high pain.'
          : lang === 'ar'
            ? 'تم حفظ تعافي الأربعين. تابعي النزيف والألم والنوم وضغط الرضاعة بلطف.'
            : '40-day recovery saved. Keep tracking bleeding, pain, sleep, and feeding stress gently.',
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
