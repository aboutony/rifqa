import type { ApiLang } from './http.js'

export const DEFAULT_PROMPT_VERSION = 'rifqa-maternal-companion-2026-04-27.2'

export type CompanionSafetyKind = 'self_harm' | 'medical_diagnosis' | 'medication' | 'none'

export type CompanionSafetyDecision = {
  kind: CompanionSafetyKind
  crisisSafeMode: boolean
  shouldUseModel: boolean
  message: string
}

const diagnosisPatterns = [
  /diagnose/i,
  /do i have/i,
  /is this preeclampsia/i,
  /is this miscarriage/i,
  /شخص/i,
  /تشخيص/i,
  /هل عندي/,
  /هل هذا تسمم حمل/,
  /هل هذا إجهاض/,
]

const medicationPatterns = [
  /what dose/i,
  /dosage/i,
  /can i take/i,
  /should i take/i,
  /ibuprofen/i,
  /aspirin/i,
  /paracetamol/i,
  /جرعة/,
  /كم حبة/,
  /هل آخذ/,
  /هل أتناول/,
  /دواء/,
  /بروفين/,
  /أسبرين/,
  /باراسيتامول/,
]

const selfHarmPatterns = [
  /self-harm/i,
  /kill myself/i,
  /suicide/i,
  /hurt myself/i,
  /end my life/i,
  /أؤذي نفسي/,
  /أقتل نفسي/,
  /انتحار/,
  /أنهي حياتي/,
]

function matches(patterns: RegExp[], input: string) {
  return patterns.some((pattern) => pattern.test(input))
}

export function classifyCompanionSafety(input: string, lang: ApiLang): CompanionSafetyDecision {
  if (matches(selfHarmPatterns, input)) {
    return {
      kind: 'self_harm',
      crisisSafeMode: true,
      shouldUseModel: false,
      message: lang === 'ar'
        ? 'سلامتك أهم شيء الآن. إذا كنتِ قد تؤذين نفسك أو لستِ آمنة، اتصلي بالطوارئ أو اطلبي من شخص موثوق البقاء معك الآن. رفقة لا تضع أي دعم أزمة خلف اشتراك.'
        : 'Your safety matters most right now. If you might hurt yourself or do not feel safe, call emergency care or ask a trusted person to stay with you now. RIFQA never puts crisis support behind a paywall.',
    }
  }

  if (matches(medicationPatterns, input)) {
    return {
      kind: 'medication',
      crisisSafeMode: false,
      shouldUseModel: false,
      message: lang === 'ar'
        ? 'لا أستطيع تحديد جرعة أو تأكيد دواء أثناء الحمل. اسألي طبيبتك أو الصيدلي، واذكري أسبوع الحمل وأي أمراض أو أدوية أخرى. إذا ظهرت أعراض شديدة أو نزيف أو قلة حركة، توجهي للرعاية العاجلة.'
        : 'I cannot choose a medication or dose during pregnancy. Ask your clinician or pharmacist and share your pregnancy week, conditions, and other medicines. Seek urgent care for severe symptoms, bleeding, or reduced movement.',
    }
  }

  if (matches(diagnosisPatterns, input)) {
    return {
      kind: 'medical_diagnosis',
      crisisSafeMode: false,
      shouldUseModel: false,
      message: lang === 'ar'
        ? 'لا أستطيع تشخيصك من رسالة. أستطيع مساعدتك في ترتيب الأعراض والأسئلة للطبيبة. إذا كان هناك نزيف، ألم شديد، صداع شديد مع زغللة، أو قلة حركة واضحة، تواصلي مع الرعاية العاجلة.'
        : 'I cannot diagnose you from a message. I can help organize symptoms and questions for your clinician. If there is bleeding, severe pain, severe headache with vision changes, or clearly reduced movement, contact urgent care.',
    }
  }

  return {
    kind: 'none',
    crisisSafeMode: false,
    shouldUseModel: true,
    message: '',
  }
}

export function redactSensitiveIdentifiers(input: string) {
  return input
    .replace(/(اسمي|أنا اسمي|اسم المريضة)\s+.+?(?=\s+(?:ورقم|رقم|الجوال|هوية|السجل)|$)/g, '$1 [name]')
    .replace(/(رقم الهوية|هوية|السجل المدني)\s*[:：]?\s*\d{6,}/g, '$1 [id]')
    .replace(/(الجوال|رقمي|رقم الهاتف)\s*[:：]?\s*\+?\d[\d\s().-]{7,}\d/g, '$1 [phone]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\d{10,}\b/g, '[id]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]')
}

export function redactForAiContext(input: string) {
  return redactSensitiveIdentifiers(input).slice(0, 1200)
}
