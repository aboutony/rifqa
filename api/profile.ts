import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { demoProfile } from './_lib/content.js'
import { readNumber, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const context = await getRequestContext(req)
    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('profiles')
        .select('id, display_name, locale, privacy_mode, journey_stage, birth_date, created_at, updated_at')
        .eq('user_id', context.userId)
        .maybeSingle()

      if (error) throw error
      const { data: pregnancy, error: pregnancyError } = await context.supabase
        .from('pregnancies')
        .select('due_date, current_week, status')
        .eq('user_id', context.userId)
        .eq('status', 'active')
        .maybeSingle()

      if (pregnancyError) throw pregnancyError
      if (data) {
        return sendJson(res, 200, {
          data: {
            id: data.id,
            displayName: data.display_name,
            locale: data.locale,
            privacyMode: data.privacy_mode,
            stage: data.journey_stage ?? (pregnancy?.status === 'active' ? 'pregnancy' : demoProfile.stage),
            birthDate: data.birth_date,
            pregnancyWeek: pregnancy?.current_week ?? demoProfile.pregnancyWeek,
            dueDate: pregnancy?.due_date ?? demoProfile.dueDate,
            updatedAt: data.updated_at,
          },
          meta: { persisted: true },
        })
      }
    }

    return sendJson(res, 200, { data: demoProfile })
  }

  if (req.method === 'PUT') {
    const context = await getRequestContext(req)
    const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
    const pregnancyWeek = Math.max(1, Math.min(42, readNumber(body.pregnancyWeek, demoProfile.pregnancyWeek)))
    const stage = ['pregnancy', 'postpartum', 'child_0_3'].includes(readString(body.stage, demoProfile.stage))
      ? readString(body.stage, demoProfile.stage)
      : demoProfile.stage
    const profile = {
      display_name: readString(body.displayName, demoProfile.displayName) || demoProfile.displayName,
      locale: readString(body.locale, demoProfile.locale) || demoProfile.locale,
      privacy_mode: 'low_pii',
      journey_stage: stage,
      birth_date: readString(body.birthDate) || null,
    }

    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('profiles')
        .upsert({ ...profile, user_id: context.userId }, { onConflict: 'user_id' })
        .select('id, display_name, locale, privacy_mode, journey_stage, birth_date, updated_at')
        .single()

      if (error) throw error

      const { error: pregnancyUpsertError } = await context.supabase
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

      if (pregnancyUpsertError) throw pregnancyUpsertError

      return sendJson(res, 200, {
        data: {
          id: data.id,
          displayName: data.display_name,
          locale: data.locale,
          privacyMode: data.privacy_mode,
          stage: data.journey_stage,
          birthDate: data.birth_date,
          pregnancyWeek,
          dueDate: readString(body.dueDate, demoProfile.dueDate) || demoProfile.dueDate,
          updatedAt: data.updated_at,
        },
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
