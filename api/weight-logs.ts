import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const id = crypto.randomUUID()
  const weightKg = readNumber(body.weightKg, 72.4)
  const note = readString(body.note)

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('weight_logs').insert({
      id,
      user_id: context.userId,
      weight_kg: weightKg,
      note,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      weightKg,
      note,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}

