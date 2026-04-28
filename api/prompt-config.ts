import type { VercelRequest, VercelResponse } from '@vercel/node'
import { DEFAULT_PROMPT_VERSION } from './_lib/ai-policy.js'
import { readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'
import { isAdmin } from './reviewer-roles.js'
import { adminRateLimit, enforceRateLimit } from './_lib/rate-limit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])
  if (req.method === 'POST' && enforceRateLimit(req, res, adminRateLimit)) return

  const context = await getRequestContext(req)

  if (req.method === 'GET') {
    if (context.supabase) {
      const { data, error } = await context.supabase
        .from('ai_prompt_configs')
        .select('prompt_version, label, active, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) return sendJson(res, 200, { data: { promptVersion: data.prompt_version, label: data.label, stored: true } })
    }

    return sendJson(res, 200, {
      data: {
        promptVersion: process.env.OPENAI_PROMPT_VERSION || DEFAULT_PROMPT_VERSION,
        label: 'Default maternal companion prompt',
        stored: false,
      },
    })
  }

  if (!(await isAdmin(context)) || !context.supabase || !context.userId) {
    return sendJson(res, 403, { error: { code: 'admin_role_required', message: 'Admin role is required to update prompt config.' } })
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const promptVersion = readString(body.promptVersion, DEFAULT_PROMPT_VERSION)
  const label = readString(body.label, 'Maternal companion prompt')

  const { error: deactivateError } = await context.supabase
    .from('ai_prompt_configs')
    .update({ active: false })
    .eq('active', true)
  if (deactivateError) throw deactivateError

  const { data, error } = await context.supabase
    .from('ai_prompt_configs')
    .upsert({ prompt_version: promptVersion, label, active: true, created_by: context.userId }, { onConflict: 'prompt_version' })
    .select('prompt_version, label, active, created_at')
    .single()
  if (error) throw error

  return sendJson(res, 200, { data: { promptVersion: data.prompt_version, label: data.label, stored: true } })
}
