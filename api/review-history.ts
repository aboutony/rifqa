import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'
import { isReviewer } from './review-queue.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  const context = await getRequestContext(req)
  if (!(await isReviewer(context)) || !context.supabase) {
    return sendJson(res, 403, {
      error: {
        code: 'reviewer_role_required',
        message: 'Reviewer role is required to view content history.',
      },
    })
  }

  const contentId = typeof req.query.contentId === 'string' ? req.query.contentId : ''
  if (!contentId) {
    return sendJson(res, 400, {
      error: {
        code: 'content_id_required',
        message: 'contentId is required.',
      },
    })
  }

  const { data, error } = await context.supabase
    .from('reviewed_content_versions')
    .select('id, content_id, version_number, snapshot, change_action, changed_by, created_at')
    .eq('content_id', contentId)
    .order('version_number', { ascending: false })
    .limit(20)

  if (error) throw error
  return sendJson(res, 200, {
    data: {
      versions: data ?? [],
    },
  })
}
