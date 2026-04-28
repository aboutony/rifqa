import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getReviewedContentSeeds } from './_lib/maternal-os.js'
import { sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'
import { isReviewer, persistReviewedContentItem } from './review-queue.js'
import { writeReviewAudit } from './_lib/review-audit.js'
import { adminRateLimit, enforceRateLimit } from './_lib/rate-limit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])
  if (enforceRateLimit(req, res, adminRateLimit)) return

  const context = await getRequestContext(req)
  if (context.mode !== 'production' || !context.supabase) {
    return sendJson(res, 409, {
      error: {
        code: 'supabase_required',
        message: 'Supabase service configuration and a reviewer bearer token are required to sync reviewed content.',
      },
    })
  }

  if (!(await isReviewer(context))) {
    return sendJson(res, 403, {
      error: {
        code: 'reviewer_role_required',
        message: 'Clinical reviewer or admin role is required to sync reviewed content seeds.',
      },
    })
  }

  const seeds = getReviewedContentSeeds()
  for (const item of seeds) {
    await persistReviewedContentItem(context, item)
  }
  await writeReviewAudit({
    supabase: context.supabase,
    actorUserId: context.userId,
    action: 'sync_seed',
    targetType: 'reviewed_content',
    targetId: 'seed_reviewed_content',
    metadata: {
      count: seeds.length,
      ids: seeds.map((item) => item.id),
    },
  })

  return sendJson(res, 200, {
    data: {
      synced: seeds.length,
      ids: seeds.map((item) => item.id),
      stored: true,
    },
  })
}
