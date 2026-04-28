import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type WeightRow = {
  id: string
  weight_kg: number
  note: string | null
  created_at: string
}

function mapWeight(row: WeightRow) {
  return {
    id: row.id,
    weightKg: Number(row.weight_kg),
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
        .from('weight_logs')
        .select('id, weight_kg, note, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      return sendJson(res, 200, { data: (data ?? []).map(mapWeight), meta: { persisted: true } })
    }

    return sendJson(res, 200, { data: [{ id: 'demo-weight-1', weightKg: 72.4, note: 'OB visit reading', createdAt: new Date().toISOString(), stored: false }], meta: { persisted: false } })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const weightKg = readNumber(body.weightKg, 72.4)
  const note = readString(body.note)

  if (req.method === 'POST') {
    const id = crypto.randomUUID()
    if (context.supabase && context.userId) {
      const { error } = await context.supabase.from('weight_logs').insert({ id, user_id: context.userId, weight_kg: weightKg, note })
      if (error) throw error
    }

    return sendJson(res, 201, { data: { id, weightKg, note, stored: Boolean(context.supabase && context.userId) } })
  }

  if (req.method === 'PUT') {
    const id = typeof body.id === 'string' ? body.id : ''
    if (context.supabase && context.userId && id) {
      const { data, error } = await context.supabase
        .from('weight_logs')
        .update({ weight_kg: weightKg, note })
        .eq('id', id)
        .eq('user_id', context.userId)
        .select('id, weight_kg, note, created_at')
        .single()

      if (error) throw error
      return sendJson(res, 200, { data: mapWeight(data), meta: { persisted: true } })
    }

    return sendJson(res, 200, { data: { id, weightKg, note, stored: false }, meta: { persisted: false } })
  }

  if (req.method === 'DELETE') {
    const id = typeof body.id === 'string' ? body.id : ''
    if (context.supabase && context.userId && id) {
      const { error } = await context.supabase.from('weight_logs').delete().eq('id', id).eq('user_id', context.userId)
      if (error) throw error
    }

    return sendJson(res, 200, { data: { id, deleted: true }, meta: { persisted: Boolean(context.supabase && context.userId) } })
  }

  return sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE'])
}
