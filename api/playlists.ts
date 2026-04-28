import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const id = crypto.randomUUID()
  const title = readString(body.title, 'My calming playlist')
  const playlistUrl = readString(body.playlistUrl)
  const playlistType = readString(body.playlistType, 'personal')

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('relaxation_playlists').insert({
      id,
      user_id: context.userId,
      title,
      playlist_url: playlistUrl || null,
      playlist_type: playlistType,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      title,
      playlistUrl,
      playlistType,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}

