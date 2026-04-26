import { useMemo, useState } from 'react'
import './App.css'

type Screen = 'home' | 'timeline' | 'checkin' | 'companion' | 'support'
type Theme = 'light' | 'dark'
type Lang = 'ar' | 'en'

type NavItem = { id: Screen; label: string; icon: string }
type TimelineItem = {
  week: string
  label: string
  status: 'done' | 'current' | 'future'
  size?: string
  length?: string
  weight?: string
}

const content = {
  ar: {
    dir: 'rtl',
    langName: 'العربية',
    langToggle: 'English',
    themeLight: 'تفعيل الوضع الفاتح',
    themeDark: 'تفعيل الوضع الليلي',
    nav: [
      { id: 'home', label: 'الرئيسية', icon: 'home' },
      { id: 'timeline', label: 'الجدول', icon: 'calendar_month' },
      { id: 'checkin', label: 'الفحص اليومي', icon: 'check_circle' },
      { id: 'companion', label: 'رفيقة AI', icon: 'chat' },
      { id: 'support', label: 'الدعم', icon: 'health_and_safety' },
    ] satisfies NavItem[],
    header: {
      date: '١٤ رجب | ٢٥ يناير',
      greeting: 'أهلاً بكِ، نورة',
    },
    home: {
      weekLabel: 'الأسبوع',
      week: '٢٨',
      progressAria: 'الأسبوع الثامن والعشرون من الحمل',
      days: '٨٤',
      daysLabel: 'يوماً للقاء طفلكِ',
      insightTitle: 'رؤية اليوم',
      insight:
        'طفلكِ الآن بحجم حبة الباذنجان. بدأت رئتاه بالنضوج استعداداً للتنفس.',
      ctaTitle: 'أكملي تسجيلك اليومي',
      cta:
        'شاركيناً حالتك المزاجية والأعراض. سنحوّلها إلى خطوة واضحة، لا إلى قلق.',
      ctaAria: 'بدء الفحص اليومي',
      tools: [
        { label: 'الفحص اليومي', icon: 'how_to_reg', tone: 'violet', target: 'checkin' },
        { label: 'السجل', icon: 'book_5', tone: 'rose' },
        { label: 'رفيقة AI', icon: 'chat_spark', tone: 'primary', target: 'companion' },
        { label: 'موقت التقلصات', icon: 'timer', tone: 'gold' },
        { label: 'عد الركلات', icon: 'touch_app', tone: 'teal' },
        { label: 'الوزن', icon: 'monitor_weight', tone: 'violet' },
      ],
    },
    timeline: {
      eyebrow: 'رحلة الحمل',
      title: 'تطور طفلكِ أسبوعاً بأسبوع',
      intro: 'مقارنات سعودية مألوفة، ومعلومات قصيرة لا تزدحم عليكِ.',
      weekPrefix: 'الأسبوع',
      currentSize: 'حجم طفلك الآن',
      lengthLabel: 'الطول التقريبي',
      weightLabel: 'الوزن التقريبي',
      items: [
        { week: '٢٢', label: 'اكتشاف الأصوات', status: 'done' },
        { week: '٢٣', label: 'بدء الحركة', status: 'done' },
        {
          week: '٢٤',
          label: 'تطور السمع',
          status: 'current',
          size: 'مثل الرمانة',
          length: '٣٠ سم',
          weight: '٦٠٠ جم',
        },
        { week: '٢٥', label: 'تطور الرئتين', status: 'future' },
        { week: '٢٦', label: 'فتح العينين', status: 'future' },
      ] satisfies TimelineItem[],
    },
    checkin: {
      close: 'إغلاق',
      label: 'تسجيل يومي',
      step: '١ من ٥',
      title: 'كيف تشعرين اليوم؟',
      intro: 'استمعي لجسدك ومزاجك اليوم. لا توجد إجابة خاطئة.',
      sleep: 'كيف كان نومك؟',
      low: 'متقطع',
      high: 'جيد',
      next: 'التالي',
      moods: [
        { label: 'سعيدة', icon: 'sentiment_very_satisfied' },
        { label: 'هادئة', icon: 'sentiment_satisfied' },
        { label: 'مستقرة', icon: 'sentiment_content' },
        { label: 'عادية', icon: 'sentiment_neutral' },
        { label: 'متعبة', icon: 'sentiment_dissatisfied' },
        { label: 'مرهقة', icon: 'sick' },
        { label: 'متقلبة', icon: 'mood_bad' },
      ],
    },
    companion: {
      eyebrow: 'رفيقة AI',
      title: 'مساحة آمنة للسؤال والطمأنة',
      aiName: 'رفيقة',
      userConcern: 'حركة الطفل اليوم أقل من المعتاد.',
      opening:
        'أنا معكِ يا نورة. أخبريني بما يقلقك، وسأساعدك بخطوة واضحة ولطيفة.',
      answer:
        'أفهم قلقك. ابدئي بجلسة عد الركلات الآن. إذا بقيت الحركة أقل من المعتاد، تواصلي مع طبيبتك أو الطوارئ.',
      replies: ['ابدئي عد الركلات', 'حضري أسئلة للطبيبة', 'أحتاج تهدئة'],
      input: 'اكتبي ما يدور في بالك...',
      voice: 'إدخال صوتي',
      send: 'إرسال',
    },
    support: {
      eyebrow: 'الدعم الهادئ',
      title: 'عندما يصبح اليوم ثقيلاً',
      intro:
        'لا نعرض تشخيصاً ولا نضغط عليكِ. فقط خطوات آمنة وواضحة.',
      safeTitle: 'نحن هنا معكِ',
      safeText:
        'خذي نفساً بطيئاً. اختاري شخصاً تثقين به، أو اطلبي دعماً طبياً فوراً إذا شعرتِ أنكِ غير آمنة.',
      callTrusted: 'اتصلي بشخص تثقين به',
      urgent: 'اعرضي موارد عاجلة',
      pathwayTitle: 'من أتواصل معه؟',
      pathway: [
        'أعراض بسيطة ومتكررة: طبيبة النساء أو طب الأسرة.',
        'نزيف، ألم شديد، أو قلة حركة واضحة: الطوارئ فوراً.',
        'ضيق نفسي مستمر: مختصة نفسية أو مركز موثوق.',
      ],
    },
  },
  en: {
    dir: 'ltr',
    langName: 'English',
    langToggle: 'العربية',
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',
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
      insight:
        'Your baby is now about the size of an eggplant. The lungs are maturing in preparation for breathing.',
      ctaTitle: 'Complete your daily check-in',
      cta:
        'Share your mood and symptoms. RIFQA turns them into a clear next step, not extra worry.',
      ctaAria: 'Start daily check-in',
      tools: [
        { label: 'Daily check-in', icon: 'how_to_reg', tone: 'violet', target: 'checkin' },
        { label: 'Journal', icon: 'book_5', tone: 'rose' },
        { label: 'RIFQA AI', icon: 'chat_spark', tone: 'primary', target: 'companion' },
        { label: 'Contraction timer', icon: 'timer', tone: 'gold' },
        { label: 'Kick counter', icon: 'touch_app', tone: 'teal' },
        { label: 'Weight', icon: 'monitor_weight', tone: 'violet' },
      ],
    },
    timeline: {
      eyebrow: 'Pregnancy journey',
      title: 'Your baby, week by week',
      intro: 'Saudi-familiar size comparisons and short, calm updates.',
      weekPrefix: 'Week',
      currentSize: 'Your baby is now',
      lengthLabel: 'Approx. length',
      weightLabel: 'Approx. weight',
      items: [
        { week: '22', label: 'Sound discovery', status: 'done' },
        { week: '23', label: 'Movement begins', status: 'done' },
        {
          week: '24',
          label: 'Hearing development',
          status: 'current',
          size: 'the size of a pomegranate',
          length: '30 cm',
          weight: '600 g',
        },
        { week: '25', label: 'Lung development', status: 'future' },
        { week: '26', label: 'Eyes opening', status: 'future' },
      ] satisfies TimelineItem[],
    },
    checkin: {
      close: 'Close',
      label: 'Daily check-in',
      step: '1 of 5',
      title: 'How are you feeling today?',
      intro: 'Listen to your body and mood today. There is no wrong answer.',
      sleep: 'How was your sleep?',
      low: 'Interrupted',
      high: 'Good',
      next: 'Next',
      moods: [
        { label: 'Happy', icon: 'sentiment_very_satisfied' },
        { label: 'Calm', icon: 'sentiment_satisfied' },
        { label: 'Steady', icon: 'sentiment_content' },
        { label: 'Okay', icon: 'sentiment_neutral' },
        { label: 'Tired', icon: 'sentiment_dissatisfied' },
        { label: 'Drained', icon: 'sick' },
        { label: 'Mixed', icon: 'mood_bad' },
      ],
    },
    companion: {
      eyebrow: 'RIFQA AI',
      title: 'A safe space for questions and reassurance',
      aiName: 'RIFQA',
      userConcern: "The baby's movement feels lower than usual today.",
      opening:
        "I am here with you, Noura. Tell me what is worrying you and I will help with a gentle, clear next step.",
      answer:
        'I understand why that feels worrying. Start a kick-count session now. If movement remains lower than usual, contact your doctor or emergency care.',
      replies: ['Start kick count', 'Prepare doctor questions', 'I need grounding'],
      input: 'Write what is on your mind...',
      voice: 'Voice input',
      send: 'Send',
    },
    support: {
      eyebrow: 'Calm support',
      title: 'When the day feels heavy',
      intro:
        'No diagnosis and no pressure. Just safe, clear steps.',
      safeTitle: 'We are here with you',
      safeText:
        'Take one slow breath. Choose someone you trust, or seek urgent medical support if you feel unsafe.',
      callTrusted: 'Call someone you trust',
      urgent: 'Show urgent resources',
      pathwayTitle: 'Who should I contact?',
      pathway: [
        'Mild repeated symptoms: your OB or family physician.',
        'Bleeding, severe pain, or clearly reduced movement: emergency care now.',
        'Ongoing emotional distress: a mental health specialist or trusted center.',
      ],
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
  const t = content[lang]
  const [selectedMood, setSelectedMood] = useState(t.checkin.moods[0].label)

  const activeTitle = useMemo(
    () => t.nav.find((item) => item.id === screen)?.label ?? t.nav[0].label,
    [screen, t.nav],
  )

  const toggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    setSelectedMood(content[next].checkin.moods[0].label)
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
            onClick={() => setScreen(item.id)}
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
          {screen === 'home' && <HomeScreen t={t} onNavigate={setScreen} />}
          {screen === 'timeline' && <TimelineScreen t={t} />}
          {screen === 'checkin' && (
            <CheckInScreen
              t={t}
              selectedMood={selectedMood}
              onSelectMood={setSelectedMood}
            />
          )}
          {screen === 'companion' && <CompanionScreen t={t} />}
          {screen === 'support' && <SupportScreen t={t} />}
        </section>

        <BottomNav active={screen} items={t.nav} onNavigate={setScreen} />
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

function HomeScreen({
  t,
  onNavigate,
}: {
  t: (typeof content)[Lang]
  onNavigate: (screen: Screen) => void
}) {
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
          <button
            key={tool.label}
            type="button"
            className="tool-card glass-card"
            onClick={() => {
              if (tool.target) onNavigate(tool.target as Screen)
            }}
          >
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
        {t.timeline.items.map((item) => (
          <article key={item.week} className={`timeline-item ${item.status}`}>
            <div className="timeline-node">
              {item.status === 'done' ? <Icon name="check" filled /> : item.week}
            </div>
            <div className="glass-card timeline-card">
              <div className="timeline-topline">
                <span>
                  {t.timeline.weekPrefix} {item.week}
                </span>
                <strong>{item.label}</strong>
              </div>
              {item.status === 'current' && (
                <>
                  <div className="pomegranate" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h3>
                    {t.timeline.currentSize} {item.size}
                  </h3>
                  <div className="baby-stats">
                    <span>
                      {t.timeline.lengthLabel} <strong>{item.length}</strong>
                    </span>
                    <span>
                      {t.timeline.weightLabel} <strong>{item.weight}</strong>
                    </span>
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
}: {
  t: (typeof content)[Lang]
  selectedMood: string
  onSelectMood: (mood: string) => void
}) {
  return (
    <div className="checkin-screen">
      <div className="flow-header">
        <button className="icon-button" type="button" aria-label={t.checkin.close}>
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
        <h2>{t.checkin.title}</h2>
        <p>{t.checkin.intro}</p>
        <div className="mood-row">
          {t.checkin.moods.map((mood) => (
            <button
              key={mood.label}
              type="button"
              className={`mood-option ${selectedMood === mood.label ? 'selected' : ''}`}
              onClick={() => onSelectMood(mood.label)}
            >
              <span>
                <Icon name={mood.icon} filled={selectedMood === mood.label} />
              </span>
              {mood.label}
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

      <button className="primary-button" type="button">
        {t.checkin.next}
        <Icon name="arrow_back" />
      </button>
    </div>
  )
}

function CompanionScreen({ t }: { t: (typeof content)[Lang] }) {
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
        <article className="bubble user">
          <p>{t.companion.userConcern}</p>
        </article>
        <article className="bubble ai">
          <strong>{t.companion.aiName}</strong>
          <p>{t.companion.answer}</p>
        </article>
      </div>

      <div className="quick-replies">
        {t.companion.replies.map((reply) => (
          <button key={reply} type="button">
            {reply}
          </button>
        ))}
      </div>

      <form className="chat-input">
        <button type="button" aria-label={t.companion.voice}>
          <Icon name="mic" />
        </button>
        <input type="text" placeholder={t.companion.input} />
        <button type="submit" aria-label={t.companion.send}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  )
}

function SupportScreen({ t }: { t: (typeof content)[Lang] }) {
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
          <button type="button">{t.support.callTrusted}</button>
          <button type="button">{t.support.urgent}</button>
        </div>
      </section>

      <section className="glass-card pathway-card">
        <div className="card-title">
          <Icon name="local_hospital" />
          <span>{t.support.pathwayTitle}</span>
        </div>
        <ul>
          {t.support.pathway.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function BottomNav({
  active,
  items,
  onNavigate,
}: {
  active: Screen
  items: NavItem[]
  onNavigate: (screen: Screen) => void
}) {
  return (
    <nav className="bottom-nav" aria-label="navigation">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={active === item.id ? 'active' : ''}
          onClick={() => onNavigate(item.id)}
        >
          <Icon name={item.icon} filled={active === item.id} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default App
