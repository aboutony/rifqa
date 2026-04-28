import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'
import { isReviewer } from './review-queue.js'
import { isAdmin } from './reviewer-roles.js'

type AuditEventRow = {
  id: string
  actor_user_id: string | null
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

function csvCell(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function toCsv(rows: AuditEventRow[]) {
  const headers = ['created_at', 'actor_user_id', 'action', 'target_type', 'target_id', 'metadata']
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => [
      row.created_at,
      row.actor_user_id ?? '',
      row.action,
      row.target_type,
      row.target_id,
      row.metadata ?? {},
    ].map(csvCell).join(',')),
  ].join('\n')
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function toPdfSummary(rows: AuditEventRow[]) {
  const lines = [
    'RIFQA Review Audit Summary',
    `Generated: ${new Date().toISOString()}`,
    `Events: ${rows.length}`,
    '',
    ...rows.slice(0, 60).flatMap((row) => [
      `${row.created_at} | ${row.action} | ${row.target_type} | ${row.target_id}`,
      `Actor: ${row.actor_user_id ?? 'unknown'}`,
    ]),
  ]
  const content = ['BT', '/F1 12 Tf', '50 780 Td']
  for (const line of lines) {
    content.push(`(${pdfEscape(line).slice(0, 110)}) Tj`, '0 -16 Td')
  }
  content.push('ET')
  const stream = content.join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ]
  let offset = '%PDF-1.4\n'.length
  const xref = ['xref', '0 6', '0000000000 65535 f ']
  const body = objects.map((object) => {
    xref.push(`${offset.toString().padStart(10, '0')} 00000 n `)
    offset += Buffer.byteLength(`${object}\n`)
    return object
  }).join('\n') + '\n'
  const startxref = offset
  return Buffer.from(`%PDF-1.4\n${body}${xref.join('\n')}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  const context = await getRequestContext(req)
  const exportFormat = typeof req.query.export === 'string' ? req.query.export : ''
  const isExport = exportFormat === 'csv' || exportFormat === 'pdf'
  const hasAccess = isExport ? await isAdmin(context) : await isReviewer(context)
  if (!hasAccess || !context.supabase) {
    return sendJson(res, 403, {
      error: {
        code: isExport ? 'admin_role_required' : 'reviewer_role_required',
        message: isExport
          ? 'Admin role is required to export review audit events.'
          : 'Reviewer role is required to view review audit events.',
      },
    })
  }

  const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10) || 1, 1)
  const pageSize = Math.min(Math.max(Number.parseInt(String(req.query.pageSize ?? '10'), 10) || 10, 5), 50)
  const from = typeof req.query.from === 'string' && req.query.from ? new Date(req.query.from) : null
  const to = typeof req.query.to === 'string' && req.query.to ? new Date(req.query.to) : null
  const targetGroup = typeof req.query.group === 'string' ? req.query.group : 'all'
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const fromIndex = (page - 1) * pageSize
  const toIndex = fromIndex + pageSize - 1

  let query = context.supabase
    .from('review_audit_events')
    .select('id, actor_user_id, action, target_type, target_id, metadata, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (isExport) {
    query = query.limit(5000)
  } else {
    query = query.range(fromIndex, toIndex)
  }

  if (targetGroup === 'content') {
    query = query.eq('target_type', 'reviewed_content')
  } else if (targetGroup === 'roles') {
    query = query.eq('target_type', 'reviewer_role')
  }

  if (from && !Number.isNaN(from.valueOf())) {
    query = query.gte('created_at', from.toISOString())
  }

  if (to && !Number.isNaN(to.valueOf())) {
    to.setHours(23, 59, 59, 999)
    query = query.lte('created_at', to.toISOString())
  }

  if (search) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search)
    query = isUuid
      ? query.or(`actor_user_id.eq.${search},target_id.ilike.%${search}%`)
      : query.ilike('target_id', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) throw error
  if (exportFormat === 'csv') {
    const csv = toCsv((data ?? []) as AuditEventRow[])
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="rifqa-review-audit.csv"')
    return res.status(200).send(`\uFEFF${csv}`)
  }
  if (exportFormat === 'pdf') {
    const pdf = toPdfSummary((data ?? []) as AuditEventRow[])
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="rifqa-review-audit-summary.pdf"')
    return res.status(200).send(pdf)
  }

  return sendJson(res, 200, {
    data: {
      events: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
      stored: true,
    },
  })
}
