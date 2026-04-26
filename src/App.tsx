import { useMemo, useState } from 'react'
import './App.css'

type Screen = 'home' | 'timeline' | 'checkin' | 'companion' | 'support'
type Theme = 'light' | 'dark'

const navItems: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'home', label: 'الرئيسية', icon: 'home' },
  { id: 'timeline', label: 'الجدول', icon: 'calendar_month' },
  { id: 'checkin', label: 'الفحص اليومي', icon: 'check_circle' },
  { id: 'companion', label: 'رفيقة AI', icon: 'chat' },
  { id: 'support', label: 'الدعم', icon: 'health_and_safety' },
]

const timelineWeeks = [
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
]

const moodOptions = [
  { label: 'سعيدة', icon: 'sentiment_very_satisfied' },
  { label: 'هادئة', icon: 'sentiment_satisfied' },
  { label: 'مستقرة', icon: 'sentiment_content' },
  { label: 'عادية', icon: 'sentiment_neutral' },
  { label: 'متعبة', icon: 'sentiment_dissatisfied' },
  { label: 'مرهقة', icon: 'sick' },
  { label: 'متقلبة', icon: 'mood_bad' },
]

const quickTools = [
  { label: 'الفحص اليومي', icon: 'how_to_reg', tone: 'violet' },
  { label: 'السجل', icon: 'book_5', tone: 'rose' },
  { label: 'رفيقة AI', icon: 'chat_spark', tone: 'primary' },
  { label: 'موقت التقلصات', icon: 'timer', tone: 'gold' },
  { label: 'عد الركلات', icon: 'touch_app', tone: 'teal' },
  { label: 'الوزن', icon: 'monitor_weight', tone: 'violet' },
]

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
  const [selectedMood, setSelectedMood] = useState('سعيدة')

  const activeTitle = useMemo(
    () => navItems.find((item) => item.id === screen)?.label ?? 'الرئيسية',
    [screen],
  )

  return (
    <div className={`app-shell ${theme}`} dir="rtl" lang="ar">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <aside className="desktop-rail" aria-label="التنقل الرئيسي">
        <div className="brand-mark">ر</div>
        {navItems.map((item) => (
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

      <main className="phone-frame" aria-label={`واجهة ${activeTitle}`}>
        <Header theme={theme} onThemeChange={setTheme} />

        <section className="screen-content">
          {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
          {screen === 'timeline' && <TimelineScreen />}
          {screen === 'checkin' && (
            <CheckInScreen selectedMood={selectedMood} onSelectMood={setSelectedMood} />
          )}
          {screen === 'companion' && <CompanionScreen />}
          {screen === 'support' && <SupportScreen />}
        </section>

        <BottomNav active={screen} onNavigate={setScreen} />
      </main>
    </div>
  )
}

function Header({
  theme,
  onThemeChange,
}: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}) {
  return (
    <header className="top-bar">
      <div className="profile-cluster">
        <div className="avatar" aria-hidden="true">
          ن
        </div>
        <div>
          <p className="eyebrow">١٤ رجب | ٢٥ يناير</p>
          <h1>أهلاً بكِ، نورة</h1>
        </div>
      </div>
      <button
        className="theme-toggle"
        type="button"
        onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
        aria-label={theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع الفاتح'}
      >
        <Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} />
      </button>
    </header>
  )
}

function HomeScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <div className="home-screen">
      <section className="progress-hero">
        <div className="progress-ring" aria-label="الأسبوع الثامن والعشرون من الحمل">
          <div>
            <span>الأسبوع</span>
            <strong>٢٨</strong>
          </div>
        </div>
      </section>

      <section className="bento two">
        <article className="glass-card metric-card">
          <Icon name="hourglass_empty" />
          <strong>٨٤</strong>
          <span>يوماً للقاء طفلكِ</span>
        </article>
        <article className="glass-card insight-card">
          <div className="card-title">
            <Icon name="tips_and_updates" />
            <span>رؤية اليوم</span>
          </div>
          <p>طفلكِ الآن بحجم حبة الباذنجان. بدأت رئتاه بالنضوج استعداداً للتنفس.</p>
        </article>
      </section>

      <section className="tool-grid" aria-label="أدوات سريعة">
        {quickTools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            className="tool-card glass-card"
            onClick={() => {
              if (tool.label === 'الفحص اليومي') onNavigate('checkin')
              if (tool.label === 'رفيقة AI') onNavigate('companion')
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
          <h2>أكملي تسجيلك اليومي</h2>
          <p>شاركيناً حالتك المزاجية والأعراض. سنحوّلها إلى خطوة واضحة، لا إلى قلق.</p>
        </div>
        <button type="button" onClick={() => onNavigate('checkin')} aria-label="بدء الفحص اليومي">
          <Icon name="arrow_back" />
        </button>
      </section>
    </div>
  )
}

function TimelineScreen() {
  return (
    <div className="timeline-screen">
      <div className="screen-heading">
        <span className="eyebrow">رحلة الحمل</span>
        <h2>تطور طفلكِ أسبوعاً بأسبوع</h2>
        <p>مقارنات سعودية مألوفة، ومعلومات قصيرة لا تزدحم عليكِ.</p>
      </div>

      <div className="timeline-list">
        {timelineWeeks.map((item) => (
          <article key={item.week} className={`timeline-item ${item.status}`}>
            <div className="timeline-node">
              {item.status === 'done' ? <Icon name="check" filled /> : item.week}
            </div>
            <div className="glass-card timeline-card">
              <div className="timeline-topline">
                <span>الأسبوع {item.week}</span>
                <strong>{item.label}</strong>
              </div>
              {item.status === 'current' && (
                <>
                  <div className="pomegranate" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h3>حجم طفلك الآن {item.size}</h3>
                  <div className="baby-stats">
                    <span>الطول التقريبي <strong>{item.length}</strong></span>
                    <span>الوزن التقريبي <strong>{item.weight}</strong></span>
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
  selectedMood,
  onSelectMood,
}: {
  selectedMood: string
  onSelectMood: (mood: string) => void
}) {
  return (
    <div className="checkin-screen">
      <div className="flow-header">
        <button className="icon-button" type="button" aria-label="إغلاق">
          <Icon name="close" />
        </button>
        <span>تسجيل يومي</span>
        <div />
      </div>

      <div className="progress-line" aria-hidden="true">
        <span />
      </div>
      <p className="step-count">١ من ٥</p>

      <section className="glass-card check-card">
        <h2>كيف تشعرين اليوم؟</h2>
        <p>استمعي لجسدك ومزاجك اليوم. لا توجد إجابة خاطئة.</p>
        <div className="mood-row">
          {moodOptions.map((mood) => (
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
        <label htmlFor="sleep">كيف كان نومك؟</label>
        <input id="sleep" type="range" min="1" max="5" defaultValue="3" />
        <div className="range-labels">
          <span>متقطع</span>
          <span>جيد</span>
        </div>
      </section>

      <button className="primary-button" type="button">
        التالي
        <Icon name="arrow_back" />
      </button>
    </div>
  )
}

function CompanionScreen() {
  return (
    <div className="companion-screen">
      <div className="screen-heading">
        <span className="eyebrow">رفيقة AI</span>
        <h2>مساحة آمنة للسؤال والطمأنة</h2>
      </div>

      <div className="chat-thread">
        <article className="bubble ai">
          <strong>رفيقة</strong>
          <p>أنا معكِ يا نورة. أخبريني بما يقلقك، وسأساعدك بخطوة واضحة ولطيفة.</p>
        </article>
        <article className="bubble user">
          <p>حركة الطفل اليوم أقل من المعتاد.</p>
        </article>
        <article className="bubble ai">
          <strong>رفيقة</strong>
          <p>أفهم قلقك. ابدئي بجلسة عد الركلات الآن. إذا بقيت الحركة أقل من المعتاد، تواصلي مع طبيبتك أو الطوارئ.</p>
        </article>
      </div>

      <div className="quick-replies">
        <button type="button">ابدئي عد الركلات</button>
        <button type="button">حضري أسئلة للطبيبة</button>
        <button type="button">أحتاج تهدئة</button>
      </div>

      <form className="chat-input">
        <button type="button" aria-label="إدخال صوتي">
          <Icon name="mic" />
        </button>
        <input type="text" placeholder="اكتبي ما يدور في بالك..." />
        <button type="submit" aria-label="إرسال">
          <Icon name="send" />
        </button>
      </form>
    </div>
  )
}

function SupportScreen() {
  return (
    <div className="support-screen">
      <div className="screen-heading teal">
        <span className="eyebrow">الدعم الهادئ</span>
        <h2>عندما يصبح اليوم ثقيلاً</h2>
        <p>لا نعرض تشخيصاً ولا نضغط عليكِ. فقط خطوات آمنة وواضحة.</p>
      </div>

      <section className="safe-mode glass-card">
        <div className="breathing-circle" aria-hidden="true" />
        <h3>نحن هنا معكِ</h3>
        <p>خذي نفساً بطيئاً. اختاري شخصاً تثقين به، أو اطلبي دعماً طبياً فوراً إذا شعرتِ أنكِ غير آمنة.</p>
        <div className="support-actions">
          <button type="button">اتصلي بشخص تثقين به</button>
          <button type="button">اعرضي موارد عاجلة</button>
        </div>
      </section>

      <section className="glass-card pathway-card">
        <div className="card-title">
          <Icon name="local_hospital" />
          <span>من أتواصل معه؟</span>
        </div>
        <ul>
          <li>أعراض بسيطة ومتكررة: طبيبة النساء أو طب الأسرة.</li>
          <li>نزيف، ألم شديد، أو قلة حركة واضحة: الطوارئ فوراً.</li>
          <li>ضيق نفسي مستمر: مختصة نفسية أو مركز موثوق.</li>
        </ul>
      </section>
    </div>
  )
}

function BottomNav({
  active,
  onNavigate,
}: {
  active: Screen
  onNavigate: (screen: Screen) => void
}) {
  return (
    <nav className="bottom-nav" aria-label="التنقل السفلي">
      {navItems.map((item) => (
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
