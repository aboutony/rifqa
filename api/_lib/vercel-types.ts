export type VercelQueryValue = string | string[]
export type VercelHeaderValue = string | undefined

export interface VercelRequest {
  // Vercel parses request bodies before invoking Node functions; handlers validate shapes locally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any
  cookies?: Record<string, string>
  headers: Record<string, VercelHeaderValue>
  method?: string
  query: Record<string, VercelQueryValue>
  url?: string
}

export interface VercelResponse {
  json: (body: unknown) => VercelResponse
  redirect: (statusOrUrl: number | string, url?: string) => VercelResponse
  send: (body: unknown) => VercelResponse
  setHeader: (name: string, value: number | string | readonly string[]) => VercelResponse
  status: (statusCode: number) => VercelResponse
}
