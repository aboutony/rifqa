import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { getLang, readNumber, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type ContractionRow = {
  id: string
  contraction_count: number
  average_frequency_minutes: number | null
  average_duration_seconds: number | null
  safety_level: string
  guidance: string | null
  created_at: string
}

function buildGuidance(lang: 'ar' | 'en', sessionCount: number, averageFrequencyMinutes: number, averageDurationSeconds: number) {
  const urgentPattern = sessionCount >= 6 && averageFrequencyMinutes > 0 && averageFrequencyMinutes <= 5 && averageDurationSeconds >= 45
  const level = urgentPattern ? 'urgent' : 'watch'
  const guidance = urgentPattern
    ? lang === 'ar'
      ? 'النمط قد يكون منتظما. اتصلي بطبيبتك أو توجهي للرعاية حسب تعليمات خطتك.'
      : 'The pattern may be regular. Contact your clinician or follow your care plan now.'
    : lang === 'ar'
      ? 'استمري في التسجيل وركزي على الراحة والسوائل. اطلبي الرعاية عند الألم الشديد أو النزيف.'
      : 'Keep timing and prioritize rest and fluids. Seek care for severe pain or bleeding.'

  return { level, guidance }
}

function mapContraction(row: ContractionRow) {
  return {
    id: row.id,
    sessionCount: row.contraction_count,
    averageFrequencyMinutes: Number(row.average_frequency_minutes ?? 0),
    averageDurationSeconds: row.average_duration_seconds ?? 0,
    level: row.safety_level,
    guidance: row.guidance ?? '',
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
        .from('contraction_sessions')
        .select('id, contraction_count, average_frequency_minutes, average_duration_seconds, safety_level, guidance, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return sendJson(res, 200, { data: (data ?? []).map(mapContraction), meta: { persisted: true } })
    }

    return sendJson(res, 200, {
      data: [{
        id: 'demo-contraction-1',
        sessionCount: 6,
        averageFrequencyMinutes: 5,
        averageDurationSeconds: 48,
        level: 'urgent',
        guidance: lang === 'ar' ? 'جلسة تجريبية.' : 'Demo session.',
        createdAt: new Date().toISOString(),
        stored: false,
      }],
      meta: { persisted: false },
    })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const averageFrequencyMinutes = Math.max(0, readNumber(body.averageFrequencyMinutes, 0))
  const averageDurationSeconds = Math.max(0, Math.round(readNumber(body.averageDurationSeconds, 0)))
  const sessionCount = Math.max(0, Math.round(readNumber(body.sessionCount, 0)))
  const { level, guidance } = buildGuidance(lang, sessionCount, averageFrequencyMinutes, averageDurationSeconds)

  if (req.method === 'POST') {
    const id = crypto.randomUUID()
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

    return sendJson(res, 201, { data: { id, averageFrequencyMinutes, averageDurationSeconds, sessionCount, level, guidance, stored: Boolean(context.supabase && context.userId) } })
  }

  if (req.method === 'PUT') {
    const id = typeof body.id === 'string' ? body.id : ''
    if (context.supabase && context.userId && id) {
      const { data, error } = await context.supabase
        .from('contraction_sessions')
        .update({
          contraction_count: sessionCount,
          average_frequency_minutes: averageFrequencyMinutes,
          average_duration_seconds: averageDurationSeconds,
          safety_level: level,
          guidance,
        })
        .eq('id', id)
        .eq('user_id', context.userId)
        .select('id, contraction_count, average_frequency_minutes, average_duration_seconds, safety_level, guidance, created_at')
        .single()

      if (error) throw error
      return sendJson(res, 200, { data: mapContraction(data), meta: { persisted: true } })
    }

    return sendJson(res, 200, { data: { id, averageFrequencyMinutes, averageDurationSeconds, sessionCount, level, guidance, stored: false }, meta: { persisted: false } })
  }

  if (req.method === 'DELETE') {
    const id = typeof body.id === 'string' ? body.id : ''
    if (context.supabase && context.userId && id) {
      const { error } = await context.supabase.from('contraction_sessions').delete().eq('id', id).eq('user_id', context.userId)
      if (error) throw error
    }

    return sendJson(res, 200, { data: { id, deleted: true }, meta: { persisted: Boolean(context.supabase && context.userId) } })
  }

  return sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE'])
}
