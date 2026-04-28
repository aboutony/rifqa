import type { SupabaseClient } from '@supabase/supabase-js'

export type ReviewAuditAction = 'approve' | 'renew' | 'expire' | 'retire' | 'assign' | 'request_changes' | 'grant_role' | 'revoke_role' | 'sync_seed'

export async function writeReviewAudit({
  supabase,
  actorUserId,
  action,
  targetType,
  targetId,
  metadata = {},
}: {
  supabase: SupabaseClient | null
  actorUserId: string | null
  action: ReviewAuditAction
  targetType: 'reviewed_content' | 'reviewer_role'
  targetId: string
  metadata?: Record<string, unknown>
}) {
  if (!supabase || !actorUserId) return false

  const { error } = await supabase.from('review_audit_events').insert({
    actor_user_id: actorUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  })

  if (error) throw error
  return true
}
