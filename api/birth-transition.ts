import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getRequestContext } from './_lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  const context = await getRequestContext(req)
  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const birthDate = readString(body.birthDate, new Date().toISOString().slice(0, 10))
  const deliveryType = readString(body.deliveryType, 'vaginal')

  if (context.supabase && context.userId) {
    const { error: profileError } = await context.supabase
      .from('profiles')
      .upsert(
        {
          user_id: context.userId,
          journey_stage: 'postpartum',
          birth_date: birthDate,
          privacy_mode: 'low_pii',
        },
        { onConflict: 'user_id' },
      )

    if (profileError) throw profileError

    await context.supabase
      .from('pregnancies')
      .update({ status: 'completed' })
      .eq('user_id', context.userId)
      .eq('status', 'active')
      .throwOnError()
  }

  return sendJson(res, 200, {
    data: {
      stage: 'postpartum',
      birthDate,
      deliveryType,
      recoveryDay: 1,
      message:
        lang === 'ar'
          ? 'تم الانتقال إلى وضع ما بعد الولادة. سنركز الآن على تعافي الأربعين وروتين الطفل.'
          : 'Postpartum mode is on. RIFQA now focuses on 40-day recovery and baby care.',
      stored: Boolean(context.supabase && context.userId),
    },
  })
}
