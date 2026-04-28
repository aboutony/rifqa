import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { applyReviewAction, getReviewQueue, type ReviewAction, type ReviewedContent } from './_lib/maternal-os.js'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext, type RequestContext } from './_lib/supabase.js'
import { getPersistedReviewedContent } from './_lib/reviewed-content-store.js'
import { writeReviewAudit } from './_lib/review-audit.js'
import { adminRateLimit, enforceRateLimit } from './_lib/rate-limit.js'

const allowedActions = new Set<ReviewAction>(['approve', 'renew', 'expire', 'retire', 'assign', 'request_changes'])

type ReviewedContentRow = {
  id: string
  status: ReviewedContent['status']
  reviewer_name: string
  reviewer_specialty: string
  approval_date: string
  expiry_date: string
  workflow_status?: ReviewedContent['workflowStatus'] | null
  assigned_reviewer?: string | null
  review_comments?: string | null
  rejection_reason?: string | null
  version_number?: number | null
}

function mergePersistedStatus(items: ReviewedContent[], rows: ReviewedContentRow[]) {
  const byId = new Map(rows.map((row) => [row.id, row]))
  return items.map((item) => {
    const row = byId.get(item.id)
    if (!row) return item
    return {
      ...item,
      status: row.status,
      reviewerName: row.reviewer_name || item.reviewerName,
      reviewerSpecialty: row.reviewer_specialty || item.reviewerSpecialty,
      approvalDate: row.approval_date || item.approvalDate,
      expiryDate: row.expiry_date || item.expiryDate,
      workflowStatus: row.workflow_status || item.workflowStatus || 'approved',
      assignedReviewer: row.assigned_reviewer || item.assignedReviewer || '',
      reviewComments: row.review_comments || item.reviewComments || '',
      rejectionReason: row.rejection_reason || item.rejectionReason || '',
      versionNumber: row.version_number || item.versionNumber || 1,
    }
  })
}

export async function getReviewerRole(context: RequestContext) {
  if (context.mode !== 'production' || !context.supabase || !context.userId) return null
  if (context.appRole === 'admin') return 'admin'
  if (context.appRole === 'clinical_reviewer') return 'clinical_reviewer'

  const { data, error } = await context.supabase
    .from('reviewer_roles')
    .select('role')
    .eq('user_id', context.userId)
    .in('role', ['clinical_reviewer', 'admin'])
    .maybeSingle()

  if (error) throw error
  return data?.role ?? null
}

export async function isReviewer(context: RequestContext) {
  return Boolean(await getReviewerRole(context))
}

async function readPersistedQueue(context: RequestContext, fallback: ReviewedContent[]) {
  if (context.mode !== 'production' || !context.supabase) {
    return { queue: fallback, stored: false }
  }

  const { data, error } = await context.supabase
    .from('reviewed_content')
    .select('id, status, reviewer_name, reviewer_specialty, approval_date, expiry_date, workflow_status, assigned_reviewer, review_comments, rejection_reason, version_number')

  if (error) throw error
  return { queue: mergePersistedStatus(fallback, (data ?? []) as ReviewedContentRow[]), stored: true }
}

export async function persistReviewedContentItem(context: RequestContext, item: ReviewedContent) {
  if (context.mode !== 'production' || !context.supabase || !context.userId) return false

  const { data: previous } = await context.supabase
    .from('reviewed_content')
    .select('*')
    .eq('id', item.id)
    .maybeSingle()
  const previousVersion = typeof previous?.version_number === 'number' ? previous.version_number : 0
  const nextVersion = previousVersion + 1

  if (previous) {
    const { error: versionError } = await context.supabase.from('reviewed_content_versions').insert({
      content_id: item.id,
      version_number: previousVersion || 1,
      snapshot: previous,
      changed_by: context.userId,
      change_action: item.workflowStatus === 'changes_requested' ? 'request_changes' : item.status,
    })
    if (versionError) throw versionError
  }

  const { error } = await context.supabase.from('reviewed_content').upsert({
    id: item.id,
    stage: item.stage,
    locale: 'SA',
    title: item.title,
    summary: item.summary,
    reviewer_name: item.reviewerName,
    reviewer_specialty: item.reviewerSpecialty,
    citations: item.citations,
    approval_date: item.approvalDate,
    expiry_date: item.expiryDate,
    status: item.status,
    workflow_status: item.workflowStatus || (item.status === 'approved' ? 'approved' : 'unassigned'),
    assigned_reviewer: item.assignedReviewer || null,
    review_comments: item.reviewComments || null,
    rejection_reason: item.rejectionReason || null,
    version_number: nextVersion,
    reviewed_by: context.userId,
    reviewed_at: new Date().toISOString(),
  })

  if (error) throw error
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const lang = getLang(req)
  if (req.method !== 'GET' && enforceRateLimit(req, res, adminRateLimit)) return
  const context = await getRequestContext(req)

  if (req.method === 'GET') {
    if (req.query.access === '1') {
      const role = await getReviewerRole(context)
      return sendJson(res, 200, {
        data: {
          stored: context.mode === 'production' && Boolean(context.supabase),
          canReview: context.mode === 'demo' ? true : Boolean(role),
          role,
        },
      })
    }

    const available = await getPersistedReviewedContent(lang)
    const fallback = getReviewQueue(lang).map((seed) => available.items.find((item) => item.id === seed.id) ?? seed)
    const persisted = await readPersistedQueue(context, fallback)
    const role = await getReviewerRole(context)
    const now = new Date()
    const reminders = persisted.queue
      .filter((item) => item.status === 'approved')
      .map((item) => {
        const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / 86_400_000)
        return { id: item.id, title: item.title, expiryDate: item.expiryDate, daysUntilExpiry }
      })
      .filter((item) => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 30)
    return sendJson(res, 200, {
      data: {
        queue: persisted.queue,
        reminders,
        actions: ['approve', 'renew', 'expire', 'retire', 'assign', 'request_changes'] satisfies ReviewAction[],
        stored: persisted.stored,
        canReview: context.mode === 'demo' ? true : Boolean(role),
        role,
      },
    })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const actionInput = readString(body.action, 'renew') as ReviewAction
  const action = allowedActions.has(actionInput) ? actionInput : 'renew'
  const contentId = readString(body.contentId)
  const reviewerName = readString(body.reviewerName)
  const reviewerSpecialty = readString(body.reviewerSpecialty)
  const assignedReviewer = readString(body.assignedReviewer)
  const reviewComments = readString(body.reviewComments)
  const rejectionReason = readString(body.rejectionReason)
  const canReview = context.mode === 'demo' ? true : await isReviewer(context)
  if (!canReview) {
    return sendJson(res, 403, {
      error: {
        code: 'reviewer_role_required',
        message: 'Clinical reviewer role is required to update reviewed content.',
      },
    })
  }

  const updated = applyReviewAction({
    lang,
    contentId,
    action,
    reviewerName,
    reviewerSpecialty,
  })
  if (updated) {
    if (assignedReviewer) updated.assignedReviewer = assignedReviewer
    if (reviewComments) updated.reviewComments = reviewComments
    if (rejectionReason) updated.rejectionReason = rejectionReason
    if (action === 'assign') {
      updated.assignedReviewer = assignedReviewer || updated.assignedReviewer || reviewerName
      updated.reviewComments = reviewComments || updated.reviewComments
    }
    if (action === 'request_changes') {
      updated.rejectionReason = rejectionReason || reviewComments || updated.rejectionReason
      updated.reviewComments = reviewComments || updated.reviewComments
    }
  }
  const stored = updated ? await persistReviewedContentItem(context, updated) : false
  if (stored && updated) {
    await writeReviewAudit({
      supabase: context.supabase,
      actorUserId: context.userId,
      action,
      targetType: 'reviewed_content',
      targetId: updated.id,
      metadata: {
        status: updated.status,
        approvalDate: updated.approvalDate,
        expiryDate: updated.expiryDate,
        workflowStatus: updated.workflowStatus,
        assignedReviewer: updated.assignedReviewer,
        rejectionReason: updated.rejectionReason,
      },
    })
  }

  return sendJson(res, updated ? 200 : 404, {
    data: {
      item: updated,
      action,
      stored,
    },
  })
}
