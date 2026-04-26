export type OpenAIResponse = {
  text: string
  requestId: string | null
  model: string
}

type ResponseOutputContent = {
  type?: string
  text?: string
}

type ResponseOutputItem = {
  type?: string
  content?: ResponseOutputContent[]
}

type ResponsePayload = {
  output_text?: string
  output?: ResponseOutputItem[]
}

function extractOutputText(payload: ResponsePayload) {
  if (payload.output_text) return payload.output_text

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter((text): text is string => Boolean(text))
      .join('\n')
      .trim() ?? ''
  )
}

export async function createMaternalCompanionResponse({
  message,
  lang,
  safetyMessage,
}: {
  message: string
  lang: 'ar' | 'en'
  safetyMessage: string
}): Promise<OpenAIResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 320,
      instructions:
        lang === 'ar'
          ? [
              'You are RIFQA / رفقة, a Saudi maternal wellness companion.',
              'Reply in Arabic unless the user uses English.',
              'You are not a doctor and must not diagnose, prescribe medication, or override clinician instructions.',
              'For urgent pregnancy symptoms, reduced fetal movement, bleeding, severe pain, unsafe feelings, or self-harm, direct the user to clinician/emergency care.',
              'When appropriate, suggest relaxation audio/prayer/breathing or safe gentle exercise, but doctor exercise instructions override AI.',
              'Keep the answer warm, short, culturally respectful, and action-oriented.',
            ].join('\n')
          : [
              'You are RIFQA / رفقة, a Saudi maternal wellness companion.',
              'You are not a doctor and must not diagnose, prescribe medication, or override clinician instructions.',
              'For urgent pregnancy symptoms, reduced fetal movement, bleeding, severe pain, unsafe feelings, or self-harm, direct the user to clinician/emergency care.',
              'When appropriate, suggest relaxation audio/prayer/breathing or safe gentle exercise, but doctor exercise instructions override AI.',
              'Keep the answer warm, short, culturally respectful, and action-oriented.',
            ].join('\n'),
      input: [
        `Safety assessment to respect: ${safetyMessage}`,
        `User message: ${message}`,
      ].join('\n\n'),
    }),
  })

  const requestId = response.headers.get('x-request-id')
  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${requestId ?? ''}`.trim())
  }

  const payload = (await response.json()) as ResponsePayload

  return {
    text: extractOutputText(payload),
    requestId,
    model,
  }
}

