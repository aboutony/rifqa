import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
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

type Theme = 'light' | 'dark'
type Lang = 'ar' | 'en'
type NavItem = { id: Screen; label: string; icon: string }
type Tool = { label: string; icon: string; tone: string; target: Screen }
type ChatMessage = { role: 'ai' | 'user'; text: string }

const content = {
  ar: {
    dir: 'rtl',
    langToggle: 'English',
    themeLight: 'تفعيل الوضع الفاتح',
    themeDark: 'تفعيل الوضع الليلي',
    demo: 'وضع العرض التجريبي',
    saved: 'تم الحفظ في بيانات العرض التجريبي.',
    nav: [
      { id: 'home', label: 'الرئيسية', icon: 'home' },
      { id: 'timeline', label: 'الجدول', icon: 'calendar_month' },
      { id: 'checkin', label: 'الفحص', icon: 'check_circle' },
      { id: 'companion', label: 'رفقة AI', icon: 'chat' },
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
        { label: 'رفقة AI', icon: 'chat_bubble', tone: 'primary', target: 'companion' },
        { label: 'موقت التقلصات', icon: 'timer', tone: 'gold', target: 'contractions' },
        { label: 'عد الركلات', icon: 'touch_app', tone: 'teal', target: 'kicks' },
        { label: 'الوزن', icon: 'monitor_weight', tone: 'violet', target: 'weight' },
        { label: 'الاسترخاء', icon: 'self_improvement', tone: 'teal', target: 'wellness' },
        { label: 'التمارين', icon: 'directions_walk', tone: 'gold', target: 'exercise' },
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
      eyebrow: 'رفقة AI',
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
      exerciseBody: 'لا توجد تعليمات طبيبة مسجلة في العرض التجريبي. تقترح رفقة مشيا خفيفا 10 دقائق وتمدد كتف لطيف. تعليمات الطبيبة ستتجاوز أي اقتراح AI.',
      startExercise: 'بدء تمرين لطيف',
      doctorPlan: 'خطة الطبيبة',
      backHome: 'العودة للرئيسية',
    },
  },
  en: {
    dir: 'ltr',
    langToggle: 'العربية',
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

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [theme, setTheme] = useState<Theme>('light')
  const [lang, setLang] = useState<Lang>('ar')
  const [selectedMood, setSelectedMood] = useState(content.ar.checkin.moods[0])
  const [notice, setNotice] = useState(content.ar.demo)
  const t = content[lang]

  const activeTitle = useMemo(
    () => t.nav.find((item) => item.id === screen)?.label ?? t.home.tools.find((tool) => tool.target === screen)?.label ?? t.nav[0].label,
    [screen, t],
  )

  const showNotice = (message: string) => setNotice(message)

  const navigate = (target: Screen) => {
    setScreen(target)
    showNotice(t.demo)
  }

  const toggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    setSelectedMood(content[next].checkin.moods[0])
    setNotice(content[next].demo)
  }

  return (
    <div className={`app-shell ${theme} ${t.dir}`} dir={t.dir} lang={lang}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <aside className="desktop-rail" aria-label={activeTitle}>
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
      </aside>

      <main className="phone-frame" aria-label={activeTitle}>
        <Header
          theme={theme}
          lang={lang}
          t={t}
          onThemeChange={setTheme}
          onLanguageToggle={toggleLang}
        />

        <section className="screen-content">
          <div className="demo-pill">{notice}</div>
          {screen === 'home' && <HomeScreen t={t} onNavigate={navigate} />}
          {screen === 'timeline' && <TimelineScreen t={t} />}
          {screen === 'checkin' && (
            <CheckInScreen
              t={t}
              selectedMood={selectedMood}
              onSelectMood={setSelectedMood}
              onClose={() => navigate('home')}
              onSave={() => showNotice(t.saved)}
            />
          )}
          {screen === 'companion' && (
            <CompanionScreen
              t={t}
              onNavigate={navigate}
              onNotice={showNotice}
            />
          )}
          {screen === 'support' && <SupportScreen t={t} onNotice={showNotice} />}
          {screen === 'journal' && <UtilityScreen title={t.utility.journalTitle} body={t.utility.journalBody} icon="book_5" primary={t.utility.addEntry} secondary={t.utility.backHome} onPrimary={() => showNotice(t.saved)} onSecondary={() => navigate('home')} />}
          {screen === 'contractions' && <UtilityScreen title={t.utility.contractionsTitle} body={t.utility.contractionsBody} icon="timer" primary={t.utility.startTimer} secondary={t.utility.saveSession} onPrimary={() => showNotice(t.utility.contractionsBody)} onSecondary={() => showNotice(t.saved)} />}
          {screen === 'kicks' && <UtilityScreen title={t.utility.kicksTitle} body={t.utility.kicksBody} icon="touch_app" primary={t.utility.addKick} secondary={t.utility.endSession} onPrimary={() => showNotice(t.utility.kicksBody)} onSecondary={() => showNotice(t.saved)} />}
          {screen === 'weight' && <UtilityScreen title={t.utility.weightTitle} body={t.utility.weightBody} icon="monitor_weight" primary={t.utility.addWeight} secondary={t.utility.viewTrend} onPrimary={() => showNotice(t.saved)} onSecondary={() => showNotice(t.utility.weightBody)} />}
          {screen === 'wellness' && <UtilityScreen title={t.utility.wellnessTitle} body={t.utility.wellnessBody} icon="self_improvement" primary={t.utility.playRecommended} secondary={t.utility.addPlaylist} onPrimary={() => showNotice(t.utility.wellnessBody)} onSecondary={() => showNotice(t.saved)} />}
          {screen === 'exercise' && <UtilityScreen title={t.utility.exerciseTitle} body={t.utility.exerciseBody} icon="directions_walk" primary={t.utility.startExercise} secondary={t.utility.doctorPlan} onPrimary={() => showNotice(t.utility.exerciseBody)} onSecondary={() => showNotice(t.saved)} />}
        </section>

        <BottomNav active={screen} items={t.nav} onNavigate={navigate} />
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
}: {
  theme: Theme
  lang: Lang
  t: (typeof content)[Lang]
  onThemeChange: (theme: Theme) => void
  onLanguageToggle: () => void
}) {
  return (
    <header className="top-bar">
      <div className="profile-cluster">
        <img className="app-logo" src="/rifqa-logo.png" alt="RIFQA" />
        <div>
          <p className="eyebrow">{t.header.date}</p>
          <h1>{t.header.greeting}</h1>
        </div>
      </div>
      <div className="top-actions">
        <button className="language-toggle" type="button" onClick={onLanguageToggle}>
          <span>{lang === 'ar' ? 'AR' : 'EN'}</span>
          {t.langToggle}
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

function HomeScreen({ t, onNavigate }: { t: (typeof content)[Lang]; onNavigate: (screen: Screen) => void }) {
  return (
    <div className="home-screen">
      <section className="progress-hero">
        <div className="progress-ring" aria-label={t.home.progressAria}>
          <div>
            <span>{t.home.weekLabel}</span>
            <strong>{t.home.week}</strong>
          </div>
        </div>
      </section>

      <section className="bento two">
        <article className="glass-card metric-card">
          <Icon name="hourglass_empty" />
          <strong>{t.home.days}</strong>
          <span>{t.home.daysLabel}</span>
        </article>
        <article className="glass-card insight-card">
          <div className="card-title">
            <Icon name="tips_and_updates" />
            <span>{t.home.insightTitle}</span>
          </div>
          <p>{t.home.insight}</p>
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

      <section className="action-banner glass-card">
        <div>
          <h2>{t.home.ctaTitle}</h2>
          <p>{t.home.cta}</p>
        </div>
        <button type="button" onClick={() => onNavigate('checkin')} aria-label={t.home.ctaAria}>
          <Icon name="arrow_back" />
        </button>
      </section>
    </div>
  )
}

function TimelineScreen({ t }: { t: (typeof content)[Lang] }) {
  return (
    <div className="timeline-screen">
      <div className="screen-heading">
        <span className="eyebrow">{t.timeline.eyebrow}</span>
        <h2>{t.timeline.title}</h2>
        <p>{t.timeline.intro}</p>
      </div>
      <div className="timeline-list">
        {t.timeline.items.map((item, index) => (
          <article key={item} className={`timeline-item ${index < 2 ? 'done' : index === 2 ? 'current' : 'future'}`}>
            <div className="timeline-node">{index < 2 ? <Icon name="check" filled /> : index + 22}</div>
            <div className="glass-card timeline-card">
              <div className="timeline-topline">
                <span>{index + 22}</span>
                <strong>{item}</strong>
              </div>
              {index === 2 && (
                <>
                  <div className="pomegranate" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h3>{t.timeline.currentSize}</h3>
                  <div className="baby-stats">
                    <span>{t.timeline.length}</span>
                    <span>{t.timeline.weight}</span>
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
}: {
  t: (typeof content)[Lang]
  selectedMood: string
  onSelectMood: (mood: string) => void
  onClose: () => void
  onSave: () => void
}) {
  const [done, setDone] = useState(false)

  const save = () => {
    setDone(true)
    onSave()
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
        <input id="sleep" type="range" min="1" max="5" defaultValue="3" />
        <div className="range-labels">
          <span>{t.checkin.low}</span>
          <span>{t.checkin.high}</span>
        </div>
      </section>

      <button className="primary-button" type="button" onClick={save}>
        {t.checkin.next}
        <Icon name="arrow_back" />
      </button>
    </div>
  )
}

function CompanionScreen({
  t,
  onNavigate,
  onNotice,
}: {
  t: (typeof content)[Lang]
  onNavigate: (screen: Screen) => void
  onNotice: (message: string) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'ai', text: t.companion.answer }])
  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const payload = (await response.json()) as { data?: { reply?: string } }
      const reply = payload.data?.reply || t.companion.answer
      setMessages((current) => [...current, { role: 'ai', text: reply }])
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
              <button className="speak-button" type="button" onClick={() => speak(message.text)}>
                <Icon name="volume_up" />
                {t.companion.speakReply}
              </button>
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
