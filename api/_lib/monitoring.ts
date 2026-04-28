import type { VercelRequest } from './vercel-types.js'

type MonitoringEvent = {
  level: 'info' | 'warn' | 'error'
  event: string
  route?: string
  requestId?: string
  message?: string
  metadata?: Record<string, unknown>
}

function requestId(req?: VercelRequest) {
  const header = req?.headers['x-vercel-id'] ?? req?.headers['x-request-id']
  return Array.isArray(header) ? header[0] : header
}

export function logMonitoringEvent(event: MonitoringEvent) {
  const payload = {
    ...event,
    service: 'rifqa-api',
    environment: process.env.RIFQA_ENV || process.env.VERCEL_ENV || 'development',
    timestamp: new Date().toISOString(),
  }
  const line = JSON.stringify(payload)
  if (event.level === 'error') console.error(line)
  else if (event.level === 'warn') console.warn(line)
  else console.info(line)
}

export function reportApiError(req: VercelRequest, error: unknown, metadata: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error)
  logMonitoringEvent({
    level: 'error',
    event: 'api_error',
    route: req.url,
    requestId: requestId(req),
    message,
    metadata,
  })
}

export function reportRateLimit(req: VercelRequest, bucket: string, limit: number, windowMs: number) {
  logMonitoringEvent({
    level: 'warn',
    event: 'rate_limited',
    route: req.url,
    requestId: requestId(req),
    metadata: { bucket, limit, windowMs },
  })
}
