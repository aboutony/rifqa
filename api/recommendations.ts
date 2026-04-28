import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { getLang, readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { buildWellnessRecommendations } from './_lib/recommendations.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const body: Record<string, unknown> = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const symptoms = Array.isArray(body.symptoms)
    ? body.symptoms.filter((item): item is string => typeof item === 'string')
    : []
  const recommendations = buildWellnessRecommendations({
    lang: getLang(req),
    mood: readString(body.mood, 'steady'),
    sleepQuality: readNumber(body.sleepQuality, 3),
    symptoms,
    hasDoctorExercisePlan: body.hasDoctorExercisePlan === true,
  })

  if (context.supabase && context.userId && recommendations.length > 0) {
    const { error } = await context.supabase.from('wellness_recommendations').insert(
      recommendations.map((recommendation) => ({
        user_id: context.userId,
        kind: recommendation.kind,
        priority: recommendation.priority,
        source: recommendation.source,
        title: recommendation.title,
        body: recommendation.body,
        trigger: recommendation.trigger,
      })),
    )

    if (error) throw error
  }

  return sendJson(res, 200, {
    data: {
      recommendations,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
