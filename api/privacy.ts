import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

const allowedRequests = new Set(['export', 'delete'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const requestType = readString(body.requestType, 'export')
  const normalizedType = allowedRequests.has(requestType) ? requestType : 'export'
  const id = crypto.randomUUID()

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('privacy_requests').insert({
      id,
      user_id: context.userId,
      request_type: normalizedType,
      status: 'requested',
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      requestType: normalizedType,
      status: 'requested',
      stored: Boolean(context.supabase && context.userId),
    },
  })
}

