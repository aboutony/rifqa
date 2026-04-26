import type { VercelRequest, VercelResponse } from '@vercel/node'
import { assessCheckin } from './_lib/safety.js'
import { getLang, readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const body: Record<string, unknown> = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const symptoms = Array.isArray(body.symptoms)
    ? body.symptoms.filter((item): item is string => typeof item === 'string')
    : []
  const assessment = assessCheckin({
    mood: readString(body.mood, 'steady'),
    sleepQuality: readNumber(body.sleepQuality, 3),
    symptoms,
    lang: getLang(req),
  })
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('checkins').insert({
      id,
      user_id: context.userId,
      mood: readString(body.mood, 'steady'),
      sleep_quality: readNumber(body.sleepQuality, 3),
      symptoms,
      safety_level: assessment.level,
      safety_reasons: assessment.reasons,
      created_at: createdAt,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      createdAt,
      assessment,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
