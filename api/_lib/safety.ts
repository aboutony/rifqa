import type { ApiLang } from './http.js'

export type SafetyLevel = 'normal' | 'watch' | 'urgent'

export type SafetyAssessment = {
  level: SafetyLevel
  reasons: string[]
  message: string
  nextActions: string[]
}

const urgentPatterns = [
  /bleeding/i,
  /severe pain/i,
  /reduced movement/i,
  /no movement/i,
  /suicide/i,
  /unsafe/i,
  /نزيف/,
  /ألم شديد/,
  /حركة أقل/,
  /لا توجد حركة/,
  /انتحار/,
  /غير آمنة/,
]

const watchPatterns = [
  /anxious/i,
  /panic/i,
  /sad/i,
  /exhausted/i,
  /قلق/,
  /هلع/,
  /حزينة/,
  /مرهقة/,
]

export function assessText(input: string, lang: ApiLang): SafetyAssessment {
  const urgent = urgentPatterns.filter((pattern) => pattern.test(input))
  if (urgent.length > 0) {
    return {
      level: 'urgent',
      reasons: ['safety_keyword_match'],
      message:
        lang === 'ar'
          ? 'هذا يحتاج خطوة آمنة الآن. تواصلي مع طبيبتك أو الطوارئ، خصوصا مع النزيف أو الألم الشديد أو قلة حركة واضحة.'
          : 'This needs a safe next step now. Contact your clinician or emergency care, especially with bleeding, severe pain, or clearly reduced movement.',
      nextActions:
        lang === 'ar'
          ? ['اتصلي بالطوارئ أو الطبيبة', 'اطلبي من شخص موثوق البقاء معك', 'احتفظي بملخص الأعراض']
          : ['Call emergency care or your clinician', 'Ask a trusted person to stay with you', 'Keep a short symptom summary'],
    }
  }

  const watch = watchPatterns.filter((pattern) => pattern.test(input))
  if (watch.length > 0) {
    return {
      level: 'watch',
      reasons: ['emotional_distress_keyword_match'],
      message:
        lang === 'ar'
          ? 'أفهم أن اليوم ثقيل. لن نشخصك من رسالة واحدة، لكن سنحولها إلى خطوة صغيرة وواضحة.'
          : 'I hear that today feels heavy. We will not diagnose from one message, but we can turn it into one small clear step.',
      nextActions:
        lang === 'ar'
          ? ['خذي نفسا بطيئا', 'سجلي فحصا يوميا', 'تواصلي مع شخص تثقين به إذا استمر الشعور']
          : ['Take one slow breath', 'Log a daily check-in', 'Contact someone you trust if this keeps going'],
    }
  }

  return {
    level: 'normal',
    reasons: [],
    message:
      lang === 'ar'
        ? 'تم استلام رسالتك. سنبقي الإرشاد واضحا وهادئا ومناسبا لمرحلتك.'
        : 'Message received. Guidance will stay clear, calm, and appropriate for your stage.',
    nextActions: lang === 'ar' ? ['متابعة', 'حفظ كملاحظة'] : ['Continue', 'Save as note'],
  }
}

export function assessCheckin({
  mood,
  sleepQuality,
  symptoms,
  lang,
}: {
  mood: string
  sleepQuality: number
  symptoms: string[]
  lang: ApiLang
}): SafetyAssessment {
  const text = [mood, ...symptoms].join(' ')
  const textAssessment = assessText(text, lang)
  if (textAssessment.level === 'urgent') return textAssessment

  if (sleepQuality <= 2 || textAssessment.level === 'watch') {
    return {
      level: 'watch',
      reasons: ['low_sleep_or_emotional_load'],
      message:
        lang === 'ar'
          ? 'هناك إشارة تستحق اللطف والانتباه، لا الذعر. راقبي النمط واطلبي دعما إذا تكرر.'
          : 'There is a signal worth care and attention, not panic. Watch the pattern and seek support if it repeats.',
      nextActions:
        lang === 'ar'
          ? ['راحة قصيرة', 'شرب ماء', 'إضافة ملاحظة للطبيبة']
          : ['Short rest', 'Drink water', 'Add a clinician note'],
    }
  }

  return {
    level: 'normal',
    reasons: ['routine_checkin'],
    message: lang === 'ar' ? 'تسجيل جيد. لا توجد إشارة عاجلة من هذا الفحص.' : 'Logged. No urgent signal from this check-in.',
    nextActions: lang === 'ar' ? ['حفظ الفحص'] : ['Save check-in'],
  }
}
