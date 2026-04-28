import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'
import { DEFAULT_PROMPT_VERSION, classifyCompanionSafety, redactSensitiveIdentifiers } from './_lib/ai-policy.js'
import { assessText } from './_lib/safety.js'
import { getLang, readString, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { createMaternalCompanionResponse, redactForAiContext } from './_lib/openai.js'
import { buildCareRoute, selectRelevantReviewedContent } from './_lib/maternal-os.js'
import { getPersistedReviewedContent } from './_lib/reviewed-content-store.js'
import { getRequestContext } from './_lib/supabase.js'
import { aiRateLimit, enforceRateLimit } from './_lib/rate-limit.js'

type CompanionContext = {
  pregnancyWeek?: unknown
  latestCheckin?: {
    mood?: unknown
    sleepQuality?: unknown
    symptoms?: unknown
    note?: unknown
    assessment?: { level?: unknown }
  }
  recentLogs?: unknown
}

type CompanionContextSource = {
  kind: 'reviewed_content' | 'safety_rules' | 'general_guidance' | 'private_checkin'
  label: string
  detail: string
  contentId?: string
}

async function getPromptVersion(context: Awaited<ReturnType<typeof getRequestContext>>) {
  if (context.supabase) {
    const { data } = await context.supabase
      .from('ai_prompt_configs')
      .select('prompt_version')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.prompt_version) return data.prompt_version as string
  }
  return process.env.OPENAI_PROMPT_VERSION || DEFAULT_PROMPT_VERSION
}

function appendCitations({
  reply,
  lang,
  reviewedContent,
}: {
  reply: string
  lang: 'ar' | 'en'
  reviewedContent: Array<{ title: string; reviewerName: string; citations: string[] }>
}) {
  if (reviewedContent.length === 0) return reply
  const lines = reviewedContent.map((item, index) => {
    const citation = item.citations[0] ? `; ${item.citations[0]}` : ''
    return `${index + 1}. ${item.title} (${item.reviewerName}${citation})`
  })
  return lang === 'ar'
    ? `${reply}\n\nالمصادر المراجعة المستخدمة:\n${lines.join('\n')}`
    : `${reply}\n\nReviewed sources used:\n${lines.join('\n')}`
}

function formatCompanionContext(context: CompanionContext | null) {
  if (!context) return ''
  const pieces: string[] = []
  if (typeof context.pregnancyWeek === 'number') pieces.push(`pregnancy week ${context.pregnancyWeek}`)
  const checkin = context.latestCheckin
  if (checkin) {
    const symptoms = Array.isArray(checkin.symptoms)
      ? checkin.symptoms.filter((item): item is string => typeof item === 'string').slice(0, 6).join(', ')
      : ''
    pieces.push(
      [
        'latest check-in',
        typeof checkin.mood === 'string' ? `mood ${checkin.mood}` : '',
        typeof checkin.sleepQuality === 'number' ? `sleep ${checkin.sleepQuality}/5` : '',
        symptoms ? `symptoms ${symptoms}` : '',
        typeof checkin.note === 'string' ? `note ${checkin.note}` : '',
        typeof checkin.assessment?.level === 'string' ? `safety ${checkin.assessment.level}` : '',
      ].filter(Boolean).join(': '),
    )
  }
  if (Array.isArray(context.recentLogs)) {
    pieces.push(`recent logs available: ${context.recentLogs.length}`)
  }
  return redactForAiContext(pieces.join('\n'))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])
  if (enforceRateLimit(req, res, aiRateLimit)) return

  const requestContext = await getRequestContext(req)
  const lang = getLang(req)
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const message = readString(body.message)
  const redactedMessage = redactSensitiveIdentifiers(message)
  const context = typeof body.context === 'object' && body.context !== null ? (body.context as CompanionContext) : null
  const assessment = assessText(message, lang)
  const safetyDecision = classifyCompanionSafety(message, lang)
  const careRoute = buildCareRoute({ concern: message, lang, stage: 'pregnancy' })
  const userContext = formatCompanionContext(context)
  const promptVersion = await getPromptVersion(requestContext)
  const availableReviewedContent = await getPersistedReviewedContent(lang)
  const reviewedContent = selectRelevantReviewedContent({
    lang,
    query: [message, userContext].filter(Boolean).join('\n'),
    items: availableReviewedContent.items,
  })
  const approvedContext = reviewedContent
    .map((item) => `${item.title}: ${item.summary} Reviewed by ${item.reviewerName}, ${item.reviewerSpecialty}.`)
    .join('\n')

  const fallbackReply =
    lang === 'ar'
      ? `${assessment.message} تذكير مهم: رفقة لا تستبدل الطبيبة، لكنها تساعدك على ترتيب الخطوة التالية.`
      : `${assessment.message} Important reminder: RIFQA does not replace your clinician, but it can help organize the next step.`
  const aiResponse =
    assessment.level === 'urgent' || !safetyDecision.shouldUseModel
      ? null
      : await createMaternalCompanionResponse({
          message: redactedMessage,
          lang,
          safetyMessage: assessment.message,
          approvedContext,
          userContext,
          promptVersion,
        }).catch(() => null)
  const baseReply = safetyDecision.kind === 'none' ? (aiResponse?.text || fallbackReply) : safetyDecision.message
  const reply = appendCitations({
    reply: baseReply,
    lang,
    reviewedContent: assessment.level === 'urgent' || safetyDecision.crisisSafeMode ? [] : reviewedContent,
  })
  const contextSources: CompanionContextSource[] = [
    {
      kind: 'safety_rules',
      label: lang === 'ar' ? 'قواعد السلامة' : 'Safety rules',
      detail:
        lang === 'ar'
          ? `تقييم مستوى السلامة: ${assessment.level}`
          : `Safety level assessed as ${assessment.level}`,
    },
  ]

  if (assessment.level !== 'urgent' && reviewedContent.length > 0) {
    contextSources.push(
      ...reviewedContent.map((item) => ({
        kind: 'reviewed_content' as const,
        label: item.title,
        detail:
          lang === 'ar'
            ? `راجعتها ${item.reviewerName}، ${item.reviewerSpecialty}. تنتهي ${item.expiryDate}.`
            : `Reviewed by ${item.reviewerName}, ${item.reviewerSpecialty}. Expires ${item.expiryDate}.`,
        contentId: item.id,
      })),
    )
  }

  if (userContext) {
    contextSources.push({
      kind: 'private_checkin',
      label: lang === 'ar' ? 'سياق فحصك الخاص' : 'Private check-in context',
      detail:
        lang === 'ar'
          ? 'تم استخدام ملخص مختصر ومخفف من فحصك الأخير.'
          : 'Used a short redacted summary from your latest check-in.',
    })
  }

  contextSources.push({
    kind: 'general_guidance',
    label: lang === 'ar' ? 'إرشاد رفقة العام' : 'General companion guidance',
    detail:
      lang === 'ar'
        ? aiResponse ? 'صاغت رفقة الرد ضمن الحدود الطبية الآمنة.' : 'تم استخدام رد احتياطي آمن عند الحاجة.'
        : aiResponse ? 'RIFQA drafted the reply within safe medical boundaries.' : 'Used a safe fallback reply when needed.',
  })

  if (requestContext.supabase && requestContext.userId) {
    await requestContext.supabase.from('chat_messages').insert([
      {
        user_id: requestContext.userId,
        role: 'user',
        message: redactedMessage,
        prompt_version: promptVersion,
        safety_level: assessment.level,
        crisis_safe_mode: safetyDecision.crisisSafeMode,
        context_sources: [],
      },
      {
        user_id: requestContext.userId,
        role: 'assistant',
        message: reply,
        prompt_version: promptVersion,
        safety_level: assessment.level,
        crisis_safe_mode: safetyDecision.crisisSafeMode,
        context_sources: contextSources,
      },
    ]).throwOnError()
  }

  return sendJson(res, 200, {
    data: {
      id: crypto.randomUUID(),
      role: 'assistant',
      reply,
      assessment,
      careRoute: {
        level: careRoute.level,
        route: careRoute.route,
        title: careRoute.title,
        guidance: careRoute.guidance,
        actions: careRoute.actions,
      },
      contextUsed: Boolean(userContext),
      contextSources,
      promptVersion,
      safetyMode: safetyDecision.kind,
      crisisSafeMode: safetyDecision.crisisSafeMode,
      model: aiResponse?.model ?? 'safe-rules-fallback',
      requestId: aiResponse?.requestId ?? null,
      persisted: false,
    },
  })
}
