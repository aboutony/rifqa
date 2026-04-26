import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const id = crypto.randomUUID()
  const consentType = readString(body.consentType, 'privacy_policy')
  const version = readString(body.version, '2026-04-26')
  const granted = body.granted !== false

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('consents').insert({
      id,
      user_id: context.userId,
      consent_type: consentType,
      version,
      granted,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      consentType,
      version,
      granted,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}

