import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import './App.css'

type SpeechRecognitionResultAlternative = {
  transcript: string
}

type SpeechRecognitionResult = {
  readonly length: number
  item(index: number): SpeechRecognitionResultAlternative
  [index: number]: SpeechRecognitionResultAlternative
}

type SpeechRecognitionResultList = {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList
}

type SpeechRecognitionInstance = EventTarget & {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

type Screen =
  | 'home'
  | 'timeline'
  | 'checkin'
  | 'companion'
  | 'support'
  | 'journal'
  | 'contractions'
  | 'kicks'
  | 'weight'
  | 'wellness'
  | 'exercise'
  | 'care'
  | 'postpartum'
  | 'partner'
  | 'notifications'
  | 'privacy'
  | 'library'
  | 'reviewAdmin'
  | 'growth'
  | 'saudi'
  | 'account'

type Theme = 'light' | 'dark'
type Lang = 'ar' | 'en'
type CountryCode = 'SA' | 'AE' | 'KW' | 'QA' | 'BH' | 'OM'
type NavItem = { id: Screen; label: string; icon: string }
type Tool = { label: string; icon: string; tone: string; target: Screen }
type BabyName = { ar: string; en: string; meaningAr: string; meaningEn: string; tone: 'faith' | 'nature' | 'heritage' | 'gentle' }
type ChatMessage = {
  role: 'ai' | 'user'
  text: string
  assessment?: { level: string; message: string; nextActions: string[] }
  careRoute?: { level: string; route: string; title: string; guidance: string; actions: string[] }
  contextUsed?: boolean
  contextSources?: Array<{
    kind: 'reviewed_content' | 'safety_rules' | 'general_guidance' | 'private_checkin'
    label: string
    detail: string
    contentId?: string
  }>
  promptVersion?: string
  safetyMode?: string
  crisisSafeMode?: boolean
}
type CareRouteResponse = {
  data?: {
    level: string
    route: string
    title: string
    guidance: string
    actions: string[]
    resources: Array<{ label: string; kind: string }>
  }
}
type WellnessRecommendation = {
  kind: string
  priority: string
  source: string
  title: string
  body: string
  trigger: string
}
type ReviewedContentItem = {
  id: string
  stage: string
  topic?: string
  title: string
  summary: string
  body?: string
  reviewerName: string
  reviewerSpecialty: string
  reviewerProfile?: {
    name: string
    specialty: string
    organization?: string
    bio?: string
  }
  approvalDate: string
  expiryDate: string
  status: 'draft' | 'pending_review' | 'approved' | 'expired' | 'retired'
  citations: string[]
  citationDetails?: Array<{
    title: string
    source: string
    url?: string
    year?: string
  }>
  workflowStatus?: 'unassigned' | 'assigned' | 'in_review' | 'changes_requested' | 'approved'
  assignedReviewer?: string
  reviewComments?: string
  rejectionReason?: string
  versionNumber?: number
}
type ReviewedContentVersion = {
  id: string
  content_id: string
  version_number: number
  snapshot: Record<string, unknown>
  change_action: string
  changed_by: string | null
  created_at: string
}
type LatestCheckin = {
  id?: string
  mood: string
  sleepQuality: number
  symptoms: string[]
  note: string
  assessment?: {
    level: string
    message: string
    nextActions: string[]
  }
  recommendations: WellnessRecommendation[]
  createdAt?: string
  stored?: boolean
}
type CheckinTrends = { count: number; sleepAverage: number; topMood: string; watchOrUrgentCount: number }
type NotificationCopy = Record<string, { title: string; body: string }>
type ScheduledNotification = { type: string; title: string; body: string; scheduledFor?: string; meta?: Record<string, unknown> }
type ReminderPreference = {
  channel?: string
  dailyCheckinTime: string
  checkinReminders: boolean
  quietHoursStart: string
  quietHoursEnd: string
  pregnancyWeekNotifications?: boolean
  appointmentReminders?: boolean
  vaccinationReminders?: boolean
  contentReviewExpiryReminders?: boolean
  notificationLanguage?: Lang
  appointmentReminderTime?: string
  vaccinationReminderTime?: string
  copy?: NotificationCopy
  scheduled?: ScheduledNotification[]
  stored?: boolean
}
type PrivacySettings = {
  aiContextEnabled: boolean
  lowPiiMode: boolean
  rawChatAnalytics: boolean
}
type ConsentRecord = {
  id: string
  label: string
  granted: boolean
  version?: string
  createdAt: string
}
type PrivacyRequestRecord = {
  id: string
  requestType: 'export' | 'delete'
  status: string
  createdAt: string
  completedAt?: string | null
}
type EntitlementState = {
  plan: string
  source: string
  sponsorCode?: string | null
  policyGroup?: string | null
  b2bFirewall: string
  aggregateReportingOnly: boolean
  featureAccess?: {
    sponsored: boolean
    premium: boolean
    neverPaywalled: string[]
    premiumCandidates: string[]
  }
}
type B2BReport = {
  id?: string
  metric: string
  stage: string
  locale: string
  userCount: number
  value: number
  period: string
  dimensions: Record<string, unknown>
}
type MotherProfile = {
  id?: string
  displayName: string
  stage: 'pregnancy' | 'postpartum' | 'child_0_3'
  pregnancyWeek: number
  dueDate: string
  birthDate?: string | null
  locale?: string
  privacyMode?: string
  updatedAt?: string
}
type KickSessionLog = { id: string; count: number; minutes: number; level: string; guidance?: string; createdAt?: string; stored?: boolean }
type ContractionSessionLog = { id: string; sessionCount: number; averageFrequencyMinutes: number; averageDurationSeconds: number; level: string; guidance?: string; createdAt?: string; stored?: boolean }
type WeightLog = { id: string; weightKg: number; note: string; createdAt?: string; stored?: boolean }
type SymptomLog = { id: string; symptom: string; severity: number; note: string; createdAt?: string; stored?: boolean }
type ReviewerRoleRecord = {
  user_id: string
  role: 'clinical_reviewer' | 'admin'
  granted_by?: string | null
  granted_at?: string | null
}
type ReviewAuditEvent = {
  id: string
  actor_user_id: string | null
  action: string
  target_type: string
  target_id: string
  created_at: string
}
type KickDraft = { startedAt: number | null; kickTimes: number[] }
type ContractionEvent = { startedAt: number; endedAt: number }
type ContractionDraft = { activeStart: number | null; events: ContractionEvent[] }

const KICK_DRAFT_KEY = 'rifqa:kick-draft'
const CONTRACTION_DRAFT_KEY = 'rifqa:contraction-draft'
const PRIVACY_SETTINGS_KEY = 'rifqa:privacy-settings'
const CONSENT_HISTORY_KEY = 'rifqa:consent-history'
const PRIVACY_REQUESTS_KEY = 'rifqa:privacy-requests'
const ACCESS_TOKEN_KEY = 'rifqa:access-token'
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  aiContextEnabled: true,
  lowPiiMode: true,
  rawChatAnalytics: false,
}
const DEFAULT_MOTHER_PROFILE: MotherProfile = {
  displayName: 'Noura',
  stage: 'pregnancy',
  pregnancyWeek: 28,
  dueDate: '2026-07-18',
  locale: 'SA',
  privacyMode: 'low_pii',
}

const GCC_COUNTRIES: CountryCode[] = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM']

const SAUDI_BABY_SIZE_COMPARISONS = [
  { week: 8, ar: 'حبة تمر سكري', en: 'a Sukkari date', length: '1.6 cm', weight: '1 g' },
  { week: 12, ar: 'حبة ليمون حساوي', en: 'a Hassawi lime', length: '5.4 cm', weight: '14 g' },
  { week: 16, ar: 'حبة تين طائفي', en: 'a Taif fig', length: '11.6 cm', weight: '100 g' },
  { week: 20, ar: 'ثمرة رمان صغيرة', en: 'a small pomegranate', length: '25.6 cm', weight: '300 g' },
  { week: 24, ar: 'حبة شمام صغيرة', en: 'a small melon', length: '30 cm', weight: '600 g' },
  { week: 28, ar: 'باذنجانة سعودية', en: 'a Saudi eggplant', length: '37.6 cm', weight: '1 kg' },
  { week: 32, ar: 'قرعة نجدية صغيرة', en: 'a small Najdi squash', length: '42.4 cm', weight: '1.7 kg' },
  { week: 36, ar: 'حبة بطيخ صغيرة', en: 'a small watermelon', length: '47.4 cm', weight: '2.6 kg' },
  { week: 40, ar: 'طفل مكتمل النمو', en: 'a full-term baby', length: '51 cm', weight: '3.4 kg' },
]

const SAUDI_VACCINATION_SCHEDULE = [
  { ageAr: 'عند الولادة', ageEn: 'At birth', vaccineAr: 'الدرن، التهاب الكبد ب', vaccineEn: 'BCG, Hepatitis B' },
  { ageAr: 'شهران', ageEn: '2 months', vaccineAr: 'السداسي، الروتا، المكورات الرئوية', vaccineEn: 'Hexavalent, rotavirus, pneumococcal' },
  { ageAr: '٤ أشهر', ageEn: '4 months', vaccineAr: 'جرعات المتابعة الأساسية', vaccineEn: 'Core follow-up doses' },
  { ageAr: '٦ أشهر', ageEn: '6 months', vaccineAr: 'جرعات المتابعة والإنفلونزا حسب الموسم', vaccineEn: 'Follow-up doses and seasonal flu when applicable' },
  { ageAr: '٩ أشهر', ageEn: '9 months', vaccineAr: 'الحصبة وأي جرعات مستحقة', vaccineEn: 'Measles and due catch-up doses' },
  { ageAr: '١٢ شهرا', ageEn: '12 months', vaccineAr: 'الثلاثي الفيروسي والجرعات المستحقة', vaccineEn: 'MMR and due doses' },
  { ageAr: '١٨ شهرا', ageEn: '18 months', vaccineAr: 'الجرعات المنشطة حسب الجدول الوطني', vaccineEn: 'Boosters according to the national schedule' },
]

const BABY_NAMES: BabyName[] = [
  { ar: 'لينة', en: 'Leenah', meaningAr: 'النخلة الصغيرة واللين', meaningEn: 'young palm and gentleness', tone: 'nature' },
  { ar: 'سارة', en: 'Sarah', meaningAr: 'البهجة والسرور', meaningEn: 'joy and delight', tone: 'heritage' },
  { ar: 'مريم', en: 'Maryam', meaningAr: 'اسم قرآني محبوب', meaningEn: 'beloved Qurani name', tone: 'faith' },
  { ar: 'نورة', en: 'Noura', meaningAr: 'النور والضياء', meaningEn: 'light and radiance', tone: 'gentle' },
  { ar: 'سلمان', en: 'Salman', meaningAr: 'السلامة والطمأنينة', meaningEn: 'safety and reassurance', tone: 'heritage' },
  { ar: 'فهد', en: 'Fahad', meaningAr: 'اسم عربي أصيل', meaningEn: 'classic Arabic name', tone: 'heritage' },
  { ar: 'عبدالعزيز', en: 'Abdulaziz', meaningAr: 'العبودية لله العزيز', meaningEn: 'servant of the Almighty', tone: 'faith' },
  { ar: 'ريان', en: 'Rayan', meaningAr: 'باب في الجنة ومعنى الارتواء', meaningEn: 'a gate of Paradise and refreshment', tone: 'faith' },
]

const countryCareConfig: Record<CountryCode, {
  names: Record<Lang, string>
  emergency: Record<Lang, string>
  ministry: Record<Lang, string>
  telehealth: Record<Lang, string>
  mentalHealth: Record<Lang, string>
  insurance: Record<Lang, string>
  maternityPartner: Record<Lang, string>
  hospitalPartner: Record<Lang, string>
}> = {
  SA: {
    names: { ar: 'السعودية', en: 'Saudi Arabia' },
    emergency: { ar: 'الطوارئ السعودية', en: 'Saudi emergency' },
    ministry: { ar: 'إرشادات وزارة الصحة', en: 'MOH guidance' },
    telehealth: { ar: 'استشارة صحتي عن بعد', en: 'Sehhaty telehealth' },
    mentalHealth: { ar: 'دعم نفسي موثوق', en: 'Mental health support' },
    insurance: { ar: 'تغطية التأمين ومجلس الضمان الصحي', en: 'Insurance and CCHI context' },
    maternityPartner: { ar: 'حجز عيادة نساء وولادة', en: 'Book OB-GYN clinic' },
    hospitalPartner: { ar: 'أقرب مستشفى ولادة', en: 'Nearest maternity hospital' },
  },
  AE: {
    names: { ar: 'الإمارات', en: 'United Arab Emirates' },
    emergency: { ar: 'طوارئ الإمارات', en: 'UAE emergency' },
    ministry: { ar: 'إرشادات وزارة الصحة والجهات الصحية المحلية', en: 'MOHAP and local health authority guidance' },
    telehealth: { ar: 'استشارة صحية عن بعد', en: 'Telehealth consult' },
    mentalHealth: { ar: 'دعم الصحة النفسية', en: 'Mental health support' },
    insurance: { ar: 'تغطية التأمين الصحي المحلي', en: 'Local health insurance context' },
    maternityPartner: { ar: 'حجز عيادة نساء وولادة', en: 'Book OB-GYN clinic' },
    hospitalPartner: { ar: 'أقرب مستشفى ولادة', en: 'Nearest maternity hospital' },
  },
  KW: {
    names: { ar: 'الكويت', en: 'Kuwait' },
    emergency: { ar: 'طوارئ الكويت', en: 'Kuwait emergency' },
    ministry: { ar: 'إرشادات وزارة الصحة الكويتية', en: 'Kuwait MOH guidance' },
    telehealth: { ar: 'استشارة صحية عن بعد', en: 'Telehealth consult' },
    mentalHealth: { ar: 'دعم الصحة النفسية', en: 'Mental health support' },
    insurance: { ar: 'تغطية التأمين الصحي المحلي', en: 'Local health insurance context' },
    maternityPartner: { ar: 'حجز عيادة نساء وولادة', en: 'Book OB-GYN clinic' },
    hospitalPartner: { ar: 'أقرب مستشفى ولادة', en: 'Nearest maternity hospital' },
  },
  QA: {
    names: { ar: 'قطر', en: 'Qatar' },
    emergency: { ar: 'طوارئ قطر', en: 'Qatar emergency' },
    ministry: { ar: 'إرشادات وزارة الصحة العامة', en: 'Ministry of Public Health guidance' },
    telehealth: { ar: 'استشارة صحية عن بعد', en: 'Telehealth consult' },
    mentalHealth: { ar: 'دعم الصحة النفسية', en: 'Mental health support' },
    insurance: { ar: 'تغطية التأمين الصحي المحلي', en: 'Local health insurance context' },
    maternityPartner: { ar: 'حجز عيادة نساء وولادة', en: 'Book OB-GYN clinic' },
    hospitalPartner: { ar: 'أقرب مستشفى ولادة', en: 'Nearest maternity hospital' },
  },
  BH: {
    names: { ar: 'البحرين', en: 'Bahrain' },
    emergency: { ar: 'طوارئ البحرين', en: 'Bahrain emergency' },
    ministry: { ar: 'إرشادات وزارة الصحة البحرينية', en: 'Bahrain MOH guidance' },
    telehealth: { ar: 'استشارة صحية عن بعد', en: 'Telehealth consult' },
    mentalHealth: { ar: 'دعم الصحة النفسية', en: 'Mental health support' },
    insurance: { ar: 'تغطية التأمين الصحي المحلي', en: 'Local health insurance context' },
    maternityPartner: { ar: 'حجز عيادة نساء وولادة', en: 'Book OB-GYN clinic' },
    hospitalPartner: { ar: 'أقرب مستشفى ولادة', en: 'Nearest maternity hospital' },
  },
  OM: {
    names: { ar: 'عمان', en: 'Oman' },
    emergency: { ar: 'طوارئ عمان', en: 'Oman emergency' },
    ministry: { ar: 'إرشادات وزارة الصحة العمانية', en: 'Oman MOH guidance' },
    telehealth: { ar: 'استشارة صحية عن بعد', en: 'Telehealth consult' },
    mentalHealth: { ar: 'دعم الصحة النفسية', en: 'Mental health support' },
    insurance: { ar: 'تغطية التأمين الصحي المحلي', en: 'Local health insurance context' },
    maternityPartner: { ar: 'حجز عيادة نساء وولادة', en: 'Book OB-GYN clinic' },
    hospitalPartner: { ar: 'أقرب مستشفى ولادة', en: 'Nearest maternity hospital' },
  },
}

function normalizeCountry(value?: string): CountryCode {
  return GCC_COUNTRIES.includes(value as CountryCode) ? value as CountryCode : 'SA'
}

let browserSupabase: SupabaseClient | null = null

const content = {
  ar: {
    dir: 'rtl',
    langToggle: 'EN',
    themeLight: 'تفعيل الوضع الفاتح',
    themeDark: 'تفعيل الوضع الليلي',
    demo: 'وضع العرض التجريبي',
    saved: 'تم الحفظ في بيانات العرض التجريبي.',
    nav: [
      { id: 'home', label: 'الرئيسية', icon: 'home' },
      { id: 'timeline', label: 'الجدول', icon: 'calendar_month' },
      { id: 'checkin', label: 'الفحص', icon: 'check_circle' },
      { id: 'companion', label: 'رفقة الذكية', icon: 'chat' },
      { id: 'support', label: 'الدعم', icon: 'health_and_safety' },
    ] satisfies NavItem[],
    header: {
      date: '14 رجب | 25 يناير',
      greeting: 'أهلا بك، نورة',
    },
    home: {
      weekLabel: 'الأسبوع',
      week: '28',
      progressAria: 'الأسبوع الثامن والعشرون من الحمل',
      days: '84',
      daysLabel: 'يوما للقاء طفلك',
      insightTitle: 'رؤية اليوم',
      insight: 'طفلك الآن بحجم حبة باذنجان. الرئتان تواصلان النضج، وحركة الطفل تصبح أكثر انتظاما.',
      ctaTitle: 'أكملي فحصك اليومي',
      cta: 'شاركي المزاج والنوم والأعراض. رفقة تحولها إلى خطوة واضحة، لا إلى قلق إضافي.',
      ctaAria: 'بدء الفحص اليومي',
      tools: [
        { label: 'الفحص اليومي', icon: 'how_to_reg', tone: 'violet', target: 'checkin' },
        { label: 'السجل', icon: 'book_5', tone: 'rose', target: 'journal' },
        { label: 'رفقة الذكية', icon: 'chat_bubble', tone: 'primary', target: 'companion' },
        { label: 'موقت التقلصات', icon: 'timer', tone: 'gold', target: 'contractions' },
        { label: 'عد الركلات', icon: 'touch_app', tone: 'teal', target: 'kicks' },
        { label: 'الوزن', icon: 'monitor_weight', tone: 'violet', target: 'weight' },
        { label: 'الاسترخاء', icon: 'self_improvement', tone: 'teal', target: 'wellness' },
        { label: 'التمارين', icon: 'directions_walk', tone: 'gold', target: 'exercise' },
        { label: 'مسار الرعاية', icon: 'local_hospital', tone: 'teal', target: 'care' },
        { label: 'مكتبة موثوقة', icon: 'verified', tone: 'teal', target: 'library' },
        { label: 'بعد الولادة', icon: 'spa', tone: 'rose', target: 'postpartum' },
        { label: 'الشريك', icon: 'diversity_1', tone: 'gold', target: 'partner' },
        { label: 'التنبيهات', icon: 'notifications_active', tone: 'teal', target: 'notifications' },
        { label: 'الخصوصية', icon: 'lock', tone: 'violet', target: 'privacy' },
        { label: 'النمو', icon: 'ios_share', tone: 'primary', target: 'growth' },
      ] satisfies Tool[],
    },
    timeline: {
      eyebrow: 'رحلة الحمل',
      title: 'تطور طفلك أسبوعا بأسبوع',
      intro: 'مقارنات مألوفة ومعلومات قصيرة لا تزدحم عليك.',
      currentSize: 'حجم طفلك الآن مثل الرمانة',
      length: '30 سم',
      weight: '600 جم',
      items: ['اكتشاف الأصوات', 'بدء الحركة', 'تطور السمع', 'تطور الرئتين', 'فتح العينين'],
    },
    checkin: {
      close: 'إغلاق',
      label: 'تسجيل يومي',
      step: '1 من 5',
      title: 'كيف تشعرين اليوم؟',
      intro: 'استمعي لجسدك ومزاجك. لا توجد إجابة خاطئة.',
      sleep: 'كيف كان نومك؟',
      low: 'متقطع',
      high: 'جيد',
      next: 'حفظ الفحص',
      doneTitle: 'تم تسجيل الفحص',
      doneBody: 'النتيجة التجريبية: لا توجد إشارة عاجلة. ننصح براحة قصيرة وشرب الماء ومتابعة الحركة المعتادة.',
      moods: ['سعيدة', 'هادئة', 'مستقرة', 'عادية', 'متعبة', 'مرهقة', 'متقلبة'],
    },
    companion: {
      eyebrow: 'رفقة الذكية',
      title: 'مساحة آمنة للسؤال والطمأنة',
      aiName: 'رفقة',
      opening: 'أنا معك يا نورة. أخبريني بما يقلقك وسأساعدك بخطوة واضحة ولطيفة.',
      answer: 'أفهم قلقك. إذا كانت حركة الطفل أقل من المعتاد، ابدئي جلسة عد الركلات. إذا استمرت القلة، تواصلي مع الطبيبة أو الطوارئ.',
      replies: ['ابدئي عد الركلات', 'حضري أسئلة للطبيبة', 'أحتاج تهدئة'],
      input: 'اكتبي ما يدور في بالك...',
      empty: 'اكتبي سؤالك أولا، ثم اضغطي إرسال.',
      voice: 'تحدثي الآن',
      listening: 'أستمع الآن...',
      voiceUnsupported: 'المتصفح لا يدعم التعرف الصوتي المجاني. يمكنك الكتابة بدلا من ذلك.',
      aiThinking: 'رفقة تفكر في رد آمن...',
      speakReply: 'تشغيل الرد صوتيا',
      stopVoice: 'إيقاف الصوت',
      voiceReady: 'تم التقاط الصوت وإرساله إلى رفقة.',
      send: 'إرسال',
    },
    support: {
      eyebrow: 'الدعم الهادئ',
      title: 'عندما يصبح اليوم ثقيلا',
      intro: 'لا تشخيص ولا ضغط. فقط خطوات آمنة وواضحة.',
      safeTitle: 'نحن هنا معك',
      safeText: 'خذي نفسا بطيئا. اختاري شخصا تثقين به، أو اطلبي دعما طبيا فورا إذا شعرت أنك غير آمنة.',
      callTrusted: 'اتصلي بشخص تثقين به',
      urgent: 'اعرضي موارد عاجلة',
      trustedDone: 'تم فتح بطاقة اتصال تجريبية للشخص الموثوق.',
      urgentDone: 'الموارد العاجلة: اتصلي بالطوارئ أو توجهي لأقرب رعاية عاجلة عند النزيف أو الألم الشديد أو قلة الحركة الواضحة.',
      pathwayTitle: 'من أتواصل معه؟',
      pathway: [
        'أعراض بسيطة ومتكررة: طبيبة النساء أو طب الأسرة.',
        'نزيف أو ألم شديد أو قلة حركة واضحة: الطوارئ فورا.',
        'ضيق نفسي مستمر: مختصة نفسية أو مركز موثوق.',
      ],
    },
    utility: {
      journalTitle: 'السجل الخاص',
      journalBody: 'ملاحظة اليوم: شعرت نورة بحركة واضحة بعد الغداء وسجلت سؤالا للطبيبة عن النوم.',
      addEntry: 'إضافة ذكرى',
      contractionsTitle: 'موقت التقلصات',
      contractionsBody: 'جلسة تجريبية: 6 تقلصات، متوسط المدة 48 ثانية، كل 5 دقائق.',
      startTimer: 'بدء الموقت',
      saveSession: 'حفظ الجلسة',
      kicksTitle: 'عد الركلات',
      kicksBody: 'جلسة تجريبية: 10 حركات خلال 42 دقيقة.',
      addKick: 'إضافة ركلة',
      endSession: 'إنهاء الجلسة',
      weightTitle: 'تتبع الوزن',
      weightBody: 'آخر قراءة: 72.4 كجم. الاتجاه مستقر ولا توجد لغة لوم أو تخويف.',
      addWeight: 'إضافة وزن',
      viewTrend: 'عرض الاتجاه',
      wellnessTitle: 'استرخاء وصوتيات',
      wellnessBody: 'توصية رفقة الآن: تلاوة هادئة أو دعاء قصير أو موسيقى تنفس لمدة 7 دقائق بسبب نوم متقطع وتوتر خفيف. يمكنك إضافة قائمتك الخاصة لاحقا.',
      playRecommended: 'تشغيل المقترح',
      addPlaylist: 'إضافة قائمتي',
      exerciseTitle: 'تمارين آمنة',
      exerciseBody: 'لا توجد تعليمات طبيبة مسجلة في العرض التجريبي. تقترح رفقة مشيا خفيفا 10 دقائق وتمدد كتف لطيف. تعليمات الطبيبة ستتجاوز أي اقتراح من الذكاء الاصطناعي.',
      startExercise: 'بدء تمرين لطيف',
      doctorPlan: 'خطة الطبيبة',
      careTitle: 'مسار الرعاية السعودي',
      careBody: 'توجيه واضح يربط القلق بطبيبة النساء، طب الأسرة، الطوارئ، الرعاية عن بعد، أو الدعم النفسي. رفقة تطمئن، لكن قواعد السلامة تحدد التصعيد.',
      libraryTitle: 'مكتبة المحتوى المراجع',
      libraryBody: 'بطاقات صحية مع اسم المراجعة، التخصص، تاريخ الاعتماد، تاريخ الانتهاء، والمراجع.',
      reviewAdminTitle: 'اعتماد المحتوى الصحي',
      reviewAdminBody: 'مساحة خاصة بفريق المراجعة الطبي لاعتماد المحتوى وتجديده قبل ظهوره للأمهات.',
      postpartumTitle: 'ما بعد الولادة والطفل',
      postpartumBody: 'متابعة الأربعين، النزيف، الألم، ضغط الرضاعة، النوم، روتين الطفل، التطعيمات السعودية، المراحل، والذكريات الخاصة.',
      partnerTitle: 'صلاحيات الشريك',
      partnerBody: 'يرى الشريك نمو الطفل وتذكيرات المواعيد ورسائل الدعم فقط. الصحة النفسية، الأعراض، السجل، ومحادثات رفقة الذكية مخفية افتراضيا.',
      privacyTitle: 'مركز الثقة والخصوصية',
      privacyBody: 'وضع قليل البيانات، سجل الموافقات، الحذف والتصدير، التحكم ببيانات رفقة الذكية، لا تحليل للمحادثات الخام، ولا رؤية فردية لصاحب عمل أو شركة تأمين.',
      growthTitle: 'حلقات النمو والمشاركة',
      growthBody: 'أكواد إحالة، رموز استجابة للعيادات، بطاقات مشاركة للمراحل، مجموعات حسب موعد الولادة، وتجهيز مجتمع قابل للإشراف قبل الإطلاق.',
      backHome: 'العودة للرئيسية',
    },
  },
  en: {
    dir: 'ltr',
    langToggle: 'AR',
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',
    demo: 'Demo environment',
    saved: 'Saved to seeded demo data.',
    nav: [
      { id: 'home', label: 'Home', icon: 'home' },
      { id: 'timeline', label: 'Timeline', icon: 'calendar_month' },
      { id: 'checkin', label: 'Check-in', icon: 'check_circle' },
      { id: 'companion', label: 'RIFQA AI', icon: 'chat' },
      { id: 'support', label: 'Support', icon: 'health_and_safety' },
    ] satisfies NavItem[],
    header: {
      date: '14 Rajab | 25 January',
      greeting: 'Welcome back, Noura',
    },
    home: {
      weekLabel: 'Week',
      week: '28',
      progressAria: 'Pregnancy week twenty eight',
      days: '84',
      daysLabel: 'days until you meet your baby',
      insightTitle: "Today's insight",
      insight: 'Your baby is about the size of an eggplant. The lungs are maturing and movement patterns are becoming clearer.',
      ctaTitle: 'Complete your daily check-in',
      cta: 'Share mood, sleep, and symptoms. RIFQA turns them into a clear next step, not extra worry.',
      ctaAria: 'Start daily check-in',
      tools: [
        { label: 'Daily check-in', icon: 'how_to_reg', tone: 'violet', target: 'checkin' },
        { label: 'Journal', icon: 'book_5', tone: 'rose', target: 'journal' },
        { label: 'RIFQA AI', icon: 'chat_bubble', tone: 'primary', target: 'companion' },
        { label: 'Contraction timer', icon: 'timer', tone: 'gold', target: 'contractions' },
        { label: 'Kick counter', icon: 'touch_app', tone: 'teal', target: 'kicks' },
        { label: 'Weight', icon: 'monitor_weight', tone: 'violet', target: 'weight' },
        { label: 'Relaxation', icon: 'self_improvement', tone: 'teal', target: 'wellness' },
        { label: 'Exercise', icon: 'directions_walk', tone: 'gold', target: 'exercise' },
        { label: 'Care route', icon: 'local_hospital', tone: 'teal', target: 'care' },
        { label: 'Trusted library', icon: 'verified', tone: 'teal', target: 'library' },
        { label: 'Postpartum', icon: 'spa', tone: 'rose', target: 'postpartum' },
        { label: 'Partner', icon: 'diversity_1', tone: 'gold', target: 'partner' },
        { label: 'Notifications', icon: 'notifications_active', tone: 'teal', target: 'notifications' },
        { label: 'Privacy', icon: 'lock', tone: 'violet', target: 'privacy' },
        { label: 'Growth', icon: 'ios_share', tone: 'primary', target: 'growth' },
      ] satisfies Tool[],
    },
    timeline: {
      eyebrow: 'Pregnancy journey',
      title: 'Your baby, week by week',
      intro: 'Saudi-familiar size comparisons and short, calm updates.',
      currentSize: 'Your baby is now the size of a pomegranate',
      length: '30 cm',
      weight: '600 g',
      items: ['Sound discovery', 'Movement begins', 'Hearing development', 'Lung development', 'Eyes opening'],
    },
    checkin: {
      close: 'Close',
      label: 'Daily check-in',
      step: '1 of 5',
      title: 'How are you feeling today?',
      intro: 'Listen to your body and mood. There is no wrong answer.',
      sleep: 'How was your sleep?',
      low: 'Interrupted',
      high: 'Good',
      next: 'Save check-in',
      doneTitle: 'Check-in saved',
      doneBody: 'Demo result: no urgent signal. Try a short rest, drink water, and keep watching your usual movement pattern.',
      moods: ['Happy', 'Calm', 'Steady', 'Okay', 'Tired', 'Drained', 'Mixed'],
    },
    companion: {
      eyebrow: 'RIFQA AI',
      title: 'A safe space for questions and reassurance',
      aiName: 'RIFQA',
      opening: 'I am here with you, Noura. Tell me what is worrying you and I will help with a gentle, clear next step.',
      answer: 'I understand why that feels worrying. If movement feels lower than usual, start a kick-count session. If it remains low, contact your clinician or emergency care.',
      replies: ['Start kick count', 'Prepare doctor questions', 'I need grounding'],
      input: 'Write what is on your mind...',
      empty: 'Write a question first, then tap send.',
      voice: 'Speak now',
      listening: 'Listening...',
      voiceUnsupported: 'This browser does not support free speech recognition. You can type instead.',
      aiThinking: 'RIFQA is preparing a safe reply...',
      speakReply: 'Speak reply',
      stopVoice: 'Stop voice',
      voiceReady: 'Voice captured and sent to RIFQA.',
      send: 'Send',
    },
    support: {
      eyebrow: 'Calm support',
      title: 'When the day feels heavy',
      intro: 'No diagnosis and no pressure. Just safe, clear steps.',
      safeTitle: 'We are here with you',
      safeText: 'Take one slow breath. Choose someone you trust, or seek urgent medical support if you feel unsafe.',
      callTrusted: 'Call someone you trust',
      urgent: 'Show urgent resources',
      trustedDone: 'Opened a demo trusted-contact card.',
      urgentDone: 'Urgent resources: call emergency care or go to urgent care for bleeding, severe pain, or clearly reduced movement.',
      pathwayTitle: 'Who should I contact?',
      pathway: [
        'Mild repeated symptoms: your OB or family physician.',
        'Bleeding, severe pain, or clearly reduced movement: emergency care now.',
        'Ongoing emotional distress: a mental health specialist or trusted center.',
      ],
    },
    utility: {
      journalTitle: 'Private journal',
      journalBody: 'Today: Noura felt clear movement after lunch and saved one sleep question for her clinician.',
      addEntry: 'Add memory',
      contractionsTitle: 'Contraction timer',
      contractionsBody: 'Demo session: 6 contractions, average duration 48 seconds, every 5 minutes.',
      startTimer: 'Start timer',
      saveSession: 'Save session',
      kicksTitle: 'Kick counter',
      kicksBody: 'Demo session: 10 movements in 42 minutes.',
      addKick: 'Add kick',
      endSession: 'End session',
      weightTitle: 'Weight tracker',
      weightBody: 'Latest entry: 72.4 kg. Trend is steady, with no shaming language.',
      addWeight: 'Add weight',
      viewTrend: 'View trend',
      wellnessTitle: 'Relaxation and audio',
      wellnessBody: 'RIFQA recommends a calm recitation, short prayer, or 7-minute breathing music now because sleep was interrupted and stress is slightly elevated. Personal playlists can be added later.',
      playRecommended: 'Play recommendation',
      addPlaylist: 'Add my playlist',
      exerciseTitle: 'Safe exercise',
      exerciseBody: 'No clinician instructions are stored in this demo. RIFQA suggests a 10-minute easy walk and gentle shoulder stretch. Doctor instructions override AI suggestions.',
      startExercise: 'Start gentle exercise',
      doctorPlan: 'Doctor plan',
      careTitle: 'Saudi care navigator',
      careBody: 'Rule-based guidance routes concerns to OB-GYN, family medicine, emergency care, telehealth, or mental health support. AI can comfort, but safety rules decide escalation.',
      libraryTitle: 'Reviewed content library',
      libraryBody: 'Health cards with reviewer, specialty, approval date, expiry date, and citations.',
      reviewAdminTitle: 'Health Content Approval',
      reviewAdminBody: 'A private clinical review space for approving and renewing health content before mothers see it.',
      postpartumTitle: 'Postpartum and baby OS',
      postpartumBody: 'Track 40-day recovery, bleeding, pain, feeding stress, sleep, baby routines, milestones, Saudi vaccines, and private journal memories after birth.',
      partnerTitle: 'Partner permissions',
      partnerBody: 'Partner can see baby progress, support prompts, and appointment reminders. Mental health, symptoms, journal, and AI chat stay private by default.',
      privacyTitle: 'Privacy trust center',
      privacyBody: 'Low-PII mode, consent history, delete/export, AI data controls, no raw chat analytics, and no employer or insurer individual visibility.',
      growthTitle: 'Growth loops',
      growthBody: 'Referral codes, clinic QR attribution, milestone share cards, due-date cohorts, and moderation-ready community foundations.',
      backHome: 'Back home',
    },
  },
}

function Icon({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}` }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStoredJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function clearStoredJson(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

function getBrowserSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !anonKey || anonKey.startsWith('__')) return null
  browserSupabase ??= createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  return browserSupabase
}

function getStoredAccessToken() {
  if (typeof window === 'undefined') return null
  const directToken = window.localStorage.getItem(ACCESS_TOKEN_KEY) || window.localStorage.getItem('supabase.access_token')
  if (directToken) return directToken

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue
    try {
      const value = window.localStorage.getItem(key)
      if (!value) continue
      const parsed = JSON.parse(value) as { access_token?: unknown; currentSession?: { access_token?: unknown } }
      const token = typeof parsed.access_token === 'string'
        ? parsed.access_token
        : typeof parsed.currentSession?.access_token === 'string'
          ? parsed.currentSession.access_token
          : null
      if (token) return token
    } catch {
      continue
    }
  }

  return null
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function persistAccessToken(session: Session | null) {
  if (typeof window === 'undefined') return
  if (session?.access_token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token)
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatLogDate(value: string | undefined, dir: string) {
  if (!value) return ''
  return formatDualCalendarDate(value, dir as 'rtl' | 'ltr', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDualCalendarDate(
  value: string | Date,
  dir: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
) {
  const date = value instanceof Date ? value : new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  const gregorianLocale = dir === 'rtl' ? 'ar-SA-u-ca-gregory' : 'en-US'
  const hijriLocale = dir === 'rtl' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-US-u-ca-islamic-umalqura'
  const gregorian = new Intl.DateTimeFormat(gregorianLocale, options).format(date)
  const hijri = new Intl.DateTimeFormat(hijriLocale, options).format(date)
  return dir === 'rtl' ? `${hijri} | ${gregorian}` : `${hijri} | ${gregorian}`
}

function getSaudiBabySize(week: number) {
  return SAUDI_BABY_SIZE_COMPARISONS.reduce((best, item) => (
    Math.abs(item.week - week) < Math.abs(best.week - week) ? item : best
  ), SAUDI_BABY_SIZE_COMPARISONS[0])
}

function calculatePregnancyWeek(dueDate: string) {
  if (!dueDate) return DEFAULT_MOTHER_PROFILE.pregnancyWeek
  const due = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(due.getTime())) return DEFAULT_MOTHER_PROFILE.pregnancyWeek
  const daysUntilDue = Math.ceil((due.getTime() - Date.now()) / 86400000)
  return Math.max(1, Math.min(42, 40 - Math.floor(daysUntilDue / 7)))
}

function calculateDaysUntilDue(dueDate: string) {
  if (!dueDate) return 0
  const due = new Date(`${dueDate}T12:00:00`)
  if (Number.isNaN(due.getTime())) return 0
  return Math.max(0, Math.ceil((due.getTime() - Date.now()) / 86400000))
}

function calculateDueDateFromLmp(lmpDate: string) {
  const lmp = new Date(`${lmpDate}T12:00:00`)
  if (Number.isNaN(lmp.getTime())) return ''
  lmp.setDate(lmp.getDate() + 280)
  return lmp.toISOString().slice(0, 10)
}

function isAdminEntry() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin') || window.location.hash === '#/admin'
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [adminMode, setAdminMode] = useState(isAdminEntry)
  const [theme, setTheme] = useState<Theme>('light')
  const [lang, setLang] = useState<Lang>('ar')
  const [selectedMood, setSelectedMood] = useState(content.ar.checkin.moods[0])
  const [notice, setNotice] = useState(content.ar.demo)
  const [motherSession, setMotherSession] = useState<Session | null>(null)
  const [motherProfile, setMotherProfile] = useState<MotherProfile>(DEFAULT_MOTHER_PROFILE)
  const [latestCheckin, setLatestCheckin] = useState<LatestCheckin | null>(null)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => readStoredJson(PRIVACY_SETTINGS_KEY, DEFAULT_PRIVACY_SETTINGS))
  const [selectedReviewedContentId, setSelectedReviewedContentId] = useState<string | null>(null)
  const screenContentRef = useRef<HTMLElement | null>(null)
  const t = content[lang]

  const activeTitle = useMemo(
    () => adminMode ? t.utility.reviewAdminTitle : t.nav.find((item) => item.id === screen)?.label ?? t.home.tools.find((tool) => tool.target === screen)?.label ?? t.nav[0].label,
    [adminMode, screen, t],
  )

  const showNotice = (message: string) => setNotice(message)
  const updatePrivacySettings = useCallback((next: PrivacySettings) => {
    setPrivacySettings(next)
    writeStoredJson(PRIVACY_SETTINGS_KEY, next)
  }, [])

  const navigate = (target: Screen, options?: { reviewedContentId?: string }) => {
    if (target === 'library') {
      setSelectedReviewedContentId(options?.reviewedContentId ?? null)
    }
    setScreen(target)
    showNotice(t.demo)
  }

  const loadMotherProfile = async (session: Session | null = motherSession) => {
    try {
      const response = await fetch('/api/profile', { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : getAuthHeaders() })
      if (!response.ok) throw new Error('profile failed')
      const payload = (await response.json()) as { data?: MotherProfile }
      if (payload.data) setMotherProfile({ ...DEFAULT_MOTHER_PROFILE, ...payload.data })
    } catch {
      setMotherProfile(DEFAULT_MOTHER_PROFILE)
    }
  }

  const toggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    setSelectedMood(content[next].checkin.moods[0])
    setNotice(content[next].demo)
  }

  useEffect(() => {
    screenContentRef.current?.scrollTo({ top: 0, left: 0 })
  }, [adminMode, screen, lang])

  useEffect(() => {
    const updateAdminMode = () => setAdminMode(isAdminEntry())
    window.addEventListener('hashchange', updateAdminMode)
    window.addEventListener('popstate', updateAdminMode)
    return () => {
      window.removeEventListener('hashchange', updateAdminMode)
      window.removeEventListener('popstate', updateAdminMode)
    }
  }, [])

  useEffect(() => {
    const supabase = getBrowserSupabase()
    if (!supabase) {
      persistAccessToken(null)
      return
    }
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setMotherSession(data.session)
      persistAccessToken(data.session)
      void loadMotherProfile(data.session)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setMotherSession(nextSession)
      persistAccessToken(nextSession)
      void loadMotherProfile(nextSession)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return (
    <div className={`app-shell ${theme} ${t.dir}`} dir={t.dir} lang={lang}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      {!adminMode && <aside className="desktop-rail" aria-label={activeTitle}>
        <img className="rail-logo" src="/rifqa-logo.png" alt="RIFQA" />
        {t.nav.map((item) => (
          <button
            key={item.id}
            className={`rail-button ${screen === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.id)}
            type="button"
            title={item.label}
          >
            <Icon name={item.icon} filled={screen === item.id} />
          </button>
        ))}
      </aside>}

      <main className="phone-frame" aria-label={activeTitle}>
        <Header
          theme={theme}
          lang={lang}
          t={t}
          onThemeChange={setTheme}
          onLanguageToggle={toggleLang}
          onAccountOpen={() => navigate('account')}
          signedIn={Boolean(motherSession)}
          displayName={motherProfile.displayName}
        />

        <section className="screen-content" ref={screenContentRef}>
          <div className="demo-pill">{notice}</div>
          {adminMode && <AdminAccessScreen t={t} onNotice={showNotice} />}
          {!adminMode && screen === 'home' && <HomeScreen t={t} profile={motherProfile} onNavigate={navigate} />}
          {!adminMode && screen === 'timeline' && <TimelineScreen t={t} profile={motherProfile} />}
          {!adminMode && screen === 'checkin' && (
            <CheckInScreen
              t={t}
              selectedMood={selectedMood}
              onSelectMood={setSelectedMood}
              onClose={() => navigate('home')}
              onSave={() => showNotice(t.saved)}
              onComplete={setLatestCheckin}
              onRouteCare={() => navigate('care')}
            />
          )}
          {!adminMode && screen === 'companion' && (
            <CompanionScreen
              t={t}
              onNavigate={navigate}
              onNotice={showNotice}
              latestCheckin={latestCheckin}
              aiContextEnabled={privacySettings.aiContextEnabled}
            />
          )}
          {!adminMode && screen === 'support' && <SupportScreen t={t} onNotice={showNotice} />}
          {!adminMode && screen === 'journal' && <UtilityScreen title={t.utility.journalTitle} body={t.utility.journalBody} icon="book_5" primary={t.utility.addEntry} secondary={t.utility.backHome} onPrimary={() => showNotice(t.saved)} onSecondary={() => navigate('home')} />}
          {!adminMode && screen === 'contractions' && <ContractionTimerScreen t={t} onNotice={showNotice} />}
          {!adminMode && screen === 'kicks' && <KickCounterScreen t={t} onNotice={showNotice} />}
          {!adminMode && screen === 'weight' && <WeightSymptomsScreen t={t} onNotice={showNotice} latestCheckin={latestCheckin} />}
          {!adminMode && screen === 'wellness' && <UtilityScreen title={t.utility.wellnessTitle} body={t.utility.wellnessBody} icon="self_improvement" primary={t.utility.playRecommended} secondary={t.utility.addPlaylist} onPrimary={() => showNotice(t.utility.wellnessBody)} onSecondary={() => showNotice(t.saved)} />}
          {!adminMode && screen === 'exercise' && <UtilityScreen title={t.utility.exerciseTitle} body={t.utility.exerciseBody} icon="directions_walk" primary={t.utility.startExercise} secondary={t.utility.doctorPlan} onPrimary={() => showNotice(t.utility.exerciseBody)} onSecondary={() => showNotice(t.saved)} />}
          {!adminMode && screen === 'care' && <SaudiCareNavigatorScreen t={t} onNotice={showNotice} latestCheckin={latestCheckin} profile={motherProfile} />}
          {!adminMode && screen === 'library' && <ReviewedContentLibraryScreen t={t} onNotice={showNotice} selectedContentId={selectedReviewedContentId} />}
          {!adminMode && screen === 'postpartum' && <PostpartumScreen t={t} profile={motherProfile} onProfileChange={setMotherProfile} onNotice={showNotice} />}
          {!adminMode && screen === 'partner' && <PartnerScreen t={t} onNotice={showNotice} />}
          {!adminMode && screen === 'notifications' && <NotificationsScreen t={t} profile={motherProfile} onNotice={showNotice} />}
          {!adminMode && screen === 'privacy' && <PrivacyTrustScreen t={t} onNotice={showNotice} settings={privacySettings} onSettingsChange={updatePrivacySettings} />}
          {!adminMode && screen === 'growth' && <GrowthScreen t={t} profile={motherProfile} onNotice={showNotice} />}
          {!adminMode && screen === 'saudi' && <SaudiDifferentiationScreen t={t} profile={motherProfile} onNotice={showNotice} onNavigate={navigate} />}
          {!adminMode && screen === 'account' && (
            <AccountScreen
              t={t}
              session={motherSession}
              profile={motherProfile}
              onNotice={showNotice}
              onProfileChange={setMotherProfile}
              onSessionChange={(session) => {
                setMotherSession(session)
                persistAccessToken(session)
                void loadMotherProfile(session)
              }}
            />
          )}
        </section>

        {!adminMode && <BottomNav active={screen} items={t.nav} onNavigate={navigate} />}
      </main>
    </div>
  )
}

function Header({
  theme,
  lang,
  t,
  onThemeChange,
  onLanguageToggle,
  onAccountOpen,
  signedIn,
  displayName,
}: {
  theme: Theme
  lang: Lang
  t: (typeof content)[Lang]
  onThemeChange: (theme: Theme) => void
  onLanguageToggle: () => void
  onAccountOpen: () => void
  signedIn: boolean
  displayName: string
}) {
  const rawDisplayName = displayName.trim()
  const dualDate = formatDualCalendarDate(new Date(), t.dir)
  const greetingName = t.dir === 'rtl' && (!rawDisplayName || rawDisplayName.toLowerCase() === 'noura')
    ? 'نورة'
    : rawDisplayName || 'Noura'
  const greeting = t.dir === 'rtl' ? `أهلا بك، ${greetingName}` : `Welcome back,\n${greetingName}`

  return (
    <header className="top-bar">
      <div className="profile-cluster">
        <img className="app-logo" src="/rifqa-logo.png" alt="RIFQA" />
        <div>
          <p className="eyebrow">{dualDate}</p>
          <h1>{greeting}</h1>
        </div>
      </div>
      <div className="top-actions">
        <button className="language-toggle" type="button" onClick={onLanguageToggle} data-current-lang={lang}>
          {t.langToggle}
        </button>
        <button className={`theme-toggle account-button ${signedIn ? 'signed-in' : ''}`} type="button" onClick={onAccountOpen} aria-label={t.dir === 'rtl' ? 'الحساب' : 'Account'}>
          <Icon name={signedIn ? 'account_circle' : 'person'} filled={signedIn} />
        </button>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? t.themeDark : t.themeLight}
        >
          <Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} />
        </button>
      </div>
    </header>
  )
}

function AccountScreen({
  t,
  session,
  profile,
  onNotice,
  onProfileChange,
  onSessionChange,
}: {
  t: (typeof content)[Lang]
  session: Session | null
  profile: MotherProfile
  onNotice: (message: string) => void
  onProfileChange: (profile: MotherProfile) => void
  onSessionChange: (session: Session | null) => void
}) {
  const supabase = getBrowserSupabase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [pregnancyWeek, setPregnancyWeek] = useState(profile.pregnancyWeek)
  const [dueDate, setDueDate] = useState(profile.dueDate)
  const [country, setCountry] = useState<CountryCode>(normalizeCountry(profile.locale))
  const [lmpDate, setLmpDate] = useState('')
  const [sponsorCode, setSponsorCode] = useState('')
  const [entitlement, setEntitlement] = useState<EntitlementState | null>(null)
  const [busy, setBusy] = useState(false)
  const isRtl = t.dir === 'rtl'
  const profileDisplayName = isRtl && displayName.trim().toLowerCase() === 'noura'
    ? '\u0646\u0648\u0631\u0629'
    : displayName
  const localizedEntitlementValue = (kind: 'plan' | 'source', value?: string) => {
    const normalized = value || (kind === 'plan' ? 'free' : 'direct')
    if (!isRtl) return normalized
    const labels: Record<string, string> = {
      free: '\u0645\u062c\u0627\u0646\u064a\u0629',
      sponsored: '\u0645\u0645\u0648\u0644\u0629',
      premium: '\u0645\u0645\u064a\u0632\u0629',
      direct: '\u0645\u0628\u0627\u0634\u0631',
      employer: '\u062c\u0647\u0629 \u0639\u0645\u0644',
      insurer: '\u062a\u0623\u0645\u064a\u0646',
      clinic: '\u0639\u064a\u0627\u062f\u0629',
      corporate: '\u0634\u0631\u0643\u0629',
    }
    return labels[normalized] ?? normalized
  }
  const ui = t.dir === 'rtl'
    ? {
        eyebrow: 'الحساب الآمن',
        title: 'حساب الأم وملف الحمل',
        intro: 'سجلي الدخول لحفظ فحوصاتك وملف الحمل في حسابك. يمكنك الاستمرار كضيفة، لكن بيانات الضيفة تبقى على هذا الجهاز فقط.',
        guest: 'وضع الضيفة',
        signedIn: 'تم تسجيل الدخول',
        unavailable: 'تسجيل الدخول غير متاح في هذا العرض.',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        signIn: 'تسجيل الدخول',
        signUp: 'إنشاء حساب',
        reset: 'استعادة كلمة المرور',
        signOut: 'تسجيل الخروج',
        profileTitle: 'ملف الحمل',
        displayName: 'الاسم',
        week: 'أسبوع الحمل',
        dueDate: 'موعد الولادة',
        country: 'الدولة',
        lmp: 'تاريخ آخر دورة',
        calculateDue: 'حساب موعد الولادة',
        save: 'حفظ الملف',
        saved: 'تم حفظ ملف الحمل.',
        authSaved: 'تم تحديث الجلسة.',
        resetSent: 'تم إرسال رابط الاستعادة إذا كان البريد مسجلا.',
        failed: 'تعذر تنفيذ الطلب الآن.',
        boundary: 'حدود وضع الضيفة',
        boundaryBody: 'رفقة لا تحفظ بيانات الضيفة في الحساب ولا تنقلها بين الأجهزة. سجلي الدخول قبل الاعتماد على السجل الطويل أو طلبات الخصوصية.',
        firewall: 'خصوصية الدعم المؤسسي',
        firewallBody: 'إذا كان الوصول ممولا من جهة عمل أو تأمين، فالجهة ترى أرقاما إجمالية فقط. لا ترى هويتك، فحوصك، أعراضك، مذكراتك، أو محادثات رفقة.',
      }
    : {
        eyebrow: 'Secure account',
        title: 'Mother Account And Pregnancy Profile',
        intro: 'Sign in to save check-ins and your pregnancy profile to your account. You can continue as a guest, but guest data stays on this device only.',
        guest: 'Guest mode',
        signedIn: 'Signed in',
        unavailable: 'Sign-in is not available in this preview.',
        email: 'Email',
        password: 'Password',
        signIn: 'Sign in',
        signUp: 'Create account',
        reset: 'Reset password',
        signOut: 'Sign out',
        profileTitle: 'Pregnancy profile',
        displayName: 'Name',
        week: 'Pregnancy week',
        dueDate: 'Due date',
        country: 'Country',
        lmp: 'Last period date',
        calculateDue: 'Calculate due date',
        save: 'Save profile',
        saved: 'Pregnancy profile saved.',
        authSaved: 'Session updated.',
        resetSent: 'Recovery link sent if the email is registered.',
        failed: 'Could not complete that request.',
        boundary: 'Guest mode boundaries',
        boundaryBody: 'RIFQA does not save guest data to an account or sync it across devices. Sign in before relying on long-term history or privacy requests.',
        firewall: 'Sponsored-access privacy firewall',
        firewallBody: 'If an employer, clinic, or insurer sponsors access, they only see aggregate adoption and safety metrics. They never see your identity, check-ins, symptoms, journal, pregnancy details, or RIFQA conversations.',
      }

  const entitlementUi = t.dir === 'rtl'
    ? {
        title: 'الوصول الممول',
        sponsorCode: 'رمز الجهة الراعية',
        applySponsor: 'تفعيل الوصول',
        plan: 'الخطة',
        source: 'المصدر',
        aggregateOnly: 'تقارير إجمالية فقط',
      }
    : {
        title: 'Sponsored access',
        sponsorCode: 'Sponsor code',
        applySponsor: 'Apply access',
        plan: 'Plan',
        source: 'Source',
        aggregateOnly: 'Aggregate reports only',
      }

  useEffect(() => {
    setDisplayName(profile.displayName)
    setPregnancyWeek(profile.pregnancyWeek)
    setDueDate(profile.dueDate)
    setCountry(normalizeCountry(profile.locale))
  }, [profile.displayName, profile.pregnancyWeek, profile.dueDate, profile.locale])

  useEffect(() => {
    let active = true
    void fetch(`/api/entitlements?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, { headers: getAuthHeaders() })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { data?: EntitlementState } | null) => {
        if (!active || !payload?.data) return
        setEntitlement(payload.data)
        setSponsorCode(payload.data.sponsorCode ?? '')
      })
      .catch(() => null)
    return () => {
      active = false
    }
  }, [t.dir, session])

  const authenticate = async (mode: 'signIn' | 'signUp') => {
    if (!supabase) {
      onNotice(ui.unavailable)
      return
    }
    setBusy(true)
    try {
      const result = mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
      if (result.error) throw result.error
      onSessionChange(result.data.session)
      setPassword('')
      onNotice(ui.authSaved)
    } catch {
      onNotice(ui.failed)
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    if (!supabase || !email) return
    setBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      onNotice(ui.resetSent)
    } catch {
      onNotice(ui.failed)
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    setBusy(true)
    await supabase.auth.signOut().catch(() => null)
    onSessionChange(null)
    setBusy(false)
    onNotice(ui.authSaved)
  }

  const saveProfile = async () => {
    const nextProfile = {
      ...profile,
      displayName,
      pregnancyWeek: Math.max(1, Math.min(42, pregnancyWeek)),
      dueDate,
      locale: country,
    }
    setBusy(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(nextProfile),
      })
      const payload = (await response.json()) as { data?: MotherProfile }
      onProfileChange(payload.data ? { ...nextProfile, ...payload.data } : nextProfile)
      onNotice(ui.saved)
    } catch {
      onProfileChange(nextProfile)
      onNotice(ui.saved)
    } finally {
      setBusy(false)
    }
  }

  const applyDueDateCalculation = () => {
    const calculatedDueDate = calculateDueDateFromLmp(lmpDate)
    if (!calculatedDueDate) return
    setDueDate(calculatedDueDate)
    setPregnancyWeek(calculatePregnancyWeek(calculatedDueDate))
  }

  const applySponsor = async () => {
    setBusy(true)
    try {
      const response = await fetch(`/api/entitlements?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ plan: 'sponsored', source: 'employer', sponsorCode }),
      })
      const payload = (await response.json()) as { data?: EntitlementState }
      if (payload.data) setEntitlement(payload.data)
      onNotice(ui.authSaved)
    } catch {
      onNotice(ui.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="account-screen">
      <div className="screen-heading">
        <span className="eyebrow">{ui.eyebrow}</span>
        <h2>{ui.title}</h2>
        <p>{ui.intro}</p>
      </div>
      <section className="glass-card account-card">
        <div className="card-title">
          <Icon name={session ? 'verified_user' : 'person'} filled={Boolean(session)} />
          <span>{session ? ui.signedIn : ui.guest}</span>
        </div>
        {session ? (
          <>
            <strong>{session.user.email}</strong>
            <button type="button" disabled={busy} onClick={() => void signOut()}>{ui.signOut}</button>
          </>
        ) : (
          <>
            <input type="email" value={email} placeholder={ui.email} onChange={(event) => setEmail(event.target.value)} disabled={busy || !supabase} />
            <input type="password" value={password} placeholder={ui.password} onChange={(event) => setPassword(event.target.value)} disabled={busy || !supabase} />
            <div className="account-actions">
              <button type="button" disabled={busy || !email || !password || !supabase} onClick={() => void authenticate('signIn')}>{ui.signIn}</button>
              <button type="button" disabled={busy || !email || !password || !supabase} onClick={() => void authenticate('signUp')}>{ui.signUp}</button>
              <button type="button" disabled={busy || !email || !supabase} onClick={() => void resetPassword()}>{ui.reset}</button>
            </div>
          </>
        )}
      </section>
      <section className="glass-card account-card muted privacy-onboarding-card">
        <div className="card-title">
          <Icon name="domain_disabled" />
          <span>{ui.firewall}</span>
        </div>
        <p>{ui.firewallBody}</p>
      </section>
      <section className="glass-card account-card entitlement-card">
        <div className="card-title">
          <Icon name="workspace_premium" />
          <span>{entitlementUi.title}</span>
        </div>
        <dl>
          <div>
            <dt>{entitlementUi.plan}</dt>
            <dd>{localizedEntitlementValue('plan', entitlement?.plan)}</dd>
          </div>
          <div>
            <dt>{entitlementUi.source}</dt>
            <dd>{localizedEntitlementValue('source', entitlement?.source)}</dd>
          </div>
        </dl>
        <p>{entitlement?.b2bFirewall ?? ui.firewallBody}</p>
        <small>{entitlementUi.aggregateOnly}</small>
        <input value={sponsorCode} placeholder={entitlementUi.sponsorCode} onChange={(event) => setSponsorCode(event.target.value)} disabled={busy} />
        <button type="button" disabled={busy || !sponsorCode.trim()} onClick={() => void applySponsor()}>{entitlementUi.applySponsor}</button>
      </section>
      <section className="glass-card account-card">
        <div className="card-title">
          <Icon name="pregnant_woman" />
          <span>{ui.profileTitle}</span>
        </div>
        <input value={profileDisplayName} placeholder={ui.displayName} onChange={(event) => setDisplayName(event.target.value)} />
        <label>
          <span>{ui.week}</span>
          <input type="number" min="1" max="42" value={pregnancyWeek} onChange={(event) => setPregnancyWeek(Number(event.target.value))} />
        </label>
        <label>
          <span>{ui.dueDate}</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        {dueDate && <p className="account-date-preview">{formatDualCalendarDate(dueDate, t.dir)}</p>}
        <label>
          <span>{ui.country}</span>
          <select value={country} onChange={(event) => setCountry(normalizeCountry(event.target.value))}>
            {GCC_COUNTRIES.map((code) => (
              <option key={code} value={code}>{countryCareConfig[code].names[t.dir === 'rtl' ? 'ar' : 'en']}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{ui.lmp}</span>
          <input type="date" value={lmpDate} onChange={(event) => setLmpDate(event.target.value)} />
        </label>
        <button type="button" disabled={busy || !lmpDate} onClick={applyDueDateCalculation}>{ui.calculateDue}</button>
        <button type="button" disabled={busy} onClick={() => void saveProfile()}>{ui.save}</button>
      </section>
      <section className="glass-card account-card muted">
        <strong>{ui.boundary}</strong>
        <p>{ui.boundaryBody}</p>
      </section>
    </div>
  )
}

function HomeScreen({ t, profile, onNavigate }: { t: (typeof content)[Lang]; profile: MotherProfile; onNavigate: (screen: Screen) => void }) {
  const daysUntilDue = calculateDaysUntilDue(profile.dueDate)
  const week = Math.max(1, Math.min(42, profile.pregnancyWeek || calculatePregnancyWeek(profile.dueDate)))
  const babySize = getSaudiBabySize(week)
  const dueDateLabel = formatDualCalendarDate(profile.dueDate, t.dir)
  const insight = t.dir === 'rtl'
    ? `أنت الآن في الأسبوع ${week}. بقي ${daysUntilDue} يوما تقريبا حتى موعد الولادة.`
    : `You are in week ${week}. About ${daysUntilDue} days remain until your due date.`
  const saudiUi = t.dir === 'rtl'
    ? {
        title: 'النمط السعودي',
        body: `موعد الولادة: ${dueDateLabel}. حجم طفلك قريب من ${babySize.ar}.`,
        action: 'فتح المزايا السعودية',
      }
    : {
        title: 'Saudi mode',
        body: `Due date: ${dueDateLabel}. Your baby is about ${babySize.en}.`,
        action: 'Open Saudi features',
      }

  return (
    <div className="home-screen">
      <section className="progress-hero">
        <div className="progress-ring" aria-label={`${t.home.weekLabel} ${week}`}>
          <div>
            <span>{t.home.weekLabel}</span>
            <strong>{week}</strong>
          </div>
        </div>
      </section>

      <section className="bento two">
        <article className="glass-card metric-card">
          <Icon name="hourglass_empty" />
          <strong>{daysUntilDue}</strong>
          <span>{t.home.daysLabel}</span>
        </article>
        <article className="glass-card insight-card">
          <div className="card-title">
            <Icon name="tips_and_updates" />
            <span>{t.home.insightTitle}</span>
          </div>
          <p>{insight}</p>
        </article>
      </section>

      <section className="tool-grid" aria-label={t.home.insightTitle}>
        {t.home.tools.map((tool) => (
          <button key={tool.label} type="button" className="tool-card glass-card" onClick={() => onNavigate(tool.target)}>
            <span className={`tool-icon ${tool.tone}`}>
              <Icon name={tool.icon} />
            </span>
            <span>{tool.label}</span>
          </button>
        ))}
      </section>

      <section className="glass-card saudi-feature-banner">
        <Icon name="mosque" />
        <span>
          <strong>{saudiUi.title}</strong>
          <small>{saudiUi.body}</small>
        </span>
        <button type="button" onClick={() => onNavigate('saudi')}>{saudiUi.action}</button>
      </section>

      <section className="action-banner glass-card">
        <div>
          <h2>{t.home.ctaTitle}</h2>
          <p>{t.home.cta}</p>
        </div>
        <button type="button" onClick={() => onNavigate('checkin')} aria-label={t.home.ctaAria}>
          <Icon name={t.dir === 'rtl' ? 'arrow_back' : 'arrow_forward'} />
        </button>
      </section>
    </div>
  )
}

function TimelineScreen({ t, profile }: { t: (typeof content)[Lang]; profile: MotherProfile }) {
  const week = Math.max(1, Math.min(42, profile.pregnancyWeek || calculatePregnancyWeek(profile.dueDate)))
  const items = [-2, -1, 0, 1, 2].map((offset) => Math.max(1, Math.min(42, week + offset)))
  const dueDateLabel = formatDualCalendarDate(profile.dueDate, t.dir)
  const weekLabel = t.dir === 'rtl' ? 'الأسبوع' : 'Week'
  const currentSize = t.dir === 'rtl'
    ? `تحديث الأسبوع ${week}: حركة الطفل ونموه يصبحان أوضح حسب مرحلة حملك.`
    : `Week ${week} update: baby movement and growth are becoming clearer for your stage.`
  return (
    <div className="timeline-screen">
      <div className="screen-heading">
        <span className="eyebrow">{t.timeline.eyebrow}</span>
        <h2>{t.timeline.title}</h2>
        <p>{t.timeline.intro}</p>
        <p className="care-country-chip">{t.dir === 'rtl' ? `موعد الولادة: ${dueDateLabel}` : `Due date: ${dueDateLabel}`}</p>
      </div>
      <div className="timeline-list">
        {items.map((itemWeek, index) => (
          <article key={itemWeek} className={`timeline-item ${index < 2 ? 'done' : index === 2 ? 'current' : 'future'}`}>
            <div className="timeline-node">{index < 2 ? <Icon name="check" filled /> : itemWeek}</div>
            <div className="glass-card timeline-card">
              <div className="timeline-topline">
                <span>{weekLabel} {itemWeek}</span>
                <strong>{getSaudiBabySize(itemWeek)[t.dir === 'rtl' ? 'ar' : 'en']}</strong>
              </div>
              {index === 2 && (
                <>
                  <div className="pomegranate" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h3>{currentSize}</h3>
                  <div className="baby-stats">
                    <span>{getSaudiBabySize(itemWeek).length}</span>
                    <span>{getSaudiBabySize(itemWeek).weight}</span>
                  </div>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function CheckInScreen({
  t,
  selectedMood,
  onSelectMood,
  onClose,
  onSave,
  onComplete,
  onRouteCare,
}: {
  t: (typeof content)[Lang]
  selectedMood: string
  onSelectMood: (mood: string) => void
  onClose: () => void
  onSave: () => void
  onComplete: (checkin: LatestCheckin) => void
  onRouteCare: () => void
}) {
  const [done, setDone] = useState(false)
  const [sleepQuality, setSleepQuality] = useState(3)
  const [symptomsText, setSymptomsText] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [latest, setLatest] = useState<LatestCheckin | null>(null)
  const [history, setHistory] = useState<LatestCheckin[]>([])
  const [trends, setTrends] = useState<CheckinTrends | null>(null)
  const [reminder, setReminder] = useState<ReminderPreference>({ dailyCheckinTime: '20:00', checkinReminders: true, quietHoursStart: '22:00', quietHoursEnd: '08:00' })
  const [saving, setSaving] = useState(false)
  const ui = t.dir === 'rtl'
    ? {
        symptoms: 'الأعراض',
        extraSymptoms: 'أعراض أخرى',
        privateNote: 'ملاحظة خاصة',
        notePlaceholder: 'أي شيء تريدين إخبار الطبيبة به؟',
        saving: 'جار الحفظ...',
        care: 'فتح مسار الرعاية',
        careVisible: 'توصية السلامة بعد الفحص',
        history: 'سجل الفحوصات',
        trends: 'اتجاه آخر 7 فحوصات',
        avgSleep: 'متوسط النوم',
        topMood: 'المزاج الأكثر تكرارا',
        watchCount: 'تنبيهات للمتابعة',
        reminderTitle: 'تذكير الفحص اليومي',
        reminderOn: 'مفعل',
        reminderOff: 'متوقف',
        reminderSaved: 'تم حفظ تذكير الفحص.',
        defaultSymptom: 'تعب خفيف',
        symptomChips: ['تعب خفيف', 'ألم ظهر', 'غثيان', 'صداع', 'تورم', 'قلة حركة', 'نزيف', 'قلق'],
      }
    : {
        symptoms: 'Symptoms',
        extraSymptoms: 'Other symptoms',
        privateNote: 'Private note',
        notePlaceholder: 'Anything to tell your clinician?',
        saving: 'Saving...',
        care: 'Open care navigator',
        careVisible: 'Safety recommendation after check-in',
        history: 'Check-in history',
        trends: 'Last 7 check-ins',
        avgSleep: 'Average sleep',
        topMood: 'Most common mood',
        watchCount: 'Watch flags',
        reminderTitle: 'Daily check-in reminder',
        reminderOn: 'On',
        reminderOff: 'Off',
        reminderSaved: 'Check-in reminder saved.',
        defaultSymptom: 'mild fatigue',
        symptomChips: ['mild fatigue', 'back pain', 'nausea', 'headache', 'swelling', 'reduced movement', 'bleeding', 'anxiety'],
      }

  useEffect(() => {
    setSymptomsText('')
    setSelectedSymptoms([ui.defaultSymptom])
    setNote('')
    setLatest(null)
    setDone(false)
  }, [t.dir])

  const loadCheckinHistory = async () => {
    const response = await fetch(`/api/checkins?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, { headers: getAuthHeaders() })
    const payload = (await response.json()) as { data?: { items?: LatestCheckin[]; trends?: CheckinTrends } }
    setHistory(payload.data?.items ?? [])
    setTrends(payload.data?.trends ?? null)
  }

  const loadReminder = async () => {
    const response = await fetch('/api/notifications', { headers: getAuthHeaders() })
    const payload = (await response.json()) as { data?: ReminderPreference }
    if (payload.data) setReminder(payload.data)
  }

  useEffect(() => {
    void loadCheckinHistory().catch(() => null)
    void loadReminder().catch(() => null)
  }, [t.dir])

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) => current.includes(symptom)
      ? current.filter((item) => item !== symptom)
      : [...current, symptom])
  }

  const saveReminder = async (next: ReminderPreference) => {
    setReminder(next)
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(next),
    }).catch(() => null)
    onSave()
  }

  const save = async () => {
    const customSymptoms = symptomsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const symptoms = Array.from(new Set([...selectedSymptoms, ...customSymptoms]))
    setSaving(true)
    try {
      const response = await fetch(`/api/checkins?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          mood: selectedMood,
          sleepQuality,
          symptoms,
          note,
        }),
      })
      const payload = (await response.json()) as {
        data?: {
          id?: string
          createdAt?: string
          assessment?: LatestCheckin['assessment']
          recommendations?: WellnessRecommendation[]
        }
      }
      void loadCheckinHistory().catch(() => null)
      const recommendationResponse = await fetch(`/api/recommendations?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          mood: selectedMood,
          sleepQuality,
          symptoms,
        }),
      }).catch(() => null)
      const recommendationPayload = recommendationResponse
        ? ((await recommendationResponse.json()) as { data?: { recommendations?: WellnessRecommendation[] } })
        : null
      const recommendations = recommendationPayload?.data?.recommendations ?? payload.data?.recommendations ?? []
      const checkin: LatestCheckin = {
        id: payload.data?.id,
        mood: selectedMood,
        sleepQuality,
        symptoms,
        note,
        assessment: payload.data?.assessment,
        recommendations,
        createdAt: payload.data?.createdAt,
      }
      setLatest(checkin)
      onComplete(checkin)
      setDone(true)
      onSave()
      if (checkin.assessment?.level && checkin.assessment.level !== 'normal') {
        window.setTimeout(onRouteCare, 900)
      }
    } catch {
      const checkin: LatestCheckin = { mood: selectedMood, sleepQuality, symptoms, note, recommendations: [] }
      setLatest(checkin)
      onComplete(checkin)
      setDone(true)
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="checkin-screen">
      <div className="flow-header">
        <button className="icon-button" type="button" aria-label={t.checkin.close} onClick={onClose}>
          <Icon name="close" />
        </button>
        <span>{t.checkin.label}</span>
        <div />
      </div>
      <div className="progress-line" aria-hidden="true">
        <span />
      </div>
      <p className="step-count">{t.checkin.step}</p>

      <section className="glass-card check-card">
        <h2>{done ? t.checkin.doneTitle : t.checkin.title}</h2>
        <p>{done ? t.checkin.doneBody : t.checkin.intro}</p>
        <div className="mood-row">
          {t.checkin.moods.map((mood, index) => (
            <button
              key={mood}
              type="button"
              className={`mood-option ${selectedMood === mood ? 'selected' : ''}`}
              onClick={() => onSelectMood(mood)}
            >
              <span>
                <Icon name={['sentiment_very_satisfied', 'sentiment_satisfied', 'sentiment_content', 'sentiment_neutral', 'sentiment_dissatisfied', 'sick', 'mood_bad'][index]} filled={selectedMood === mood} />
              </span>
              {mood}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card mini-form">
        <label htmlFor="sleep">{t.checkin.sleep}</label>
        <input id="sleep" type="range" min="1" max="5" value={sleepQuality} onChange={(event) => setSleepQuality(Number(event.target.value))} />
        <div className="range-labels">
          <span>{t.checkin.low}</span>
          <span>{t.checkin.high}</span>
        </div>
      </section>

      <section className="glass-card log-form">
        <label>{ui.symptoms}</label>
        <div className="symptom-chip-grid">
          {ui.symptomChips.map((symptom) => (
            <button key={symptom} type="button" className={selectedSymptoms.includes(symptom) ? 'selected' : ''} onClick={() => toggleSymptom(symptom)}>
              {symptom}
            </button>
          ))}
        </div>
        <label>{ui.extraSymptoms}</label>
        <input value={symptomsText} onChange={(event) => setSymptomsText(event.target.value)} />
        <label>{ui.privateNote}</label>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={ui.notePlaceholder} />
      </section>

      {latest?.assessment && (
        <section className={`glass-card os-result ${latest.assessment.level}`}>
          <div className="card-title">
            <Icon name={latest.assessment.level === 'urgent' ? 'emergency_home' : 'health_and_safety'} />
            <span>{ui.careVisible}: {latest.assessment.level}</span>
          </div>
          <p>{latest.assessment.message}</p>
          <ul className="os-highlights">
            {latest.assessment.nextActions.map((action) => (
              <li key={action}><Icon name="check_circle" filled /><span>{action}</span></li>
            ))}
          </ul>
          {latest.assessment.level !== 'normal' && (
            <button className="primary-button" type="button" onClick={onRouteCare}>
              {ui.care}
              <Icon name="local_hospital" />
            </button>
          )}
        </section>
      )}

      <section className="glass-card reminder-card">
        <div className="card-title">
          <Icon name="notifications_active" />
          <span>{ui.reminderTitle}</span>
        </div>
        <label>
          <span>{reminder.checkinReminders ? ui.reminderOn : ui.reminderOff}</span>
          <input type="checkbox" checked={reminder.checkinReminders} onChange={(event) => void saveReminder({ ...reminder, checkinReminders: event.target.checked })} />
        </label>
        <input type="time" value={reminder.dailyCheckinTime} onChange={(event) => void saveReminder({ ...reminder, dailyCheckinTime: event.target.value })} />
      </section>

      {trends && (
        <section className="glass-card checkin-trends">
          <div className="card-title"><Icon name="monitoring" /><span>{ui.trends}</span></div>
          <div>
            <span>{ui.avgSleep}</span>
            <strong>{trends.sleepAverage}/5</strong>
          </div>
          <div>
            <span>{ui.topMood}</span>
            <strong>{trends.topMood || '-'}</strong>
          </div>
          <div>
            <span>{ui.watchCount}</span>
            <strong>{trends.watchOrUrgentCount}</strong>
          </div>
        </section>
      )}

      <section className="glass-card log-history">
        <div className="card-title"><Icon name="history" /><span>{ui.history}</span></div>
        {history.length === 0 ? <p>{t.dir === 'rtl' ? 'لا توجد فحوصات محفوظة بعد.' : 'No saved check-ins yet.'}</p> : history.slice(0, 8).map((item) => (
          <article key={item.id ?? item.createdAt}>
            <span>{formatLogDate(item.createdAt, t.dir)}</span>
            <strong>{item.mood} · {item.sleepQuality}/5</strong>
            <small>{item.symptoms.join(', ') || '-'}</small>
            {item.assessment && <small>{item.assessment.level}</small>}
          </article>
        ))}
      </section>

      {latest && latest.recommendations.length > 0 && (
        <section className="glass-card tracker-list">
          {latest.recommendations.map((recommendation) => (
            <div key={`${recommendation.kind}-${recommendation.trigger}`}>
              <span>{recommendation.title}</span>
              <strong>{recommendation.priority}</strong>
            </div>
          ))}
        </section>
      )}

      <button className="primary-button" type="button" onClick={() => void save()} disabled={saving}>
        {saving ? ui.saving : t.checkin.next}
        <Icon name="arrow_back" />
      </button>
    </div>
  )
}

function CompanionScreen({
  t,
  onNavigate,
  onNotice,
  latestCheckin,
  aiContextEnabled,
}: {
  t: (typeof content)[Lang]
  onNavigate: (screen: Screen, options?: { reviewedContentId?: string }) => void
  onNotice: (message: string) => void
  latestCheckin: LatestCheckin | null
  aiContextEnabled: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'ai', text: t.companion.answer }])
  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [privateSummary, setPrivateSummary] = useState('')
  const ui = t.dir === 'rtl'
    ? {
        usedContext: 'استخدمت رفقة فحصك الأخير بشكل خاص.',
        privateTitle: 'ملخص رفقة الخاص',
        privateEmpty: 'لا يوجد ملخص خاص بعد. أنت تتحكمين في استخدام سياق الفحص.',
        contextOff: 'استخدام سياق الفحص متوقف من مركز الخصوصية.',
        privacyIndicatorTitle: aiContextEnabled ? 'سياق الفحص مفعل' : 'سياق الفحص متوقف',
        privacyIndicatorBody: aiContextEnabled
          ? latestCheckin
            ? 'ستستخدم رفقة فحصك الأخير بشكل خاص في الرد القادم.'
            : 'الإعداد مفعل، لكن لا يوجد فحص يومي محفوظ بعد.'
          : 'الرد القادم سيستخدم رسالتك فقط.',
        privacyIndicatorAction: 'إعدادات الخصوصية',
        deleteChat: 'حذف المحادثة',
        deleteDone: 'تم حذف المحادثة من الحساب.',
        promptVersion: 'إصدار التعليمات',
        crisisMode: 'وضع الأمان للأزمة مفعل',
        summaryContext: 'استخدمت آخر محادثة فحصك الأخير',
        summaryMessageOnly: 'استخدمت آخر محادثة رسالتك فقط',
        safety: 'مستوى السلامة',
        sourcesTitle: 'مصادر الرد',
        sourceIcons: {
          reviewed_content: 'verified',
          safety_rules: 'health_and_safety',
          general_guidance: 'chat_bubble',
          private_checkin: 'lock',
        } as Record<string, string>,
        levels: { normal: 'طبيعي', watch: 'انتباه', urgent: 'عاجل' } as Record<string, string>,
      }
    : {
        usedContext: 'Used your latest check-in privately.',
        privateTitle: 'Private AI summary',
        privateEmpty: 'No private summary yet. You control whether check-in context is used.',
        contextOff: 'Check-in context is off in Privacy Center.',
        privacyIndicatorTitle: aiContextEnabled ? 'Check-in context on' : 'Check-in context off',
        privacyIndicatorBody: aiContextEnabled
          ? latestCheckin
            ? 'RIFQA will privately use your latest check-in in the next reply.'
            : 'The setting is on, but no daily check-in is saved yet.'
          : 'The next reply will use only your message.',
        privacyIndicatorAction: 'Privacy settings',
        deleteChat: 'Delete chat',
        deleteDone: 'Chat deleted from your account.',
        promptVersion: 'Prompt version',
        crisisMode: 'Crisis-safe mode active',
        summaryContext: 'Last AI turn used your latest check-in context',
        summaryMessageOnly: 'Last AI turn used only this message',
        safety: 'safety level',
        sourcesTitle: 'Reply sources',
        sourceIcons: {
          reviewed_content: 'verified',
          safety_rules: 'health_and_safety',
          general_guidance: 'chat_bubble',
          private_checkin: 'lock',
        } as Record<string, string>,
        levels: { normal: 'normal', watch: 'watch', urgent: 'urgent' } as Record<string, string>,
      }

  useEffect(() => {
    setMessages([{ role: 'ai', text: t.companion.answer }])
    setDraft('')
    setPrivateSummary('')
    window.speechSynthesis.cancel()
  }, [t.dir])

  const levelLabel = (level?: string) => ui.levels[level ?? 'normal'] ?? level ?? ui.levels.normal

  const speak = (text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = t.dir === 'rtl' ? 'ar-SA' : 'en-US'
    utterance.rate = 0.94
    window.speechSynthesis.speak(utterance)
  }

  const sendMessage = async (message: string, shouldSpeak = false) => {
    setMessages((current) => [...current, { role: 'user', text: message }])
    setIsThinking(true)
    try {
      const response = await fetch(`/api/companion?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          message,
          context: {
            pregnancyWeek: 28,
            latestCheckin: aiContextEnabled ? latestCheckin : null,
            recentLogs: [],
          },
        }),
      })
      const payload = (await response.json()) as {
        data?: {
          reply?: string
          assessment?: ChatMessage['assessment']
          careRoute?: ChatMessage['careRoute']
          contextUsed?: boolean
          contextSources?: ChatMessage['contextSources']
          promptVersion?: string
          safetyMode?: string
          crisisSafeMode?: boolean
        }
      }
      const reply = payload.data?.reply || t.companion.answer
      setMessages((current) => [
        ...current,
        {
          role: 'ai',
          text: reply,
          assessment: payload.data?.assessment,
          careRoute: payload.data?.careRoute,
          contextUsed: payload.data?.contextUsed,
          contextSources: payload.data?.contextSources,
          promptVersion: payload.data?.promptVersion,
          safetyMode: payload.data?.safetyMode,
          crisisSafeMode: payload.data?.crisisSafeMode,
        },
      ])
      if ((aiContextEnabled && latestCheckin) || payload.data?.assessment) {
        setPrivateSummary(`${payload.data?.contextUsed ? ui.summaryContext : ui.summaryMessageOnly}; ${ui.safety} ${levelLabel(payload.data?.assessment?.level)}.`)
      }
      if (shouldSpeak) speak(reply)
    } catch {
      setMessages((current) => [...current, { role: 'ai', text: t.companion.answer }])
      if (shouldSpeak) speak(t.companion.answer)
    } finally {
      setIsThinking(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message) {
      onNotice(t.companion.empty)
      return
    }
    setDraft('')
    void sendMessage(message)
  }

  const quickReply = (reply: string) => {
    if (reply === t.companion.replies[0]) onNavigate('kicks')
    else if (reply === t.companion.replies[1]) onNavigate('journal')
    else onNavigate('support')
  }

  const deleteChat = async () => {
    await fetch('/api/chat', { method: 'DELETE', headers: getAuthHeaders() }).catch(() => null)
    setPrivateSummary('')
    setMessages([{ role: 'ai', text: t.companion.answer }])
    onNotice(ui.deleteDone)
  }

  const startVoiceConversation = () => {
    const speechWindow = window as SpeechWindow
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) {
      onNotice(t.companion.voiceUnsupported)
      return
    }

    const recognition = new Recognition()
    recognition.lang = t.dir === 'rtl' ? 'ar-SA' : 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onstart = () => {
      setIsListening(true)
      onNotice(t.companion.listening)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      onNotice(t.companion.voiceUnsupported)
    }
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()
      if (!transcript) {
        onNotice(t.companion.empty)
        return
      }
      setDraft('')
      onNotice(t.companion.voiceReady)
      void sendMessage(transcript, true)
    }
    recognition.start()
  }

  return (
    <div className="companion-screen">
      <div className="screen-heading">
        <span className="eyebrow">{t.companion.eyebrow}</span>
        <h2>{t.companion.title}</h2>
      </div>
      <div className="chat-thread">
        <article className="bubble ai">
          <strong>{t.companion.aiName}</strong>
          <p>{t.companion.opening}</p>
        </article>
        {messages.map((message, index) => (
          <article key={`${message.text}-${index}`} className={`bubble ${message.role}`}>
            {message.role === 'ai' && <strong>{t.companion.aiName}</strong>}
            <p>{message.text}</p>
            {message.role === 'ai' && (
              <>
                <button className="speak-button" type="button" onClick={() => speak(message.text)}>
                  <Icon name="volume_up" />
                  {t.companion.speakReply}
                </button>
                {message.assessment && (
                  <div className={`ai-meta ${message.assessment.level}`}>
                    <Icon name="health_and_safety" />
                    <span>{levelLabel(message.assessment.level)}</span>
                  </div>
                )}
                {message.crisisSafeMode && (
                  <div className="ai-meta urgent">
                    <Icon name="shield" />
                    <span>{ui.crisisMode}</span>
                  </div>
                )}
                {message.promptVersion && (
                  <p className="context-note">{ui.promptVersion}: {message.promptVersion}</p>
                )}
                {message.careRoute && message.careRoute.level !== 'normal' && (
                  <button className="speak-button" type="button" onClick={() => onNavigate('care')}>
                    <Icon name="local_hospital" />
                    {message.careRoute.title}
                  </button>
                )}
                {message.contextUsed && <p className="context-note">{ui.usedContext}</p>}
                {message.contextSources && message.contextSources.length > 0 && (
                  <details className="reply-sources">
                    <summary>
                      <Icon name="fact_check" />
                      {ui.sourcesTitle}
                    </summary>
                    <div>
                      {message.contextSources.map((source) => (
                        <button
                          key={`${source.kind}-${source.label}`}
                          type="button"
                          title={source.detail}
                          onClick={() => {
                            if (source.kind === 'reviewed_content') onNavigate('library', { reviewedContentId: source.contentId })
                          }}
                        >
                          <Icon name={ui.sourceIcons[source.kind] ?? 'info'} filled={source.kind === 'reviewed_content'} />
                          <strong>{source.label}</strong>
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </article>
        ))}
        {isThinking && (
          <article className="bubble ai">
            <strong>{t.companion.aiName}</strong>
            <p>{t.companion.aiThinking}</p>
          </article>
        )}
      </div>
      <div className="quick-replies">
        {t.companion.replies.map((reply) => (
          <button key={reply} type="button" onClick={() => quickReply(reply)}>
            {reply}
          </button>
        ))}
      </div>
      <button className={`privacy-context-indicator ${aiContextEnabled ? 'on' : 'off'}`} type="button" onClick={() => onNavigate('privacy')}>
        <Icon name={aiContextEnabled ? 'lock_open' : 'lock'} />
        <span>
          <strong>{ui.privacyIndicatorTitle}</strong>
          <small>{ui.privacyIndicatorBody}</small>
        </span>
        <em>{ui.privacyIndicatorAction}</em>
      </button>
      <form className="chat-input" onSubmit={submit}>
        <button
          type="button"
          aria-label={isListening ? t.companion.listening : t.companion.voice}
          onClick={startVoiceConversation}
          className={isListening ? 'listening' : ''}
        >
          <Icon name={isListening ? 'graphic_eq' : 'mic'} />
        </button>
        <input type="text" placeholder={t.companion.input} value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button type="submit" aria-label={t.companion.send}>
          <Icon name="send" />
        </button>
      </form>
      <button className="stop-voice-button" type="button" onClick={() => window.speechSynthesis.cancel()}>
        <Icon name="volume_off" />
        {t.companion.stopVoice}
      </button>
      <section className="glass-card ai-private-panel">
        <div>
          <strong>{ui.privateTitle}</strong>
          <p>{privateSummary || ui.privateEmpty}</p>
          {!aiContextEnabled && <p>{ui.contextOff}</p>}
        </div>
        <button type="button" onClick={() => void deleteChat()}>
          <Icon name="delete" />
          {ui.deleteChat}
        </button>
      </section>
    </div>
  )
}

function SupportScreen({ t, onNotice }: { t: (typeof content)[Lang]; onNotice: (message: string) => void }) {
  return (
    <div className="support-screen">
      <div className="screen-heading teal">
        <span className="eyebrow">{t.support.eyebrow}</span>
        <h2>{t.support.title}</h2>
        <p>{t.support.intro}</p>
      </div>
      <section className="safe-mode glass-card">
        <div className="breathing-circle" aria-hidden="true" />
        <h3>{t.support.safeTitle}</h3>
        <p>{t.support.safeText}</p>
        <div className="support-actions">
          <button type="button" onClick={() => onNotice(t.support.trustedDone)}>{t.support.callTrusted}</button>
          <button type="button" onClick={() => onNotice(t.support.urgentDone)}>{t.support.urgent}</button>
        </div>
      </section>
      <section className="glass-card pathway-card">
        <div className="card-title">
          <Icon name="local_hospital" />
          <span>{t.support.pathwayTitle}</span>
        </div>
        <ul>
          {t.support.pathway.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </div>
  )
}

function KickCounterScreen({ t, onNotice }: { t: (typeof content)[Lang]; onNotice: (message: string) => void }) {
  const restored = readStoredJson<KickDraft>(KICK_DRAFT_KEY, { startedAt: null, kickTimes: [] })
  const [startedAt, setStartedAt] = useState<number | null>(restored.startedAt)
  const [kickTimes, setKickTimes] = useState<number[]>(restored.kickTimes)
  const [history, setHistory] = useState<KickSessionLog[]>([])
  const [now, setNow] = useState(Date.now())
  const elapsedSeconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0
  const ui = t.dir === 'rtl'
    ? {
        started: 'بدأت جلسة عد الركلات. تابعي النمط المعتاد بهدوء.',
        kicks: 'ركلات',
        goalReached: 'اكتمل الهدف',
        toTen: (count: number) => `${count} حتى 10`,
        restart: 'إعادة الجلسة',
        start: 'بدء الجلسة',
        add: 'إضافة ركلة',
        save: 'إنهاء وحفظ',
        history: 'السجل',
        edit: 'تعديل',
        delete: 'حذف',
        countPrompt: 'عدد الركلات',
        minutesPrompt: 'المدة بالدقائق',
        safety: 'إذا كانت الحركة أقل بوضوح من المعتاد بعد العد، تواصلي مع طبيبتك أو الطوارئ.',
      }
    : {
        started: 'Kick session started. Watch the usual pattern calmly.',
        kicks: 'kicks',
        goalReached: 'Goal reached',
        toTen: (count: number) => `${count} to 10`,
        restart: 'Restart session',
        start: 'Start session',
        add: 'Add kick',
        save: 'End and save',
        history: 'History',
        edit: 'Edit',
        delete: 'Delete',
        countPrompt: 'Kick count',
        minutesPrompt: 'Duration in minutes',
        safety: 'If movement is clearly lower than usual after a focused count, contact your clinician or emergency care.',
      }

  const loadHistory = async () => {
    const response = await fetch(`/api/kick-sessions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, { headers: getAuthHeaders() })
    const payload = (await response.json()) as { data?: KickSessionLog[] }
    setHistory(payload.data ?? [])
  }

  useEffect(() => {
    void loadHistory().catch(() => null)
  }, [t.dir])

  useEffect(() => {
    if (!startedAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  useEffect(() => {
    if (startedAt || kickTimes.length > 0) writeStoredJson<KickDraft>(KICK_DRAFT_KEY, { startedAt, kickTimes })
    else clearStoredJson(KICK_DRAFT_KEY)
  }, [startedAt, kickTimes])

  const start = () => {
    setStartedAt(Date.now())
    setNow(Date.now())
    setKickTimes([])
    onNotice(ui.started)
  }

  const addKick = () => {
    if (!startedAt) {
      const timestamp = Date.now()
      setStartedAt(timestamp)
      setNow(timestamp)
      onNotice(ui.started)
    }
    setKickTimes((current) => [...current, Date.now()])
  }

  const save = async () => {
    const duration = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : 0
    try {
      const response = await fetch(`/api/kick-sessions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ count: kickTimes.length, minutes: duration }),
      })
      const payload = (await response.json()) as { data?: { guidance?: string } }
      void loadHistory().catch(() => null)
      onNotice(payload.data?.guidance ?? t.saved)
      setStartedAt(null)
      setKickTimes([])
      clearStoredJson(KICK_DRAFT_KEY)
    } catch {
      onNotice(t.saved)
    }
  }

  const editLog = async (log: KickSessionLog) => {
    const count = Number(window.prompt(ui.countPrompt, String(log.count)))
    if (!Number.isFinite(count)) return
    const minutes = Number(window.prompt(ui.minutesPrompt, String(log.minutes)))
    if (!Number.isFinite(minutes)) return
    const response = await fetch(`/api/kick-sessions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id: log.id, count, minutes }),
    })
    const payload = (await response.json()) as { data?: KickSessionLog }
    setHistory((current) => current.map((item) => item.id === log.id ? { ...item, ...payload.data } : item))
    onNotice(payload.data?.guidance ?? t.saved)
  }

  const deleteLog = async (id: string) => {
    await fetch(`/api/kick-sessions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id }),
    })
    setHistory((current) => current.filter((item) => item.id !== id))
    onNotice(t.saved)
  }

  return (
    <div className="tracker-screen">
      <div className="screen-heading">
        <span className="eyebrow">{t.utility.kicksTitle}</span>
        <h2>{t.utility.kicksTitle}</h2>
        <p>{t.utility.kicksBody}</p>
      </div>
      <section className="glass-card tracker-hero">
        <Icon name="touch_app" />
        <strong>{kickTimes.length}</strong>
        <span>{ui.kicks}</span>
        <div className="tracker-stats">
          <span>{formatElapsed(elapsedSeconds)}</span>
          <span>{kickTimes.length >= 10 ? ui.goalReached : ui.toTen(Math.max(0, 10 - kickTimes.length))}</span>
        </div>
      </section>
      <div className="tracker-actions">
        <button type="button" onClick={start}>{startedAt ? ui.restart : ui.start}</button>
        <button type="button" onClick={addKick}>{ui.add}</button>
        <button type="button" onClick={() => void save()} disabled={kickTimes.length === 0}>{ui.save}</button>
      </div>
      <section className="glass-card tracker-note">
        <Icon name="health_and_safety" />
        <p>{ui.safety}</p>
      </section>
      <section className="glass-card log-history">
        <div className="card-title"><Icon name="history" /><span>{ui.history}</span></div>
        {history.length === 0 ? <p>{t.dir === 'rtl' ? 'لا توجد جلسات بعد.' : 'No sessions yet.'}</p> : history.map((item) => (
          <article key={item.id}>
            <span>{formatLogDate(item.createdAt, t.dir)}</span>
            <strong>{item.count} {ui.kicks} · {item.minutes} min</strong>
            <small>{item.level}</small>
            <div>
              <button type="button" onClick={() => void editLog(item)}>{ui.edit}</button>
              <button type="button" onClick={() => void deleteLog(item.id)}>{ui.delete}</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function ContractionTimerScreen({ t, onNotice }: { t: (typeof content)[Lang]; onNotice: (message: string) => void }) {
  const restored = readStoredJson<ContractionDraft>(CONTRACTION_DRAFT_KEY, { activeStart: null, events: [] })
  const [activeStart, setActiveStart] = useState<number | null>(restored.activeStart)
  const [events, setEvents] = useState<ContractionEvent[]>(restored.events)
  const [history, setHistory] = useState<ContractionSessionLog[]>([])
  const [now, setNow] = useState(Date.now())
  const durations = events.map((event) => Math.round((event.endedAt - event.startedAt) / 1000))
  const avgDuration = durations.length ? Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length) : 0
  const frequencies = events.slice(1).map((event, index) => Math.max(1, Math.round((event.startedAt - events[index].startedAt) / 60000)))
  const avgFrequency = frequencies.length ? Math.round(frequencies.reduce((sum, item) => sum + item, 0) / frequencies.length) : 0
  const activeElapsedSeconds = activeStart ? Math.max(0, Math.floor((now - activeStart) / 1000)) : 0
  const ui = t.dir === 'rtl'
    ? {
        contractions: 'تقلصات',
        avg: (seconds: number) => `متوسط ${seconds || 0} ث`,
        apart: (minutes: number) => minutes ? `كل ${minutes} د` : '-',
        stop: 'إيقاف التقلص',
        start: 'بدء تقلص',
        reset: 'إعادة',
        save: 'حفظ الجلسة',
        empty: 'لا توجد تقلصات مسجلة بعد.',
        history: 'السجل',
        edit: 'تعديل',
        delete: 'حذف',
        countPrompt: 'عدد التقلصات',
        frequencyPrompt: 'متوسط التكرار بالدقائق',
        durationPrompt: 'متوسط المدة بالثواني',
      }
    : {
        contractions: 'contractions',
        avg: (seconds: number) => `${seconds || 0}s avg`,
        apart: (minutes: number) => minutes ? `${minutes} min apart` : '-',
        stop: 'Stop contraction',
        start: 'Start contraction',
        reset: 'Reset',
        save: 'Save session',
        empty: 'No contractions recorded yet.',
        history: 'History',
        edit: 'Edit',
        delete: 'Delete',
        countPrompt: 'Contraction count',
        frequencyPrompt: 'Average minutes apart',
        durationPrompt: 'Average duration seconds',
      }

  const loadHistory = async () => {
    const response = await fetch(`/api/contractions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, { headers: getAuthHeaders() })
    const payload = (await response.json()) as { data?: ContractionSessionLog[] }
    setHistory(payload.data ?? [])
  }

  useEffect(() => {
    void loadHistory().catch(() => null)
  }, [t.dir])

  useEffect(() => {
    if (!activeStart) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [activeStart])

  useEffect(() => {
    if (activeStart || events.length > 0) writeStoredJson<ContractionDraft>(CONTRACTION_DRAFT_KEY, { activeStart, events })
    else clearStoredJson(CONTRACTION_DRAFT_KEY)
  }, [activeStart, events])

  const toggle = () => {
    if (activeStart) {
      const endedAt = Date.now()
      setEvents((current) => [...current, { startedAt: activeStart, endedAt }])
      setActiveStart(null)
      setNow(endedAt)
    } else {
      const started = Date.now()
      setActiveStart(started)
      setNow(started)
    }
  }

  const save = async () => {
    try {
      const response = await fetch(`/api/contractions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          sessionCount: events.length,
          averageFrequencyMinutes: avgFrequency,
          averageDurationSeconds: avgDuration,
        }),
      })
      const payload = (await response.json()) as { data?: { guidance?: string } }
      void loadHistory().catch(() => null)
      onNotice(payload.data?.guidance ?? t.saved)
      setEvents([])
      setActiveStart(null)
      clearStoredJson(CONTRACTION_DRAFT_KEY)
    } catch {
      onNotice(t.saved)
    }
  }

  const editLog = async (log: ContractionSessionLog) => {
    const sessionCount = Number(window.prompt(ui.countPrompt, String(log.sessionCount)))
    if (!Number.isFinite(sessionCount)) return
    const averageFrequencyMinutes = Number(window.prompt(ui.frequencyPrompt, String(log.averageFrequencyMinutes)))
    if (!Number.isFinite(averageFrequencyMinutes)) return
    const averageDurationSeconds = Number(window.prompt(ui.durationPrompt, String(log.averageDurationSeconds)))
    if (!Number.isFinite(averageDurationSeconds)) return
    const response = await fetch(`/api/contractions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id: log.id, sessionCount, averageFrequencyMinutes, averageDurationSeconds }),
    })
    const payload = (await response.json()) as { data?: ContractionSessionLog }
    setHistory((current) => current.map((item) => item.id === log.id ? { ...item, ...payload.data } : item))
    onNotice(payload.data?.guidance ?? t.saved)
  }

  const deleteLog = async (id: string) => {
    await fetch(`/api/contractions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id }),
    })
    setHistory((current) => current.filter((item) => item.id !== id))
    onNotice(t.saved)
  }

  return (
    <div className="tracker-screen">
      <div className="screen-heading">
        <span className="eyebrow">{t.utility.contractionsTitle}</span>
        <h2>{t.utility.contractionsTitle}</h2>
        <p>{t.utility.contractionsBody}</p>
      </div>
      <section className={`glass-card tracker-hero ${activeStart ? 'active' : ''}`}>
        <Icon name="timer" />
        <strong>{events.length}</strong>
        <span>{ui.contractions}</span>
        <div className="tracker-stats">
          <span>{activeStart ? formatElapsed(activeElapsedSeconds) : ui.avg(avgDuration)}</span>
          <span>{ui.apart(avgFrequency)}</span>
        </div>
      </section>
      <div className="tracker-actions">
        <button type="button" onClick={toggle}>{activeStart ? ui.stop : ui.start}</button>
        <button type="button" onClick={() => { setEvents([]); setActiveStart(null); clearStoredJson(CONTRACTION_DRAFT_KEY) }}>{ui.reset}</button>
        <button type="button" onClick={() => void save()} disabled={events.length === 0 || Boolean(activeStart)}>{ui.save}</button>
      </div>
      <section className="glass-card tracker-list">
        {events.length === 0 ? <p>{ui.empty}</p> : events.slice(-4).map((event, index) => (
          <div key={`${event.startedAt}-${index}`}>
            <span>#{events.length - Math.min(3, events.length - 1) + index}</span>
            <strong>{Math.round((event.endedAt - event.startedAt) / 1000)}s</strong>
          </div>
        ))}
      </section>
      <section className="glass-card log-history">
        <div className="card-title"><Icon name="history" /><span>{ui.history}</span></div>
        {history.length === 0 ? <p>{ui.empty}</p> : history.map((item) => (
          <article key={item.id}>
            <span>{formatLogDate(item.createdAt, t.dir)}</span>
            <strong>{item.sessionCount} {ui.contractions} · {item.averageDurationSeconds}s</strong>
            <small>{ui.apart(item.averageFrequencyMinutes)} · {item.level}</small>
            <div>
              <button type="button" onClick={() => void editLog(item)}>{ui.edit}</button>
              <button type="button" onClick={() => void deleteLog(item.id)}>{ui.delete}</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function WeightSymptomsScreen({ t, onNotice, latestCheckin }: { t: (typeof content)[Lang]; onNotice: (message: string) => void; latestCheckin: LatestCheckin | null }) {
  const [weightKg, setWeightKg] = useState('72.4')
  const [weightNote, setWeightNote] = useState(t.dir === 'rtl' ? 'قراءة زيارة الطبيبة' : 'OB visit reading')
  const [symptom, setSymptom] = useState(t.dir === 'rtl' ? 'انزعاج في الظهر' : 'back discomfort')
  const [severity, setSeverity] = useState(3)
  const [symptomNote, setSymptomNote] = useState(t.dir === 'rtl' ? 'يزداد بعد الوقوف' : 'Worse after standing')
  const [summary, setSummary] = useState('')
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([])
  const [symptomHistory, setSymptomHistory] = useState<SymptomLog[]>([])
  const ui = t.dir === 'rtl'
    ? {
        weightKg: 'الوزن بالكيلوجرام',
        weightNote: 'ملاحظة الوزن',
        symptom: 'العرض',
        severity: 'الشدة',
        symptomNote: 'ملاحظة العرض',
        saveWeight: 'حفظ الوزن',
        saveSymptom: 'حفظ العرض',
        prepare: 'تحضير ملخص الزيارة',
        history: 'السجل',
        edit: 'تعديل',
        delete: 'حذف',
        valuePrompt: 'القيمة',
        notePrompt: 'الملاحظة',
        weightSaved: (value: number) => `تم حفظ الوزن: ${value} كجم`,
        symptomSaved: (name: string, value?: number) => `تم حفظ العرض: ${name} (${value}/5)`,
        summaryReady: 'تم تحضير ملخص الزيارة.',
        weightDefault: 'قراءة زيارة الطبيبة',
        symptomDefault: 'انزعاج في الظهر',
        symptomNoteDefault: 'يزداد بعد الوقوف',
        noSymptoms: 'لا توجد',
        noNote: 'لا توجد',
        notAssessed: 'غير مقيم',
        buildCheckinNotes: (checkin: LatestCheckin) =>
          ` آخر فحص: المزاج ${checkin.mood}، النوم ${checkin.sleepQuality}/5، الأعراض ${checkin.symptoms.join('، ') || 'لا توجد'}، الملاحظة ${checkin.note || 'لا توجد'}، مستوى السلامة ${checkin.assessment?.level ?? 'غير مقيم'}.`,
        buildVisitNotes: (checkinNotes: string) =>
          `الوزن: ${weightKg} كجم (${weightNote}). العرض: ${symptom}، الشدة ${severity}/5. الملاحظة: ${symptomNote}.${checkinNotes}`,
      }
    : {
        weightKg: 'Weight kg',
        weightNote: 'Weight note',
        symptom: 'Symptom',
        severity: 'Severity',
        symptomNote: 'Symptom note',
        saveWeight: 'Save weight',
        saveSymptom: 'Save symptom',
        prepare: 'Prepare visit summary',
        history: 'History',
        edit: 'Edit',
        delete: 'Delete',
        valuePrompt: 'Value',
        notePrompt: 'Note',
        weightSaved: (value: number) => `Weight saved: ${value} kg`,
        symptomSaved: (name: string, value?: number) => `Symptom saved: ${name} (${value}/5)`,
        summaryReady: 'Visit summary prepared.',
        weightDefault: 'OB visit reading',
        symptomDefault: 'back discomfort',
        symptomNoteDefault: 'Worse after standing',
        noSymptoms: 'none',
        noNote: 'none',
        notAssessed: 'not assessed',
        buildCheckinNotes: (checkin: LatestCheckin) =>
          ` Latest check-in: mood ${checkin.mood}, sleep ${checkin.sleepQuality}/5, symptoms ${checkin.symptoms.join(', ') || 'none'}, note ${checkin.note || 'none'}, safety ${checkin.assessment?.level ?? 'not assessed'}.`,
        buildVisitNotes: (checkinNotes: string) =>
          `Weight: ${weightKg} kg (${weightNote}). Symptom: ${symptom}, severity ${severity}/5. Note: ${symptomNote}.${checkinNotes}`,
      }

  useEffect(() => {
    setWeightNote(ui.weightDefault)
    setSymptom(ui.symptomDefault)
    setSymptomNote(ui.symptomNoteDefault)
    setSummary('')
  }, [t.dir])

  const loadHistory = async () => {
    const [weightsResponse, symptomsResponse] = await Promise.all([
      fetch('/api/weight-logs', { headers: getAuthHeaders() }),
      fetch('/api/symptoms', { headers: getAuthHeaders() }),
    ])
    const weights = (await weightsResponse.json()) as { data?: WeightLog[] }
    const symptoms = (await symptomsResponse.json()) as { data?: SymptomLog[] }
    setWeightHistory(weights.data ?? [])
    setSymptomHistory(symptoms.data ?? [])
  }

  useEffect(() => {
    void loadHistory().catch(() => null)
  }, [t.dir])

  const saveWeight = async () => {
    try {
      const response = await fetch('/api/weight-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ weightKg: Number(weightKg), note: weightNote }),
      })
      const result = (await response.json()) as { data?: { weightKg?: number } }
      void loadHistory().catch(() => null)
      onNotice(result.data?.weightKg ? ui.weightSaved(result.data.weightKg) : t.saved)
    } catch {
      onNotice(t.saved)
    }
  }

  const saveSymptom = async () => {
    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ symptom, severity, note: symptomNote }),
      })
      const result = (await response.json()) as { data?: { symptom?: string; severity?: number } }
      void loadHistory().catch(() => null)
      onNotice(result.data?.symptom ? ui.symptomSaved(result.data.symptom, result.data.severity) : t.saved)
    } catch {
      onNotice(t.saved)
    }
  }

  const editWeight = async (log: WeightLog) => {
    const nextWeight = Number(window.prompt(ui.valuePrompt, String(log.weightKg)))
    if (!Number.isFinite(nextWeight)) return
    const nextNote = window.prompt(ui.notePrompt, log.note) ?? log.note
    const response = await fetch('/api/weight-logs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id: log.id, weightKg: nextWeight, note: nextNote }),
    })
    const payload = (await response.json()) as { data?: WeightLog }
    setWeightHistory((current) => current.map((item) => item.id === log.id ? { ...item, ...payload.data } : item))
    onNotice(t.saved)
  }

  const deleteWeight = async (id: string) => {
    await fetch('/api/weight-logs', { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ id }) })
    setWeightHistory((current) => current.filter((item) => item.id !== id))
    onNotice(t.saved)
  }

  const editSymptom = async (log: SymptomLog) => {
    const nextSymptom = window.prompt(ui.symptom, log.symptom) ?? log.symptom
    const nextSeverity = Number(window.prompt(ui.severity, String(log.severity)))
    if (!Number.isFinite(nextSeverity)) return
    const nextNote = window.prompt(ui.notePrompt, log.note) ?? log.note
    const response = await fetch('/api/symptoms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id: log.id, symptom: nextSymptom, severity: nextSeverity, note: nextNote }),
    })
    const payload = (await response.json()) as { data?: SymptomLog }
    setSymptomHistory((current) => current.map((item) => item.id === log.id ? { ...item, ...payload.data } : item))
    onNotice(t.saved)
  }

  const deleteSymptom = async (id: string) => {
    await fetch('/api/symptoms', { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ id }) })
    setSymptomHistory((current) => current.filter((item) => item.id !== id))
    onNotice(t.saved)
  }

  const prepareVisit = async () => {
    const checkinNotes = latestCheckin ? ui.buildCheckinNotes(latestCheckin) : ''
    const notes = ui.buildVisitNotes(checkinNotes)
    try {
      const response = await fetch(`/api/visit-summary?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ notes }),
      })
      const result = (await response.json()) as { data?: { summary?: string } }
      setSummary(result.data?.summary ?? notes)
      onNotice(ui.summaryReady)
    } catch {
      setSummary(notes)
      onNotice(ui.summaryReady)
    }
  }

  return (
    <div className="tracker-screen">
      <div className="screen-heading">
        <span className="eyebrow">{t.utility.weightTitle}</span>
        <h2>{t.utility.weightTitle}</h2>
        <p>{t.utility.weightBody}</p>
      </div>
      <section className="glass-card log-form">
        <label>{ui.weightKg}</label>
        <input value={weightKg} inputMode="decimal" onChange={(event) => setWeightKg(event.target.value)} />
        <label>{ui.weightNote}</label>
        <input value={weightNote} onChange={(event) => setWeightNote(event.target.value)} />
        <button type="button" onClick={() => void saveWeight()}>{ui.saveWeight}</button>
      </section>
      <section className="glass-card log-form">
        <label>{ui.symptom}</label>
        <input value={symptom} onChange={(event) => setSymptom(event.target.value)} />
        <label>{ui.severity}: {severity}/5</label>
        <input type="range" min="1" max="5" value={severity} onChange={(event) => setSeverity(Number(event.target.value))} />
        <label>{ui.symptomNote}</label>
        <input value={symptomNote} onChange={(event) => setSymptomNote(event.target.value)} />
        <button type="button" onClick={() => void saveSymptom()}>{ui.saveSymptom}</button>
      </section>
      <button className="primary-button" type="button" onClick={() => void prepareVisit()}>
        {ui.prepare}
        <Icon name="summarize" />
      </button>
      {summary && <section className="glass-card tracker-note"><p>{summary}</p></section>}
      <section className="glass-card log-history">
        <div className="card-title"><Icon name="monitor_weight" /><span>{ui.history}</span></div>
        {weightHistory.length === 0 ? <p>{t.dir === 'rtl' ? 'لا توجد قراءات وزن بعد.' : 'No weight logs yet.'}</p> : weightHistory.map((item) => (
          <article key={item.id}>
            <span>{formatLogDate(item.createdAt, t.dir)}</span>
            <strong>{item.weightKg} kg</strong>
            <small>{item.note}</small>
            <div>
              <button type="button" onClick={() => void editWeight(item)}>{ui.edit}</button>
              <button type="button" onClick={() => void deleteWeight(item.id)}>{ui.delete}</button>
            </div>
          </article>
        ))}
      </section>
      <section className="glass-card log-history">
        <div className="card-title"><Icon name="sick" /><span>{ui.symptom}</span></div>
        {symptomHistory.length === 0 ? <p>{t.dir === 'rtl' ? 'لا توجد أعراض بعد.' : 'No symptom logs yet.'}</p> : symptomHistory.map((item) => (
          <article key={item.id}>
            <span>{formatLogDate(item.createdAt, t.dir)}</span>
            <strong>{item.symptom} · {item.severity}/5</strong>
            <small>{item.note}</small>
            <div>
              <button type="button" onClick={() => void editSymptom(item)}>{ui.edit}</button>
              <button type="button" onClick={() => void deleteSymptom(item.id)}>{ui.delete}</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function CareNavigatorScreen({ t, onNotice, latestCheckin }: { t: (typeof content)[Lang]; onNotice: (message: string) => void; latestCheckin: LatestCheckin | null }) {
  const defaultConcern = latestCheckin
    ? t.dir === 'rtl'
      ? `المزاج ${latestCheckin.mood}، النوم ${latestCheckin.sleepQuality}/5، الأعراض ${latestCheckin.symptoms.join('، ') || 'لا توجد'}، الملاحظة ${latestCheckin.note || 'لا توجد'}`
      : `Mood ${latestCheckin.mood}, sleep ${latestCheckin.sleepQuality}/5, symptoms ${latestCheckin.symptoms.join(', ') || 'none'}, note ${latestCheckin.note || 'none'}`
    : t.dir === 'rtl' ? 'حركة الطفل أقل من المعتاد اليوم' : 'Baby movement feels lower than usual today'
  const [concern, setConcern] = useState(defaultConcern)
  const [stage, setStage] = useState<'pregnancy' | 'postpartum' | 'baby_0_3'>('pregnancy')
  const [route, setRoute] = useState<CareRouteResponse['data'] | null>(null)
  const [loading, setLoading] = useState(false)
  const ui = t.dir === 'rtl'
    ? {
        pregnancy: 'الحمل',
        postpartum: 'بعد الولادة',
        baby: 'الطفل',
        routing: 'جار تحديد المسار...',
        route: 'تحديد المسار',
      }
    : {
        pregnancy: 'Pregnancy',
        postpartum: 'Postpartum',
        baby: 'Baby',
        routing: 'Routing...',
        route: 'Route concern',
      }

  useEffect(() => {
    setConcern(defaultConcern)
    setRoute(null)
  }, [defaultConcern])

  const runRoute = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/care-routing?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ concern, stage }),
      })
      const payload = (await response.json()) as CareRouteResponse
      setRoute(payload.data ?? null)
      onNotice(payload.data?.guidance ?? t.saved)
    } catch {
      onNotice(t.support.urgentDone)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="os-flow">
      <div className="screen-heading teal">
        <span className="eyebrow">{t.utility.careTitle}</span>
        <h2>{t.utility.careTitle}</h2>
        <p>{t.utility.careBody}</p>
      </div>
      <section className="glass-card os-form-card">
        <div className="segment-row">
          {(['pregnancy', 'postpartum', 'baby_0_3'] as const).map((item) => (
            <button key={item} type="button" className={stage === item ? 'active' : ''} onClick={() => setStage(item)}>
              {item === 'baby_0_3' ? ui.baby : item === 'postpartum' ? ui.postpartum : ui.pregnancy}
            </button>
          ))}
        </div>
        <textarea value={concern} onChange={(event) => setConcern(event.target.value)} />
        <button className="primary-button" type="button" onClick={runRoute} disabled={loading}>
          {loading ? ui.routing : ui.route}
          <Icon name="near_me" />
        </button>
      </section>
      {route && (
        <section className={`glass-card os-result ${route.level}`}>
          <div className="card-title">
            <Icon name={route.level === 'urgent' ? 'emergency_home' : 'local_hospital'} />
            <span>{route.title}</span>
          </div>
          <p>{route.guidance}</p>
          <ul className="os-highlights">
            {route.actions.map((action) => (
              <li key={action}><Icon name="check_circle" filled /><span>{action}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function SaudiCareNavigatorScreen({ t, onNotice, latestCheckin, profile }: { t: (typeof content)[Lang]; onNotice: (message: string) => void; latestCheckin: LatestCheckin | null; profile: MotherProfile }) {
  const defaultConcern = latestCheckin
    ? t.dir === 'rtl'
      ? `المزاج ${latestCheckin.mood}، النوم ${latestCheckin.sleepQuality}/5، الأعراض ${latestCheckin.symptoms.join('، ') || 'لا توجد'}، الملاحظة ${latestCheckin.note || 'لا توجد'}`
      : `Mood ${latestCheckin.mood}, sleep ${latestCheckin.sleepQuality}/5, symptoms ${latestCheckin.symptoms.join(', ') || 'none'}, note ${latestCheckin.note || 'none'}`
    : t.dir === 'rtl' ? 'حركة الطفل أقل من المعتاد اليوم' : 'Baby movement feels lower than usual today'
  const [concern, setConcern] = useState(defaultConcern)
  const [stage, setStage] = useState<'pregnancy' | 'postpartum' | 'baby_0_3'>('pregnancy')
  const [route, setRoute] = useState<CareRouteResponse['data'] | null>(null)
  const [loading, setLoading] = useState(false)
  const country = normalizeCountry(profile.locale)
  const countryConfig = countryCareConfig[country]
  const countryName = countryConfig.names[t.dir === 'rtl' ? 'ar' : 'en']
  const ui = t.dir === 'rtl'
    ? {
        pregnancy: 'الحمل',
        postpartum: 'بعد الولادة',
        baby: 'الطفل',
        routing: 'جار تحديد المسار...',
        route: 'تحديد المسار',
        urgentTitle: 'رعاية عاجلة الآن',
        urgentBody: 'النزيف، الألم الشديد، قلة حركة واضحة، ضيق النفس، ألم الصدر، أو الشعور بعدم الأمان يحتاج تواصلا عاجلا.',
        countryLabel: 'الدولة',
        emergency: countryConfig.emergency.ar,
        moh: countryConfig.ministry.ar,
        telehealth: countryConfig.telehealth.ar,
        insurance: countryConfig.insurance.ar,
        nonUrgentTitle: 'مسارات غير عاجلة',
        ob: 'طبيبة النساء والولادة',
        family: 'طب الأسرة',
        mental: 'دعم نفسي',
        babyClinic: 'عيادة أطفال',
        partnersTitle: 'روابط العيادات والشركاء',
        partner1: countryConfig.maternityPartner.ar,
        partner2: countryConfig.telehealth.ar,
        partner3: countryConfig.hospitalPartner.ar,
        actionCall: 'اتصال',
        actionOpen: 'فتح',
        resources: 'موارد مقترحة',
      }
    : {
        pregnancy: 'Pregnancy',
        postpartum: 'Postpartum',
        baby: 'Baby',
        routing: 'Routing...',
        route: 'Route concern',
        urgentTitle: 'Urgent Care Now',
        urgentBody: 'Bleeding, severe pain, clearly reduced movement, shortness of breath, chest pain, or unsafe feelings need urgent contact.',
        countryLabel: 'Country',
        emergency: countryConfig.emergency.en,
        moh: countryConfig.ministry.en,
        telehealth: countryConfig.telehealth.en,
        insurance: countryConfig.insurance.en,
        nonUrgentTitle: 'Non-Urgent Pathways',
        ob: 'OB-GYN',
        family: 'Family medicine',
        mental: 'Mental health support',
        babyClinic: 'Pediatric clinic',
        partnersTitle: 'Clinic And Partner Links',
        partner1: countryConfig.maternityPartner.en,
        partner2: countryConfig.telehealth.en,
        partner3: countryConfig.hospitalPartner.en,
        actionCall: 'Call',
        actionOpen: 'Open',
        resources: 'Suggested resources',
      }
  const urgentCards = [
    { label: ui.emergency, body: t.dir === 'rtl' ? 'عند الخطر الفوري اتصلي برقم الطوارئ المحلي أو توجهي للطوارئ.' : 'For immediate danger, call local emergency services or go to emergency care.', icon: 'emergency_home', action: ui.actionCall },
    { label: ui.moh, body: t.dir === 'rtl' ? 'إرشادات وزارة الصحة لعلامات الخطر ومسارات الرعاية.' : 'MOH guidance for warning signs and care pathways.', icon: 'health_and_safety', action: ui.actionOpen },
    { label: ui.insurance, body: t.dir === 'rtl' ? 'تحققي من التغطية والشبكة الطبية حسب بلدك قبل الحجز غير العاجل.' : 'Check coverage and network rules for your country before non-urgent booking.', icon: 'verified_user', action: ui.actionOpen },
  ]
  const pathwayCards = [
    { label: ui.ob, body: t.dir === 'rtl' ? 'للأعراض المتكررة، الزيارات، الحمل، الحركة، والأدوية.' : 'For pregnancy symptoms, visits, movement questions, and medication guidance.', icon: 'pregnant_woman' },
    { label: ui.family, body: t.dir === 'rtl' ? 'للأعراض العامة، النوم، التغذية، والمتابعة غير العاجلة.' : 'For general symptoms, sleep, nutrition, and non-urgent follow-up.', icon: 'family_restroom' },
    { label: ui.mental, body: countryConfig.mentalHealth[t.dir === 'rtl' ? 'ar' : 'en'], icon: 'psychology' },
    { label: ui.babyClinic, body: t.dir === 'rtl' ? 'للرضاعة، الحرارة، الحفاضات، التطعيمات، ونمو الطفل.' : 'For feeding, fever, diapers, vaccines, and baby growth.', icon: 'child_care' },
  ]
  const partnerLinks = [
    { label: ui.partner1, kind: ui.ob, icon: 'event_available' },
    { label: ui.partner2, kind: ui.telehealth, icon: 'video_call' },
    { label: ui.partner3, kind: ui.emergency, icon: 'local_hospital' },
  ]

  useEffect(() => {
    setConcern(defaultConcern)
    setRoute(null)
  }, [defaultConcern])

  const runRoute = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/care-routing?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ concern, stage, country }),
      })
      const payload = (await response.json()) as CareRouteResponse
      setRoute(payload.data ?? null)
      onNotice(payload.data?.guidance ?? t.saved)
    } catch {
      onNotice(t.support.urgentDone)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="care-navigator">
      <div className="screen-heading teal">
        <span className="eyebrow">{t.utility.careTitle}</span>
        <h2>{t.utility.careTitle}</h2>
        <p>{t.utility.careBody}</p>
        <p className="care-country-chip">{ui.countryLabel}: {countryName}</p>
      </div>
      <section className="glass-card care-urgent">
        <div>
          <Icon name="emergency_home" />
          <span>
            <strong>{ui.urgentTitle}</strong>
            <small>{ui.urgentBody}</small>
          </span>
        </div>
        <div className="care-card-grid">
          {urgentCards.map((card) => (
            <button key={card.label} type="button" onClick={() => onNotice(card.body)}>
              <Icon name={card.icon} />
              <span>
                <strong>{card.label}</strong>
                <small>{card.body}</small>
              </span>
              <em>{card.action}</em>
            </button>
          ))}
        </div>
      </section>
      <section className="glass-card os-form-card">
        <div className="segment-row">
          {(['pregnancy', 'postpartum', 'baby_0_3'] as const).map((item) => (
            <button key={item} type="button" className={stage === item ? 'active' : ''} onClick={() => setStage(item)}>
              {item === 'baby_0_3' ? ui.baby : item === 'postpartum' ? ui.postpartum : ui.pregnancy}
            </button>
          ))}
        </div>
        <textarea value={concern} onChange={(event) => setConcern(event.target.value)} />
        <button className="primary-button" type="button" onClick={runRoute} disabled={loading}>
          {loading ? ui.routing : ui.route}
          <Icon name="near_me" />
        </button>
      </section>
      <section className="care-pathways">
        <div className="card-title"><Icon name="alt_route" /><span>{ui.nonUrgentTitle}</span></div>
        <div className="care-card-grid">
          {pathwayCards.map((card) => (
            <article className="glass-card" key={card.label}>
              <Icon name={card.icon} />
              <strong>{card.label}</strong>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>
      {route && (
        <section className={`glass-card os-result ${route.level}`}>
          <div className="card-title">
            <Icon name={route.level === 'urgent' ? 'emergency_home' : 'local_hospital'} />
            <span>{route.title}</span>
          </div>
          <p>{route.guidance}</p>
          <ul className="os-highlights">
            {route.actions.map((action) => (
              <li key={action}><Icon name="check_circle" filled /><span>{action}</span></li>
            ))}
          </ul>
          <div className="care-resource-list">
            <strong>{ui.resources}</strong>
            {route.resources.map((resource) => (
              <button key={`${resource.kind}-${resource.label}`} type="button" onClick={() => onNotice(resource.label)}>
                <Icon name={resource.kind === 'moh' ? 'health_and_safety' : resource.kind === 'hospital' ? 'local_hospital' : resource.kind === 'telehealth' ? 'video_call' : 'contacts'} />
                <span>{resource.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="care-pathways">
        <div className="card-title"><Icon name="hub" /><span>{ui.partnersTitle}</span></div>
        <div className="partner-link-list">
          {partnerLinks.map((link) => (
            <button key={link.label} className="glass-card" type="button" onClick={() => onNotice(link.label)}>
              <Icon name={link.icon} />
              <span>
                <strong>{link.label}</strong>
                <small>{link.kind}</small>
              </span>
              <em>{ui.actionOpen}</em>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

void CareNavigatorScreen

function ReviewedContentLibraryScreen({
  t,
  onNotice,
  selectedContentId,
}: {
  t: (typeof content)[Lang]
  onNotice: (message: string) => void
  selectedContentId: string | null
}) {
  const [items, setItems] = useState<ReviewedContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState<string>('all')
  const [activeTopic, setActiveTopic] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'reviewDue' | 'lastReviewed' | 'title'>('reviewDue')
  const [detailId, setDetailId] = useState<string | null>(selectedContentId)
  const ui = t.dir === 'rtl'
    ? {
        loading: 'جار تحميل المحتوى المراجع...',
        all: 'الكل',
        stages: { pregnancy: 'الحمل', postpartum: 'بعد الولادة', baby_0_3: 'الطفل', ramadan: 'رمضان', islamic: 'إرشاد إسلامي' } as Record<string, string>,
        reviewedBy: 'راجعتها',
        specialty: 'التخصص',
        approved: 'اعتمدت',
        expires: 'تنتهي',
        citations: 'المراجع',
        usedInReply: 'استخدم في رد رفقة',
        reviewCurrent: 'المراجعة سارية',
        reviewExpiring: 'تحتاج مراجعة قريبا',
        reviewExpired: 'انتهت المراجعة',
        daysLeft: (days: number) => `باقي ${days} يوم`,
        policy: 'لا يظهر هنا إلا المحتوى الصحي المعتمد للمستخدم.',
        empty: 'لا يوجد محتوى مراجع لهذه المرحلة بعد.',
        failed: 'تعذر تحميل مكتبة المحتوى. استخدمي المحتوى التجريبي مؤقتا.',
      }
    : {
        loading: 'Loading reviewed content...',
        all: 'All',
        stages: { pregnancy: 'Pregnancy', postpartum: 'Postpartum', baby_0_3: 'Baby', ramadan: 'Ramadan', islamic: 'Islamic guidance' } as Record<string, string>,
        reviewedBy: 'Reviewed by',
        specialty: 'Specialty',
        approved: 'Approved',
        expires: 'Expires',
        citations: 'Citations',
        usedInReply: 'Used in AI reply',
        reviewCurrent: 'Review current',
        reviewExpiring: 'Review due soon',
        reviewExpired: 'Review expired',
        daysLeft: (days: number) => `${days} days left`,
        policy: 'Only approved user-facing health content appears here.',
        empty: 'No reviewed content for this stage yet.',
        failed: 'Could not load the content library. Showing demo content for now.',
      }
  const libraryUi = t.dir === 'rtl'
    ? {
        allTopics: 'كل المواضيع',
        topics: {
          pregnancy: 'الحمل',
          postpartum: 'بعد الولادة',
          baby_0_3: 'الطفل',
          ramadan: 'رمضان',
          islamic: 'إرشاد إسلامي',
          vaccines: 'التطعيمات',
          care_navigation: 'مسار الرعاية',
          telehealth: 'الاستشارة عن بعد',
          travel: 'السفر والمناسك',
          conditions: 'حالات صحية',
          faith_support: 'إرشاد إيماني',
        } as Record<string, string>,
        search: 'ابحثي في المكتبة',
        topic: 'الموضوع',
        sort: 'الترتيب',
        reviewDueSort: 'الأقرب للمراجعة',
        lastReviewedSort: 'الأحدث مراجعة',
        titleSort: 'العنوان',
        openDetails: 'فتح التفاصيل',
        backToLibrary: 'العودة للمكتبة',
        fullGuidance: 'الإرشاد الكامل',
        reviewerProfile: 'ملف المراجع',
        organization: 'الجهة',
        lastReviewed: 'آخر مراجعة',
        reviewDue: 'تاريخ المراجعة القادمة',
      }
    : {
        allTopics: 'All topics',
        topics: {
          pregnancy: 'Pregnancy',
          postpartum: 'Postpartum',
          baby_0_3: 'Baby',
          ramadan: 'Ramadan',
          islamic: 'Islamic guidance',
          vaccines: 'Vaccines',
          care_navigation: 'Care navigation',
          telehealth: 'Telehealth',
          travel: 'Travel and rituals',
          conditions: 'Health conditions',
          faith_support: 'Faith support',
        } as Record<string, string>,
        search: 'Search the library',
        topic: 'Topic',
        sort: 'Sort',
        reviewDueSort: 'Review due',
        lastReviewedSort: 'Last reviewed',
        titleSort: 'Title',
        openDetails: 'Open details',
        backToLibrary: 'Back to library',
        fullGuidance: 'Full guidance',
        reviewerProfile: 'Reviewer profile',
        organization: 'Organization',
        lastReviewed: 'Last reviewed',
        reviewDue: 'Review due',
      }

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetch(`/api/content-library?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`)
      .then((response) => response.json())
      .then((payload: { data?: { reviewedContent?: ReviewedContentItem[] } }) => {
        if (!isMounted) return
        setItems(payload.data?.reviewedContent ?? [])
      })
      .catch(() => {
        if (!isMounted) return
        onNotice(ui.failed)
        setItems([])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [t.dir])

  useEffect(() => {
    if (!selectedContentId || items.length === 0) return
    const selectedItem = items.find((item) => item.id === selectedContentId)
    if (!selectedItem) return
    setActiveStage(selectedItem.stage)
    setActiveTopic('all')
    setDetailId(selectedItem.id)
    window.setTimeout(() => {
      document.getElementById(`review-card-${selectedContentId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 80)
  }, [items, selectedContentId])

  const stages = ['all', ...Array.from(new Set(items.map((item) => item.stage)))]
  const topics = ['all', ...Array.from(new Set(items.map((item) => item.topic || item.stage)))]
  const normalizedQuery = query.trim().toLowerCase()
  const visibleItems = items
    .filter((item) => activeStage === 'all' || item.stage === activeStage)
    .filter((item) => activeTopic === 'all' || (item.topic || item.stage) === activeTopic)
    .filter((item) => {
      if (!normalizedQuery) return true
      const haystack = [
        item.title,
        item.summary,
        item.body,
        item.reviewerName,
        item.reviewerSpecialty,
        item.topic,
        ...(item.citations || []),
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    })
    .sort((first, second) => {
      if (sortMode === 'lastReviewed') return new Date(second.approvalDate).getTime() - new Date(first.approvalDate).getTime()
      if (sortMode === 'title') return first.title.localeCompare(second.title, t.dir === 'rtl' ? 'ar' : 'en')
      return new Date(first.expiryDate).getTime() - new Date(second.expiryDate).getTime()
    })
  const detailItem = detailId ? items.find((item) => item.id === detailId) ?? null : null
  const formatDate = (value: string) => new Intl.DateTimeFormat(t.dir === 'rtl' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
  const getFreshness = (expiryDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000)
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: ui.reviewExpired }
    }
    if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `${ui.reviewExpiring} · ${ui.daysLeft(daysUntilExpiry)}` }
    }
    return { status: 'current', label: ui.reviewCurrent }
  }
  const detailCitations: Array<{ title: string; source: string; year?: string }> = detailItem
    ? detailItem.citationDetails?.length
      ? detailItem.citationDetails
      : detailItem.citations.map((citation) => ({ title: citation, source: citation }))
    : []

  return (
    <div className="review-library">
      <div className="screen-heading teal">
        <span className="eyebrow">{t.utility.libraryTitle}</span>
        <h2>{t.utility.libraryTitle}</h2>
        <p>{t.utility.libraryBody}</p>
      </div>

      <section className="glass-card review-policy">
        <Icon name="verified_user" filled />
        <span>{ui.policy}</span>
      </section>

      <div className="library-tabs" role="tablist" aria-label={t.utility.libraryTitle}>
        {stages.map((stage) => (
          <button
            key={stage}
            type="button"
            className={activeStage === stage ? 'active' : ''}
            onClick={() => {
              setActiveStage(stage)
              setDetailId(null)
            }}
          >
            {stage === 'all' ? ui.all : ui.stages[stage] ?? stage}
          </button>
        ))}
      </div>

      <section className="glass-card library-controls">
        <label>
          <span>{libraryUi.search}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={libraryUi.search} />
        </label>
        <div className="library-select-row">
          <label>
            <span>{libraryUi.topic}</span>
            <select value={activeTopic} onChange={(event) => setActiveTopic(event.target.value)}>
              {topics.map((topic) => (
                <option key={topic} value={topic}>{topic === 'all' ? libraryUi.allTopics : libraryUi.topics[topic] ?? topic}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{libraryUi.sort}</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)}>
              <option value="reviewDue">{libraryUi.reviewDueSort}</option>
              <option value="lastReviewed">{libraryUi.lastReviewedSort}</option>
              <option value="title">{libraryUi.titleSort}</option>
            </select>
          </label>
        </div>
      </section>

      {detailItem && (
        <section className={`glass-card review-detail-page ${detailItem.id === selectedContentId ? 'selected' : ''}`}>
          <button className="secondary-button" type="button" onClick={() => setDetailId(null)}>
            <Icon name={t.dir === 'rtl' ? 'arrow_forward' : 'arrow_back'} />
            {libraryUi.backToLibrary}
          </button>
          <div className="review-card-heading">
            <span>{ui.stages[detailItem.stage] ?? detailItem.stage} · {libraryUi.topics[detailItem.topic || detailItem.stage] ?? detailItem.topic ?? detailItem.stage}</span>
            <div>
              {detailItem.id === selectedContentId && <em>{ui.usedInReply}</em>}
              <em className={`freshness-pill ${getFreshness(detailItem.expiryDate).status}`}>{getFreshness(detailItem.expiryDate).label}</em>
              <Icon name="verified" filled />
            </div>
          </div>
          <h3>{detailItem.title}</h3>
          <p>{detailItem.summary}</p>
          <div className="review-detail-section">
            <strong>{libraryUi.fullGuidance}</strong>
            <p>{detailItem.body || detailItem.summary}</p>
          </div>
          <div className="reviewer-profile-card">
            <Icon name="clinical_notes" />
            <span>
              <strong>{libraryUi.reviewerProfile}</strong>
              <b>{detailItem.reviewerProfile?.name || detailItem.reviewerName}</b>
              <small>{detailItem.reviewerProfile?.specialty || detailItem.reviewerSpecialty}</small>
              {detailItem.reviewerProfile?.organization && <small>{libraryUi.organization}: {detailItem.reviewerProfile.organization}</small>}
              {detailItem.reviewerProfile?.bio && <small>{detailItem.reviewerProfile.bio}</small>}
            </span>
          </div>
          <dl>
            <div>
              <dt>{libraryUi.lastReviewed}</dt>
              <dd>{formatDate(detailItem.approvalDate)}</dd>
            </div>
            <div>
              <dt>{libraryUi.reviewDue}</dt>
              <dd>{formatDate(detailItem.expiryDate)}</dd>
            </div>
          </dl>
          <div className="citation-list citation-detail-list">
            <strong>{ui.citations}</strong>
            <ul>
              {detailCitations.map((citation) => (
                <li key={`${citation.title}-${citation.source}`}>
                  <b>{citation.title}</b>
                  <span>{citation.source}{citation.year ? ` · ${citation.year}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {loading ? (
        <section className="glass-card review-empty">{ui.loading}</section>
      ) : visibleItems.length === 0 ? (
        <section className="glass-card review-empty">{ui.empty}</section>
      ) : (
        <section className="review-card-list">
          {visibleItems.map((item) => {
            const freshness = getFreshness(item.expiryDate)
            return (
              <article
                className={`glass-card review-content-card ${item.id === selectedContentId ? 'selected' : ''} ${freshness.status}`}
                id={`review-card-${item.id}`}
                key={item.id}
              >
              <div className="review-card-heading">
                <span>{ui.stages[item.stage] ?? item.stage}</span>
                <div>
                  {item.id === selectedContentId && <em>{ui.usedInReply}</em>}
                  <em className={`freshness-pill ${freshness.status}`}>{freshness.label}</em>
                  <Icon name="verified" filled />
                </div>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="review-card-actions">
                <span>{libraryUi.topics[item.topic || item.stage] ?? item.topic ?? item.stage}</span>
                <button type="button" onClick={() => setDetailId(item.id)}>
                  <Icon name="article" />
                  {libraryUi.openDetails}
                </button>
              </div>
              <dl>
                <div>
                  <dt>{ui.reviewedBy}</dt>
                  <dd>{item.reviewerName}</dd>
                </div>
                <div>
                  <dt>{ui.specialty}</dt>
                  <dd>{item.reviewerSpecialty}</dd>
                </div>
                <div>
                  <dt>{ui.approved}</dt>
                  <dd>{formatDate(item.approvalDate)}</dd>
                </div>
                <div>
                  <dt>{ui.expires}</dt>
                  <dd>{formatDate(item.expiryDate)}</dd>
                </div>
              </dl>
              <div className="citation-list">
                <strong>{ui.citations}</strong>
                <ul>
                  {item.citations.map((citation) => (
                    <li key={citation}>{citation}</li>
                  ))}
                </ul>
              </div>
            </article>
            )
          })}
        </section>
      )}
    </div>
  )
}

function AdminAccessScreen({ t, onNotice }: { t: (typeof content)[Lang]; onNotice: (message: string) => void }) {
  const supabase = getBrowserSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [accessRole, setAccessRole] = useState<'clinical_reviewer' | 'admin' | null>(null)
  const ui = t.dir === 'rtl'
    ? {
        eyebrow: 'مدخل خاص',
        title: 'اعتماد المحتوى والحوكمة',
        body: 'هذه مساحة خاصة بفريق رفقة الطبي والإداري. لا تظهر ضمن تجربة الأمهات.',
        unavailable: 'تسجيل دخول فريق المراجعة غير متاح في هذا العرض.',
        checking: 'جار التحقق من الصلاحية...',
        denied: 'هذا الحساب لا يملك صلاحية مراجعة أو إدارة.',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        signIn: 'تسجيل الدخول',
        signingIn: 'جار الدخول...',
        failed: 'تعذر تسجيل الدخول أو التحقق من الصلاحية.',
        signOut: 'تسجيل الخروج',
        signedOut: 'تم تسجيل الخروج من مساحة الإدارة.',
        roleLabel: 'الصلاحية',
        roleAdmin: 'مسؤولة',
        roleReviewer: 'مراجعة طبية',
        openApp: 'العودة لتجربة الأم',
      }
    : {
        eyebrow: 'Private entry',
        title: 'Content Approval And Governance',
        body: 'This area is reserved for RIFQA clinical and admin teams. It is not part of the mother-facing experience.',
        unavailable: 'Reviewer sign-in is not available in this preview.',
        checking: 'Checking access...',
        denied: 'This account does not have reviewer or admin access.',
        email: 'Email',
        password: 'Password',
        signIn: 'Sign in',
        signingIn: 'Signing in...',
        failed: 'Could not sign in or verify access.',
        signOut: 'Sign out',
        signedOut: 'Signed out of the admin area.',
        roleLabel: 'Role',
        roleAdmin: 'Admin',
        roleReviewer: 'Clinical reviewer',
        openApp: 'Back to mother app',
      }

  const verifyAccess = async (nextSession: Session | null = session) => {
    if (!nextSession) {
      setChecking(false)
      setAllowed(false)
      setAccessRole(null)
      return
    }
    setChecking(true)
    persistAccessToken(nextSession)
    try {
      const response = await fetch(`/api/review-queue?access=1&lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('access check failed')
      const payload = (await response.json()) as { data?: { canReview?: boolean; stored?: boolean; role?: 'clinical_reviewer' | 'admin' | null } }
      setAllowed(Boolean(payload.data?.canReview && payload.data?.stored))
      setAccessRole(payload.data?.role ?? null)
    } catch {
      setAllowed(false)
      setAccessRole(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!supabase) {
      persistAccessToken(null)
      setChecking(false)
      setAllowed(false)
      setAccessRole(null)
      return
    }

    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      void verifyAccess(data.session)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void verifyAccess(nextSession)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [supabase, t.dir])

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    setSigningIn(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setSession(data.session)
      setPassword('')
      await verifyAccess(data.session)
    } catch {
      setAllowed(false)
      onNotice(ui.failed)
    } finally {
      setSigningIn(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut().catch(() => null)
    setSession(null)
    setAllowed(false)
    setAccessRole(null)
    persistAccessToken(null)
    onNotice(ui.signedOut)
  }

  if (allowed) {
    return (
      <div className="admin-gate">
        <section className="glass-card admin-session-header">
          <span>
            <Icon name="verified_user" filled />
            <strong>{session?.user.email}</strong>
          </span>
          <em>{ui.roleLabel}: {accessRole === 'admin' ? ui.roleAdmin : ui.roleReviewer}</em>
          <button type="button" onClick={() => void signOut()}>{ui.signOut}</button>
        </section>
        <PromptConfigPanel t={t} onNotice={onNotice} />
        <B2BReportsPanel t={t} onNotice={onNotice} />
        <ReviewQueueScreen t={t} onNotice={onNotice} />
      </div>
    )
  }

  return (
    <div className="admin-gate">
      <div className="screen-heading">
        <span className="eyebrow">{ui.eyebrow}</span>
        <h2>{ui.title}</h2>
        <p>{ui.body}</p>
      </div>
      <section className="glass-card reviewer-session">
        <div className="card-title">
          <Icon name="lock_person" />
          <span>{ui.title}</span>
        </div>
        {!supabase ? (
          <p>{ui.unavailable}</p>
        ) : checking ? (
          <p>{ui.checking}</p>
        ) : session ? (
          <p>{ui.denied}</p>
        ) : (
          <form className="reviewer-session-form" onSubmit={signIn}>
            <input type="email" value={email} placeholder={ui.email} onChange={(event) => setEmail(event.target.value)} disabled={signingIn} />
            <input type="password" value={password} placeholder={ui.password} onChange={(event) => setPassword(event.target.value)} disabled={signingIn} />
            <button type="submit" disabled={signingIn || !email || !password}>{signingIn ? ui.signingIn : ui.signIn}</button>
          </form>
        )}
        <button className="admin-gate-link" type="button" onClick={() => { window.history.pushState(null, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')) }}>
          {ui.openApp}
        </button>
      </section>
    </div>
  )
}

function B2BReportsPanel({ t, onNotice }: { t: (typeof content)[Lang]; onNotice: (message: string) => void }) {
  const [reports, setReports] = useState<B2BReport[]>([])
  const [threshold, setThreshold] = useState(10)
  const [loading, setLoading] = useState(false)
  const ui = t.dir === 'rtl'
    ? {
        title: 'تقارير الجهات الراعية',
        body: 'تعرض هذه اللوحة مؤشرات إجمالية فقط. لا توجد هوية فردية أو أعراض أو يوميات أو محادثات.',
        threshold: 'حد الخصوصية',
        users: 'مستخدمون',
        value: 'القيمة',
        create: 'إنشاء تقرير تجريبي',
        saved: 'تم تحديث التقارير الإجمالية.',
        empty: 'لا توجد تقارير إجمالية بعد.',
        firewall: 'حاجز البيانات الفردية مفعل',
      }
    : {
        title: 'B2B aggregate reports',
        body: 'This panel shows aggregate-only sponsor metrics. No individual identity, symptoms, journal, or chat data is exposed.',
        threshold: 'Privacy threshold',
        users: 'users',
        value: 'Value',
        create: 'Create demo report',
        saved: 'Aggregate reports updated.',
        empty: 'No aggregate reports yet.',
        firewall: 'Individual-data firewall active',
      }

  const loadReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/b2b-reports?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, { headers: getAuthHeaders() })
      const payload = (await response.json()) as { data?: { reports?: B2BReport[]; threshold?: number } }
      setReports(payload.data?.reports ?? [])
      setThreshold(payload.data?.threshold ?? 10)
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [t.dir])

  const createReport = async () => {
    setLoading(true)
    try {
      await fetch(`/api/b2b-reports?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          metric: t.dir === 'rtl' ? 'التفعيل الشهري' : 'Monthly activation',
          stage: 'mixed',
          locale: 'SA',
          userCount: 24,
          value: 71,
          dimensions: { sponsorType: 'aggregate' },
        }),
      })
      await loadReports()
      onNotice(ui.saved)
    } catch {
      onNotice(ui.saved)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass-card admin-report-panel">
      <div className="card-title">
        <Icon name="monitoring" />
        <span>{ui.title}</span>
      </div>
      <p>{ui.body}</p>
      <div className="privacy-threshold-badge">
        <Icon name="shield_lock" />
        <span>{ui.threshold}: {threshold}+ {ui.users}</span>
        <em>{ui.firewall}</em>
      </div>
      <button type="button" disabled={loading} onClick={() => void createReport()}>{ui.create}</button>
      <div className="admin-report-list">
        {reports.length === 0 ? <p>{ui.empty}</p> : reports.slice(0, 8).map((item, index) => (
          <article key={item.id ?? `${item.metric}-${index}`}>
            <span>
              <strong>{item.metric}</strong>
              <small>{item.period} - {item.stage} - {item.locale}</small>
            </span>
            <em>{item.userCount} {ui.users}</em>
            <b>{ui.value}: {item.value}</b>
          </article>
        ))}
      </div>
    </section>
  )
}

function PromptConfigPanel({ t, onNotice }: { t: (typeof content)[Lang]; onNotice: (message: string) => void }) {
  const [promptVersion, setPromptVersion] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const ui = t.dir === 'rtl'
    ? {
        title: 'إصدار تعليمات رفقة الذكية',
        version: 'إصدار التعليمات',
        label: 'وصف الإصدار',
        save: 'تحديث الإصدار',
        saved: 'تم تحديث إصدار تعليمات رفقة.',
      }
    : {
        title: 'RIFQA AI Prompt Version',
        version: 'Prompt version',
        label: 'Version label',
        save: 'Update version',
        saved: 'RIFQA prompt version updated.',
      }

  useEffect(() => {
    void fetch('/api/prompt-config', { headers: getAuthHeaders() })
      .then((response) => response.json())
      .then((payload: { data?: { promptVersion?: string; label?: string } }) => {
        setPromptVersion(payload.data?.promptVersion ?? '')
        setLabel(payload.data?.label ?? '')
      })
      .catch(() => null)
  }, [])

  const save = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/prompt-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ promptVersion, label }),
      })
      if (!response.ok) throw new Error('prompt update failed')
      onNotice(ui.saved)
    } catch {
      onNotice(t.dir === 'rtl' ? 'تعذر تحديث الإصدار.' : 'Could not update prompt version.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="glass-card reviewer-session prompt-config-panel">
      <div className="card-title">
        <Icon name="developer_board" />
        <span>{ui.title}</span>
      </div>
      <input value={promptVersion} placeholder={ui.version} onChange={(event) => setPromptVersion(event.target.value)} />
      <input value={label} placeholder={ui.label} onChange={(event) => setLabel(event.target.value)} />
      <button type="button" disabled={busy || !promptVersion} onClick={() => void save()}>{ui.save}</button>
    </section>
  )
}

function ReviewerSessionPanel({
  t,
  onNotice,
  onSessionChange,
  section,
}: {
  t: (typeof content)[Lang]
  onNotice: (message: string) => void
  onSessionChange: () => void
  section: 'roles' | 'audit'
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [targetUserId, setTargetUserId] = useState('')
  const [targetRole, setTargetRole] = useState<'clinical_reviewer' | 'admin'>('clinical_reviewer')
  const [roles, setRoles] = useState<ReviewerRoleRecord[]>([])
  const [auditEvents, setAuditEvents] = useState<ReviewAuditEvent[]>([])
  const [auditFilter, setAuditFilter] = useState<'all' | 'content' | 'roles'>('all')
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditFrom, setAuditFrom] = useState('')
  const [auditTo, setAuditTo] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [exportingAudit, setExportingAudit] = useState(false)
  const [granting, setGranting] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const supabase = getBrowserSupabase()
  const ui = t.dir === 'rtl'
    ? {
        setupTitle: 'إدارة صلاحيات فريق المراجعة',
        setupIntro: 'هذه الإعدادات مخصصة لمسؤولي رفقة فقط، ولا تظهر في تجربة الأمهات.',
        setupStepOne: '1. افتحي لوحة الإدارة الداخلية.',
        setupStepTwo: '2. اختاري حساب المراجعة الطبي.',
        setupStepThree: '3. امنحي الصلاحية المناسبة ثم اطلبِي تسجيل الدخول من جديد.',
        grantTitle: 'منح صلاحية من داخل رفقة',
        userId: 'معرف المستخدم',
        roleAdmin: 'مسؤولة',
        roleReviewer: 'طبيبة مراجعة',
        grant: 'منح الصلاحية',
        granting: 'جار المنح...',
        granted: 'تم منح الصلاحية.',
        grantFailed: 'تعذر منح الصلاحية. تحتاجين حساب مسؤولة.',
        roleList: 'الصلاحيات الحالية',
        refreshRoles: 'تحديث القائمة',
        revoke: 'إلغاء',
        revokeFailed: 'تعذر إلغاء الصلاحية. تحتاجين حساب مسؤولة، ولا يمكن إلغاء صلاحيتك من هنا.',
        revoked: 'تم إلغاء الصلاحية.',
        noRoles: 'لا توجد صلاحيات مراجعة ظاهرة لهذا الحساب.',
        auditTitle: 'سجل الأمان',
        refreshAudit: 'تحديث السجل',
        exportAudit: 'تصدير السجل',
        exportPdf: 'ملخص PDF',
        exportingAudit: 'جار التصدير...',
        exportReady: 'تم تجهيز ملف سجل الأمان.',
        exportFailed: 'تعذر تصدير السجل. تحتاجين حساب مسؤولة.',
        noAudit: 'لا توجد أحداث تدقيق ظاهرة لهذا الحساب.',
        auditAll: 'الكل',
        auditContent: 'المحتوى',
        auditRoles: 'الصلاحيات',
        auditFrom: 'من',
        auditTo: 'إلى',
        auditSearch: 'بحث بالمعرف',
        clearDates: 'مسح التواريخ',
        previousPage: 'السابق',
        nextPage: 'التالي',
        pageSummary: 'صفحة {page} من {total}',
        auditActions: {
          approve: 'اعتماد محتوى',
          renew: 'تجديد محتوى',
          expire: 'إنهاء اعتماد محتوى',
          retire: 'إيقاف محتوى',
          grant_role: 'منح صلاحية',
          revoke_role: 'إلغاء صلاحية',
          sync_seed: 'تحديث المحتوى الأولي',
        } as Record<string, string>,
        auditTargets: {
          reviewed_content: 'محتوى مراجع',
          reviewer_role: 'صلاحية مراجعة',
        } as Record<string, string>,
      }
    : {
        setupTitle: 'Manage reviewer access',
        setupIntro: 'These settings are for RIFQA administrators only and are not part of the mother-facing experience.',
        setupStepOne: '1. Open the internal admin console.',
        setupStepTwo: '2. Select the clinical reviewer account.',
        setupStepThree: '3. Grant the right access level, then ask the reviewer to sign in again.',
        grantTitle: 'Grant access inside RIFQA',
        userId: 'User ID',
        roleAdmin: 'Admin',
        roleReviewer: 'Clinical reviewer',
        grant: 'Grant role',
        granting: 'Granting...',
        granted: 'Reviewer role granted.',
        grantFailed: 'Could not grant role. Admin account required.',
        roleList: 'Current roles',
        refreshRoles: 'Refresh roles',
        revoke: 'Revoke',
        revokeFailed: 'Could not revoke role. Admin account required, and you cannot revoke yourself here.',
        revoked: 'Reviewer role revoked.',
        noRoles: 'No reviewer roles visible for this account.',
        auditTitle: 'Security audit trail',
        refreshAudit: 'Refresh audit',
        exportAudit: 'Export audit',
        exportPdf: 'PDF summary',
        exportingAudit: 'Exporting...',
        exportReady: 'Audit export is ready.',
        exportFailed: 'Could not export audit. Admin account required.',
        noAudit: 'No audit events visible for this account.',
        auditAll: 'All',
        auditContent: 'Content',
        auditRoles: 'Roles',
        auditFrom: 'From',
        auditTo: 'To',
        auditSearch: 'Search by ID',
        clearDates: 'Clear dates',
        previousPage: 'Previous',
        nextPage: 'Next',
        pageSummary: 'Page {page} of {total}',
        auditActions: {
          approve: 'Approved content',
          renew: 'Renewed content',
          expire: 'Expired content',
          retire: 'Retired content',
          grant_role: 'Granted role',
          revoke_role: 'Revoked role',
          sync_seed: 'Updated starter content',
        } as Record<string, string>,
        auditTargets: {
          reviewed_content: 'Reviewed content',
          reviewer_role: 'Reviewer role',
        } as Record<string, string>,
      }

  useEffect(() => {
    if (!supabase) {
      persistAccessToken(null)
      return
    }

    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      persistAccessToken(data.session)
      onSessionChange()
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      persistAccessToken(nextSession)
      onSessionChange()
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

  const formatAuditDate = (value: string) => new Intl.DateTimeFormat(t.dir === 'rtl' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
  const auditPageSize = 10
  const auditPageCount = Math.max(Math.ceil(auditTotal / auditPageSize), 1)
  const auditPageSummary = ui.pageSummary
    .replace('{page}', String(auditPage))
    .replace('{total}', String(auditPageCount))

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/reviewer-roles', { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('roles failed')
      const payload = (await response.json()) as { data?: { roles?: ReviewerRoleRecord[] } }
      setRoles(payload.data?.roles ?? [])
    } catch {
      setRoles([])
    }
  }

  const loadAudit = async ({
    page = auditPage,
    filter = auditFilter,
    from = auditFrom,
    to = auditTo,
    search = auditSearch,
  }: {
    page?: number
    filter?: typeof auditFilter
    from?: string
    to?: string
    search?: string
  } = {}) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(auditPageSize),
        group: filter,
      })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (search) params.set('search', search)
      const response = await fetch(`/api/review-audit?${params.toString()}`, { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('audit failed')
      const payload = (await response.json()) as { data?: { events?: ReviewAuditEvent[]; total?: number; page?: number } }
      setAuditEvents(payload.data?.events ?? [])
      setAuditTotal(payload.data?.total ?? 0)
      setAuditPage(payload.data?.page ?? page)
    } catch {
      setAuditEvents([])
      setAuditTotal(0)
    }
  }

  const changeAuditFilter = (filter: typeof auditFilter) => {
    setAuditFilter(filter)
    void loadAudit({ page: 1, filter })
  }

  const changeAuditDateRange = (nextFrom: string, nextTo: string) => {
    setAuditFrom(nextFrom)
    setAuditTo(nextTo)
    void loadAudit({ page: 1, from: nextFrom, to: nextTo })
  }

  const changeAuditSearch = (nextSearch: string) => {
    setAuditSearch(nextSearch)
    void loadAudit({ page: 1, search: nextSearch })
  }

  const changeAuditPage = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), auditPageCount)
    void loadAudit({ page: boundedPage })
  }

  const exportAudit = async (format: 'csv' | 'pdf' = 'csv') => {
    setExportingAudit(true)
    try {
      const params = new URLSearchParams({
        export: format,
        group: auditFilter,
      })
      if (auditFrom) params.set('from', auditFrom)
      if (auditTo) params.set('to', auditTo)
      if (auditSearch) params.set('search', auditSearch)
      const response = await fetch(`/api/review-audit?${params.toString()}`, { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('audit export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `rifqa-review-audit-${auditFilter}-${date}.${format === 'pdf' ? 'pdf' : 'csv'}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      onNotice(ui.exportReady)
    } catch {
      onNotice(ui.exportFailed)
    } finally {
      setExportingAudit(false)
    }
  }

  const grantRole = async (event: FormEvent) => {
    event.preventDefault()
    setGranting(true)
    try {
      const response = await fetch('/api/reviewer-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: targetUserId, role: targetRole }),
      })
      if (!response.ok) throw new Error('grant failed')
      setTargetUserId('')
      onNotice(ui.granted)
      void loadRoles()
      void loadAudit({ page: 1 })
      onSessionChange()
    } catch {
      onNotice(ui.grantFailed)
    } finally {
      setGranting(false)
    }
  }

  const revokeRole = async (userId: string) => {
    setRevokingId(userId)
    try {
      const response = await fetch('/api/reviewer-roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId }),
      })
      if (!response.ok) throw new Error('revoke failed')
      setRoles((current) => current.filter((item) => item.user_id !== userId))
      onNotice(ui.revoked)
      void loadAudit({ page: 1 })
      onSessionChange()
    } catch {
      onNotice(ui.revokeFailed)
    } finally {
      setRevokingId(null)
    }
  }

  useEffect(() => {
    if (!session) return
    if (section === 'roles') void loadRoles()
    if (section === 'audit') void loadAudit({ page: 1 })
  }, [session, section])

  if (!session) return null

  if (section === 'roles') {
    return (
      <section className="glass-card reviewer-session">
        <details className="reviewer-setup-guide" open>
          <summary>
            <Icon name="manage_accounts" />
            {ui.setupTitle}
          </summary>
          <p>{ui.setupIntro}</p>
          <ol>
            <li>{ui.setupStepOne}</li>
            <li>{ui.setupStepTwo}</li>
            <li>{ui.setupStepThree}</li>
          </ol>
          <form className="reviewer-role-form" onSubmit={grantRole}>
            <strong>{ui.grantTitle}</strong>
            <input value={targetUserId} placeholder={ui.userId} onChange={(event) => setTargetUserId(event.target.value)} disabled={granting} />
            <select value={targetRole} onChange={(event) => setTargetRole(event.target.value as 'clinical_reviewer' | 'admin')} disabled={granting}>
              <option value="clinical_reviewer">{ui.roleReviewer}</option>
              <option value="admin">{ui.roleAdmin}</option>
            </select>
            <button type="submit" disabled={granting || !targetUserId}>{granting ? ui.granting : ui.grant}</button>
          </form>
          <div className="reviewer-role-list">
            <div>
              <strong>{ui.roleList}</strong>
              <button type="button" onClick={() => void loadRoles()}>{ui.refreshRoles}</button>
            </div>
            {roles.length === 0 ? (
              <p>{ui.noRoles}</p>
            ) : (
              <ul>
                {roles.map((item) => (
                  <li key={item.user_id}>
                    <span>{item.user_id}</span>
                    <strong>{item.role === 'admin' ? ui.roleAdmin : ui.roleReviewer}</strong>
                    <button type="button" disabled={revokingId === item.user_id} onClick={() => void revokeRole(item.user_id)}>
                      {ui.revoke}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </section>
    )
  }

  return (
    <section className="glass-card reviewer-session">
      <div className="reviewer-role-list audit-tool">
        <div className="audit-heading-row">
          <strong>{ui.auditTitle}</strong>
          <span>
            <button type="button" onClick={() => void loadAudit()}>{ui.refreshAudit}</button>
            <button type="button" disabled={exportingAudit} onClick={() => void exportAudit('csv')}>{exportingAudit ? ui.exportingAudit : ui.exportAudit}</button>
            <button type="button" disabled={exportingAudit} onClick={() => void exportAudit('pdf')}>{ui.exportPdf}</button>
          </span>
        </div>
        <div className="audit-filter-row">
          <button type="button" className={auditFilter === 'all' ? 'active' : ''} onClick={() => changeAuditFilter('all')}>{ui.auditAll}</button>
          <button type="button" className={auditFilter === 'content' ? 'active' : ''} onClick={() => changeAuditFilter('content')}>{ui.auditContent}</button>
          <button type="button" className={auditFilter === 'roles' ? 'active' : ''} onClick={() => changeAuditFilter('roles')}>{ui.auditRoles}</button>
        </div>
        <div className="audit-date-row">
          <label>
            <span>{ui.auditSearch}</span>
            <input type="search" value={auditSearch} placeholder={ui.auditSearch} onChange={(event) => changeAuditSearch(event.target.value)} />
          </label>
          <label>
            <span>{ui.auditFrom}</span>
            <input type="date" value={auditFrom} onChange={(event) => changeAuditDateRange(event.target.value, auditTo)} />
          </label>
          <label>
            <span>{ui.auditTo}</span>
            <input type="date" value={auditTo} min={auditFrom || undefined} onChange={(event) => changeAuditDateRange(auditFrom, event.target.value)} />
          </label>
          <button type="button" disabled={!auditFrom && !auditTo} onClick={() => changeAuditDateRange('', '')}>{ui.clearDates}</button>
        </div>
        {auditEvents.length === 0 ? (
          <p>{ui.noAudit}</p>
        ) : (
          <ul>
            {auditEvents.map((item) => (
              <li key={item.id}>
                <span>{formatAuditDate(item.created_at)}</span>
                <strong>{ui.auditActions[item.action] ?? item.action}</strong>
                <small>{ui.auditTargets[item.target_type] ?? item.target_type}</small>
                <span>{item.target_id}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="audit-pagination-row">
          <button type="button" disabled={auditPage <= 1} onClick={() => changeAuditPage(auditPage - 1)}>{ui.previousPage}</button>
          <span>{auditPageSummary}</span>
          <button type="button" disabled={auditPage >= auditPageCount} onClick={() => changeAuditPage(auditPage + 1)}>{ui.nextPage}</button>
        </div>
      </div>
    </section>
  )
}

function ReviewQueueScreen({ t, onNotice }: { t: (typeof content)[Lang]; onNotice: (message: string) => void }) {
  const [activeTab, setActiveTab] = useState<'content' | 'roles' | 'audit'>('content')
  const [items, setItems] = useState<ReviewedContentItem[]>([])
  const [contentLoaded, setContentLoaded] = useState(false)
  const [reminders, setReminders] = useState<Array<{ id: string; title: string; expiryDate: string; daysUntilExpiry: number }>>([])
  const [workflowDrafts, setWorkflowDrafts] = useState<Record<string, { assignedReviewer: string; reviewComments: string; rejectionReason: string }>>({})
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [versions, setVersions] = useState<ReviewedContentVersion[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [canReview, setCanReview] = useState(true)
  const [queueStored, setQueueStored] = useState(false)
  const ui = t.dir === 'rtl'
    ? {
        contentTab: 'مراجعة المحتوى',
        rolesTab: 'الصلاحيات',
        auditTab: 'سجل الأمان',
        remindersTitle: 'تنبيهات قرب انتهاء المراجعة',
        expiresSoon: (days: number) => `ينتهي خلال ${days} يوم`,
        assignedReviewer: 'المراجعة المسندة',
        reviewComments: 'تعليقات المراجعة',
        rejectionReason: 'سبب طلب التعديل',
        assign: 'إسناد',
        requestChanges: 'طلب تعديل',
        history: 'السجل',
        versionHistory: 'تاريخ النسخ',
        noHistory: 'لا توجد نسخ محفوظة بعد.',
        changedBy: 'بواسطة',
        loading: 'جار تحميل قائمة المراجعة...',
        reviewer: 'المراجعة',
        specialty: 'التخصص',
        approved: 'اعتمدت',
        expires: 'تنتهي',
        approve: 'اعتماد',
        renew: 'تجديد 6 أشهر',
        expire: 'إنهاء الاعتماد',
        sync: 'تحديث المحتوى المعتمد',
        syncing: 'جار التحديث...',
        authRequirement: 'يتطلب التحديث جلسة مراجعة طبية أو حساب مسؤولة.',
        readOnly: 'أنت في وضع قراءة فقط. سجلي الدخول بحساب مراجعة لتفعيل أدوات الاعتماد والمزامنة.',
        demoMode: 'وضع المعاينة: تظهر الأدوات للتجربة، وقد لا يتم حفظ التغييرات.',
        status: {
          draft: 'مسودة',
          pending_review: 'بانتظار المراجعة',
          approved: 'معتمد',
          expired: 'منتهي',
          retired: 'متقاعد',
        } as Record<string, string>,
        saved: 'تم تحديث حالة المراجعة في وضع العرض التجريبي.',
        synced: (count: number) => `تمت مزامنة ${count} بطاقة مراجعة.`,
        failed: 'تعذر تحديث قائمة المراجعة.',
        syncFailed: 'تعذر التحديث. تأكدي من تسجيل الدخول بحساب مراجعة مناسب.',
        empty: 'لا توجد بطاقات في قائمة المراجعة.',
      }
    : {
        contentTab: 'Content Review',
        rolesTab: 'Reviewer Roles',
        auditTab: 'Audit Trail',
        remindersTitle: 'Review expiry reminders',
        expiresSoon: (days: number) => `Expires in ${days} days`,
        assignedReviewer: 'Assigned reviewer',
        reviewComments: 'Review comments',
        rejectionReason: 'Change-request reason',
        assign: 'Assign',
        requestChanges: 'Request changes',
        history: 'History',
        versionHistory: 'Version history',
        noHistory: 'No saved versions yet.',
        changedBy: 'By',
        loading: 'Loading review queue...',
        reviewer: 'Reviewer',
        specialty: 'Specialty',
        approved: 'Approved',
        expires: 'Expires',
        approve: 'Approve',
        renew: 'Renew 6 months',
        expire: 'Expire',
        sync: 'Update approved content',
        syncing: 'Updating...',
        authRequirement: 'Updating requires a clinical reviewer or admin session.',
        readOnly: 'Read-only mode. Sign in with a reviewer account to enable approval and sync tools.',
        demoMode: 'Preview mode: tools are visible for testing, and changes may not be saved.',
        status: {
          draft: 'Draft',
          pending_review: 'Pending review',
          approved: 'Approved',
          expired: 'Expired',
          retired: 'Retired',
        } as Record<string, string>,
        saved: 'Review status updated in demo mode.',
        synced: (count: number) => `${count} reviewed cards synced.`,
        failed: 'Could not update review queue.',
        syncFailed: 'Could not update. Sign in with an approved reviewer account.',
        empty: 'No cards in the review queue.',
      }

  const formatDate = (value: string) => new Intl.DateTimeFormat(t.dir === 'rtl' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))

  const loadQueue = () => {
    fetch(`/api/review-queue?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
      headers: getAuthHeaders(),
    })
      .then((response) => response.json())
      .then((payload: { data?: { queue?: ReviewedContentItem[]; reminders?: Array<{ id: string; title: string; expiryDate: string; daysUntilExpiry: number }>; canReview?: boolean; stored?: boolean } }) => {
        setItems(payload.data?.queue ?? [])
        setReminders(payload.data?.reminders ?? [])
        setCanReview(payload.data?.canReview ?? false)
        setQueueStored(payload.data?.stored ?? false)
        setContentLoaded(true)
      })
      .catch(() => onNotice(ui.failed))
  }

  useEffect(() => {
    if (activeTab === 'content' && !contentLoaded) loadQueue()
  }, [activeTab, contentLoaded, t.dir])

  useEffect(() => {
    setContentLoaded(false)
  }, [t.dir])

  const applyAction = async (contentId: string, action: 'approve' | 'renew' | 'expire' | 'assign' | 'request_changes') => {
    setBusyId(contentId)
    try {
      const draft = workflowDrafts[contentId]
      const response = await fetch(`/api/review-queue?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ contentId, action, ...draft }),
      })
      if (!response.ok) throw new Error('review update failed')
      const payload = (await response.json()) as { data?: { item?: ReviewedContentItem } }
      if (payload.data?.item) {
        setItems((current) => current.map((item) => item.id === contentId ? payload.data!.item! : item))
      }
      onNotice(ui.saved)
    } catch {
      onNotice(ui.failed)
    } finally {
      setBusyId(null)
    }
  }

  const syncSeeds = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync-reviewed-content', {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('sync failed')
      const payload = (await response.json()) as { data?: { synced?: number } }
      onNotice(ui.synced(payload.data?.synced ?? 0))
      loadQueue()
    } catch {
      onNotice(ui.syncFailed)
    } finally {
      setSyncing(false)
    }
  }

  const updateWorkflowDraft = (contentId: string, field: 'assignedReviewer' | 'reviewComments' | 'rejectionReason', value: string) => {
    setWorkflowDrafts((current) => ({
      ...current,
      [contentId]: {
        assignedReviewer: current[contentId]?.assignedReviewer ?? items.find((item) => item.id === contentId)?.assignedReviewer ?? '',
        reviewComments: current[contentId]?.reviewComments ?? items.find((item) => item.id === contentId)?.reviewComments ?? '',
        rejectionReason: current[contentId]?.rejectionReason ?? items.find((item) => item.id === contentId)?.rejectionReason ?? '',
        [field]: value,
      },
    }))
  }

  const loadHistory = async (contentId: string) => {
    setHistoryId(contentId)
    try {
      const response = await fetch(`/api/review-history?contentId=${encodeURIComponent(contentId)}`, { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('history failed')
      const payload = (await response.json()) as { data?: { versions?: ReviewedContentVersion[] } }
      setVersions(payload.data?.versions ?? [])
    } catch {
      setVersions([])
    }
  }

  const canSync = canReview && queueStored && Boolean(getAuthHeaders().Authorization)

  return (
    <div className="review-library">
      <div className="screen-heading">
        <span className="eyebrow">{t.utility.reviewAdminTitle}</span>
        <h2>{t.utility.reviewAdminTitle}</h2>
        <p>{t.utility.reviewAdminBody}</p>
      </div>
      <div className="admin-tabs" role="tablist" aria-label={t.utility.reviewAdminTitle}>
        <button type="button" className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}>{ui.contentTab}</button>
        <button type="button" className={activeTab === 'roles' ? 'active' : ''} onClick={() => setActiveTab('roles')}>{ui.rolesTab}</button>
        <button type="button" className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}>{ui.auditTab}</button>
      </div>
      {activeTab === 'content' && (
        <>
          <section className="glass-card review-admin-toolbar">
            <Icon name="sync" />
            <span>
              {t.utility.reviewAdminBody}
              <small>{ui.authRequirement}</small>
              {!canSync && <small>{ui.readOnly}</small>}
              {canReview && !queueStored && <small>{ui.demoMode}</small>}
            </span>
            <button type="button" disabled={syncing || !canSync} onClick={() => void syncSeeds()}>
              {syncing ? ui.syncing : ui.sync}
            </button>
          </section>
          {reminders.length > 0 && (
            <section className="glass-card review-reminders">
              <strong>{ui.remindersTitle}</strong>
              <ul>
                {reminders.map((item) => (
                  <li key={item.id}>
                    <span>{item.title}</span>
                    <em>{ui.expiresSoon(item.daysUntilExpiry)}</em>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {items.length === 0 ? (
            <section className="glass-card review-empty">{ui.empty}</section>
          ) : (
            <section className="review-card-list">
              {items.map((item) => {
                const draft = workflowDrafts[item.id] ?? {
                  assignedReviewer: item.assignedReviewer ?? '',
                  reviewComments: item.reviewComments ?? '',
                  rejectionReason: item.rejectionReason ?? '',
                }
                return (
                  <article className={`glass-card review-content-card admin ${item.status}`} key={item.id}>
                    <div className="review-card-heading">
                      <span>{item.stage}</span>
                      <div>
                        {item.workflowStatus && <em>{item.workflowStatus.replace(/_/g, ' ')}</em>}
                        {item.versionNumber && <em>v{item.versionNumber}</em>}
                        <em className={`freshness-pill ${item.status}`}>{ui.status[item.status] ?? item.status}</em>
                        <Icon name="rate_review" />
                      </div>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <dl>
                      <div>
                        <dt>{ui.reviewer}</dt>
                        <dd>{item.reviewerName}</dd>
                      </div>
                      <div>
                        <dt>{ui.specialty}</dt>
                        <dd>{item.reviewerSpecialty}</dd>
                      </div>
                      <div>
                        <dt>{ui.approved}</dt>
                        <dd>{formatDate(item.approvalDate)}</dd>
                      </div>
                      <div>
                        <dt>{ui.expires}</dt>
                        <dd>{formatDate(item.expiryDate)}</dd>
                      </div>
                    </dl>
                    <div className="workflow-box">
                      <input value={draft.assignedReviewer} placeholder={ui.assignedReviewer} onChange={(event) => updateWorkflowDraft(item.id, 'assignedReviewer', event.target.value)} />
                      <textarea value={draft.reviewComments} placeholder={ui.reviewComments} onChange={(event) => updateWorkflowDraft(item.id, 'reviewComments', event.target.value)} />
                      <textarea value={draft.rejectionReason} placeholder={ui.rejectionReason} onChange={(event) => updateWorkflowDraft(item.id, 'rejectionReason', event.target.value)} />
                    </div>
                    <div className="review-actions">
                      <button type="button" disabled={busyId === item.id || !canReview} onClick={() => void applyAction(item.id, 'approve')}>{ui.approve}</button>
                      <button type="button" disabled={busyId === item.id || !canReview} onClick={() => void applyAction(item.id, 'renew')}>{ui.renew}</button>
                      <button type="button" disabled={busyId === item.id || !canReview} onClick={() => void applyAction(item.id, 'expire')}>{ui.expire}</button>
                      <button type="button" disabled={busyId === item.id || !canReview} onClick={() => void applyAction(item.id, 'assign')}>{ui.assign}</button>
                      <button type="button" disabled={busyId === item.id || !canReview} onClick={() => void applyAction(item.id, 'request_changes')}>{ui.requestChanges}</button>
                      <button type="button" onClick={() => void loadHistory(item.id)}>{ui.history}</button>
                    </div>
                    {historyId === item.id && (
                      <div className="version-history">
                        <strong>{ui.versionHistory}</strong>
                        {versions.length === 0 ? <p>{ui.noHistory}</p> : (
                          <ul>
                            {versions.map((version) => (
                              <li key={version.id}>
                                <span>v{version.version_number} · {version.change_action}</span>
                                <small>{ui.changedBy}: {version.changed_by ?? '-'}</small>
                                <small>{formatDate(version.created_at)}</small>
                                <code>{JSON.stringify({
                                  status: version.snapshot.status,
                                  workflow_status: version.snapshot.workflow_status,
                                  assigned_reviewer: version.snapshot.assigned_reviewer,
                                  expiry_date: version.snapshot.expiry_date,
                                })}</code>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </section>
          )}
        </>
      )}
      {activeTab === 'roles' && <ReviewerSessionPanel t={t} onNotice={onNotice} onSessionChange={loadQueue} section="roles" />}
      {activeTab === 'audit' && <ReviewerSessionPanel t={t} onNotice={onNotice} onSessionChange={loadQueue} section="audit" />}
    </div>
  )
}

function SaudiDifferentiationScreen({
  t,
  profile,
  onNotice,
  onNavigate,
}: {
  t: (typeof content)[Lang]
  profile: MotherProfile
  onNotice: (message: string) => void
  onNavigate: (screen: Screen, options?: { reviewedContentId?: string }) => void
}) {
  const [ramadanMode, setRamadanMode] = useState(false)
  const [nameQuery, setNameQuery] = useState('')
  const week = Math.max(1, Math.min(42, profile.pregnancyWeek || calculatePregnancyWeek(profile.dueDate)))
  const babySize = getSaudiBabySize(week)
  const filteredNames = BABY_NAMES.filter((name) => {
    const query = nameQuery.trim().toLowerCase()
    if (!query) return true
    return [name.ar, name.en, name.meaningAr, name.meaningEn, name.tone].join(' ').toLowerCase().includes(query)
  })
  const ui = t.dir === 'rtl'
    ? {
        eyebrow: 'تمييز سعودي',
        title: 'تجربة حمل سعودية أولا',
        body: 'رمضان، الإرشاد الإسلامي، التقويم الهجري والميلادي، مقارنات سعودية لحجم الطفل، الأسماء العربية، والتطعيمات السعودية في مكان واحد.',
        ramadanTitle: 'نمط رمضان للحمل',
        ramadanBody: ramadanMode ? 'مفعل: تذكيرات الترطيب، السحور، الحركة، ومتى تتواصلين مع الطبيبة تظهر بلغة آمنة.' : 'فعليه عند دخول رمضان أو إذا رغبت بمتابعة الصيام مع طبيبتك.',
        ramadanAction: ramadanMode ? 'إيقاف نمط رمضان' : 'تفعيل نمط رمضان',
        ramadanGuidance: ['ناقشي الصيام مع الطبيبة إذا لديك سكري حمل أو قيء شديد أو حمل عالي الخطورة.', 'توقفي واطلبي الرعاية عند الجفاف، الدوخة الشديدة، النزيف، الألم، أو قلة حركة الجنين.', 'رفقة لا تفتي طبيا؛ تعرض تذكيرا آمنا وتحيلك للمحتوى المراجع.'],
        islamicTitle: 'إرشاد إسلامي لطيف',
        islamicBody: 'لغة مطمئنة تحترم الرخصة، الدعاء، وراحة الأم، مع فصل واضح بين الإرشاد العام والرأي الطبي.',
        datesTitle: 'التاريخ الهجري والميلادي',
        today: 'اليوم',
        due: 'موعد الولادة',
        sizeTitle: 'حجم الطفل بمقارنة سعودية',
        namesTitle: 'باحث أسماء عربية',
        namePlaceholder: 'ابحثي بالاسم أو المعنى',
        vaccinesTitle: 'جدول التطعيمات السعودي',
        terminologyTitle: 'مصطلحات طبية عربية محلية',
        terminology: ['حركة الجنين', 'النزيف', 'تقلصات الرحم', 'سكري الحمل', 'ضغط الحمل', 'الرضاعة الطبيعية', 'النفاس', 'الطوارئ'],
        openReviewed: 'فتح المحتوى المراجع',
        saved: 'تم تحديث إعداد النمط السعودي.',
      }
    : {
        eyebrow: 'Saudi Differentiation',
        title: 'Saudi-first pregnancy experience',
        body: 'Ramadan, Islamic guidance, Hijri and Gregorian dates, Saudi baby-size comparisons, Arabic names, and the Saudi vaccination schedule in one place.',
        ramadanTitle: 'Ramadan pregnancy mode',
        ramadanBody: ramadanMode ? 'On: hydration, suhoor, movement, and clinician-contact reminders use safety-first language.' : 'Turn it on during Ramadan or whenever you want fasting-aware pregnancy guidance with your clinician.',
        ramadanAction: ramadanMode ? 'Turn Ramadan mode off' : 'Turn Ramadan mode on',
        ramadanGuidance: ['Discuss fasting with your clinician if you have gestational diabetes, severe vomiting, or high-risk pregnancy.', 'Stop and seek care for dehydration, severe dizziness, bleeding, pain, or reduced fetal movement.', 'RIFQA does not give religious rulings or medical diagnosis; it routes you to reviewed guidance.'],
        islamicTitle: 'Gentle Islamic guidance',
        islamicBody: 'Supportive wording that respects religious ease, dua, and maternal rest, while separating general guidance from medical advice.',
        datesTitle: 'Hijri and Gregorian dates',
        today: 'Today',
        due: 'Due date',
        sizeTitle: 'Saudi baby-size comparison',
        namesTitle: 'Arabic baby-name finder',
        namePlaceholder: 'Search by name or meaning',
        vaccinesTitle: 'Saudi vaccination schedule',
        terminologyTitle: 'Local Arabic medical terminology',
        terminology: ['Fetal movement', 'Bleeding', 'Uterine contractions', 'Gestational diabetes', 'Pregnancy hypertension', 'Breastfeeding', 'Nifas recovery', 'Emergency care'],
        openReviewed: 'Open reviewed content',
        saved: 'Saudi mode setting updated.',
      }

  return (
    <div className="saudi-screen">
      <div className="screen-heading">
        <span className="eyebrow">{ui.eyebrow}</span>
        <h2>{ui.title}</h2>
        <p>{ui.body}</p>
      </div>
      <section className={`glass-card saudi-mode-card ${ramadanMode ? 'active' : ''}`}>
        <Icon name="dark_mode" />
        <span>
          <strong>{ui.ramadanTitle}</strong>
          <small>{ui.ramadanBody}</small>
        </span>
        <button type="button" onClick={() => {
          setRamadanMode((current) => !current)
          onNotice(ui.saved)
        }}>{ui.ramadanAction}</button>
      </section>
      <section className="glass-card saudi-detail-card">
        <div className="card-title"><Icon name="restaurant" /><span>{ui.ramadanTitle}</span></div>
        <ul className="os-highlights">
          {ui.ramadanGuidance.map((item) => (
            <li key={item}><Icon name="check_circle" filled /><span>{item}</span></li>
          ))}
        </ul>
        <button type="button" onClick={() => onNavigate('library', { reviewedContentId: 'ramadan-pregnancy-guidance' })}>{ui.openReviewed}</button>
      </section>
      <section className="glass-card saudi-detail-card">
        <div className="card-title"><Icon name="mosque" /><span>{ui.islamicTitle}</span></div>
        <p>{ui.islamicBody}</p>
        <button type="button" onClick={() => onNavigate('library', { reviewedContentId: 'islamic-pregnancy-ease' })}>{ui.openReviewed}</button>
      </section>
      <section className="glass-card saudi-date-grid">
        <div className="card-title"><Icon name="date_range" /><span>{ui.datesTitle}</span></div>
        <div><span>{ui.today}</span><strong>{formatDualCalendarDate(new Date(), t.dir)}</strong></div>
        <div><span>{ui.due}</span><strong>{formatDualCalendarDate(profile.dueDate, t.dir)}</strong></div>
      </section>
      <section className="glass-card saudi-detail-card">
        <div className="card-title"><Icon name="child_care" /><span>{ui.sizeTitle}</span></div>
        <strong>{t.dir === 'rtl' ? babySize.ar : babySize.en}</strong>
        <p>{t.dir === 'rtl' ? `الأسبوع ${week} · الطول ${babySize.length} · الوزن ${babySize.weight}` : `Week ${week} · length ${babySize.length} · weight ${babySize.weight}`}</p>
      </section>
      <section className="glass-card saudi-name-finder">
        <div className="card-title"><Icon name="badge" /><span>{ui.namesTitle}</span></div>
        <input value={nameQuery} placeholder={ui.namePlaceholder} onChange={(event) => setNameQuery(event.target.value)} />
        <div className="name-grid">
          {filteredNames.slice(0, 6).map((name) => (
            <article key={name.ar}>
              <strong>{t.dir === 'rtl' ? name.ar : name.en}</strong>
              <span>{t.dir === 'rtl' ? name.meaningAr : name.meaningEn}</span>
              <em>{name.tone}</em>
            </article>
          ))}
        </div>
      </section>
      <section className="glass-card saudi-detail-card">
        <div className="card-title"><Icon name="vaccines" /><span>{ui.vaccinesTitle}</span></div>
        <div className="vaccine-schedule-list">
          {SAUDI_VACCINATION_SCHEDULE.map((item) => (
            <div key={item.ageEn}>
              <span>{t.dir === 'rtl' ? item.ageAr : item.ageEn}</span>
              <strong>{t.dir === 'rtl' ? item.vaccineAr : item.vaccineEn}</strong>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onNavigate('library', { reviewedContentId: 'saudi-vaccination-schedule' })}>{ui.openReviewed}</button>
      </section>
      <section className="glass-card terminology-card">
        <div className="card-title"><Icon name="translate" /><span>{ui.terminologyTitle}</span></div>
        <div>{ui.terminology.map((term) => <span key={term}>{term}</span>)}</div>
      </section>
    </div>
  )
}


function PostpartumScreen({
  t,
  profile,
  onProfileChange,
  onNotice,
}: {
  t: (typeof content)[Lang]
  profile: MotherProfile
  onProfileChange: (profile: MotherProfile) => void
  onNotice: (message: string) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [busy, setBusy] = useState(false)
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? today)
  const [deliveryType, setDeliveryType] = useState('vaginal')
  const [recoveryDay, setRecoveryDay] = useState(7)
  const [cSection, setCSection] = useState(false)
  const [sleepHours, setSleepHours] = useState(4)
  const [feedingStress, setFeedingStress] = useState(2)
  const [babyAmount, setBabyAmount] = useState(90)
  const [babyLogType, setBabyLogType] = useState('feeding')
  const [milestoneMonth, setMilestoneMonth] = useState(6)
  const [journalShared, setJournalShared] = useState(false)
  const ui = t.dir === 'rtl'
    ? {
        transition: 'الانتقال لما بعد الولادة',
        birthDate: 'تاريخ الولادة',
        deliveryType: 'نوع الولادة',
        vaginal: 'طبيعية',
        csection: 'قيصرية',
        startPostpartum: 'تفعيل وضع ما بعد الولادة',
        recovery: 'تعافي الأربعين',
        recoveryDay: 'اليوم من الأربعين',
        bleeding: 'نزيف خفيف',
        pain: 'ألم 2 من 5',
        sleep: 'ساعات النوم',
        feedingStress: 'ضغط الرضاعة',
        saveRecovery: 'حفظ تعافي اليوم',
        babyRoutine: 'روتين الطفل',
        logType: 'نوع السجل',
        amount: 'الكمية أو المدة',
        saveBabyLog: 'حفظ سجل الطفل',
        vaccineTitle: 'جدول التطعيمات السعودي',
        saveVaccine: 'حفظ أول تطعيم مستحق',
        milestoneTitle: 'المراحل حتى 36 شهرا',
        milestoneMonth: 'عمر الطفل بالشهور',
        saveMilestone: 'حفظ مرحلة',
        journalTitle: 'سجل الطفل وبطاقة المشاركة',
        privateJournal: 'ذكرى خاصة',
        sharedJournal: 'بطاقة آمنة للعائلة',
        saveJournal: 'حفظ الذكرى',
        saved: 'تم الحفظ في وضع ما بعد الولادة.',
        months: 'شهر',
        logLabels: {
          feeding: 'رضاعة',
          pumping: 'شفط',
          sleep: 'نوم',
          diaper: 'حفاض',
          medication: 'دواء',
        },
      }
    : {
        transition: 'Birth transition',
        birthDate: 'Birth date',
        deliveryType: 'Delivery type',
        vaginal: 'Vaginal',
        csection: 'C-section',
        startPostpartum: 'Turn on postpartum mode',
        recovery: '40-day recovery',
        recoveryDay: 'Recovery day',
        bleeding: 'Light bleeding',
        pain: 'Pain 2 of 5',
        sleep: 'Sleep hours',
        feedingStress: 'Feeding stress',
        saveRecovery: 'Save recovery log',
        babyRoutine: 'Baby routine',
        logType: 'Log type',
        amount: 'Amount or duration',
        saveBabyLog: 'Save baby log',
        vaccineTitle: 'Saudi vaccination schedule',
        saveVaccine: 'Save first due vaccine',
        milestoneTitle: 'Milestones through 36 months',
        milestoneMonth: 'Child age in months',
        saveMilestone: 'Save milestone',
        journalTitle: 'Baby journal and share card',
        privateJournal: 'Private memory',
        sharedJournal: 'Family-safe card',
        saveJournal: 'Save memory',
        saved: 'Saved in postpartum mode.',
        months: 'months',
        logLabels: {
          feeding: 'Feeding',
          pumping: 'Pumping',
          sleep: 'Sleep',
          diaper: 'Diaper',
          medication: 'Medication',
        },
      }

  const postJson = async (url: string, payload: Record<string, unknown>) => {
    setBusy(true)
    try {
      const response = await fetch(url + '?lang=' + (t.dir === 'rtl' ? 'ar' : 'en'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as { data?: { guidance?: string; next?: string; message?: string; shareCard?: string; birthDate?: string } }
      if (url === '/api/birth-transition') {
        onProfileChange({ ...profile, stage: 'postpartum', birthDate: result.data?.birthDate ?? birthDate })
      }
      onNotice(result.data?.guidance ?? result.data?.next ?? result.data?.message ?? result.data?.shareCard ?? ui.saved)
    } catch {
      onNotice(ui.saved)
    } finally {
      setBusy(false)
    }
  }

  const saveRecovery = () => postJson('/api/postpartum-logs', {
    recoveryDay,
    bleeding: 'light',
    painLevel: 2,
    mood: 'steady',
    feedingStress,
    cSection,
    sleepHours,
    feedingMethod: cSection ? 'mixed' : 'breastfeeding',
    note: cSection ? 'C-section incision check included.' : '40-day recovery check.',
  })

  const saveBabyLog = () => postJson('/api/baby-logs', {
    logType: babyLogType,
    amount: babyAmount,
    unit: babyLogType === 'sleep' ? 'hours' : babyLogType === 'diaper' ? 'count' : 'ml',
    note: babyLogType === 'medication' ? 'Given as prescribed by clinician.' : 'Routine baby log.',
  })

  const saveVaccine = () => postJson('/api/vaccine-records', {
    vaccineName: t.dir === 'rtl' ? 'الدرن، التهاب الكبد ب' : 'BCG and Hepatitis B',
    dueAgeMonth: 0,
    completed: false,
    note: t.dir === 'rtl' ? 'راجعي جدول وزارة الصحة مع طبيب الأطفال.' : 'Confirm timing with the pediatrician.',
  })

  const saveMilestone = () => postJson('/api/milestones', {
    childMonth: milestoneMonth,
    title: t.dir === 'rtl' ? 'مرحلة نمو جديدة' : 'New development milestone',
    note: t.dir === 'rtl' ? 'ملاحظة لطيفة عن نمو الطفل.' : 'Gentle note about baby development.',
    completed: false,
  })

  const saveJournal = () => postJson('/api/journal-entries', {
    title: t.dir === 'rtl' ? 'ذكرى من يوم الطفل' : 'Baby day memory',
    body: t.dir === 'rtl' ? 'لحظة صغيرة تستحق الحفظ.' : 'A small moment worth keeping.',
    visibility: journalShared ? 'partner_shared' : 'private',
  })

  return (
    <div className="postpartum-mode os-flow">
      <div className="screen-heading">
        <span className="eyebrow">{t.utility.postpartumTitle}</span>
        <h2>{profile.stage === 'postpartum' ? t.utility.postpartumTitle : ui.transition}</h2>
        <p>{t.utility.postpartumBody}</p>
      </div>

      <section className="glass-card postpartum-panel">
        <div className="card-title"><Icon name="baby_changing_station" /><span>{ui.transition}</span></div>
        <label><span>{ui.birthDate}</span><input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
        <label><span>{ui.deliveryType}</span><select value={deliveryType} onChange={(event) => {
          setDeliveryType(event.target.value)
          setCSection(event.target.value === 'c_section')
        }}>
          <option value="vaginal">{ui.vaginal}</option>
          <option value="c_section">{ui.csection}</option>
        </select></label>
        <button type="button" disabled={busy} onClick={() => void postJson('/api/birth-transition', { birthDate, deliveryType })}>{ui.startPostpartum}</button>
      </section>

      <section className="glass-card postpartum-panel">
        <div className="card-title"><Icon name="spa" /><span>{ui.recovery}</span></div>
        <div className="postpartum-field-grid">
          <label><span>{ui.recoveryDay}</span><input type="number" min="1" max="40" value={recoveryDay} onChange={(event) => setRecoveryDay(Number(event.target.value))} /></label>
          <label><span>{ui.sleep}</span><input type="number" min="0" max="24" step="0.5" value={sleepHours} onChange={(event) => setSleepHours(Number(event.target.value))} /></label>
          <label><span>{ui.feedingStress}</span><input type="number" min="1" max="5" value={feedingStress} onChange={(event) => setFeedingStress(Number(event.target.value))} /></label>
        </div>
        <div className="postpartum-chip-row">
          <span>{ui.bleeding}</span>
          <span>{ui.pain}</span>
          <button type="button" className={cSection ? 'active' : ''} onClick={() => setCSection((current) => !current)}>{ui.csection}</button>
        </div>
        <button type="button" disabled={busy} onClick={() => void saveRecovery()}>{ui.saveRecovery}</button>
      </section>

      <section className="glass-card postpartum-panel">
        <div className="card-title"><Icon name="child_care" /><span>{ui.babyRoutine}</span></div>
        <div className="postpartum-field-grid">
          <label><span>{ui.logType}</span><select value={babyLogType} onChange={(event) => setBabyLogType(event.target.value)}>
            {Object.entries(ui.logLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label><span>{ui.amount}</span><input type="number" min="0" value={babyAmount} onChange={(event) => setBabyAmount(Number(event.target.value))} /></label>
        </div>
        <button type="button" disabled={busy} onClick={() => void saveBabyLog()}>{ui.saveBabyLog}</button>
      </section>

      <section className="glass-card postpartum-panel">
        <div className="card-title"><Icon name="vaccines" /><span>{ui.vaccineTitle}</span></div>
        <div className="vaccine-schedule-list">
          {SAUDI_VACCINATION_SCHEDULE.map((item) => (
            <div key={item.ageEn}>
              <span>{t.dir === 'rtl' ? item.ageAr : item.ageEn}</span>
              <strong>{t.dir === 'rtl' ? item.vaccineAr : item.vaccineEn}</strong>
            </div>
          ))}
        </div>
        <button type="button" disabled={busy} onClick={() => void saveVaccine()}>{ui.saveVaccine}</button>
      </section>

      <section className="glass-card postpartum-panel">
        <div className="card-title"><Icon name="timeline" /><span>{ui.milestoneTitle}</span></div>
        <input type="range" min="0" max="36" value={milestoneMonth} onChange={(event) => setMilestoneMonth(Number(event.target.value))} />
        <strong>{milestoneMonth} {ui.months}</strong>
        <button type="button" disabled={busy} onClick={() => void saveMilestone()}>{ui.saveMilestone}</button>
      </section>

      <section className="glass-card postpartum-panel">
        <div className="card-title"><Icon name="auto_stories" /><span>{ui.journalTitle}</span></div>
        <div className="postpartum-chip-row">
          <button type="button" className={!journalShared ? 'active' : ''} onClick={() => setJournalShared(false)}>{ui.privateJournal}</button>
          <button type="button" className={journalShared ? 'active' : ''} onClick={() => setJournalShared(true)}>{ui.sharedJournal}</button>
        </div>
        <button type="button" disabled={busy} onClick={() => void saveJournal()}>{ui.saveJournal}</button>
      </section>
    </div>
  )
}

type PartnerPermissions = {
  babyProgress: boolean
  appointmentReminders: boolean
  supportPrompts: boolean
  selectedJournalEntries: boolean
  symptoms: boolean
  mentalHealth: boolean
  aiChat: boolean
}

type PartnerInviteRecord = {
  id: string
  partnerName: string
  partnerContact?: string
  inviteCode?: string
  permissions: PartnerPermissions
  active: boolean
}

const DEFAULT_PARTNER_PERMISSIONS: PartnerPermissions = {
  babyProgress: true,
  appointmentReminders: true,
  supportPrompts: true,
  selectedJournalEntries: false,
  symptoms: false,
  mentalHealth: false,
  aiChat: false,
}

function PartnerScreen({ t, onNotice }: { t: (typeof content)[Lang]; onNotice: (message: string) => void }) {
  const [partnerName, setPartnerName] = useState(t.dir === 'rtl' ? 'الشريك' : 'Partner')
  const [partnerContact, setPartnerContact] = useState('')
  const [permissions, setPermissions] = useState<PartnerPermissions>(DEFAULT_PARTNER_PERMISSIONS)
  const [partners, setPartners] = useState<PartnerInviteRecord[]>([])
  const [busy, setBusy] = useState(false)
  const ui = t.dir === 'rtl'
    ? {
        eyebrow: 'وضع الشريك',
        invite: 'دعوة الشريك',
        name: 'اسم الشريك',
        contact: 'رقم أو بريد اختياري',
        sendInvite: 'إرسال الدعوة',
        update: 'تحديث الصلاحيات',
        revoke: 'إلغاء الوصول',
        active: 'نشط',
        revoked: 'ملغى',
        code: 'رمز الدعوة',
        permissions: 'الصلاحيات حسب الفئة',
        shared: 'مشترك',
        hidden: 'مخفي',
        privacyRule: 'الصحة النفسية، الأعراض الحساسة، السجل الخاص، ومحادثات رفقة مخفية افتراضيا.',
        saved: 'تم تحديث وضع الشريك.',
        permissionLabels: {
          babyProgress: 'تقدم الطفل',
          appointmentReminders: 'تذكيرات المواعيد',
          supportPrompts: 'رسائل الدعم',
          selectedJournalEntries: 'ذكريات مختارة فقط',
          symptoms: 'الأعراض الحساسة',
          mentalHealth: 'الصحة النفسية',
          aiChat: 'محادثات رفقة',
        },
        permissionDescriptions: {
          babyProgress: 'مراحل الطفل والتطعيمات والنمو العام.',
          appointmentReminders: 'مواعيد العيادة والتذكيرات العملية.',
          supportPrompts: 'اقتراحات دعم لطيفة للشريك.',
          selectedJournalEntries: 'فقط الذكريات التي تختارين مشاركتها.',
          symptoms: 'مخفية افتراضيا لأنها بيانات صحية حساسة.',
          mentalHealth: 'مخفية افتراضيا ولا تشارك إلا بقرار صريح.',
          aiChat: 'محادثات رفقة تبقى خاصة افتراضيا.',
        },
      }
    : {
        eyebrow: 'Partner Mode',
        invite: 'Partner invite',
        name: 'Partner name',
        contact: 'Optional phone or email',
        sendInvite: 'Send invite',
        update: 'Update permissions',
        revoke: 'Revoke access',
        active: 'Active',
        revoked: 'Revoked',
        code: 'Invite code',
        permissions: 'Permissions by category',
        shared: 'Shared',
        hidden: 'Hidden',
        privacyRule: 'Mental health, sensitive symptoms, private journal, and RIFQA chat are hidden by default.',
        saved: 'Partner mode updated.',
        permissionLabels: {
          babyProgress: 'Baby progress',
          appointmentReminders: 'Appointment reminders',
          supportPrompts: 'Support prompts',
          selectedJournalEntries: 'Selected journal entries',
          symptoms: 'Sensitive symptoms',
          mentalHealth: 'Mental health',
          aiChat: 'RIFQA conversations',
        },
        permissionDescriptions: {
          babyProgress: 'Milestones, vaccines, and general growth.',
          appointmentReminders: 'Clinic visits and practical reminders.',
          supportPrompts: 'Gentle partner support suggestions.',
          selectedJournalEntries: 'Only memories you choose to share.',
          symptoms: 'Hidden by default because this is sensitive health data.',
          mentalHealth: 'Hidden by default unless explicitly enabled.',
          aiChat: 'RIFQA conversations stay private by default.',
        },
      }

  const permissionKeys = Object.keys(DEFAULT_PARTNER_PERMISSIONS) as Array<keyof PartnerPermissions>

  useEffect(() => {
    setPartnerName((current) => {
      if (t.dir === 'rtl' && current === 'Partner') return 'الشريك'
      if (t.dir === 'ltr' && current === 'الشريك') return 'Partner'
      return current
    })
  }, [t.dir])

  useEffect(() => {
    let active = true
    void fetch(`/api/partner-permissions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, { headers: getAuthHeaders() })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { data?: { partners?: PartnerInviteRecord[]; permissions?: PartnerPermissions } } | null) => {
        if (!active || !payload?.data) return
        setPartners(payload.data.partners ?? [])
        if (payload.data.permissions) setPermissions(payload.data.permissions)
      })
      .catch(() => null)
    return () => {
      active = false
    }
  }, [t.dir])

  const saveInvite = async () => {
    setBusy(true)
    try {
      const response = await fetch(`/api/partner-permissions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ partnerName, partnerContact, permissions }),
      })
      const result = (await response.json()) as { data?: { partner?: PartnerInviteRecord; inviteCode?: string } }
      if (result.data?.partner) setPartners((current) => [result.data!.partner!, ...current.filter((item) => item.id !== result.data!.partner!.id)])
      onNotice(result.data?.inviteCode ? `${ui.code}: ${result.data.inviteCode}` : ui.saved)
    } catch {
      onNotice(ui.saved)
    } finally {
      setBusy(false)
    }
  }

  const revokePartner = async (id: string) => {
    setBusy(true)
    try {
      await fetch(`/api/partner-permissions?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id }),
      })
      setPartners((current) => current.map((item) => item.id === id ? { ...item, active: false } : item))
      onNotice(ui.saved)
    } catch {
      onNotice(ui.saved)
    } finally {
      setBusy(false)
    }
  }

  const togglePermission = (key: keyof PartnerPermissions) => {
    setPermissions((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="partner-mode os-flow">
      <div className="screen-heading">
        <span className="eyebrow">{ui.eyebrow}</span>
        <h2>{t.utility.partnerTitle}</h2>
        <p>{t.utility.partnerBody}</p>
      </div>

      <section className="glass-card partner-panel">
        <div className="card-title"><Icon name="person_add" /><span>{ui.invite}</span></div>
        <input value={partnerName} placeholder={ui.name} onChange={(event) => setPartnerName(event.target.value)} />
        <input value={partnerContact} placeholder={ui.contact} onChange={(event) => setPartnerContact(event.target.value)} />
        <p>{ui.privacyRule}</p>
        <button type="button" disabled={busy || !partnerName.trim()} onClick={() => void saveInvite()}>{ui.sendInvite}</button>
      </section>

      <section className="glass-card partner-panel">
        <div className="card-title"><Icon name="admin_panel_settings" /><span>{ui.permissions}</span></div>
        <div className="partner-permission-list">
          {permissionKeys.map((key) => (
            <button key={key} type="button" className={permissions[key] ? 'enabled' : ''} onClick={() => togglePermission(key)}>
              <span>
                <strong>{ui.permissionLabels[key]}</strong>
                <small>{ui.permissionDescriptions[key]}</small>
              </span>
              <em>{permissions[key] ? ui.shared : ui.hidden}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card partner-panel">
        <div className="card-title"><Icon name="diversity_1" /><span>{ui.invite}</span></div>
        {partners.length === 0 ? <p>{ui.privacyRule}</p> : partners.map((partner) => (
          <article className={`partner-invite-row ${partner.active ? '' : 'revoked'}`} key={partner.id}>
            <span>
              <strong>{partner.partnerName}</strong>
              <small>{partner.inviteCode ? `${ui.code}: ${partner.inviteCode}` : partner.partnerContact}</small>
            </span>
            <em>{partner.active ? ui.active : ui.revoked}</em>
            {partner.active && <button type="button" disabled={busy} onClick={() => void revokePartner(partner.id)}>{ui.revoke}</button>}
          </article>
        ))}
      </section>
    </div>
  )
}

function defaultNotificationPreference(lang: Lang): ReminderPreference {
  return {
    channel: 'push',
    dailyCheckinTime: '20:00',
    checkinReminders: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    pregnancyWeekNotifications: true,
    appointmentReminders: true,
    vaccinationReminders: true,
    contentReviewExpiryReminders: true,
    notificationLanguage: lang,
    appointmentReminderTime: '09:00',
    vaccinationReminderTime: '09:00',
  }
}

function NotificationsScreen({ t, profile, onNotice }: { t: (typeof content)[Lang]; profile: MotherProfile; onNotice: (message: string) => void }) {
  const [preference, setPreference] = useState<ReminderPreference>(() => defaultNotificationPreference(t.dir === 'rtl' ? 'ar' : 'en'))
  const [saving, setSaving] = useState(false)
  const langParam = t.dir === 'rtl' ? 'ar' : 'en'
  const ui = t.dir === 'rtl'
    ? {
        eyebrow: 'مركز التنبيهات',
        title: 'تفضيلات التنبيهات',
        body: 'اختاري ما يصل إليك، متى يصلك، وبأي لغة. ساعات الهدوء تمنع التنبيهات غير العاجلة.',
        pregnancy: 'تنبيهات أسبوع الحمل',
        checkin: 'تذكير الفحص اليومي',
        appointment: 'تذكيرات المواعيد',
        vaccination: 'تذكيرات التطعيمات',
        contentReview: 'تذكير انتهاء مراجعة المحتوى للمشرفين',
        quietHours: 'ساعات الهدوء',
        copy: 'نصوص التنبيهات حسب اللغة',
        scheduled: 'التنبيهات الجاهزة',
        language: 'لغة التنبيهات',
        dailyTime: 'وقت الفحص اليومي',
        appointmentTime: 'وقت تذكير الموعد',
        vaccinationTime: 'وقت تذكير التطعيم',
        start: 'البداية',
        end: 'النهاية',
        enabled: 'مفعل',
        disabled: 'متوقف',
        saved: 'تم حفظ تفضيلات التنبيهات.',
        week: 'أسبوع الحمل',
        quietNote: 'التنبيهات الطبية العاجلة لا تنتظر ساعات الهدوء.',
      }
    : {
        eyebrow: 'Notification center',
        title: 'Notification preferences',
        body: 'Choose what reaches you, when it arrives, and which language it uses. Quiet hours hold non-urgent reminders.',
        pregnancy: 'Pregnancy-week notifications',
        checkin: 'Daily check-in reminders',
        appointment: 'Appointment reminders',
        vaccination: 'Vaccination reminders',
        contentReview: 'Admin content review expiry reminders',
        quietHours: 'Quiet hours',
        copy: 'Language-specific notification copy',
        scheduled: 'Ready reminders',
        language: 'Notification language',
        dailyTime: 'Daily check-in time',
        appointmentTime: 'Appointment reminder time',
        vaccinationTime: 'Vaccination reminder time',
        start: 'Start',
        end: 'End',
        enabled: 'On',
        disabled: 'Off',
        saved: 'Notification preferences saved.',
        week: 'Pregnancy week',
        quietNote: 'Urgent medical safety alerts are not delayed by quiet hours.',
      }

  useEffect(() => {
    let active = true
    void fetch(`/api/notifications?lang=${langParam}`, { headers: getAuthHeaders() })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { data?: ReminderPreference } | null) => {
        if (!active || !payload?.data) return
        setPreference({ ...defaultNotificationPreference(langParam), ...payload.data })
      })
      .catch(() => null)
    return () => {
      active = false
    }
  }, [langParam])

  const savePreference = async (next: ReminderPreference) => {
    setPreference(next)
    setSaving(true)
    try {
      const response = await fetch(`/api/notifications?lang=${langParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(next),
      })
      const payload = (await response.json()) as { data?: ReminderPreference }
      if (payload.data) setPreference({ ...defaultNotificationPreference(langParam), ...payload.data })
      onNotice(ui.saved)
    } catch {
      onNotice(ui.saved)
    } finally {
      setSaving(false)
    }
  }

  const setBoolean = (key: keyof Pick<ReminderPreference, 'checkinReminders' | 'pregnancyWeekNotifications' | 'appointmentReminders' | 'vaccinationReminders' | 'contentReviewExpiryReminders'>, value: boolean) => {
    void savePreference({ ...preference, [key]: value })
  }

  const copyItems = Object.entries(preference.copy ?? {})
  const scheduled = preference.scheduled ?? []

  return (
    <div className="notifications-mode os-flow">
      <div className="screen-heading">
        <span className="eyebrow">{ui.eyebrow}</span>
        <h2>{ui.title}</h2>
        <p>{ui.body}</p>
        <p className="care-country-chip">{ui.week}: {profile.pregnancyWeek || 28}</p>
      </div>

      <section className="glass-card notification-panel">
        <div className="card-title"><Icon name="tune" /><span>{ui.title}</span></div>
        <div className="notification-toggle-list">
          {[
            ['pregnancyWeekNotifications', ui.pregnancy],
            ['checkinReminders', ui.checkin],
            ['appointmentReminders', ui.appointment],
            ['vaccinationReminders', ui.vaccination],
            ['contentReviewExpiryReminders', ui.contentReview],
          ].map(([key, label]) => {
            const typedKey = key as keyof Pick<ReminderPreference, 'checkinReminders' | 'pregnancyWeekNotifications' | 'appointmentReminders' | 'vaccinationReminders' | 'contentReviewExpiryReminders'>
            const enabled = Boolean(preference[typedKey])
            return (
              <label key={key}>
                <span>
                  <strong>{label}</strong>
                  <small>{enabled ? ui.enabled : ui.disabled}</small>
                </span>
                <input type="checkbox" checked={enabled} disabled={saving} onChange={(event) => setBoolean(typedKey, event.target.checked)} />
              </label>
            )
          })}
        </div>
      </section>

      <section className="glass-card notification-panel">
        <div className="card-title"><Icon name="schedule" /><span>{ui.quietHours}</span></div>
        <div className="notification-field-grid">
          <label>
            <span>{ui.start}</span>
            <input type="time" value={preference.quietHoursStart} disabled={saving} onChange={(event) => void savePreference({ ...preference, quietHoursStart: event.target.value })} />
          </label>
          <label>
            <span>{ui.end}</span>
            <input type="time" value={preference.quietHoursEnd} disabled={saving} onChange={(event) => void savePreference({ ...preference, quietHoursEnd: event.target.value })} />
          </label>
          <label>
            <span>{ui.dailyTime}</span>
            <input type="time" value={preference.dailyCheckinTime} disabled={saving} onChange={(event) => void savePreference({ ...preference, dailyCheckinTime: event.target.value })} />
          </label>
          <label>
            <span>{ui.appointmentTime}</span>
            <input type="time" value={preference.appointmentReminderTime ?? '09:00'} disabled={saving} onChange={(event) => void savePreference({ ...preference, appointmentReminderTime: event.target.value })} />
          </label>
          <label>
            <span>{ui.vaccinationTime}</span>
            <input type="time" value={preference.vaccinationReminderTime ?? '09:00'} disabled={saving} onChange={(event) => void savePreference({ ...preference, vaccinationReminderTime: event.target.value })} />
          </label>
          <label>
            <span>{ui.language}</span>
            <select value={preference.notificationLanguage ?? langParam} disabled={saving} onChange={(event) => void savePreference({ ...preference, notificationLanguage: event.target.value as Lang })}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <p>{ui.quietNote}</p>
      </section>

      <section className="glass-card notification-panel">
        <div className="card-title"><Icon name="translate" /><span>{ui.copy}</span></div>
        <div className="notification-copy-list">
          {copyItems.map(([key, item]) => (
            <article key={key}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card notification-panel">
        <div className="card-title"><Icon name="notifications_active" /><span>{ui.scheduled}</span></div>
        <div className="notification-copy-list">
          {scheduled.map((item, index) => (
            <article key={`${item.type}-${index}`}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
              {item.scheduledFor && <small>{item.scheduledFor}</small>}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function PrivacyTrustScreen({
  t,
  onNotice,
  settings,
  onSettingsChange,
}: {
  t: (typeof content)[Lang]
  onNotice: (message: string) => void
  settings: PrivacySettings
  onSettingsChange: (settings: PrivacySettings) => void
}) {
  const [consents, setConsents] = useState<ConsentRecord[]>(() => readStoredJson(CONSENT_HISTORY_KEY, []))
  const [requests, setRequests] = useState<PrivacyRequestRecord[]>(() => readStoredJson(PRIVACY_REQUESTS_KEY, []))
  const [busy, setBusy] = useState<string | null>(null)
  const ui = t.dir === 'rtl'
    ? {
        eyebrow: 'مركز الخصوصية',
        aiTitle: 'استخدام سياق الفحص مع رفقة',
        aiBody: 'عند التفعيل، يمكن لرفقة استخدام آخر فحص يومي لتقديم رد أكثر صلة. عند الإيقاف، ترسل الرسالة فقط.',
        lowPiiTitle: 'وضع قليل البيانات',
        lowPiiBody: 'يقلل البيانات الشخصية في التجربة ويجعل المحتوى الصحي والسجلات مملوكة لك.',
        analyticsTitle: 'تحليل المحادثات الخام',
        analyticsBody: 'يبقى متوقفا افتراضيا. لا نستخدم نصوص المحادثات الخام لتحليلات المنتج.',
        enabled: 'مفعل',
        disabled: 'متوقف',
        exportTitle: 'تصدير بياناتي',
        exportBody: 'اطلبي نسخة من بياناتك الصحية وسجلاتك وموافقاتك.',
        deleteTitle: 'حذف حسابي وبياناتي',
        deleteBody: 'اطلبي حذف البيانات الشخصية والصحية. تبقى السلامة والالتزامات النظامية محفوظة حسب الحاجة.',
        exportAction: 'طلب التصدير',
        deleteAction: 'طلب الحذف',
        requesting: 'جار الطلب...',
        consentTitle: 'سجل الموافقات',
        consentEmpty: 'لا توجد موافقات مسجلة في هذا الجهاز بعد.',
        firewallTitle: 'حاجز صاحب العمل وشركة التأمين',
        firewallBody: 'لن يرى أي صاحب عمل أو شركة تأمين حالتك الفردية، مزاجك، حملك، أعراضك، ملاحظاتك، أو محادثات رفقة. التقارير المؤسسية، إن وجدت، تكون إجمالية ومجهولة فقط.',
        requestTitle: 'طلبات الخصوصية',
        requestEmpty: 'لا توجد طلبات خصوصية بعد.',
        saved: 'تم تحديث إعداد الخصوصية.',
        requestSaved: (kind: string) => `تم تنفيذ طلب ${kind}.`,
        deleteConfirm: 'سيتم حذف حسابك وبياناتك المحفوظة. هل تريدين المتابعة؟',
        exportReady: 'تم تجهيز حزمة تصدير البيانات.',
        exportKind: 'التصدير',
        deleteKind: 'الحذف',
        consentLabel: (label: string) => ({
          ai_context_usage: 'استخدام سياق الفحص مع رفقة',
          low_pii_mode: 'وضع قليل البيانات',
          raw_chat_analytics: 'تحليل المحادثات الخام',
        }[label] ?? label),
        statusLabel: (status: string) => status === 'requested' ? 'مطلوب' : status,
        version: 'الإصدار 2026-04-27',
      }
    : {
        eyebrow: 'Privacy Center',
        aiTitle: 'Use check-in context with RIFQA',
        aiBody: 'When enabled, RIFQA can use your latest daily check-in for a more relevant reply. When off, only your message is sent.',
        lowPiiTitle: 'Low-PII mode',
        lowPiiBody: 'Reduces personal data in the experience and keeps health content and logs user-owned.',
        analyticsTitle: 'Raw chat analytics',
        analyticsBody: 'Off by default. We do not use raw chat text for product analytics.',
        enabled: 'On',
        disabled: 'Off',
        exportTitle: 'Export my data',
        exportBody: 'Request a copy of your health data, logs, and consent records.',
        deleteTitle: 'Delete my account and data',
        deleteBody: 'Request deletion of personal and health data. Safety and legal obligations are handled as required.',
        exportAction: 'Request export',
        deleteAction: 'Request deletion',
        requesting: 'Requesting...',
        consentTitle: 'Consent history',
        consentEmpty: 'No consents recorded on this device yet.',
        firewallTitle: 'Employer and insurer firewall',
        firewallBody: 'No employer or insurer can see your individual status, mood, pregnancy, symptoms, notes, or RIFQA conversations. Any B2B reporting is aggregate and anonymous only.',
        requestTitle: 'Privacy requests',
        requestEmpty: 'No privacy requests yet.',
        saved: 'Privacy setting updated.',
        requestSaved: (kind: string) => `${kind} request fulfilled.`,
        deleteConfirm: 'This will delete your saved account and health data. Continue?',
        exportReady: 'Data export bundle is ready.',
        exportKind: 'export',
        deleteKind: 'deletion',
        consentLabel: (label: string) => ({
          ai_context_usage: 'AI context usage',
          low_pii_mode: 'Low-PII mode',
          raw_chat_analytics: 'Raw chat analytics',
        }[label] ?? label),
        statusLabel: (status: string) => status,
        version: 'Version 2026-04-27',
      }

  const formatDate = (value: string) => new Intl.DateTimeFormat(t.dir === 'rtl' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

  useEffect(() => {
    let active = true
    void fetch(`/api/privacy?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
      headers: getAuthHeaders(),
    })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { data?: { settings?: PrivacySettings; consents?: ConsentRecord[]; requests?: PrivacyRequestRecord[] } } | null) => {
        if (!active || !payload?.data) return
        if (payload.data.settings) {
          onSettingsChange(payload.data.settings)
          writeStoredJson(PRIVACY_SETTINGS_KEY, payload.data.settings)
        }
        if (payload.data.consents) {
          setConsents(payload.data.consents)
          writeStoredJson(CONSENT_HISTORY_KEY, payload.data.consents)
        }
        if (payload.data.requests) {
          setRequests(payload.data.requests)
          writeStoredJson(PRIVACY_REQUESTS_KEY, payload.data.requests)
        }
      })
      .catch(() => null)

    return () => {
      active = false
    }
  }, [onSettingsChange, t.dir])

  const saveServerSettings = async (next: PrivacySettings) => {
    await fetch(`/api/privacy?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(next),
    }).catch(() => null)
  }

  const saveConsent = async (label: string, granted: boolean) => {
    const record: ConsentRecord = {
      id: crypto.randomUUID(),
      label,
      granted,
      createdAt: new Date().toISOString(),
    }
    const next = [record, ...consents].slice(0, 8)
    setConsents(next)
    writeStoredJson(CONSENT_HISTORY_KEY, next)
    await fetch(`/api/consents?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ consentType: label, version: '2026-04-27', granted }),
    }).catch(() => null)
  }

  const updateSetting = (key: keyof PrivacySettings, value: boolean, label: string) => {
    const next = { ...settings, [key]: value }
    onSettingsChange(next)
    void saveServerSettings(next)
    void saveConsent(label, value)
    onNotice(ui.saved)
  }

  const requestPrivacy = async (requestType: 'export' | 'delete') => {
    if (requestType === 'delete' && typeof window !== 'undefined' && !window.confirm(ui.deleteConfirm)) return
    setBusy(requestType)
    try {
      const response = await fetch(`/api/privacy?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ requestType, confirmDeletion: requestType === 'delete' }),
      })
      const payload = (await response.json()) as { data?: { id?: string; status?: string; requestType?: 'export' | 'delete'; exportBundle?: unknown } }
      const record: PrivacyRequestRecord = {
        id: payload.data?.id ?? crypto.randomUUID(),
        requestType: payload.data?.requestType ?? requestType,
        status: payload.data?.status ?? 'requested',
        createdAt: new Date().toISOString(),
      }
      const next = [record, ...requests].slice(0, 8)
      setRequests(next)
      writeStoredJson(PRIVACY_REQUESTS_KEY, next)
      if (requestType === 'export' && payload.data?.exportBundle && typeof window !== 'undefined') {
        const blob = new Blob([JSON.stringify(payload.data.exportBundle, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `rifqa-privacy-export-${record.id}.json`
        link.click()
        window.URL.revokeObjectURL(url)
        onNotice(ui.exportReady)
      } else {
        onNotice(ui.requestSaved(requestType === 'export' ? ui.exportKind : ui.deleteKind))
      }
      if (requestType === 'delete') {
        clearStoredJson(KICK_DRAFT_KEY)
        clearStoredJson(CONTRACTION_DRAFT_KEY)
        clearStoredJson(PRIVACY_SETTINGS_KEY)
        clearStoredJson(CONSENT_HISTORY_KEY)
        clearStoredJson(PRIVACY_REQUESTS_KEY)
        persistAccessToken(null)
      }
    } catch {
      onNotice(ui.requestSaved(requestType === 'export' ? ui.exportKind : ui.deleteKind))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="privacy-center">
      <div className="screen-heading">
        <span className="eyebrow">{ui.eyebrow}</span>
        <h2>{t.utility.privacyTitle}</h2>
        <p>{t.utility.privacyBody}</p>
      </div>

      <section className="glass-card privacy-firewall">
        <div className="card-title">
          <Icon name="domain_disabled" />
          <span>{ui.firewallTitle}</span>
        </div>
        <p>{ui.firewallBody}</p>
      </section>

      <section className="privacy-control-grid">
        <PrivacyToggleCard
          title={ui.aiTitle}
          body={ui.aiBody}
          checked={settings.aiContextEnabled}
          enabledLabel={ui.enabled}
          disabledLabel={ui.disabled}
          onChange={(value) => updateSetting('aiContextEnabled', value, 'ai_context_usage')}
        />
        <PrivacyToggleCard
          title={ui.lowPiiTitle}
          body={ui.lowPiiBody}
          checked={settings.lowPiiMode}
          enabledLabel={ui.enabled}
          disabledLabel={ui.disabled}
          onChange={(value) => updateSetting('lowPiiMode', value, 'low_pii_mode')}
        />
        <PrivacyToggleCard
          title={ui.analyticsTitle}
          body={ui.analyticsBody}
          checked={settings.rawChatAnalytics}
          enabledLabel={ui.enabled}
          disabledLabel={ui.disabled}
          onChange={(value) => updateSetting('rawChatAnalytics', value, 'raw_chat_analytics')}
        />
      </section>

      <section className="privacy-actions">
        <button className="glass-card" type="button" disabled={busy !== null} onClick={() => void requestPrivacy('export')}>
          <Icon name="download" />
          <span>
            <strong>{ui.exportTitle}</strong>
            <small>{ui.exportBody}</small>
          </span>
          <em>{busy === 'export' ? ui.requesting : ui.exportAction}</em>
        </button>
        <button className="glass-card danger" type="button" disabled={busy !== null} onClick={() => void requestPrivacy('delete')}>
          <Icon name="delete_forever" />
          <span>
            <strong>{ui.deleteTitle}</strong>
            <small>{ui.deleteBody}</small>
          </span>
          <em>{busy === 'delete' ? ui.requesting : ui.deleteAction}</em>
        </button>
      </section>

      <section className="glass-card privacy-history">
        <div className="card-title">
          <Icon name="history" />
          <span>{ui.consentTitle}</span>
        </div>
        {consents.length === 0 ? (
          <p>{ui.consentEmpty}</p>
        ) : (
          <ul>
            {consents.map((item) => (
              <li key={item.id}>
                <span>{ui.consentLabel(item.label)}</span>
                <strong>{item.granted ? ui.enabled : ui.disabled}</strong>
                <small>{ui.version} · {formatDate(item.createdAt)}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-card privacy-history">
        <div className="card-title">
          <Icon name="assignment_turned_in" />
          <span>{ui.requestTitle}</span>
        </div>
        {requests.length === 0 ? (
          <p>{ui.requestEmpty}</p>
        ) : (
          <ul>
            {requests.map((item) => (
              <li key={item.id}>
                <span>{item.requestType === 'export' ? ui.exportTitle : ui.deleteTitle}</span>
                <strong>{ui.statusLabel(item.status)}</strong>
                <small>{formatDate(item.createdAt)}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PrivacyToggleCard({
  title,
  body,
  checked,
  enabledLabel,
  disabledLabel,
  onChange,
}: {
  title: string
  body: string
  checked: boolean
  enabledLabel: string
  disabledLabel: string
  onChange: (value: boolean) => void
}) {
  return (
    <label className="glass-card privacy-toggle-card">
      <span>
        <strong>{title}</strong>
        <small>{body}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <em>{checked ? enabledLabel : disabledLabel}</em>
    </label>
  )
}

type GrowthReferral = {
  id?: string
  referral_code?: string
  referralCode?: string
  source: string
  campaign?: string | null
  medium?: string | null
  clinic_code?: string | null
  clinicCode?: string | null
  due_date_cohort?: string | null
  dueDateCohort?: string | null
}

type GrowthShareCard = {
  id?: string
  title: string
  body: string
  share_url?: string
  shareUrl?: string
  whatsapp_url?: string
  whatsappUrl?: string
  referral_code?: string
  referralCode?: string
}

function GrowthScreen({ t, profile, onNotice }: { t: (typeof content)[Lang]; profile: MotherProfile; onNotice: (message: string) => void }) {
  const [clinicCode, setClinicCode] = useState(t.dir === 'rtl' ? 'عيادة-رفقة' : 'RIFQA-CLINIC')
  const [campaign, setCampaign] = useState(t.dir === 'rtl' ? 'إطلاق المراحل' : 'milestone-launch')
  const [source, setSource] = useState('milestone_share')
  const [referrals, setReferrals] = useState<GrowthReferral[]>([])
  const [shareCards, setShareCards] = useState<GrowthShareCard[]>([])
  const [cohort, setCohort] = useState<{ cohort_key?: string; due_month?: string; stage?: string } | null>(null)
  const [community, setCommunity] = useState<{ enabled: boolean; moderationRequired: boolean; status: string; reason: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const ui = t.dir === 'rtl'
    ? {
        ready: (code: string) => `الإحالة جاهزة: ${code}`,
        referral: 'رمز الإحالة',
        shareCard: 'بطاقة مشاركة المرحلة',
        whatsapp: 'مشاركة واتساب',
        clinic: 'إسناد رمز الاستجابة للعيادة',
        campaign: 'الحملة أو المصدر',
        source: 'مصدر الإحالة',
        cohort: 'مجموعة موعد الولادة',
        community: 'المجتمع داخل التطبيق',
        delayed: 'مؤجل حتى تجهز أدوات الإشراف',
        create: 'إنشاء حلقة مشاركة',
        openWhatsapp: 'فتح واتساب',
        copyLink: 'نسخ الرابط',
        organic: 'مشاركة واتساب',
        clinicQr: 'رمز العيادة',
        partner: 'دعوة الشريك',
        empty: 'أنشئي أول رمز إحالة وبطاقة مشاركة.',
        copied: 'تم تجهيز رابط المشاركة.',
        badge: 'نماذج النمو مهيأة مع الخصوصية وسلامة المجتمع',
      }
    : {
        ready: (code: string) => `Referral ready: ${code}`,
        referral: 'Referral code',
        shareCard: 'Milestone share card',
        whatsapp: 'WhatsApp share loop',
        clinic: 'Clinic QR attribution',
        campaign: 'Campaign or source',
        source: 'Growth source',
        cohort: 'Due-date cohort',
        community: 'In-app community',
        delayed: 'Delayed until moderation is ready',
        create: 'Create share loop',
        openWhatsapp: 'Open WhatsApp',
        copyLink: 'Copy link',
        organic: 'WhatsApp share',
        clinicQr: 'Clinic QR',
        partner: 'Partner invite',
        empty: 'Create the first referral code and share card.',
        copied: 'Share link prepared.',
        badge: 'Growth models scaffolded with privacy and community safety',
      }

  useEffect(() => {
    setCampaign((current) => {
      if (t.dir === 'rtl' && current === 'milestone-launch') return 'إطلاق المراحل'
      if (t.dir === 'ltr' && current === 'إطلاق المراحل') return 'milestone-launch'
      return current
    })
    setClinicCode((current) => {
      if (t.dir === 'rtl' && current === 'RIFQA-CLINIC') return 'عيادة-رفقة'
      if (t.dir === 'ltr' && current === 'عيادة-رفقة') return 'RIFQA-CLINIC'
      return current
    })
  }, [t.dir])

  const sourceLabel = (value: string) => ({
    milestone_share: ui.organic,
    clinic_qr: ui.clinicQr,
    partner_invite: ui.partner,
  }[value] ?? value)

  const displayCode = (value?: string | null) => {
    if (value) return value
    return t.dir === 'rtl' ? 'رفقة-تجريبي' : 'RIFQA-DEMO'
  }

  const displayCohort = (value?: string | null) => {
    if (!value) return '-'
    if (t.dir !== 'rtl') return value
    const [year, month] = value.split('-')
    const date = new Date(`${year}-${month ?? '01'}-01T00:00:00Z`)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(date)
  }

  const localizeReferral = (item: GrowthReferral): GrowthReferral => {
    if (t.dir !== 'rtl') return item
    return {
      ...item,
      referral_code: item.referral_code?.replace(/^RIFQA-DEMO$/, 'رفقة-تجريبي').replace(/^RIFQA-/, 'رفقة-'),
      referralCode: item.referralCode?.replace(/^RIFQA-DEMO$/, 'رفقة-تجريبي').replace(/^RIFQA-/, 'رفقة-'),
      source: sourceLabel(item.source),
      campaign: item.campaign === 'milestone-launch' ? 'إطلاق المراحل' : item.campaign,
      clinic_code: item.clinic_code === 'RIFQA-CLINIC' ? 'عيادة-رفقة' : item.clinic_code,
      clinicCode: item.clinicCode === 'RIFQA-CLINIC' ? 'عيادة-رفقة' : item.clinicCode,
      due_date_cohort: displayCohort(item.due_date_cohort),
      dueDateCohort: displayCohort(item.dueDateCohort),
    }
  }

  useEffect(() => {
    let active = true
    void fetch(`/api/referrals?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, { headers: getAuthHeaders() })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { data?: { referrals?: GrowthReferral[]; shareCards?: GrowthShareCard[]; cohort?: { cohort_key?: string; due_month?: string; stage?: string } | null; community?: { enabled: boolean; moderationRequired: boolean; status: string; reason: string } } } | null) => {
        if (!active || !payload?.data) return
        setReferrals((payload.data.referrals ?? []).map(localizeReferral))
        setShareCards(payload.data.shareCards ?? [])
        setCohort(payload.data.cohort ?? null)
        setCommunity(payload.data.community ?? null)
      })
      .catch(() => null)
    return () => {
      active = false
    }
  }, [t.dir])

  const createReferral = async () => {
    setBusy(true)
    try {
      const response = await fetch(`/api/referrals?lang=${t.dir === 'rtl' ? 'ar' : 'en'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          source,
          campaign,
          medium: source === 'clinic_qr' ? 'qr' : 'whatsapp',
          clinicCode: source === 'clinic_qr' ? clinicCode : '',
          milestone: t.dir === 'rtl' ? `الأسبوع ${profile.pregnancyWeek}` : `Week ${profile.pregnancyWeek}`,
          dueDate: profile.dueDate,
          stage: profile.stage,
          landingPath: '/growth',
        }),
      })
      const result = (await response.json()) as { data?: { referralCode?: string; source: string; campaign?: string | null; clinicCode?: string | null; dueDateCohort?: string | null; shareCard?: GrowthShareCard; community?: { enabled: boolean; moderationRequired: boolean; status: string; reason: string } } }
      if (result.data?.referralCode) {
        setReferrals((current) => [{
          referralCode: result.data!.referralCode,
          source: sourceLabel(result.data!.source),
          campaign: t.dir === 'rtl' && result.data!.campaign === 'milestone-launch' ? 'إطلاق المراحل' : result.data!.campaign,
          clinicCode: t.dir === 'rtl' && result.data!.clinicCode === 'RIFQA-CLINIC' ? 'عيادة-رفقة' : result.data!.clinicCode,
          dueDateCohort: displayCohort(result.data!.dueDateCohort),
        }, ...current].slice(0, 8))
      }
      if (result.data?.shareCard) setShareCards((current) => [result.data!.shareCard!, ...current].slice(0, 8))
      if (result.data?.dueDateCohort) setCohort({ cohort_key: result.data.dueDateCohort, stage: profile.stage })
      if (result.data?.community) setCommunity(result.data.community)
      onNotice(result.data?.referralCode ? ui.ready(result.data.referralCode) : t.saved)
    } catch {
      onNotice(t.saved)
    } finally {
      setBusy(false)
    }
  }

  const shareLatest = async (card: GrowthShareCard) => {
    const link = card.whatsappUrl ?? card.whatsapp_url ?? card.shareUrl ?? card.share_url ?? ''
    if (typeof window !== 'undefined' && link) window.open(link, '_blank', 'noopener,noreferrer')
    onNotice(ui.copied)
  }

  const latestReferral = referrals[0]
  const latestCode = displayCode(latestReferral?.referralCode ?? latestReferral?.referral_code)
  const latestCard = shareCards[0]

  return (
    <div className="growth-mode os-flow">
      <div className="screen-heading">
        <span className="eyebrow">{t.utility.growthTitle}</span>
        <h2>{t.utility.growthTitle}</h2>
        <p>{t.utility.growthBody}</p>
      </div>

      <section className="glass-card growth-panel">
        <div className="card-title"><Icon name="ios_share" /><span>{ui.referral}</span></div>
        <strong className="growth-code">{latestCode}</strong>
        <div className="growth-field-grid">
          <label>
            <span>{ui.source}</span>
            <select value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="milestone_share">{ui.organic}</option>
              <option value="clinic_qr">{ui.clinicQr}</option>
              <option value="partner_invite">{ui.partner}</option>
            </select>
          </label>
          <label>
            <span>{ui.campaign}</span>
            <input value={campaign} onChange={(event) => setCampaign(event.target.value)} />
          </label>
          <label>
            <span>{ui.clinic}</span>
            <input value={clinicCode} disabled={source !== 'clinic_qr'} onChange={(event) => setClinicCode(event.target.value)} />
          </label>
          <label>
            <span>{ui.cohort}</span>
            <input value={displayCohort(cohort?.cohort_key ?? latestReferral?.dueDateCohort ?? latestReferral?.due_date_cohort)} readOnly />
          </label>
        </div>
        <button type="button" disabled={busy} onClick={() => void createReferral()}>{ui.create}</button>
      </section>

      <section className="glass-card growth-panel">
        <div className="card-title"><Icon name="featured_seasonal_and_gifts" /><span>{ui.shareCard}</span></div>
        {latestCard ? (
          <article className="growth-share-card">
            <strong>{latestCard.title}</strong>
            <p>{latestCard.body}</p>
            <div>
              <button type="button" onClick={() => void shareLatest(latestCard)}><Icon name="chat" />{ui.openWhatsapp}</button>
              <button type="button" onClick={() => void navigator.clipboard?.writeText(latestCard.shareUrl ?? latestCard.share_url ?? '').then(() => onNotice(ui.copied)).catch(() => onNotice(ui.copied))}><Icon name="link" />{ui.copyLink}</button>
            </div>
          </article>
        ) : <p>{ui.empty}</p>}
      </section>

      <section className="glass-card growth-panel">
        <div className="card-title"><Icon name="qr_code_2" /><span>{ui.clinic}</span></div>
        <div className="growth-attribution-list">
          {referrals.length === 0 ? <p>{ui.empty}</p> : referrals.map((item, index) => (
            <article key={`${item.referral_code ?? item.referralCode}-${index}`}>
              <strong>{item.referral_code ?? item.referralCode}</strong>
              <span>{item.source}{item.campaign ? ` · ${item.campaign}` : ''}</span>
              <small>{item.clinic_code ?? item.clinicCode ?? item.due_date_cohort ?? item.dueDateCohort ?? '-'}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card growth-panel">
        <div className="card-title"><Icon name="groups" /><span>{ui.community}</span></div>
        <div className="growth-community-gate">
          <Icon name="shield_lock" />
          <span>
            <strong>{community?.enabled ? ui.community : ui.delayed}</strong>
            <small>{community?.reason ?? ui.delayed}</small>
          </span>
        </div>
        <div className="review-badge">
          <Icon name="verified" filled />
          <span>{ui.badge}</span>
        </div>
      </section>
    </div>
  )
}
function UtilityScreen({
  title,
  body,
  icon,
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  title: string
  body: string
  icon: string
  primary: string
  secondary: string
  onPrimary: () => void
  onSecondary: () => void
}) {
  return (
    <div className="utility-screen">
      <section className="glass-card utility-card">
        <span className="utility-icon">
          <Icon name={icon} />
        </span>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="utility-actions">
          <button type="button" onClick={onPrimary}>{primary}</button>
          <button type="button" onClick={onSecondary}>{secondary}</button>
        </div>
      </section>
    </div>
  )
}

function BottomNav({ active, items, onNavigate }: { active: Screen; items: NavItem[]; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="bottom-nav" aria-label="navigation">
      {items.map((item) => (
        <button key={item.id} type="button" className={active === item.id ? 'active' : ''} onClick={() => onNavigate(item.id)}>
          <Icon name={item.icon} filled={active === item.id} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default App
