import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const title = readString(body.title, 'Memory')
  const bodyText = readString(body.body, 'A private RIFQA memory.')
  const visibility = readString(body.visibility, 'private') === 'partner_shared' ? 'partner_shared' : 'private'
  const id = crypto.randomUUID()

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('journal_entries').insert({
      id,
      user_id: context.userId,
      title,
      body: bodyText,
      visibility,
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      id,
      title,
      body: bodyText,
      visibility,
      shareCard:
        visibility === 'partner_shared'
          ? lang === 'ar'
            ? 'جاهزة كبطاقة مشاركة عربية وآمنة للعائلة.'
            : 'Ready for a family-safe Arabic share card.'
          : lang === 'ar'
            ? 'خاص افتراضيا.'
            : 'Private by default.',
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
