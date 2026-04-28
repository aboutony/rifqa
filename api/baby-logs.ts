import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type BabyLogRow = {
  id: string
  log_type: string
  amount: number | null
  unit: string | null
  note: string | null
  created_at: string
}

const allowedLogTypes = new Set(['feeding', 'pumping', 'sleep', 'diaper', 'medication', 'growth_note'])

function mapBabyLog(row: BabyLogRow) {
  return {
    id: row.id,
    logType: row.log_type,
    amount: row.amount === null ? null : Number(row.amount),
    unit: row.unit ?? '',
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
        .from('baby_logs')
        .select('id, log_type, amount, unit, note, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(60)

      if (error) throw error
      return sendJson(res, 200, { data: (data ?? []).map(mapBabyLog), meta: { persisted: true } })
    }

    return sendJson(res, 200, {
      data: [{
        id: 'demo-baby-feed-1',
        logType: 'feeding',
        amount: 90,
        unit: 'ml',
        note: 'calm feed',
        createdAt: new Date().toISOString(),
        stored: false,
      }],
      meta: { persisted: false },
    })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const requestedType = readString(body.logType, 'feeding')
  const logType = allowedLogTypes.has(requestedType) ? requestedType : 'feeding'
  const amount = readNumber(body.amount, 0)
  const unit = readString(body.unit)
  const note = readString(body.note)
  const id = crypto.randomUUID()

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('baby_logs').insert({
      id,
      user_id: context.userId,
      log_type: logType,
      amount: amount || null,
      unit: unit || null,
      note: note || null,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      logType,
      amount,
      unit,
      note,
      next:
        lang === 'ar'
          ? 'تم حفظ روتين الطفل. سيظهر في ملخص الرضاعة والنوم والحفاض والدواء.'
          : 'Baby routine saved for feeding, pumping, sleep, diaper, and medication summaries.',
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
