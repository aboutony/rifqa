import type { VercelRequest, VercelResponse } from '@vercel/node'

export type ApiLang = 'ar' | 'en'

export type ApiError = {
  error: {
    code: string
    message: string
  }
}

export function getLang(req: VercelRequest): ApiLang {
  const raw = Array.isArray(req.query.lang) ? req.query.lang[0] : req.query.lang
  return raw === 'en' ? 'en' : 'ar'
}

export function sendJson<T>(res: VercelResponse, status: number, payload: T) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json(payload)
}

export function sendMethodNotAllowed(res: VercelResponse, methods: string[]) {
  res.setHeader('Allow', methods.join(', '))
  return sendJson<ApiError>(res, 405, {
    error: {
      code: 'method_not_allowed',
      message: `Use ${methods.join(' or ')} for this endpoint.`,
    },
  })
}

export function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

export function readNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

