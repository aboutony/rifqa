import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const id = crypto.randomUUID()
  const source = readString(body.source, 'doctor') === 'ai_rules' ? 'ai_rules' : 'doctor'
  const title = readString(body.title, source === 'doctor' ? 'Doctor movement plan' : 'AI gentle movement plan')
  const instructions = readString(
    body.instructions,
    source === 'doctor'
      ? 'Follow the clinician instructions exactly as entered.'
      : 'Gentle walking or stretching only when there are no concerning symptoms.',
  )
  const restrictions = readString(body.restrictions)

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('exercise_plans').insert({
      id,
      user_id: context.userId,
      source,
      title,
      instructions,
      restrictions,
      active: true,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      source,
      title,
      instructions,
      restrictions,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}

