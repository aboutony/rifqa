import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { createMaternalCompanionResponse } from './_lib/openai.js'
import { getRequestContext } from './_lib/supabase.js'
import { aiRateLimit, enforceRateLimit } from './_lib/rate-limit.js'

async function buildNotesFromLogs(req: VercelRequest, fallbackNotes: string) {
  const context = await getRequestContext(req)
  if (!context.supabase || !context.userId) return fallbackNotes

  const [weights, symptoms, kicks, contractions, checkins] = await Promise.all([
    context.supabase.from('weight_logs').select('weight_kg, note, created_at').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(5),
    context.supabase.from('symptom_logs').select('symptom, severity, note, created_at').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(8),
    context.supabase.from('kick_sessions').select('kick_count, duration_minutes, safety_level, guidance, created_at').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(5),
    context.supabase.from('contraction_sessions').select('contraction_count, average_frequency_minutes, average_duration_seconds, safety_level, guidance, created_at').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(5),
    context.supabase.from('checkins').select('mood, sleep_quality, symptoms, note, safety_level, created_at').eq('user_id', context.userId).order('created_at', { ascending: false }).limit(5),
  ])

  const hasLogs = [weights.data, symptoms.data, kicks.data, contractions.data, checkins.data].some((items) => (items?.length ?? 0) > 0)
  if (!hasLogs) return fallbackNotes

  return [
    fallbackNotes,
    `Recent check-ins: ${(checkins.data ?? []).map((item) => `${item.mood}, sleep ${item.sleep_quality}/5, safety ${item.safety_level}, symptoms ${(item.symptoms ?? []).join(', ') || 'none'}, note ${item.note || 'none'}`).join(' | ') || 'none'}.`,
    `Weights: ${(weights.data ?? []).map((item) => `${item.weight_kg} kg (${item.note || 'no note'})`).join(' | ') || 'none'}.`,
    `Symptoms: ${(symptoms.data ?? []).map((item) => `${item.symptom} severity ${item.severity}/5 (${item.note || 'no note'})`).join(' | ') || 'none'}.`,
    `Kick sessions: ${(kicks.data ?? []).map((item) => `${item.kick_count} kicks in ${item.duration_minutes} min, safety ${item.safety_level}`).join(' | ') || 'none'}.`,
    `Contractions: ${(contractions.data ?? []).map((item) => `${item.contraction_count} contractions, ${item.average_frequency_minutes ?? 0} min apart, ${item.average_duration_seconds ?? 0}s avg, safety ${item.safety_level}`).join(' | ') || 'none'}.`,
  ].filter(Boolean).join('\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])
  if (enforceRateLimit(req, res, aiRateLimit)) return

  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const suppliedNotes = readString(body.notes)
  const notes = await buildNotesFromLogs(req, suppliedNotes || 'Mood steady. Sleep interrupted. No urgent symptoms reported.')
  const fallback =
    lang === 'ar'
      ? `ملخص للزيارة: ${notes}\nأسئلة مقترحة: ما خطة النوم والحركة الآمنة المناسبة لهذا الأسبوع؟`
      : `Visit summary: ${notes}\nSuggested question: What sleep and safe-movement plan should I follow this week?`
  const aiResponse = await createMaternalCompanionResponse({
    message: `Create a concise clinician visit summary from these user-owned notes. Do not diagnose. Include: key symptoms/logs, safety flags, and 3 doctor questions. Notes: ${notes}`,
    lang,
    safetyMessage: 'Visit summaries must be factual and user-verifiable.',
  }).catch(() => null)

  return sendJson(res, 200, {
    data: {
      summary: aiResponse?.text || fallback,
      model: aiResponse?.model ?? 'safe-rules-fallback',
      requestId: aiResponse?.requestId ?? null,
      source: suppliedNotes ? 'provided_and_saved_logs' : 'saved_logs',
    },
  })
}
