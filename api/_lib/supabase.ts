/// <reference types="node" />

import type { VercelRequest } from './vercel-types.js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { reportApiError } from './monitoring.js'

export type RequestContext = {
  mode: 'demo' | 'production'
  supabase: SupabaseClient | null
  userId: string | null
  appRole: string | null
}

let cachedAdmin: SupabaseClient | null = null

export function getServiceClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null
  cachedAdmin ??= createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedAdmin
}

function getBearerToken(req: VercelRequest) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim()
}

export async function getRequestContext(req: VercelRequest): Promise<RequestContext> {
  const supabase = getServiceClient()
  const token = getBearerToken(req)

  if (!supabase || !token) {
    return {
      mode: 'demo',
      supabase: null,
      userId: null,
      appRole: null,
    }
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    reportApiError(req, error ?? new Error('Invalid or expired access token.'), { auth: 'bearer' })
    throw new Error('Invalid or expired access token.')
  }

  return {
    mode: 'production',
    supabase,
    userId: data.user.id,
    appRole: typeof data.user.app_metadata?.role === 'string' ? data.user.app_metadata.role : null,
  }
}
