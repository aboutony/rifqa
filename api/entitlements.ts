import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

const neverPaywalled = ['crisis_support', 'urgent_guidance', 'delete_export', 'kick_counter', 'contraction_timer']
const premiumCandidates = ['advanced_ai_summaries', 'memory_book_export', 'partner_plus', 'deep_dive_courses']

function firewallCopy(lang: 'ar' | 'en') {
  return lang === 'ar'
    ? 'يمكن للجهة الراعية تمويل الوصول فقط. لا تحصل على بيانات فردية عن الهوية أو الحمل أو المزاج أو الأعراض أو اليوميات أو محادثات رفقة.'
    : 'Sponsors can fund access only. They never receive individual identity, pregnancy, mood, symptom, journal, or RIFQA chat data.'
}

function mapEntitlement(row: Record<string, unknown> | null | undefined, lang: 'ar' | 'en') {
  const plan = typeof row?.plan === 'string' ? row.plan : 'free'
  const source = typeof row?.source === 'string' ? row.source : 'direct'
  return {
    id: typeof row?.id === 'string' ? row.id : null,
    plan,
    source,
    sponsorCode: typeof row?.sponsor_code === 'string' ? row.sponsor_code : null,
    policyGroup: typeof row?.policy_group === 'string' ? row.policy_group : null,
    startsAt: typeof row?.starts_at === 'string' ? row.starts_at : null,
    endsAt: typeof row?.ends_at === 'string' ? row.ends_at : null,
    firewallAcknowledged: row?.firewall_acknowledged !== false,
    featureAccess: {
      sponsored: plan === 'sponsored',
      premium: plan === 'premium' || plan === 'sponsored',
      neverPaywalled,
      premiumCandidates,
    },
    b2bFirewall: firewallCopy(lang),
    aggregateReportingOnly: true,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const context = await getRequestContext(req)
  const lang = getLang(req)

  if (req.method === 'GET') {
    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('entitlements')
        .select('id, plan, source, sponsor_code, policy_group, starts_at, ends_at, firewall_acknowledged')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return sendJson(res, 200, { data: { ...mapEntitlement(data, lang), stored: Boolean(data) } })
    }

    return sendJson(res, 200, { data: { ...mapEntitlement(null, lang), stored: false } })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const requestedPlan = readString(body.plan, 'free')
  const source = readString(body.source, requestedPlan === 'sponsored' ? 'employer' : 'direct')
  const sponsorCode = readString(body.sponsorCode)
  const policyGroup = readString(body.policyGroup)
  const id = crypto.randomUUID()
  let sponsorId: string | null = null
  let sponsorType = source

  if (context.supabase && sponsorCode) {
    const { data, error } = await context.supabase
      .from('b2b_sponsors')
      .select('id, sponsor_type')
      .eq('sponsor_code', sponsorCode)
      .eq('active', true)
      .maybeSingle()
    if (error) throw error
    sponsorId = data?.id ?? null
    sponsorType = data?.sponsor_type ?? source
  }

  const plan = sponsorCode || requestedPlan === 'sponsored' ? 'sponsored' : requestedPlan

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('entitlements').insert({
      id,
      user_id: context.userId,
      plan,
      source: sponsorType,
      sponsor_id: sponsorId,
      sponsor_code: sponsorCode || null,
      policy_group: policyGroup || null,
      firewall_acknowledged: true,
      metadata: {
        aggregateOnly: true,
        individualDataFirewall: true,
      },
    })

    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      ...mapEntitlement({
        id,
        plan,
        source: sponsorType,
        sponsor_code: sponsorCode || null,
        policy_group: policyGroup || null,
        firewall_acknowledged: true,
        starts_at: new Date().toISOString(),
      }, lang),
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
