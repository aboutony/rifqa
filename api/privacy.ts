import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import {
  DEFAULT_PRIVACY_SETTINGS,
  buildPrivacyExportBundle,
  deleteUserData,
  getPersistedPrivacySettings,
  upsertPrivacySettings,
} from './_lib/privacy.js'
import { getRequestContext } from './_lib/supabase.js'

const allowedRequests = new Set(['export', 'delete'])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const context = await getRequestContext(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}

  if (req.method === 'GET') {
    if (context.supabase && context.userId) {
      const [settings, consentsResult, requestsResult] = await Promise.all([
        getPersistedPrivacySettings(context.supabase, context.userId),
        context.supabase
          .from('consents')
          .select('id, consent_type, granted, version, created_at')
          .eq('user_id', context.userId)
          .order('created_at', { ascending: false })
          .limit(20),
        context.supabase
          .from('privacy_requests')
          .select('id, request_type, status, requested_at, completed_at')
          .eq('user_id', context.userId)
          .order('requested_at', { ascending: false })
          .limit(20),
      ])

      if (consentsResult.error) throw consentsResult.error
      if (requestsResult.error) throw requestsResult.error

      return sendJson(res, 200, {
        data: {
          settings,
          consents: (consentsResult.data ?? []).map((item) => ({
            id: item.id,
            label: item.consent_type,
            granted: item.granted,
            version: item.version,
            createdAt: item.created_at,
          })),
          requests: (requestsResult.data ?? []).map((item) => ({
            id: item.id,
            requestType: item.request_type,
            status: item.status,
            createdAt: item.requested_at,
            completedAt: item.completed_at,
          })),
          stored: true,
        },
      })
    }

    return sendJson(res, 200, {
      data: {
        settings: DEFAULT_PRIVACY_SETTINGS,
        consents: [],
        requests: [],
        stored: false,
      },
    })
  }

  if (req.method === 'PUT') {
    const settings = {
      aiContextEnabled: body.aiContextEnabled !== false,
      lowPiiMode: body.lowPiiMode !== false,
      rawChatAnalytics: body.rawChatAnalytics === true,
    }

    if (context.supabase && context.userId) {
      const data = await upsertPrivacySettings(context.supabase, context.userId, settings)
      return sendJson(res, 200, { data: { settings: data, stored: true } })
    }

    return sendJson(res, 200, { data: { settings, stored: false } })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'PUT', 'POST'])

  const requestType = readString(body.requestType, 'export')
  const normalizedType = allowedRequests.has(requestType) ? requestType : 'export'
  const id = crypto.randomUUID()
  const shouldFulfillDelete = body.confirmDeletion === true

  if (context.supabase && context.userId) {
    const { error } = await context.supabase.from('privacy_requests').insert({
      id,
      user_id: context.userId,
      request_type: normalizedType,
      status: 'processing',
    })

    if (error) throw error

    if (normalizedType === 'export') {
      const bundle = await buildPrivacyExportBundle(context.supabase, context.userId, id)
      const { error: updateError } = await context.supabase
        .from('privacy_requests')
        .update({ status: 'completed', completed_at: new Date().toISOString(), fulfillment_metadata: { format: 'json', sections: Object.keys(bundle).length } })
        .eq('id', id)
        .eq('user_id', context.userId)

      if (updateError) throw updateError

      return sendJson(res, 201, {
        data: {
          id,
          requestType: normalizedType,
          status: 'completed',
          stored: true,
          exportBundle: bundle,
        },
      })
    }

    if (shouldFulfillDelete) {
      const deletion = await deleteUserData(context.supabase, context.userId)
      return sendJson(res, 202, {
        data: {
          id,
          requestType: normalizedType,
          status: deletion.skippedTables.length ? 'processing' : 'completed',
          stored: true,
          deletion,
        },
      })
    }

    const { error: updateError } = await context.supabase
      .from('privacy_requests')
      .update({ status: 'requested' })
      .eq('id', id)
      .eq('user_id', context.userId)

    if (updateError) throw updateError
  }

  return sendJson(res, 201, {
    data: {
      id,
      requestType: normalizedType,
      status: context.supabase && context.userId ? 'requested' : 'completed',
      stored: Boolean(context.supabase && context.userId),
      exportBundle:
        normalizedType === 'export'
          ? {
              exportMetadata: {
                requestId: id,
                generatedAt: new Date().toISOString(),
                format: 'rifqa-demo-privacy-export-v1',
                note: 'Demo export bundle. Sign in to export persisted account records.',
              },
              localDeviceDataHint: [
                'rifqa:privacy-settings',
                'rifqa:consent-history',
                'rifqa:privacy-requests',
                'rifqa:kick-draft',
                'rifqa:contraction-draft',
              ],
            }
          : undefined,
    },
  })
}
