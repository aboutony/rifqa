import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { getLang, readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type VaccineRow = {
  id: string
  vaccine_name: string
  due_age_month: number
  completed_at: string | null
  note: string | null
  created_at: string
}

function mapVaccine(row: VaccineRow) {
  return {
    id: row.id,
    vaccineName: row.vaccine_name,
    dueAgeMonth: row.due_age_month,
    completedAt: row.completed_at,
    note: row.note ?? '',
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
        .from('vaccine_records')
        .select('id, vaccine_name, due_age_month, completed_at, note, created_at')
        .eq('user_id', context.userId)
        .order('due_age_month', { ascending: true })
        .limit(60)

      if (error) throw error
      return sendJson(res, 200, { data: (data ?? []).map(mapVaccine), meta: { persisted: true } })
    }

    return sendJson(res, 200, {
      data: [{
        id: 'demo-vaccine-birth',
        vaccineName: lang === 'ar' ? 'الدرن والتهاب الكبد ب' : 'BCG and Hepatitis B',
        dueAgeMonth: 0,
        completedAt: null,
        note: '',
        createdAt: new Date().toISOString(),
        stored: false,
      }],
      meta: { persisted: false },
    })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const vaccineName = readString(body.vaccineName, lang === 'ar' ? 'تطعيم مستحق' : 'Due vaccine')
  const dueAgeMonth = Math.max(0, Math.min(36, readNumber(body.dueAgeMonth, 0)))
  const note = readString(body.note)
  const completedAt = body.completed === true ? new Date().toISOString() : null
  const id = crypto.randomUUID()

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('vaccine_records').insert({
      id,
      user_id: context.userId,
      vaccine_name: vaccineName,
      due_age_month: dueAgeMonth,
      completed_at: completedAt,
      note: note || null,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      vaccineName,
      dueAgeMonth,
      completedAt,
      note,
      next:
        lang === 'ar'
          ? 'تم حفظ سجل التطعيم حسب الجدول السعودي. راجعي الطبيب عند أي تأخير أو سؤال.'
          : 'Vaccine record saved against the Saudi schedule. Check with the pediatrician for delays or questions.',
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
