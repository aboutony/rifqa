import type { ApiLang } from './http.js'
import { assessText, type SafetyAssessment, type SafetyLevel } from './safety.js'

export type ReviewedContent = {
  id: string
  stage: 'pregnancy' | 'postpartum' | 'baby_0_3' | 'ramadan' | 'islamic'
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

export type ReviewAction = 'approve' | 'renew' | 'expire' | 'retire' | 'assign' | 'request_changes'

export type ReviewedContentPersistedRow = {
  id: string
  stage?: ReviewedContent['stage'] | null
  title?: string | null
  summary?: string | null
  reviewer_name?: string | null
  reviewer_specialty?: string | null
  approval_date?: string | null
  expiry_date?: string | null
  status?: ReviewedContent['status'] | null
  citations?: string[] | null
  workflow_status?: ReviewedContent['workflowStatus'] | null
  assigned_reviewer?: string | null
  review_comments?: string | null
  rejection_reason?: string | null
  version_number?: number | null
}

export type CareRoute = {
  level: SafetyLevel
  route: 'self_care' | 'ob_gyn' | 'family_medicine' | 'emergency' | 'mental_health' | 'telehealth'
  title: string
  guidance: string
  actions: string[]
  resources: Array<{ label: string; kind: 'moh' | 'hospital' | 'telehealth' | 'trusted_contact' }>
  assessment: SafetyAssessment
}

export type MaternalOsCapability = {
  id: string
  title: string
  owner: 'tracker' | 'safety' | 'care' | 'ai' | 'family' | 'postpartum' | 'privacy' | 'growth'
  status: 'active' | 'scaffolded' | 'requires_ops'
  promise: string
}

export const capabilities: MaternalOsCapability[] = [
  {
    id: 'complete-pregnancy-tracker',
    title: 'Complete pregnancy tracker',
    owner: 'tracker',
    status: 'active',
    promise: 'Kick counts, contractions, weight, symptoms, timeline, weekly development, and doctor visit prep.',
  },
  {
    id: 'clinical-review-cms',
    title: 'Clinical review content CMS',
    owner: 'safety',
    status: 'scaffolded',
    promise: 'Every health card can carry reviewer, specialty, citations, approval date, and expiry.',
  },
  {
    id: 'saudi-care-routing',
    title: 'Saudi care navigation',
    owner: 'care',
    status: 'active',
    promise: 'Rule-based guidance for OB-GYN, family medicine, emergency care, telehealth, and mental health.',
  },
  {
    id: 'bounded-ai-companion',
    title: 'Bounded AI companion',
    owner: 'ai',
    status: 'active',
    promise: 'AI comforts and explains, while deterministic safety rules control escalation.',
  },
  {
    id: 'partner-permissions',
    title: 'Partner permissions',
    owner: 'family',
    status: 'scaffolded',
    promise: 'Partner can see baby progress and support prompts; mental health remains hidden by default.',
  },
  {
    id: 'postpartum-baby-continuity',
    title: 'Postpartum and baby continuity',
    owner: 'postpartum',
    status: 'scaffolded',
    promise: 'Recovery, feeding, diapers, sleep, vaccines, milestones, and baby journal records.',
  },
  {
    id: 'privacy-trust-center',
    title: 'Privacy and trust center',
    owner: 'privacy',
    status: 'active',
    promise: 'Low-PII mode, consent history, delete/export, AI controls, and B2B firewall promises.',
  },
  {
    id: 'growth-community-loops',
    title: 'Growth and community loops',
    owner: 'growth',
    status: 'scaffolded',
    promise: 'Referral codes, clinic QR attribution, share cards, and community moderation readiness.',
  },
]

const reviewedContent: Record<ApiLang, ReviewedContent[]> = {
  ar: [
    {
      id: 'reduced-movement',
      stage: 'pregnancy',
      title: 'قلة حركة الجنين',
      summary: 'ابدئي جلسة عد ركلات بهدوء. إذا بقيت الحركة أقل بوضوح من المعتاد، تواصلي مع الطبيبة أو الطوارئ.',
      reviewerName: 'د. ليلى الراشد',
      reviewerSpecialty: 'نساء وولادة، مراجعة صحة الأم في السعودية',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['إرشادات وزارة الصحة السعودية لعلامات الخطر في الحمل', 'إرشادات حركة الجنين من الكلية الأمريكية لأطباء النساء والتوليد'],
    },
    {
      id: 'forty-day-recovery',
      stage: 'postpartum',
      title: 'تعافي الأربعين',
      summary: 'تابعي النزيف، الألم، النوم، ضغط الرضاعة، والمزاج. النزيف الغزير أو الحمى أو الألم الشديد أو الشعور بعدم الأمان يحتاج دعما عاجلا.',
      reviewerName: 'د. سارة الحربي',
      reviewerSpecialty: 'طب الأسرة ورعاية ما بعد الولادة',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['إرشادات وزارة الصحة السعودية لما بعد الولادة', 'إرشادات منظمة الصحة العالمية لرعاية ما بعد الولادة'],
    },
    {
      id: 'urgent-pregnancy-signs',
      stage: 'pregnancy',
      title: 'علامات الحمل العاجلة',
      summary: 'النزيف، الألم الشديد، صداع شديد مع زغللة، تورم مفاجئ، حرارة عالية، أو قلة حركة واضحة تحتاج تواصلا عاجلا مع الطبيبة أو الطوارئ.',
      reviewerName: 'د. ليلى الراشد',
      reviewerSpecialty: 'نساء وولادة، مراجعة علامات الخطر في الحمل',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['إرشادات وزارة الصحة السعودية لعلامات الخطر في الحمل', 'إرشادات منظمة الصحة العالمية للرعاية أثناء الحمل'],
    },
    {
      id: 'postpartum-warning-signs',
      stage: 'postpartum',
      title: 'علامات الخطر بعد الولادة',
      summary: 'النزيف الغزير، الحمى، ألم الصدر، ضيق النفس، ألم الساق الشديد، صداع شديد، أو الشعور بعدم الأمان يحتاج دعما طبيا عاجلا.',
      reviewerName: 'د. سارة الحربي',
      reviewerSpecialty: 'طب الأسرة ورعاية ما بعد الولادة',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['إرشادات وزارة الصحة السعودية لما بعد الولادة', 'إرشادات منظمة الصحة العالمية لرعاية ما بعد الولادة'],
    },
    {
      id: 'exercise-safety',
      stage: 'pregnancy',
      title: 'سلامة الحركة والتمارين',
      summary: 'الحركة الخفيفة غالبا مفيدة إذا لم توجد أعراض مقلقة أو منع طبي. توقفي واطلبي الرعاية عند النزيف، الدوخة الشديدة، ألم الصدر، ضيق النفس، أو تقلصات مؤلمة.',
      reviewerName: 'د. نورة العتيبي',
      reviewerSpecialty: 'طب نساء وولادة وطب نمط الحياة',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['إرشادات الكلية الأمريكية لأطباء النساء والتوليد حول النشاط البدني أثناء الحمل', 'إرشادات وزارة الصحة السعودية لنمط الحياة الصحي'],
    },
    {
      id: 'mental-health-support',
      stage: 'pregnancy',
      title: 'الدعم النفسي أثناء الحمل وما بعده',
      summary: 'القلق، الحزن المستمر، الهلع، أو الشعور بعدم الأمان يستحق دعما واضحا. اطلبي مساعدة مختصة أو شخصا موثوقا، واطلبي الطوارئ إذا شعرت أنك قد تؤذين نفسك.',
      reviewerName: 'د. مها القحطاني',
      reviewerSpecialty: 'طب نفسي للمرأة والصحة النفسية المحيطة بالولادة',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['إرشادات منظمة الصحة العالمية للصحة النفسية للأمهات', 'موارد وزارة الصحة السعودية للصحة النفسية'],
    },
    {
      id: 'ramadan-pregnancy-guidance',
      stage: 'ramadan',
      title: 'الحمل في رمضان',
      summary: 'قرار الصيام أثناء الحمل فردي ويحتاج رأي الطبيبة، خصوصا مع سكري الحمل، القيء الشديد، الجفاف، قلة الحركة، أو الحمل عالي الخطورة. الأولوية دائما لسلامتك وسلامة الطفل.',
      reviewerName: 'د. هناء الزهراني',
      reviewerSpecialty: 'نساء وولادة ورعاية الحمل في رمضان',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['إرشادات الرعاية أثناء الحمل في رمضان', 'إرشادات وزارة الصحة السعودية للتغذية والترطيب'],
    },
  ],
  en: [
    {
      id: 'reduced-movement',
      stage: 'pregnancy',
      title: 'Reduced fetal movement',
      summary: 'Start a calm kick-count session. If movement remains clearly lower than usual, contact your clinician or emergency care.',
      reviewerName: 'Dr. Layla Al-Rashid',
      reviewerSpecialty: 'OB-GYN, Saudi maternal health review',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['Saudi MOH pregnancy warning signs', 'ACOG fetal movement guidance'],
    },
    {
      id: 'forty-day-recovery',
      stage: 'postpartum',
      title: '40-day recovery',
      summary: 'Track bleeding, pain, sleep, feeding stress, and mood. Heavy bleeding, fever, severe pain, or unsafe feelings need urgent support.',
      reviewerName: 'Dr. Sara Al-Harbi',
      reviewerSpecialty: 'Family medicine and postpartum care',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['Saudi MOH postpartum care', 'WHO postnatal care guidance'],
    },
    {
      id: 'urgent-pregnancy-signs',
      stage: 'pregnancy',
      title: 'Urgent pregnancy warning signs',
      summary: 'Bleeding, severe pain, severe headache with vision changes, sudden swelling, high fever, or clearly reduced movement needs urgent contact with your clinician or emergency care.',
      reviewerName: 'Dr. Layla Al-Rashid',
      reviewerSpecialty: 'OB-GYN, pregnancy warning-sign review',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['Saudi MOH pregnancy warning signs', 'WHO antenatal care guidance'],
    },
    {
      id: 'postpartum-warning-signs',
      stage: 'postpartum',
      title: 'Postpartum warning signs',
      summary: 'Heavy bleeding, fever, chest pain, shortness of breath, severe leg pain, severe headache, or unsafe feelings need urgent medical support.',
      reviewerName: 'Dr. Sara Al-Harbi',
      reviewerSpecialty: 'Family medicine and postpartum care',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['Saudi MOH postpartum care', 'WHO postnatal care guidance'],
    },
    {
      id: 'exercise-safety',
      stage: 'pregnancy',
      title: 'Exercise and movement safety',
      summary: 'Gentle movement is often helpful if there are no concerning symptoms or clinician restrictions. Stop and seek care for bleeding, severe dizziness, chest pain, shortness of breath, or painful contractions.',
      reviewerName: 'Dr. Noura Al-Otaibi',
      reviewerSpecialty: 'OB-GYN and lifestyle medicine',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['ACOG physical activity during pregnancy guidance', 'Saudi MOH healthy lifestyle guidance'],
    },
    {
      id: 'mental-health-support',
      stage: 'pregnancy',
      title: 'Mental health support during and after pregnancy',
      summary: 'Anxiety, persistent sadness, panic, or unsafe feelings deserve clear support. Contact a specialist or trusted person, and seek emergency help if you may harm yourself.',
      reviewerName: 'Dr. Maha Al-Qahtani',
      reviewerSpecialty: 'Women’s mental health and perinatal psychiatry',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['WHO maternal mental health resources', 'Saudi MOH mental health resources'],
    },
    {
      id: 'ramadan-pregnancy-guidance',
      stage: 'ramadan',
      title: 'Pregnancy during Ramadan',
      summary: 'Fasting during pregnancy is an individual decision that needs clinician guidance, especially with gestational diabetes, severe vomiting, dehydration, reduced movement, or high-risk pregnancy. Safety comes first.',
      reviewerName: 'Dr. Hana Al-Zahrani',
      reviewerSpecialty: 'OB-GYN and Ramadan pregnancy care',
      approvalDate: '2026-04-27',
      expiryDate: '2026-10-27',
      status: 'approved',
      citations: ['Ramadan pregnancy care guidance', 'Saudi MOH nutrition and hydration guidance'],
    },
  ],
}

const additionalSaudiReviewedContent: Record<ApiLang, ReviewedContent[]> = {
  ar: [
    {
      id: 'saudi-vaccination-schedule',
      stage: 'baby_0_3',
      topic: 'vaccines',
      title: 'جدول التطعيمات السعودي للطفل',
      summary: 'راجعي مواعيد التطعيمات حسب جدول وزارة الصحة، واحتفظي بتاريخ كل جرعة وأي ملاحظات بعد التطعيم.',
      body: 'تطعيمات الطفل في السعودية تتبع جدولا محددا حسب العمر. استخدمي رفقة لتسجيل موعد الجرعة، تاريخ أخذها، واسم المركز. إذا ظهرت حرارة خفيفة أو انزعاج بعد التطعيم فغالبا يمكن مراقبتها حسب إرشادات الطبيب، أما صعوبة التنفس، تورم شديد، خمول غير معتاد، أو حرارة عالية فتحتاج تواصلا طبيا عاجلا.',
      reviewerName: 'د. ريم الغامدي',
      reviewerSpecialty: 'طب أطفال وطب وقائي',
      reviewerProfile: {
        name: 'د. ريم الغامدي',
        specialty: 'طب أطفال وطب وقائي',
        organization: 'مراجعة إرشادات صحة الطفل في السعودية',
        bio: 'تركز على التطعيمات، الوقاية، ونمو الطفل في السنوات الأولى.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['جدول التطعيمات الوطني السعودي', 'إرشادات وزارة الصحة السعودية لصحة الطفل'],
      citationDetails: [
        { title: 'جدول التطعيمات الوطني السعودي', source: 'وزارة الصحة السعودية', year: '2026' },
        { title: 'إرشادات صحة الطفل', source: 'وزارة الصحة السعودية', year: '2026' },
      ],
    },
    {
      id: 'cchi-insurance-maternity',
      stage: 'pregnancy',
      topic: 'care_navigation',
      title: 'التأمين وتغطية رعاية الحمل في السعودية',
      summary: 'قبل الحجز غير العاجل، تحققي من الشبكة الطبية، الموافقات، وتغطية متابعة الحمل والولادة حسب وثيقة التأمين.',
      body: 'في السعودية قد تختلف تغطية متابعة الحمل والولادة حسب شركة التأمين، الشبكة الطبية، ونوع الوثيقة. راجعي بطاقة التأمين أو تطبيق شركة التأمين قبل الزيارة غير العاجلة، واسألي عن الموافقات المطلوبة، المستشفى داخل الشبكة، وتغطية الطوارئ. لا تؤخري الطوارئ الطبية بسبب إجراءات التأمين.',
      reviewerName: 'أ. نوف العبدالله',
      reviewerSpecialty: 'حوكمة صحية وتجربة مريض',
      reviewerProfile: {
        name: 'أ. نوف العبدالله',
        specialty: 'حوكمة صحية وتجربة مريض',
        organization: 'مراجعة مسارات الرعاية والتأمين',
        bio: 'تراجع لغة التوجيه الإداري والتأميني حتى تكون مفهومة وغير مخيفة للأم.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['إرشادات مجلس الضمان الصحي للتأمين الصحي', 'سياسات تغطية خدمات الأمومة في السعودية'],
      citationDetails: [
        { title: 'حقوق المؤمن لهم', source: 'مجلس الضمان الصحي', year: '2026' },
        { title: 'تغطية خدمات الأمومة', source: 'مراجعة سياسات التأمين الصحي', year: '2026' },
      ],
    },
    {
      id: 'saudi-telehealth-resources',
      stage: 'pregnancy',
      topic: 'telehealth',
      title: 'متى تستخدمين الاستشارة الصحية عن بعد؟',
      summary: 'الاستشارة عن بعد مناسبة للأسئلة غير العاجلة، مراجعة الأعراض الخفيفة، والتحضير للزيارة، لكنها لا تستبدل الطوارئ.',
      body: 'يمكن أن تساعدك الاستشارة الصحية عن بعد في الأسئلة غير العاجلة مثل التحضير للموعد، فهم نتيجة بسيطة، أو سؤال عن عرض خفيف. عند النزيف، الألم الشديد، قلة حركة الجنين، ضيق النفس، ألم الصدر، أو الشعور بعدم الأمان، اختاري الطوارئ أو تواصلي مباشرة مع جهة الرعاية.',
      reviewerName: 'د. ليلى الراشد',
      reviewerSpecialty: 'نساء وولادة، مراجعة مسارات الرعاية',
      reviewerProfile: {
        name: 'د. ليلى الراشد',
        specialty: 'نساء وولادة',
        organization: 'مراجعة مسارات الرعاية السعودية',
        bio: 'تراجع محتوى الحمل عالي الحساسية ومسارات التصعيد الآمن.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['إرشادات وزارة الصحة السعودية للخدمات الصحية عن بعد', 'إرشادات علامات الخطر في الحمل'],
      citationDetails: [
        { title: 'الخدمات الصحية عن بعد', source: 'وزارة الصحة السعودية', year: '2026' },
        { title: 'علامات الخطر في الحمل', source: 'وزارة الصحة السعودية', year: '2026' },
      ],
    },
    {
      id: 'hajj-umrah-pregnancy',
      stage: 'pregnancy',
      topic: 'travel',
      title: 'الحمل والعمرة أو الحج',
      summary: 'الازدحام، المشي الطويل، الحرارة، والجفاف عوامل مهمة. ناقشي السفر أو المناسك مع طبيبتك، خصوصا مع الحمل عالي الخطورة.',
      body: 'قبل العمرة أو الحج أثناء الحمل، راجعي طبيبتك للتأكد من ملاءمة السفر والمشي والازدحام لحالتك. حضري خطة للراحة، السوائل، الأدوية المسموحة، أقرب نقطة رعاية، وأعراض التوقف مثل الدوخة الشديدة، النزيف، الألم، قلة الحركة، أو الانقباضات المؤلمة.',
      reviewerName: 'د. هناء الزهراني',
      reviewerSpecialty: 'نساء وولادة ورعاية الحمل في المواسم الدينية',
      reviewerProfile: {
        name: 'د. هناء الزهراني',
        specialty: 'نساء وولادة',
        organization: 'مراجعة الحمل في رمضان والحج والعمرة',
        bio: 'تراجع المحتوى الذي يجمع بين الرعاية الطبية والسياق الديني المحلي.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['إرشادات الصحة العامة للحج والعمرة', 'إرشادات الرعاية أثناء الحمل'],
      citationDetails: [
        { title: 'إرشادات الصحة العامة للحج والعمرة', source: 'وزارة الصحة السعودية', year: '2026' },
        { title: 'الرعاية أثناء الحمل', source: 'إرشادات سريرية معتمدة', year: '2026' },
      ],
    },
    {
      id: 'gestational-diabetes-ksa',
      stage: 'pregnancy',
      topic: 'conditions',
      title: 'سكري الحمل والمتابعة اليومية',
      summary: 'سكري الحمل يحتاج خطة واضحة للغذاء، الحركة، قياس السكر، ومواعيد المتابعة. لا تغيري الدواء أو الجرعات دون الطبيبة.',
      body: 'إذا كان لديك سكري حمل، فالأهم هو الالتزام بخطة الفريق الطبي: مواعيد القياس، الوجبات، الحركة المناسبة، والمتابعة. سجلي القراءات والأسئلة قبل الموعد. اطلبِ رعاية عاجلة عند الإغماء، قيء مستمر، جفاف، أو أعراض شديدة، ولا تبدئي أو توقفي دواء دون توجيه طبي.',
      reviewerName: 'د. نورة العتيبي',
      reviewerSpecialty: 'نساء وولادة وطب نمط الحياة',
      reviewerProfile: {
        name: 'د. نورة العتيبي',
        specialty: 'نساء وولادة وطب نمط الحياة',
        organization: 'مراجعة الحالات المزمنة أثناء الحمل',
        bio: 'تركز على الحركة، التغذية، وسلامة المتابعة للحالات الشائعة أثناء الحمل.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['إرشادات سكري الحمل', 'إرشادات وزارة الصحة السعودية للتغذية ونمط الحياة'],
      citationDetails: [
        { title: 'سكري الحمل', source: 'إرشادات سريرية معتمدة', year: '2026' },
        { title: 'التغذية ونمط الحياة', source: 'وزارة الصحة السعودية', year: '2026' },
      ],
    },
    {
      id: 'islamic-pregnancy-ease',
      stage: 'islamic',
      topic: 'faith_support',
      title: 'الرخصة والطمأنينة أثناء الحمل',
      summary: 'الإرشاد الديني في رفقة يذكرك بالسعة والرحمة، ولا يستبدل سؤال الطبيبة أو أهل العلم عند الحاجة.',
      body: 'الحمل قد يجعل بعض العبادات أو الروتين اليومي أثقل. رفقة تستخدم لغة مطمئنة تذكر بالرخصة والراحة والدعاء، مع فصل واضح بين الإرشاد العام، الرأي الطبي، والفتوى. عند وجود أعراض مقلقة، الأولوية لسلامتك وسلامة الطفل وطلب الرعاية.',
      reviewerName: 'د. هناء الزهراني',
      reviewerSpecialty: 'نساء وولادة ورعاية الحمل في السياق الإسلامي',
      reviewerProfile: {
        name: 'د. هناء الزهراني',
        specialty: 'نساء وولادة',
        organization: 'مراجعة الحمل والسياق الإسلامي',
        bio: 'تراجع المحتوى الذي يربط الطمأنينة الدينية بسلامة الأم طبيا.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['إرشاد عام حول الرخص الشرعية', 'إرشادات السلامة أثناء الحمل'],
      citationDetails: [
        { title: 'الرخص الشرعية العامة', source: 'مراجعة إرشادية غير فتوى', year: '2026' },
        { title: 'السلامة أثناء الحمل', source: 'إرشادات سريرية معتمدة', year: '2026' },
      ],
    },
  ],
  en: [
    {
      id: 'saudi-vaccination-schedule',
      stage: 'baby_0_3',
      topic: 'vaccines',
      title: 'Saudi childhood vaccination schedule',
      summary: 'Track vaccines using the Saudi national schedule, including the dose date, clinic, and any after-vaccine notes.',
      body: 'Baby vaccines in Saudi Arabia follow a national age-based schedule. Use RIFQA to record the dose date, clinic, and any after-vaccine notes. Mild fever or fussiness can often be monitored using clinician guidance, while breathing difficulty, severe swelling, unusual sleepiness, or high fever needs urgent medical contact.',
      reviewerName: 'Dr. Reem Al-Ghamdi',
      reviewerSpecialty: 'Pediatrics and preventive medicine',
      reviewerProfile: {
        name: 'Dr. Reem Al-Ghamdi',
        specialty: 'Pediatrics and preventive medicine',
        organization: 'Saudi child health review',
        bio: 'Reviews vaccine, prevention, and early childhood growth guidance.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['Saudi national vaccination schedule', 'Saudi MOH child health guidance'],
      citationDetails: [
        { title: 'Saudi national vaccination schedule', source: 'Saudi Ministry of Health', year: '2026' },
        { title: 'Child health guidance', source: 'Saudi Ministry of Health', year: '2026' },
      ],
    },
    {
      id: 'cchi-insurance-maternity',
      stage: 'pregnancy',
      topic: 'care_navigation',
      title: 'Insurance and maternity coverage in Saudi Arabia',
      summary: 'Before non-urgent booking, check the network, approvals, and pregnancy or birth coverage in your insurance policy.',
      body: 'In Saudi Arabia, pregnancy and birth coverage can vary by insurer, medical network, and policy. Before a non-urgent visit, check your insurance card or insurer app for required approvals, in-network maternity hospitals, and emergency coverage. Do not delay urgent medical care because of insurance steps.',
      reviewerName: 'Nouf Al-Abdullah',
      reviewerSpecialty: 'Healthcare governance and patient experience',
      reviewerProfile: {
        name: 'Nouf Al-Abdullah',
        specialty: 'Healthcare governance and patient experience',
        organization: 'Care pathway and insurance review',
        bio: 'Reviews administrative and insurance guidance so it stays clear and mother-friendly.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['Council of Health Insurance member guidance', 'Saudi maternity coverage policy review'],
      citationDetails: [
        { title: 'Insured member rights', source: 'Council of Health Insurance', year: '2026' },
        { title: 'Maternity coverage policy review', source: 'Healthcare governance review', year: '2026' },
      ],
    },
    {
      id: 'saudi-telehealth-resources',
      stage: 'pregnancy',
      topic: 'telehealth',
      title: 'When to use telehealth during pregnancy',
      summary: 'Telehealth can help with non-urgent questions, mild symptoms, and visit preparation, but it should not replace emergency care.',
      body: 'Telehealth can be useful for non-urgent questions such as visit preparation, understanding a simple result, or asking about a mild symptom. For bleeding, severe pain, reduced fetal movement, shortness of breath, chest pain, or unsafe feelings, choose emergency care or contact your care team directly.',
      reviewerName: 'Dr. Layla Al-Rashid',
      reviewerSpecialty: 'OB-GYN, Saudi care pathway review',
      reviewerProfile: {
        name: 'Dr. Layla Al-Rashid',
        specialty: 'OB-GYN',
        organization: 'Saudi care pathway review',
        bio: 'Reviews high-sensitivity pregnancy content and safe escalation pathways.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['Saudi MOH telehealth guidance', 'Pregnancy warning signs guidance'],
      citationDetails: [
        { title: 'Telehealth services', source: 'Saudi Ministry of Health', year: '2026' },
        { title: 'Pregnancy warning signs', source: 'Saudi Ministry of Health', year: '2026' },
      ],
    },
    {
      id: 'hajj-umrah-pregnancy',
      stage: 'pregnancy',
      topic: 'travel',
      title: 'Pregnancy during Hajj or Umrah',
      summary: 'Crowding, long walks, heat, and dehydration matter. Discuss travel or rituals with your clinician, especially in high-risk pregnancy.',
      body: 'Before Hajj or Umrah during pregnancy, check with your clinician whether travel, walking, and crowding are appropriate for your condition. Prepare a plan for rest, hydration, permitted medicines, nearby care, and stop signs such as severe dizziness, bleeding, pain, reduced movement, or painful contractions.',
      reviewerName: 'Dr. Hana Al-Zahrani',
      reviewerSpecialty: 'OB-GYN and religious-season pregnancy care',
      reviewerProfile: {
        name: 'Dr. Hana Al-Zahrani',
        specialty: 'OB-GYN',
        organization: 'Ramadan, Hajj, and Umrah pregnancy review',
        bio: 'Reviews content at the intersection of medical safety and local religious context.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['Hajj and Umrah public health guidance', 'Pregnancy care guidance'],
      citationDetails: [
        { title: 'Hajj and Umrah public health guidance', source: 'Saudi Ministry of Health', year: '2026' },
        { title: 'Pregnancy care guidance', source: 'Reviewed clinical guidance', year: '2026' },
      ],
    },
    {
      id: 'gestational-diabetes-ksa',
      stage: 'pregnancy',
      topic: 'conditions',
      title: 'Gestational diabetes and daily follow-up',
      summary: 'Gestational diabetes needs a clear plan for food, movement, glucose checks, and follow-up. Do not change medicines or doses without your clinician.',
      body: 'If you have gestational diabetes, the priority is following your care team plan: glucose checks, meals, safe movement, and appointments. Record readings and questions before visits. Seek urgent care for fainting, persistent vomiting, dehydration, or severe symptoms, and do not start or stop medicine without medical guidance.',
      reviewerName: 'Dr. Noura Al-Otaibi',
      reviewerSpecialty: 'OB-GYN and lifestyle medicine',
      reviewerProfile: {
        name: 'Dr. Noura Al-Otaibi',
        specialty: 'OB-GYN and lifestyle medicine',
        organization: 'Chronic conditions in pregnancy review',
        bio: 'Focuses on movement, nutrition, and safe follow-up for common pregnancy conditions.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['Gestational diabetes guidance', 'Saudi MOH nutrition and lifestyle guidance'],
      citationDetails: [
        { title: 'Gestational diabetes', source: 'Reviewed clinical guidance', year: '2026' },
        { title: 'Nutrition and lifestyle guidance', source: 'Saudi Ministry of Health', year: '2026' },
      ],
    },
    {
      id: 'islamic-pregnancy-ease',
      stage: 'islamic',
      topic: 'faith_support',
      title: 'Religious ease and reassurance during pregnancy',
      summary: 'RIFQA’s Islamic guidance reminds mothers of mercy and ease, while keeping medical care and religious rulings clearly separate.',
      body: 'Pregnancy can make worship or daily routines feel heavier. RIFQA uses reassuring language around religious ease, rest, and dua, while clearly separating general spiritual support, medical advice, and formal religious rulings. If concerning symptoms appear, maternal and baby safety comes first.',
      reviewerName: 'Dr. Hana Al-Zahrani',
      reviewerSpecialty: 'OB-GYN and Islamic-context pregnancy care',
      reviewerProfile: {
        name: 'Dr. Hana Al-Zahrani',
        specialty: 'OB-GYN',
        organization: 'Pregnancy and Islamic-context review',
        bio: 'Reviews content that connects spiritual reassurance with medical safety.',
      },
      approvalDate: '2026-04-28',
      expiryDate: '2026-10-28',
      status: 'approved',
      citations: ['General guidance on religious ease', 'Pregnancy safety guidance'],
      citationDetails: [
        { title: 'General religious ease guidance', source: 'Non-fatwa guidance review', year: '2026' },
        { title: 'Pregnancy safety guidance', source: 'Reviewed clinical guidance', year: '2026' },
      ],
    },
  ],
}

function enrichReviewedContentItem(item: ReviewedContent): ReviewedContent {
  return {
    ...item,
    topic: item.topic || item.stage,
    body: item.body || item.summary,
    reviewerProfile: item.reviewerProfile || {
      name: item.reviewerName,
      specialty: item.reviewerSpecialty,
      organization: 'RIFQA clinical review',
      bio: item.reviewerSpecialty,
    },
    citationDetails: item.citationDetails || item.citations.map((citation) => ({
      title: citation,
      source: citation.includes('Saudi') || citation.includes('السعود') ? 'Saudi health guidance' : 'Reviewed clinical guidance',
    })),
  }
}

export function getReviewedContent(lang: ApiLang) {
  return [...reviewedContent[lang], ...additionalSaudiReviewedContent[lang]].map(enrichReviewedContentItem)
}

export function getReviewedContentSeeds() {
  const byId = new Map<string, ReviewedContent>()
  for (const item of getReviewedContent('en')) {
    byId.set(item.id, item)
  }
  return Array.from(byId.values())
}

export function mergeReviewedContentRows(lang: ApiLang, rows: ReviewedContentPersistedRow[]) {
  const localized = getReviewedContent(lang)
  const rowById = new Map(rows.map((row) => [row.id, row]))
  const merged = localized.map((item) => {
    const row = rowById.get(item.id)
    if (!row) return item
    return {
      ...item,
      reviewerName: row.reviewer_name || item.reviewerName,
      reviewerSpecialty: row.reviewer_specialty || item.reviewerSpecialty,
      approvalDate: row.approval_date || item.approvalDate,
      expiryDate: row.expiry_date || item.expiryDate,
      status: row.status || item.status,
      workflowStatus: row.workflow_status || item.workflowStatus,
      assignedReviewer: row.assigned_reviewer || item.assignedReviewer,
      reviewComments: row.review_comments || item.reviewComments,
      rejectionReason: row.rejection_reason || item.rejectionReason,
      versionNumber: row.version_number || item.versionNumber,
    }
  })
  const seedIds = new Set(localized.map((item) => item.id))
  const additional = rows
    .filter((row) => row.id && !seedIds.has(row.id) && row.title && row.summary && row.stage)
    .map((row): ReviewedContent => ({
      id: row.id,
      stage: row.stage!,
      title: row.title!,
      summary: row.summary!,
      reviewerName: row.reviewer_name || '',
      reviewerSpecialty: row.reviewer_specialty || '',
      approvalDate: row.approval_date || new Date().toISOString().slice(0, 10),
      expiryDate: row.expiry_date || new Date().toISOString().slice(0, 10),
      status: row.status || 'pending_review',
      citations: row.citations || [],
      workflowStatus: row.workflow_status || 'unassigned',
      assignedReviewer: row.assigned_reviewer || '',
      reviewComments: row.review_comments || '',
      rejectionReason: row.rejection_reason || '',
      versionNumber: row.version_number || 1,
    }))

  return [...merged, ...additional]
}

export function getPublicReviewedContent(lang: ApiLang) {
  return getReviewedContent(lang).filter((item) => item.status === 'approved' || item.status === 'expired')
}

export function getPublicReviewedContentFromItems(items: ReviewedContent[]) {
  return items.filter((item) => item.status === 'approved' || item.status === 'expired').map(enrichReviewedContentItem)
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getQueueStatus(item: ReviewedContent, now = new Date()): ReviewedContent['status'] {
  if (item.status !== 'approved') return item.status
  return isReviewedContentCurrent(item, now) ? 'approved' : 'expired'
}

export function getReviewQueue(lang: ApiLang, now = new Date()) {
  return getReviewedContent(lang).map((item) => ({
    ...item,
    status: getQueueStatus(item, now),
  }))
}

export function applyReviewAction({
  lang,
  contentId,
  action,
  reviewerName,
  reviewerSpecialty,
  now = new Date(),
}: {
  lang: ApiLang
  contentId: string
  action: ReviewAction
  reviewerName?: string
  reviewerSpecialty?: string
  now?: Date
}): ReviewedContent | null {
  const item = getReviewQueue(lang, now).find((entry) => entry.id === contentId)
  if (!item) return null

  if (action === 'expire') {
    return { ...item, status: 'expired' as const, expiryDate: toDateOnly(new Date(now.getTime() - 86_400_000)) }
  }

  if (action === 'retire') {
    return { ...item, status: 'retired' as const, workflowStatus: 'approved' as const }
  }

  if (action === 'assign') {
    return { ...item, workflowStatus: 'assigned' as const }
  }

  if (action === 'request_changes') {
    return { ...item, status: 'pending_review' as const, workflowStatus: 'changes_requested' as const }
  }

  const reviewer = reviewerName || item.reviewerName
  const specialty = reviewerSpecialty || item.reviewerSpecialty
  return {
    ...item,
    reviewerName: reviewer,
    reviewerSpecialty: specialty,
    approvalDate: toDateOnly(now),
    expiryDate: toDateOnly(addMonths(now, 6)),
    status: 'approved' as const,
    workflowStatus: 'approved' as const,
  }
}

const retrievalKeywords: Record<string, string[]> = {
  'reduced-movement': [
    'movement', 'kick', 'kicks', 'fetal movement', 'reduced movement', 'less movement', 'not moving',
    'حركة', 'ركلة', 'ركلات', 'قلة الحركة', 'أقل من المعتاد', 'لا يتحرك',
  ],
  'forty-day-recovery': [
    '40 day', 'forty', 'recovery', 'after birth', 'postpartum', 'feeding stress', 'sleep after birth',
    'الأربعين', 'تعافي', 'بعد الولادة', 'نفاس', 'رضاعة', 'ضغط الرضاعة',
  ],
  'urgent-pregnancy-signs': [
    'bleeding', 'blood', 'severe pain', 'headache', 'vision', 'swelling', 'fever', 'emergency',
    'نزيف', 'دم', 'ألم شديد', 'صداع', 'زغللة', 'تورم', 'حمى', 'حرارة', 'طوارئ',
  ],
  'postpartum-warning-signs': [
    'heavy bleeding', 'postpartum bleeding', 'chest pain', 'shortness of breath', 'leg pain', 'after delivery',
    'نزيف غزير', 'نزيف بعد الولادة', 'ألم الصدر', 'ضيق النفس', 'ألم الساق', 'بعد الولادة',
  ],
  'exercise-safety': [
    'exercise', 'walk', 'movement plan', 'workout', 'stretch', 'activity', 'dizziness', 'contractions',
    'تمارين', 'رياضة', 'مشي', 'حركة', 'تمدد', 'دوخة', 'تقلصات',
  ],
  'mental-health-support': [
    'anxious', 'anxiety', 'panic', 'sad', 'depressed', 'unsafe', 'self-harm', 'suicide', 'stress', 'overwhelmed',
    'قلق', 'توتر', 'هلع', 'حزينة', 'اكتئاب', 'غير آمنة', 'انتحار', 'أؤذي نفسي', 'مرهقة',
  ],
  'ramadan-pregnancy-guidance': [
    'ramadan', 'fast', 'fasting', 'iftar', 'suhoor', 'dehydration', 'thirst',
    'رمضان', 'صيام', 'أصوم', 'إفطار', 'سحور', 'جفاف', 'عطش',
  ],
}

Object.assign(retrievalKeywords, {
  'saudi-vaccination-schedule': [
    'vaccine', 'vaccination', 'immunization', 'baby shots', 'child vaccine', 'schedule',
    'تطعيم', 'تطعيمات', 'لقاح', 'لقاحات', 'جدول التطعيمات',
  ],
  'cchi-insurance-maternity': [
    'insurance', 'coverage', 'cchi', 'approval', 'network', 'policy',
    'تأمين', 'التأمين', 'تغطية', 'موافقة', 'الشبكة', 'الضمان الصحي',
  ],
  'saudi-telehealth-resources': [
    'telehealth', 'remote consult', 'online doctor', 'sehhaty', 'virtual clinic',
    'استشارة عن بعد', 'استشارة', 'صحتي', 'طبيب عن بعد', 'عن بعد',
  ],
  'hajj-umrah-pregnancy': [
    'hajj', 'umrah', 'pilgrimage', 'travel', 'crowd', 'heat',
    'حج', 'عمرة', 'مناسك', 'سفر', 'زحام', 'حرارة',
  ],
  'gestational-diabetes-ksa': [
    'gestational diabetes', 'blood sugar', 'glucose', 'diabetes', 'sugar readings',
    'سكري الحمل', 'سكر الحمل', 'السكر', 'قياس السكر', 'قراءات السكر',
  ],
  'islamic-pregnancy-ease': [
    'islamic', 'religious', 'dua', 'prayer', 'fasting exemption', 'ease', 'mercy',
    'إسلامي', 'دعاء', 'رخصة', 'الرخصة', 'الصلاة', 'الفتوى', 'اليسر', 'الرحمة',
  ],
})

function scoreReviewedItem(item: ReviewedContent, query: string) {
  const searchable = `${item.title} ${item.summary} ${item.stage}`.toLowerCase()
  const normalizedQuery = query.toLowerCase()
  const keywords = retrievalKeywords[item.id] ?? []
  const keywordScore = keywords.reduce((score, keyword) => normalizedQuery.includes(keyword.toLowerCase()) ? score + 4 : score, 0)
  const titleScore = item.title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && normalizedQuery.includes(word))
    .length
  const summaryScore = searchable
    .split(/\s+/)
    .filter((word) => word.length > 5 && normalizedQuery.includes(word))
    .length
  return keywordScore + titleScore + Math.min(summaryScore, 3)
}

function isReviewedContentCurrent(item: ReviewedContent, now = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(item.expiryDate)
  expiry.setHours(0, 0, 0, 0)
  return item.status === 'approved' && expiry.getTime() >= today.getTime()
}

export function selectRelevantReviewedContent({
  lang,
  query,
  limit = 3,
  now = new Date(),
  items,
}: {
  lang: ApiLang
  query: string
  limit?: number
  now?: Date
  items?: ReviewedContent[]
}) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  return (items ?? getReviewedContent(lang))
    .filter((item) => isReviewedContentCurrent(item, now))
    .map((item, index) => ({ item, index, score: scoreReviewedItem(item, normalizedQuery) }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map((match) => match.item)
}

export function buildCareRoute({
  concern,
  lang,
  stage = 'pregnancy',
}: {
  concern: string
  lang: ApiLang
  stage?: 'pregnancy' | 'postpartum' | 'baby_0_3'
}): CareRoute {
  const assessment = assessText(concern, lang)
  const lowerConcern = concern.toLowerCase()
  const isMentalHealth = /anxious|panic|sad|unsafe|suicide|self-harm|stress|قلق|هلع|حزينة|غير آمنة|انتحار/.test(lowerConcern)
  const isPostpartumWarning = stage === 'postpartum' && /bleeding|fever|pain|نزيف|حمى|ألم/.test(lowerConcern)
  const isBabyConcern = stage === 'baby_0_3'

  if (assessment.level === 'urgent' || isPostpartumWarning) {
    return {
      level: 'urgent',
      route: 'emergency',
      title: lang === 'ar' ? 'رعاية عاجلة الآن' : 'Urgent care now',
      guidance:
        lang === 'ar'
          ? 'هذا النمط يحتاج مساعدة طبية في نفس اليوم. تواصلي مع طبيبتك أو الطوارئ الآن.'
          : 'This pattern needs same-day clinical help. Contact your clinician or emergency care now.',
      actions:
        lang === 'ar'
          ? ['اتصلي بالطوارئ أو الطبيبة', 'اطلبي من شخص موثوق البقاء معك', 'احتفظي بملخص الأعراض جاهزا']
          : ['Call emergency care or your clinician', 'Ask a trusted person to stay with you', 'Keep your symptom summary ready'],
      resources: [
        { label: lang === 'ar' ? 'خدمات الطوارئ في السعودية' : 'Saudi emergency services', kind: 'moh' },
        { label: lang === 'ar' ? 'أقرب طوارئ نساء وولادة' : 'Nearest maternity emergency department', kind: 'hospital' },
        { label: lang === 'ar' ? 'شخص موثوق' : 'Trusted contact', kind: 'trusted_contact' },
      ],
      assessment,
    }
  }

  if (isMentalHealth || assessment.level === 'watch') {
    return {
      level: 'watch',
      route: 'mental_health',
      title: lang === 'ar' ? 'مسار الدعم النفسي' : 'Emotional support pathway',
      guidance:
        lang === 'ar'
          ? 'هذا يستحق رعاية لا ذعرا. ابدئي تهدئة الآن وتحدثي مع شخص موثوق أو مختصة نفسية إذا استمر الشعور.'
          : 'This deserves care, not panic. Use grounding now and speak with a trusted person or mental health professional if it continues.',
      actions:
        lang === 'ar'
          ? ['ابدئي تهدئة قصيرة', 'سجلي الفحص اليومي', 'حضري جملة واحدة للطبيبة']
          : ['Start grounding', 'Log a daily check-in', 'Prepare one sentence for your clinician'],
      resources: [
        { label: lang === 'ar' ? 'دليل الدعم النفسي' : 'Mental health support directory', kind: 'moh' },
        { label: lang === 'ar' ? 'موعد رعاية عن بعد' : 'Telehealth appointment', kind: 'telehealth' },
        { label: lang === 'ar' ? 'شخص موثوق' : 'Trusted contact', kind: 'trusted_contact' },
      ],
      assessment,
    }
  }

  if (isBabyConcern) {
    return {
      level: 'normal',
      route: 'family_medicine',
      title: lang === 'ar' ? 'إرشاد رعاية الطفل' : 'Baby care guidance',
      guidance:
        lang === 'ar'
          ? 'تابعي الرضاعة، الحفاضات، النوم، الحرارة، وملاحظات النمو. تواصلي مع رعاية الأطفال إذا تغير النمط أو زادت الأعراض.'
          : 'Track feeding, diapers, sleep, temperature, and growth notes. Contact pediatric care if patterns change or symptoms escalate.',
      actions:
        lang === 'ar'
          ? ['سجلي روتين الطفل', 'راجعي جدول التطعيمات', 'حضري ملاحظات زيارة الأطفال']
          : ['Log baby routine', 'Check vaccination timeline', 'Prepare pediatric visit notes'],
      resources: [
        { label: lang === 'ar' ? 'عيادة أطفال' : 'Pediatric clinic', kind: 'hospital' },
        { label: lang === 'ar' ? 'تمريض عن بعد' : 'Telehealth nurse line', kind: 'telehealth' },
      ],
      assessment,
    }
  }

  return {
    level: 'normal',
    route: 'ob_gyn',
    title: lang === 'ar' ? 'طبيبة النساء أو طب الأسرة' : 'OB-GYN or family medicine',
    guidance:
      lang === 'ar'
        ? 'يمكن غالبا مناقشة هذا مع طبيبة النساء أو طبيبة الأسرة. استمري في متابعة النمط وخذي ملخصا مختصرا للزيارة.'
        : 'This can usually be discussed with your OB-GYN or family physician. Keep tracking patterns and bring a concise summary.',
    actions:
      lang === 'ar'
        ? ['احفظي ملخص الزيارة', 'تابعي الأعراض لمدة 24 ساعة', 'اسألي الطبيبة في الزيارة القادمة']
        : ['Save a visit summary', 'Track symptoms for 24 hours', 'Ask your clinician at the next visit'],
    resources: [
      { label: lang === 'ar' ? 'عيادة النساء والولادة' : 'OB-GYN clinic', kind: 'hospital' },
      { label: lang === 'ar' ? 'استشارة أمومة عن بعد' : 'Telehealth maternal consult', kind: 'telehealth' },
    ],
    assessment,
  }
}
