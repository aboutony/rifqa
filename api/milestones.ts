import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { getLang, readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type MilestoneRow = {
  id: string
  child_month: number
  title: string
  note: string | null
  completed_at: string | null
  created_at: string
}

function mapMilestone(row: MilestoneRow) {
  return {
    id: row.id,
    childMonth: row.child_month,
    title: row.title,
    note: row.note ?? '',
    completedAt: row.completed_at,
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
        .from('milestones')
        .select('id, child_month, title, note, completed_at, created_at')
        .eq('user_id', context.userId)
        .order('child_month', { ascending: true })
        .limit(80)

      if (error) throw error
      return sendJson(res, 200, { data: (data ?? []).map(mapMilestone), meta: { persisted: true } })
    }

    return sendJson(res, 200, {
      data: [
        { id: 'demo-ms-0', childMonth: 0, title: lang === 'ar' ? 'اللقاء الأول' : 'First hello', note: '', completedAt: null, createdAt: new Date().toISOString(), stored: false },
        { id: 'demo-ms-6', childMonth: 6, title: lang === 'ar' ? 'بدء الجلوس بدعم' : 'Sitting with support', note: '', completedAt: null, createdAt: new Date().toISOString(), stored: false },
        { id: 'demo-ms-12', childMonth: 12, title: lang === 'ar' ? 'أول خطوات' : 'First steps', note: '', completedAt: null, createdAt: new Date().toISOString(), stored: false },
      ],
      meta: { persisted: false },
    })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const childMonth = Math.max(0, Math.min(36, readNumber(body.childMonth, 0)))
  const title = readString(body.title, lang === 'ar' ? 'مرحلة جديدة' : 'New milestone')
  const note = readString(body.note)
  const completedAt = body.completed === true ? new Date().toISOString() : null
  const id = crypto.randomUUID()

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('milestones').insert({
      id,
      user_id: context.userId,
      child_month: childMonth,
      title,
      note: note || null,
      completed_at: completedAt,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      childMonth,
      title,
      note,
      completedAt,
      shareCard: lang === 'ar' ? `بطاقة مرحلة: ${title}` : `Milestone card: ${title}`,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
