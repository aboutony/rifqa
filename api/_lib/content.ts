import type { ApiLang } from './http.js'
import { capabilities, getReviewedContent } from './maternal-os.js'

export type JourneyProfile = {
  id: string
  displayName: string
  stage: 'pregnancy' | 'postpartum' | 'child_0_3'
  pregnancyWeek: number
  dueDate: string
  locale: 'SA'
  privacyMode: 'low_pii'
}

export type TimelineEntry = {
  week: number
  title: string
  size: string
  length: string
  weight: string
  body: string
}

export type ActionCard = {
  id: string
  tone: 'calm' | 'track' | 'urgent' | 'growth' | 'wellness'
  title: string
  body: string
  cta: string
}

export const demoProfile: JourneyProfile = {
  id: 'demo-mother',
  displayName: 'Noura',
  stage: 'pregnancy',
  pregnancyWeek: 28,
  dueDate: '2026-07-19',
  locale: 'SA',
  privacyMode: 'low_pii',
}

const content = {
  ar: {
    timeline: [
      {
        week: 28,
        title: 'نمو الرئتين والحركة',
        size: 'حبة باذنجان',
        length: '37.6 سم',
        weight: '1 كجم',
        body: 'يتطور تنفس طفلك وحركته. راقبي النمط المعتاد للحركة ولا تحولي المتابعة إلى قلق يومي.',
      },
      {
        week: 29,
        title: 'زيادة الوزن واليقظة',
        size: 'ثمرة قرع صغيرة',
        length: '38.6 سم',
        weight: '1.15 كجم',
        body: 'تزداد فترات اليقظة والنوم. سجلي الأسئلة المهمة لزيارتك القادمة بدلا من حفظها في رأسك.',
      },
    ],
    actions: [
      {
        id: 'daily-checkin',
        tone: 'calm',
        title: 'فحص يومي لطيف',
        body: 'سجلي المزاج والنوم والأعراض خلال أقل من دقيقة.',
        cta: 'ابدئي الفحص',
      },
      {
        id: 'kick-counter',
        tone: 'track',
        title: 'عد الركلات',
        body: 'إذا شعرت أن الحركة أقل من المعتاد، ابدئي جلسة عد هادئة ثم اتبعي الإرشاد.',
        cta: 'ابدئي الجلسة',
      },
      {
        id: 'visit-prep',
        tone: 'growth',
        title: 'تحضير الزيارة',
        body: 'حوّلي الأعراض والملاحظات إلى ملخص واضح للطبيبة.',
        cta: 'جهزي الملخص',
      },
      {
        id: 'relaxation-audio',
        tone: 'wellness',
        title: 'صوتيات استرخاء',
        body: 'يمكن لرفقة اقتراح تلاوة هادئة أو دعاء أو صوتيات تنفس عند اضطراب النوم أو ارتفاع التوتر.',
        cta: 'فتح الاسترخاء',
      },
      {
        id: 'safe-exercise',
        tone: 'wellness',
        title: 'حركة آمنة',
        body: 'تعليمات الطبيبة تأتي أولا. إذا لم توجد تعليمات محفوظة، تقترح رفقة حركة لطيفة مناسبة.',
        cta: 'فتح التمارين',
      },
    ] satisfies ActionCard[],
  },
  en: {
    timeline: [
      {
        week: 28,
        title: 'Lung growth and movement',
        size: 'an eggplant',
        length: '37.6 cm',
        weight: '1 kg',
        body: 'Your baby is practicing for breathing and movement patterns matter. Track changes without turning the day into surveillance.',
      },
      {
        week: 29,
        title: 'Weight gain and wake windows',
        size: 'a small squash',
        length: '38.6 cm',
        weight: '1.15 kg',
        body: 'Wake and sleep rhythms are becoming more noticeable. Capture doctor questions instead of carrying them in your head.',
      },
    ],
    actions: [
      {
        id: 'daily-checkin',
        tone: 'calm',
        title: 'Gentle daily check-in',
        body: 'Log mood, sleep, and symptoms in under a minute.',
        cta: 'Start check-in',
      },
      {
        id: 'kick-counter',
        tone: 'track',
        title: 'Kick count',
        body: 'If movement feels reduced, start a calm counting session and follow the guidance.',
        cta: 'Start session',
      },
      {
        id: 'visit-prep',
        tone: 'growth',
        title: 'Visit prep',
        body: 'Turn symptoms and notes into a clear summary for your clinician.',
        cta: 'Prepare summary',
      },
      {
        id: 'relaxation-audio',
        tone: 'wellness',
        title: 'State-aware relaxation',
        body: 'When sleep is poor or stress rises, RIFQA can suggest calm recitation, prayer, or breathing music.',
        cta: 'Open relaxation',
      },
      {
        id: 'safe-exercise',
        tone: 'wellness',
        title: 'Safe movement',
        body: 'Clinician instructions come first. If none are stored, RIFQA can suggest gentle movement based on patterns.',
        cta: 'Open exercise',
      },
    ] satisfies ActionCard[],
  },
} satisfies Record<ApiLang, { timeline: TimelineEntry[]; actions: ActionCard[] }>

export function getBootstrapContent(lang: ApiLang) {
  return {
    profile: demoProfile,
    timeline: content[lang].timeline,
    actions: content[lang].actions,
    reviewedContent: getReviewedContent(lang),
    maternalOs: capabilities,
    capabilities: [
      'journey_profile',
      'daily_checkin',
      'kick_counter',
      'contraction_counter',
      'weight_tracker',
      'symptom_log',
      'relaxation_recommendations',
      'doctor_or_ai_exercise_recommendations',
      'ai_companion_safe_stub',
      'clinical_review_cms',
      'saudi_care_routing',
      'partner_permissions',
      'postpartum_baby_continuity',
      'privacy_trust_center',
      'growth_referral_loops',
      'saudi_differentiation_mode',
      'hijri_gregorian_dates',
      'saudi_vaccination_schedule',
      'arabic_baby_name_finder',
    ],
  }
}
