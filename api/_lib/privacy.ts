import type { SupabaseClient } from '@supabase/supabase-js'

type PrivacySettings = {
  aiContextEnabled: boolean
  lowPiiMode: boolean
  rawChatAnalytics: boolean
}

type ExportableTable = {
  table: string
  label: string
  orderBy?: string
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  aiContextEnabled: true,
  lowPiiMode: true,
  rawChatAnalytics: false,
}

export const userExportTables: ExportableTable[] = [
  { table: 'profiles', label: 'profile', orderBy: 'created_at' },
  { table: 'pregnancies', label: 'pregnancies', orderBy: 'created_at' },
  { table: 'consents', label: 'consents', orderBy: 'created_at' },
  { table: 'user_privacy_settings', label: 'privacySettings', orderBy: 'updated_at' },
  { table: 'checkins', label: 'checkins', orderBy: 'created_at' },
  { table: 'kick_sessions', label: 'kickSessions', orderBy: 'created_at' },
  { table: 'kick_events', label: 'kickEvents', orderBy: 'occurred_at' },
  { table: 'contraction_sessions', label: 'contractionSessions', orderBy: 'created_at' },
  { table: 'symptom_logs', label: 'symptomLogs', orderBy: 'created_at' },
  { table: 'weight_logs', label: 'weightLogs', orderBy: 'created_at' },
  { table: 'relaxation_playlists', label: 'relaxationPlaylists', orderBy: 'created_at' },
  { table: 'exercise_plans', label: 'exercisePlans', orderBy: 'created_at' },
  { table: 'wellness_recommendations', label: 'wellnessRecommendations', orderBy: 'created_at' },
  { table: 'postpartum_logs', label: 'postpartumLogs', orderBy: 'created_at' },
  { table: 'baby_logs', label: 'babyLogs', orderBy: 'created_at' },
  { table: 'milestones', label: 'milestones', orderBy: 'created_at' },
  { table: 'vaccine_records', label: 'vaccineRecords', orderBy: 'created_at' },
  { table: 'journal_entries', label: 'journalEntries', orderBy: 'created_at' },
  { table: 'partner_permissions', label: 'partnerPermissions', orderBy: 'created_at' },
  { table: 'notification_preferences', label: 'notificationPreferences', orderBy: 'created_at' },
  { table: 'referrals', label: 'referrals', orderBy: 'created_at' },
  { table: 'milestone_share_cards', label: 'milestoneShareCards', orderBy: 'created_at' },
  { table: 'clinic_qr_attributions', label: 'clinicQrAttributions', orderBy: 'created_at' },
  { table: 'due_date_cohorts', label: 'dueDateCohorts', orderBy: 'created_at' },
  { table: 'entitlements', label: 'entitlements', orderBy: 'created_at' },
  { table: 'chat_messages', label: 'chatMessages', orderBy: 'created_at' },
]

export const userDeleteTables = [
  'chat_messages',
  'notification_preferences',
  'milestone_share_cards',
  'clinic_qr_attributions',
  'due_date_cohorts',
  'partner_permissions',
  'journal_entries',
  'vaccine_records',
  'milestones',
  'baby_logs',
  'postpartum_logs',
  'wellness_recommendations',
  'exercise_plans',
  'relaxation_playlists',
  'weight_logs',
  'symptom_logs',
  'contraction_sessions',
  'kick_events',
  'kick_sessions',
  'checkins',
  'pregnancies',
  'profiles',
  'referrals',
  'entitlements',
  'user_privacy_settings',
  'consents',
]

function mapSettings(row: Record<string, unknown> | null | undefined): PrivacySettings {
  if (!row) return DEFAULT_PRIVACY_SETTINGS
  return {
    aiContextEnabled: row.ai_context_enabled !== false,
    lowPiiMode: row.low_pii_mode !== false,
    rawChatAnalytics: row.raw_chat_analytics === true,
  }
}

export async function getPersistedPrivacySettings(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_privacy_settings')
    .select('ai_context_enabled, low_pii_mode, raw_chat_analytics, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return { ...mapSettings(data), updatedAt: data?.updated_at ?? null }
}

export async function upsertPrivacySettings(supabase: SupabaseClient, userId: string, settings: PrivacySettings) {
  const { data, error } = await supabase
    .from('user_privacy_settings')
    .upsert(
      {
        user_id: userId,
        ai_context_enabled: settings.aiContextEnabled,
        low_pii_mode: settings.lowPiiMode,
        raw_chat_analytics: settings.rawChatAnalytics,
      },
      { onConflict: 'user_id' },
    )
    .select('ai_context_enabled, low_pii_mode, raw_chat_analytics, updated_at')
    .single()

  if (error) throw error
  return { ...mapSettings(data), updatedAt: data.updated_at as string }
}

export async function buildPrivacyExportBundle(supabase: SupabaseClient, userId: string, requestId: string) {
  const bundle: Record<string, unknown> = {
    exportMetadata: {
      requestId,
      userId,
      generatedAt: new Date().toISOString(),
      format: 'rifqa-privacy-export-v1',
      note: 'User-owned export bundle. Aggregate analytics and deleted operational logs are not included.',
    },
  }

  for (const item of userExportTables) {
    let query = supabase.from(item.table).select('*').eq('user_id', userId)
    if (item.orderBy) query = query.order(item.orderBy, { ascending: false })
    const { data, error } = await query
    if (error) {
      bundle[item.label] = { unavailable: true, reason: error.message }
    } else {
      bundle[item.label] = data ?? []
    }
  }

  return bundle
}

export async function deleteUserData(supabase: SupabaseClient, userId: string) {
  const deletedTables: string[] = []
  const skippedTables: Array<{ table: string; reason: string }> = []

  for (const table of userDeleteTables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) {
      skippedTables.push({ table, reason: error.message })
    } else {
      deletedTables.push(table)
    }
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError) skippedTables.push({ table: 'auth.users', reason: authError.message })
  else deletedTables.push('auth.users')

  return { deletedTables, skippedTables }
}
