import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return sendMethodNotAllowed(res, ['DELETE'])

  const context = await getRequestContext(req)
  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('chat_messages').delete().eq('user_id', context.userId)
    if (error) throw error
  }

  return sendJson(res, 200, {
    data: {
      deleted: true,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
