import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readNumber, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type KickRow = {
  id: string
  kick_count: number
  duration_minutes: number
  safety_level: string
  guidance: string | null
  created_at: string
}

function buildGuidance(lang: 'ar' | 'en', count: number, minutes: number) {
  const level = minutes >= 120 && count < 10 ? 'urgent' : 'normal'
  const guidance = level === 'urgent'
    ? lang === 'ar'
      ? 'إذا بقيت الحركة أقل من المعتاد بعد جلسة العد، تواصلي مع طبيبتك أو الطوارئ الآن.'
      : 'If movement remains lower than usual after counting, contact your clinician or emergency care now.'
    : lang === 'ar'
      ? 'تم حفظ الجلسة. تابعي النمط المعتاد لحركة طفلك.'
      : "Session logged. Keep watching baby's usual movement pattern."

  return { level, guidance }
}

function mapKickSession(row: KickRow) {
  return {
    id: row.id,
    count: row.kick_count,
    minutes: row.duration_minutes,
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
        .from('kick_sessions')
        .select('id, kick_count, duration_minutes, safety_level, guidance, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return sendJson(res, 200, { data: (data ?? []).map(mapKickSession), meta: { persisted: true } })
    }

    return sendJson(res, 200, {
      data: [{
        id: 'demo-kick-1',
        count: 10,
        minutes: 42,
        level: 'normal',
        guidance: lang === 'ar' ? 'جلسة تجريبية محفوظة.' : 'Demo session saved.',
        createdAt: new Date().toISOString(),
        stored: false,
      }],
      meta: { persisted: false },
    })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const count = Math.max(0, Math.round(readNumber(body.count, 0)))
  const minutes = Math.max(0, Math.round(readNumber(body.minutes, 0)))
  const { level, guidance } = buildGuidance(lang, count, minutes)

  if (req.method === 'POST') {
    const id = crypto.randomUUID()
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

    return sendJson(res, 201, { data: { id, count, minutes, level, guidance, stored: Boolean(context.supabase && context.userId) } })
  }

  if (req.method === 'PUT') {
    const id = typeof body.id === 'string' ? body.id : ''
    if (context.supabase && context.userId && id) {
      const { data, error } = await context.supabase
        .from('kick_sessions')
        .update({ kick_count: count, duration_minutes: minutes, safety_level: level, guidance })
        .eq('id', id)
        .eq('user_id', context.userId)
        .select('id, kick_count, duration_minutes, safety_level, guidance, created_at')
        .single()

      if (error) throw error
      return sendJson(res, 200, { data: mapKickSession(data), meta: { persisted: true } })
    }

    return sendJson(res, 200, { data: { id, count, minutes, level, guidance, stored: false }, meta: { persisted: false } })
  }

  if (req.method === 'DELETE') {
    const id = typeof body.id === 'string' ? body.id : ''
    if (context.supabase && context.userId && id) {
      const { error } = await context.supabase.from('kick_sessions').delete().eq('id', id).eq('user_id', context.userId)
      if (error) throw error
    }

    return sendJson(res, 200, { data: { id, deleted: true }, meta: { persisted: Boolean(context.supabase && context.userId) } })
  }

  return sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE'])
}
