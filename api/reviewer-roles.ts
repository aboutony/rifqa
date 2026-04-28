import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext, type RequestContext } from './_lib/supabase.js'
import { writeReviewAudit } from './_lib/review-audit.js'
import { adminRateLimit, enforceRateLimit } from './_lib/rate-limit.js'

type ReviewerRole = 'clinical_reviewer' | 'admin'

const allowedRoles = new Set<ReviewerRole>(['clinical_reviewer', 'admin'])

export async function isAdmin(context: RequestContext) {
  if (context.mode !== 'production' || !context.supabase || !context.userId) return false
  if (context.appRole === 'admin') return true

  const { data, error } = await context.supabase
    .from('reviewer_roles')
    .select('role')
    .eq('user_id', context.userId)
    .eq('role', 'admin')
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

function forbidden(res: VercelResponse) {
  return sendJson(res, 403, {
    error: {
      code: 'admin_role_required',
      message: 'Admin role is required to manage reviewer roles.',
    },
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return sendMethodNotAllowed(res, ['GET', 'POST', 'DELETE'])
  }
  if (req.method !== 'GET' && enforceRateLimit(req, res, adminRateLimit)) return

  const context = await getRequestContext(req)
  if (!(await isAdmin(context)) || !context.supabase || !context.userId) return forbidden(res)

  if (req.method === 'GET') {
    const { data, error } = await context.supabase
      .from('reviewer_roles')
      .select('user_id, role, granted_by, granted_at')
      .order('granted_at', { ascending: false })

    if (error) throw error
    return sendJson(res, 200, {
      data: {
        roles: data ?? [],
        stored: true,
      },
    })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const targetUserId = readString(body.userId)
  const roleInput = readString(body.role, 'clinical_reviewer') as ReviewerRole
  const role = allowedRoles.has(roleInput) ? roleInput : 'clinical_reviewer'

  if (!targetUserId) {
    return sendJson(res, 400, {
      error: {
        code: 'user_id_required',
        message: 'userId is required.',
      },
    })
  }

  if (req.method === 'DELETE') {
    if (targetUserId === context.userId) {
      return sendJson(res, 400, {
        error: {
          code: 'cannot_revoke_self',
          message: 'Admins cannot revoke their own reviewer role from this endpoint.',
        },
      })
    }

    const { error } = await context.supabase
      .from('reviewer_roles')
      .delete()
      .eq('user_id', targetUserId)

    if (error) throw error
    await writeReviewAudit({
      supabase: context.supabase,
      actorUserId: context.userId,
      action: 'revoke_role',
      targetType: 'reviewer_role',
      targetId: targetUserId,
      metadata: {},
    })
    return sendJson(res, 200, {
      data: {
        userId: targetUserId,
        revoked: true,
        stored: true,
      },
    })
  }

  const { data, error } = await context.supabase
    .from('reviewer_roles')
    .upsert({
      user_id: targetUserId,
      role,
      granted_by: context.userId,
      granted_at: new Date().toISOString(),
    })
    .select('user_id, role, granted_by, granted_at')
    .single()

  if (error) throw error
  await writeReviewAudit({
    supabase: context.supabase,
    actorUserId: context.userId,
    action: 'grant_role',
    targetType: 'reviewer_role',
    targetId: targetUserId,
    metadata: { role },
  })
  return sendJson(res, 200, {
    data: {
      role: data,
      stored: true,
    },
  })
}
