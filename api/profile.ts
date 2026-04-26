import type { VercelRequest, VercelResponse } from '@vercel/node'
import { demoProfile } from './_lib/content.js'
import { readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return sendJson(res, 200, { data: demoProfile })
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const pregnancyWeek = Math.max(1, Math.min(42, readNumber(body.pregnancyWeek, demoProfile.pregnancyWeek)))

    return sendJson(res, 200, {
      data: {
        ...demoProfile,
        displayName: readString(body.displayName, demoProfile.displayName) || demoProfile.displayName,
        pregnancyWeek,
        dueDate: readString(body.dueDate, demoProfile.dueDate) || demoProfile.dueDate,
      },
      meta: {
        persisted: false,
        reason: 'Supabase persistence is the next backend milestone.',
      },
    })
  }

  return sendMethodNotAllowed(res, ['GET', 'PUT'])
}
