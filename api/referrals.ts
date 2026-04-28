import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

function buildCode(lang: 'ar' | 'en') {
  if (lang === 'ar') {
    const digits = Math.floor(100000 + Math.random() * 900000).toLocaleString('ar-SA', { useGrouping: false })
    return `رفقة-${digits}`
  }
  return `RIFQA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

function dueDateCohort(dueDate: string) {
  if (!dueDate) return null
  const date = new Date(`${dueDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  return {
    key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
    month: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`,
  }
}

function shareCardText(lang: 'ar' | 'en', milestone: string, code: string) {
  if (lang === 'en') {
    return {
      title: milestone || 'A RIFQA milestone',
      body: `I saved a calm pregnancy milestone in RIFQA. Use my code ${code} to join.`,
      reward: 'Unlock one premium week after a verified invite.',
      communityStatus: 'In-app community is delayed until moderation is ready.',
    }
  }

  return {
    title: milestone || 'مرحلة من رفقة',
    body: `حفظت مرحلة جميلة في رفقة. استخدمي الرمز ${code} للانضمام.`,
    reward: 'افتحي أسبوعا مميزا بعد دعوة موثوقة.',
    communityStatus: 'تم تأجيل المجتمع داخل التطبيق حتى تجهز أدوات الإشراف.',
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const context = await getRequestContext(req)
  const lang = getLang(req)

  if (req.method === 'GET') {
    const fallback = {
      referrals: [],
      shareCards: [],
      cohort: null,
      community: {
        enabled: false,
        moderationRequired: true,
        status: 'delayed',
        reason: shareCardText(lang, '', lang === 'ar' ? 'رفقة-تجريبي' : 'RIFQA-DEMO').communityStatus,
      },
      stored: false,
    }

    if (!context.supabase || !context.userId) return sendJson(res, 200, { data: fallback })

    const [{ data: referrals }, { data: shareCards }, { data: cohort }, { data: community }] = await Promise.all([
      context.supabase
        .from('referrals')
        .select('id, referral_code, source, campaign, medium, clinic_code, due_date_cohort, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(8),
      context.supabase
        .from('milestone_share_cards')
        .select('id, milestone_key, title, body, share_url, whatsapp_url, referral_code, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(8),
      context.supabase
        .from('due_date_cohorts')
        .select('cohort_key, due_month, stage')
        .eq('user_id', context.userId)
        .maybeSingle(),
      context.supabase
        .from('community_readiness')
        .select('enabled, moderation_required, status, reason')
        .eq('gate_key', 'in_app_community')
        .maybeSingle(),
    ])

    return sendJson(res, 200, {
      data: {
        referrals: referrals ?? [],
        shareCards: shareCards ?? [],
        cohort: cohort ?? null,
        community: community
          ? {
              enabled: community.enabled,
              moderationRequired: community.moderation_required,
              status: community.status,
              reason: community.reason,
            }
          : fallback.community,
        stored: true,
      },
    })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const source = readString(body.source, 'organic_share')
  const campaign = readString(body.campaign)
  const medium = readString(body.medium, source === 'clinic_qr' ? 'qr' : 'whatsapp')
  const clinicCode = readString(body.clinicCode)
  const landingPath = readString(body.landingPath, '/')
  const milestone = readString(body.milestone, lang === 'ar' ? 'مرحلة جديدة' : 'New milestone')
  const dueDate = readString(body.dueDate)
  const stage = readString(body.stage, 'pregnancy')
  const code = buildCode(lang)
  const cohort = dueDateCohort(dueDate)
  const copy = shareCardText(lang, milestone, code)
  const shareUrl = `https://rifqa.app/join?ref=${encodeURIComponent(code)}${campaign ? `&utm_campaign=${encodeURIComponent(campaign)}` : ''}${clinicCode ? `&clinic=${encodeURIComponent(clinicCode)}` : ''}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${copy.body} ${shareUrl}`)}`

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('referrals').insert({
      user_id: context.userId,
      referral_code: code,
      source,
      campaign: campaign || null,
      medium: medium || null,
      clinic_code: clinicCode || null,
      landing_path: landingPath || null,
      due_date_cohort: cohort?.key ?? null,
      metadata: { milestone, whatsappUrl, shareUrl },
    })
    if (error) throw error

    await context.supabase.from('milestone_share_cards').insert({
      user_id: context.userId,
      milestone_key: milestone.toLowerCase().replace(/\s+/g, '_').slice(0, 64),
      title: copy.title,
      body: copy.body,
      share_url: shareUrl,
      whatsapp_url: whatsappUrl,
      referral_code: code,
    })

    if (clinicCode) {
      await context.supabase.from('clinic_qr_attributions').insert({
        user_id: context.userId,
        clinic_code: clinicCode,
        campaign: campaign || null,
        source,
        landing_path: landingPath || null,
        referral_code: code,
      })
    }

    if (cohort) {
      await context.supabase.from('due_date_cohorts').upsert(
        {
          user_id: context.userId,
          cohort_key: cohort.key,
          due_month: cohort.month,
          stage: ['pregnancy', 'postpartum', 'child_0_3'].includes(stage) ? stage : 'pregnancy',
        },
        { onConflict: 'user_id' },
      )
    }
  }

  return sendJson(res, 201, {
    data: {
      referralCode: code,
      source,
      campaign: campaign || null,
      medium,
      clinicCode: clinicCode || null,
      dueDateCohort: cohort?.key ?? null,
      shareCard: {
        title: copy.title,
        body: copy.body,
        shareUrl,
        whatsappUrl,
      },
      community: {
        enabled: false,
        moderationRequired: true,
        status: 'delayed',
        reason: copy.communityStatus,
      },
      reward: copy.reward,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
