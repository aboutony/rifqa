import type { VercelRequest, VercelResponse } from '@vercel/node'
import { demoProfile } from './_lib/content.js'
import { readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const context = await getRequestContext(req)
    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('profiles')
        .select('id, display_name, locale, privacy_mode, created_at, updated_at')
        .eq('user_id', context.userId)
        .maybeSingle()

      if (error) throw error
      if (data) return sendJson(res, 200, { data, meta: { persisted: true } })
    }

    return sendJson(res, 200, { data: demoProfile })
  }

  if (req.method === 'PUT') {
    const context = await getRequestContext(req)
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const pregnancyWeek = Math.max(1, Math.min(42, readNumber(body.pregnancyWeek, demoProfile.pregnancyWeek)))
    const profile = {
      display_name: readString(body.displayName, demoProfile.displayName) || demoProfile.displayName,
      locale: 'SA',
      privacy_mode: 'low_pii',
    }

    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('profiles')
        .upsert({ ...profile, user_id: context.userId }, { onConflict: 'user_id' })
        .select('id, display_name, locale, privacy_mode, updated_at')
        .single()

      if (error) throw error

      await context.supabase
        .from('pregnancies')
        .upsert(
          {
            user_id: context.userId,
            current_week: pregnancyWeek,
            due_date: readString(body.dueDate, demoProfile.dueDate) || demoProfile.dueDate,
            status: 'active',
          },
          { onConflict: 'user_id,status' },
        )

      return sendJson(res, 200, {
        data,
        meta: { persisted: true },
      })
    }

    return sendJson(res, 200, {
      data: {
        ...demoProfile,
        displayName: profile.display_name,
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
