import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'
import { getReviewerRole } from './review-queue.js'
import { adminRateLimit, enforceRateLimit } from './_lib/rate-limit.js'

const threshold = 10

function fallbackReports(lang: 'ar' | 'en') {
  return [
    {
      metric: lang === 'ar' ? 'التفعيل الشهري' : 'Monthly activation',
      stage: 'mixed',
      locale: 'SA',
      userCount: 148,
      value: 72,
      period: '2026-04-01',
      dimensions: { sponsorType: lang === 'ar' ? 'تجريبي' : 'demo', aggregateOnly: true },
    },
    {
      metric: lang === 'ar' ? 'إكمال الفحص' : 'Check-in completion',
      stage: 'pregnancy',
      locale: 'SA',
      userCount: 64,
      value: 58,
      period: '2026-04-01',
      dimensions: { sponsorType: lang === 'ar' ? 'تجريبي' : 'demo', aggregateOnly: true },
    },
  ]
}

function mapReport(row: Record<string, unknown>) {
  return {
    id: row.id,
    metric: row.metric,
    stage: row.stage,
    locale: row.locale,
    userCount: row.user_count,
    value: row.value,
    period: row.report_period ?? row.cohort_date,
    dimensions: row.dimensions ?? {},
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])
  if (req.method === 'POST' && enforceRateLimit(req, res, adminRateLimit)) return

  const lang = getLang(req)
  const context = await getRequestContext(req)
  const role = await getReviewerRole(context)
  const canReport = context.mode === 'demo' ? true : role === 'admin'
  if (!canReport) {
    return sendJson(res, 403, {
      error: {
        code: 'admin_required',
        message: 'Admin access is required for aggregate B2B reports.',
      },
    })
  }

  if (req.method === 'GET') {
    if (!context.supabase) {
      return sendJson(res, 200, {
        data: {
          reports: fallbackReports(lang),
          threshold,
          individualDataFirewall: true,
          aggregateOnly: true,
          stored: false,
        },
      })
    }

    const [{ data: reports, error: reportError }, { data: analytics, error: analyticsError }] = await Promise.all([
      context.supabase
        .from('b2b_admin_reports')
        .select('id, report_period, metric, stage, locale, user_count, value, dimensions')
        .gte('user_count', threshold)
        .order('report_period', { ascending: false })
        .limit(12),
      context.supabase
        .from('privacy_safe_analytics_daily')
        .select('id, cohort_date, metric, stage, locale, user_count, value, dimensions')
        .gte('user_count', threshold)
        .order('cohort_date', { ascending: false })
        .limit(12),
    ])
    if (reportError) throw reportError
    if (analyticsError) throw analyticsError

    return sendJson(res, 200, {
      data: {
        reports: [...(reports ?? []), ...(analytics ?? [])].map(mapReport),
        threshold,
        individualDataFirewall: true,
        aggregateOnly: true,
        stored: true,
      },
    })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const metric = readString(body.metric, lang === 'ar' ? 'تقرير إجمالي' : 'Aggregate report')
  const stage = readString(body.stage, 'mixed')
  const locale = readString(body.locale, 'SA')
  const userCount = Math.max(threshold, Number(body.userCount) || threshold)
  const value = Number(body.value) || 0
  const reportPeriod = readString(body.reportPeriod, new Date().toISOString().slice(0, 10))
  const dimensions = typeof body.dimensions === 'object' && body.dimensions !== null ? body.dimensions : {}

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('b2b_admin_reports').insert({
      report_period: reportPeriod,
      metric,
      stage: ['pregnancy', 'postpartum', 'child_0_3', 'mixed'].includes(stage) ? stage : 'mixed',
      locale,
      user_count: userCount,
      value,
      dimensions: { ...dimensions, aggregateOnly: true },
      generated_by: context.userId,
    })
    if (error) throw error
  }

  return sendJson(res, 201, {
    data: {
      report: {
        metric,
        stage,
        locale,
        userCount,
        value,
        period: reportPeriod,
        dimensions: { ...dimensions, aggregateOnly: true },
      },
      threshold,
      aggregateOnly: true,
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
