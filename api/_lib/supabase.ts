import type { VercelRequest } from '@vercel/node'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type RequestContext = {
  mode: 'demo' | 'production'
  supabase: SupabaseClient | null
  userId: string | null
}

let cachedAdmin: SupabaseClient | null = null

function getAdminClient() {
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
  const supabase = getAdminClient()
  const token = getBearerToken(req)
  const isProduction = process.env.RIFQA_ENV === 'production'

  if (!supabase || !token) {
    if (isProduction) {
      throw new Error('Production API requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and a Bearer token.')
    }

    return {
      mode: 'demo',
      supabase: null,
      userId: null,
    }
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw new Error('Invalid or expired access token.')
  }

  return {
    mode: 'production',
    supabase,
    userId: data.user.id,
  }
}

