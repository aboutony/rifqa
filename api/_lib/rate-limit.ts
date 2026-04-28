import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendJson } from './http.js'
import { reportRateLimit } from './monitoring.js'

type RateLimitOptions = {
  bucket: string
  limit: number
  windowMs: number
}

type RateLimitState = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitState>()

function clientKey(req: VercelRequest) {
  const forwarded = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
  const auth = req.headers.authorization?.slice(-16)
  return auth || ip || 'anonymous'
}

export function enforceRateLimit(req: VercelRequest, res: VercelResponse, options: RateLimitOptions) {
  if (process.env.RIFQA_DISABLE_RATE_LIMITS === '1') return false

  const now = Date.now()
  const key = `${options.bucket}:${clientKey(req)}`
  const current = buckets.get(key)
  const state = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + options.windowMs }
    : { ...current, count: current.count + 1 }
  buckets.set(key, state)

  const retryAfterSeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000))
  res.setHeader('X-RateLimit-Limit', String(options.limit))
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.limit - state.count)))
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(state.resetAt / 1000)))

  if (state.count <= options.limit) return false

  reportRateLimit(req, options.bucket, options.limit, options.windowMs)
  res.setHeader('Retry-After', String(retryAfterSeconds))
  sendJson(res, 429, {
    error: {
      code: 'rate_limited',
      message: 'Too many requests. Please retry after the rate limit window resets.',
    },
  })
  return true
}

export const aiRateLimit = { bucket: 'ai', limit: Number(process.env.RIFQA_AI_RATE_LIMIT || 20), windowMs: 60_000 }
export const adminRateLimit = { bucket: 'admin', limit: Number(process.env.RIFQA_ADMIN_RATE_LIMIT || 60), windowMs: 60_000 }
