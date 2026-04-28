import type { VercelRequest, VercelResponse } from '@vercel/node'
import { assessCheckin } from './_lib/safety.js'
import { getLang, readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'
import { buildWellnessRecommendations } from './_lib/recommendations.js'

type CheckinRow = {
  id: string
  mood: string
  sleep_quality: number
  symptoms: string[]
  note: string | null
  safety_level: string
  safety_reasons: string[]
  created_at: string
}

function mapCheckin(row: CheckinRow, lang: 'ar' | 'en') {
  const assessment = assessCheckin({
    mood: row.mood,
    sleepQuality: row.sleep_quality,
    symptoms: row.symptoms,
    lang,
  })

  return {
    id: row.id,
    mood: row.mood,
    sleepQuality: row.sleep_quality,
    symptoms: row.symptoms,
    note: row.note ?? '',
    assessment: { ...assessment, level: row.safety_level, reasons: row.safety_reasons },
    createdAt: row.created_at,
    stored: true,
  }
}

function buildTrends(items: Array<ReturnType<typeof mapCheckin>>) {
  const recent = items.slice(0, 7)
  const sleepAverage = recent.length
    ? Math.round((recent.reduce((sum, item) => sum + item.sleepQuality, 0) / recent.length) * 10) / 10
    : 0
  const safetyCounts = recent.reduce<Record<string, number>>((counts, item) => {
    counts[item.assessment.level] = (counts[item.assessment.level] ?? 0) + 1
    return counts
  }, {})
  const moodCounts = recent.reduce<Record<string, number>>((counts, item) => {
    counts[item.mood] = (counts[item.mood] ?? 0) + 1
    return counts
  }, {})
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  return {
    count: recent.length,
    sleepAverage,
    topMood,
    watchOrUrgentCount: (safetyCounts.watch ?? 0) + (safetyCounts.urgent ?? 0),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const context = await getRequestContext(req)
  const lang = getLang(req)

  if (req.method === 'GET') {
    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('checkins')
        .select('id, mood, sleep_quality, symptoms, note, safety_level, safety_reasons, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      const items = (data ?? []).map((row) => mapCheckin(row, lang))
      return sendJson(res, 200, { data: { items, trends: buildTrends(items) }, meta: { persisted: true } })
    }

    const demo = [{
      id: 'demo-checkin-1',
      mood: lang === 'ar' ? 'هادئة' : 'Calm',
      sleepQuality: 3,
      symptoms: [lang === 'ar' ? 'تعب خفيف' : 'mild fatigue'],
      note: '',
      assessment: assessCheckin({ mood: 'steady', sleepQuality: 3, symptoms: ['mild fatigue'], lang }),
      createdAt: new Date().toISOString(),
      stored: false,
    }]
    return sendJson(res, 200, { data: { items: demo, trends: buildTrends(demo) }, meta: { persisted: false } })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const body: Record<string, unknown> = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const symptoms = Array.isArray(body.symptoms)
    ? body.symptoms.filter((item): item is string => typeof item === 'string')
    : []
  const mood = readString(body.mood, 'steady')
  const sleepQuality = readNumber(body.sleepQuality, 3)
  const assessment = assessCheckin({ mood, sleepQuality, symptoms, lang })
  const recommendations = buildWellnessRecommendations({
    lang,
    mood,
    sleepQuality,
    symptoms,
    hasDoctorExercisePlan: body.hasDoctorExercisePlan === true,
  })
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const note = readString(body.note)

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('checkins').insert({
      id,
      user_id: context.userId,
      mood,
      sleep_quality: sleepQuality,
      symptoms,
      note: note || null,
      safety_level: assessment.level,
      safety_reasons: assessment.reasons,
      created_at: createdAt,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      mood,
      sleepQuality,
      symptoms,
      createdAt,
      assessment,
      recommendations,
      note,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
