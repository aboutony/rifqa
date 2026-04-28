import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

type PartnerPermissionSet = {
  babyProgress: boolean
  appointmentReminders: boolean
  supportPrompts: boolean
  selectedJournalEntries: boolean
  symptoms: boolean
  mentalHealth: boolean
  aiChat: boolean
}

type PartnerPermissionRow = {
  id: string
  partner_name: string
  partner_contact: string | null
  invite_code: string | null
  permissions: Partial<PartnerPermissionSet>
  active: boolean
  invited_at: string | null
  revoked_at: string | null
  updated_at: string
}

const defaultPermissions: PartnerPermissionSet = {
  babyProgress: true,
  appointmentReminders: true,
  supportPrompts: true,
  selectedJournalEntries: false,
  symptoms: false,
  mentalHealth: false,
  aiChat: false,
}

function normalizePermissions(value: unknown): PartnerPermissionSet {
  const raw = typeof value === 'object' && value !== null ? value as Partial<PartnerPermissionSet> : {}
  return {
    babyProgress: raw.babyProgress !== false,
    appointmentReminders: raw.appointmentReminders !== false,
    supportPrompts: raw.supportPrompts !== false,
    selectedJournalEntries: raw.selectedJournalEntries === true,
    symptoms: raw.symptoms === true,
    mentalHealth: raw.mentalHealth === true,
    aiChat: raw.aiChat === true,
  }
}

function mapPartner(row: PartnerPermissionRow) {
  return {
    id: row.id,
    partnerName: row.partner_name,
    partnerContact: row.partner_contact ?? '',
    inviteCode: row.invite_code ?? '',
    permissions: normalizePermissions(row.permissions),
    active: row.active,
    invitedAt: row.invited_at,
    revokedAt: row.revoked_at,
    updatedAt: row.updated_at,
  }
}

function buildInviteCode() {
  return `RIFQA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method ?? '')) return sendMethodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE'])
  const lang = getLang(req)
  const context = await getRequestContext(req)
  const privacyRule =
    lang === 'ar'
      ? 'الصحة النفسية، الأعراض الحساسة، السجل الخاص، ومحادثات رفقة مخفية افتراضيا ولا تظهر للشريك إلا بموافقة صريحة.'
      : 'Mental health, sensitive symptoms, private journal, and RIFQA chat stay hidden by default unless explicitly shared.'

  if (req.method === 'GET') {
    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('partner_permissions')
        .select('id, partner_name, partner_contact, invite_code, permissions, active, invited_at, revoked_at, updated_at')
        .eq('user_id', context.userId)
        .order('invited_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return sendJson(res, 200, { data: { partners: (data ?? []).map(mapPartner), permissions: defaultPermissions, privacyRule, stored: true } })
    }

    return sendJson(res, 200, {
      data: {
        partners: [],
        permissions: defaultPermissions,
        privacyRule,
        stored: false,
      },
    })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const id = readString(body.id)

  if (req.method === 'DELETE') {
    if (context.supabase && context.userId && id) {
      const { data, error } = await context.supabase
        .from('partner_permissions')
        .update({ active: false, revoked_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', context.userId)
        .select('id, partner_name, partner_contact, invite_code, permissions, active, invited_at, revoked_at, updated_at')
        .single()

      if (error) throw error
      return sendJson(res, 200, { data: { partner: mapPartner(data), revoked: true, stored: true } })
    }

    return sendJson(res, 200, { data: { id, revoked: true, stored: false } })
  }

  const partnerName = readString(body.partnerName, lang === 'ar' ? 'الشريك' : 'Partner')
  const partnerContact = readString(body.partnerContact)
  const permissions = normalizePermissions(body.permissions)

  if (req.method === 'PUT') {
    if (context.supabase && context.userId && id) {
      const { data, error } = await context.supabase
        .from('partner_permissions')
        .update({ partner_name: partnerName, partner_contact: partnerContact || null, permissions })
        .eq('id', id)
        .eq('user_id', context.userId)
        .select('id, partner_name, partner_contact, invite_code, permissions, active, invited_at, revoked_at, updated_at')
        .single()

      if (error) throw error
      return sendJson(res, 200, { data: { partner: mapPartner(data), stored: true } })
    }

    return sendJson(res, 200, { data: { partner: { id, partnerName, partnerContact, permissions, active: true }, stored: false } })
  }

  const newId = crypto.randomUUID()
  const inviteCode = buildInviteCode()

  if (context.supabase && context.userId) {
    const { data, error } = await context.supabase
      .from('partner_permissions')
      .insert({
        id: newId,
        user_id: context.userId,
        partner_name: partnerName,
        partner_contact: partnerContact || null,
        invite_code: inviteCode,
        permissions,
        active: true,
      })
      .select('id, partner_name, partner_contact, invite_code, permissions, active, invited_at, revoked_at, updated_at')
      .single()

    if (error) throw error
    return sendJson(res, 201, { data: { partner: mapPartner(data), inviteCode, privacyRule, stored: true } })
  }

  return sendJson(res, 201, {
    data: {
      partner: {
        id: newId,
        partnerName,
        partnerContact,
        inviteCode,
        permissions,
        active: true,
        invitedAt: new Date().toISOString(),
      },
      inviteCode,
      privacyRule,
      stored: false,
    },
  })
}
