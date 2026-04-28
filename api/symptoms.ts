import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type SymptomRow = {
  id: string
  symptom: string
  severity: number
  note: string | null
  created_at: string
}

function mapSymptom(row: SymptomRow) {
  return {
    id: row.id,
    symptom: row.symptom,
    severity: row.severity,
    note: row.note ?? '',
    createdAt: row.created_at,
    stored: true,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const context = await getRequestContext(req)

  if (req.method === 'GET') {
    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('symptom_logs')
        .select('id, symptom, severity, note, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      return sendJson(res, 200, { data: (data ?? []).map(mapSymptom), meta: { persisted: true } })
    }

    return sendJson(res, 200, { data: [{ id: 'demo-symptom-1', symptom: 'back discomfort', severity: 3, note: 'Worse after standing', createdAt: new Date().toISOString(), stored: false }], meta: { persisted: false } })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const symptom = readString(body.symptom, 'general discomfort')
  const severity = Math.max(1, Math.min(5, readNumber(body.severity, 3)))
  const note = readString(body.note)

  if (req.method === 'POST') {
    const id = crypto.randomUUID()
    if (context.supabase && context.userId) {
      const { error } = await context.supabase.from('symptom_logs').insert({ id, user_id: context.userId, symptom, severity, note })
      if (error) throw error
    }

    return sendJson(res, 201, { data: { id, symptom, severity, note, stored: Boolean(context.supabase && context.userId) } })
  }

  if (req.method === 'PUT') {
    const id = typeof body.id === 'string' ? body.id : ''
    if (context.supabase && context.userId && id) {
      const { data, error } = await context.supabase
        .from('symptom_logs')
        .update({ symptom, severity, note })
        .eq('id', id)
        .eq('user_id', context.userId)
        .select('id, symptom, severity, note, created_at')
        .single()

      if (error) throw error
      return sendJson(res, 200, { data: mapSymptom(data), meta: { persisted: true } })
    }

    return sendJson(res, 200, { data: { id, symptom, severity, note, stored: false }, meta: { persisted: false } })
  }

  if (req.method === 'DELETE') {
    const id = typeof body.id === 'string' ? body.id : ''
    if (context.supabase && context.userId && id) {
      const { error } = await context.supabase.from('symptom_logs').delete().eq('id', id).eq('user_id', context.userId)
      if (error) throw error
    }

    return sendJson(res, 200, { data: { id, deleted: true }, meta: { persisted: Boolean(context.supabase && context.userId) } })
  }

  return sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE'])
}
