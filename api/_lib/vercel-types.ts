import type { IncomingMessage, ServerResponse } from 'node:http'

export type VercelQueryValue = string | string[]

export interface VercelRequest extends IncomingMessage {
  // Vercel parses request bodies before invoking Node functions; handlers validate shapes locally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any
  cookies?: Record<string, string>
  query: Record<string, VercelQueryValue>
}

export interface VercelResponse extends ServerResponse {
  json: (body: unknown) => VercelResponse
  redirect: (statusOrUrl: number | string, url?: string) => VercelResponse
  send: (body: unknown) => VercelResponse
  status: (statusCode: number) => VercelResponse
}
