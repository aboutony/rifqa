import type { VercelRequest, VercelResponse } from '@vercel/node'
import { assessCheckin } from './_lib/safety'
import { getLang, readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

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

  return sendJson(res, 201, {
    data: {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      assessment,
      stored: false,
    },
  })
}
