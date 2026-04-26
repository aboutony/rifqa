# RIFQA Revised Modules, Features, FE/BE Roadmap

Generated: 2026-04-26  
Scope reviewed: RIFQA module map, MotherCare KSA MVP blueprint, AI developer handoff, Figma/design prompt, Stitch UI screens, competitive battlecard, WTE, Bump, and Amila notes.

## 1. Blunt Strategic Verdict

RIFQA has a strong strategic spine: Arabic-first, Saudi-first, privacy-first, emotionally intelligent maternal support. That is real differentiation. WTE, Bump, and Amila are mostly tracking, content, planning, or registry products. RIFQA can become the maternal wellness operating system for Saudi and GCC mothers.

But the current module map is incomplete if the goal is to become number one. The product cannot ask users to appreciate its mental-health depth while missing basic pregnancy utilities they expect on day one. Contraction counter, kick counter, pregnancy weight tracking, baby size comparisons, pregnancy visuals, symptom logs, milestone tracking, and memory capture are not optional. They are the entry ticket.

The winning product is not "tracker vs companion." It must be both: the best tracker, the safest companion, and the most culturally fluent maternal platform in the region.

## 2. Competitive Reality

| Competitor | What They Do Well | Where RIFQA Can Beat Them | What RIFQA Must Copy or Improve |
|---|---|---|---|
| What to Expect | Huge brand trust, 15M+ users, medical content, 3D development videos, size comparisons, contraction/kick/weight tools, community, registry, fertility tools | Arabic-native emotional companion, Saudi care pathways, PPD screening, crisis-safe mode, privacy posture, family-context support | 3D/visual weekly development, baby-size moments, full pregnancy utility suite, richer medical-review signals |
| Bump | Planning, registry, birth plan, baby names, baby shower, milestones, visual shareability | No Arabic, no Saudi relevance, no mental health, no AI, no local care logic | Birth plan, baby-name finder, registry/gift tools, milestone tracker, shareable memory cards |
| Amila | Simple, free, low-friction utilities: week, due date, contractions, kicks, weight | RIFQA is vastly deeper if it remains simple at the surface | Do not lose the simple-tool user. Make core tracking faster than Amila. |

## 3. Revised Product Pillars

1. **Track everything that matters, without obsession.** Pregnancy, labor, newborn routines, postpartum recovery, milestones, medications, appointments, and memories.
2. **Guide the mother, not just the baby.** Mood, fatigue, support, PPD risk, crisis pathways, and what-to-do-now actions.
3. **Own Saudi/GCC context.** Arabic-first UX, Hijri/Gregorian, Ramadan, Islamic guidance, Saudi care pathways, CCHI, maternity leave, local hospitals, family dynamics.
4. **Make AI safe and useful.** LLM for companionship and plain-language support, rules for safety-critical decisions, no black-box clinical escalation.
5. **Build trust as infrastructure.** Consent, privacy center, data minimization, no employer visibility, audit trails, clinical content review, PDPL-aligned design.
6. **Create long-term lock-in ethically.** Baby journal, milestone archive, shareable cards, partner mode, local services, telehealth, B2B sponsored access.

## 4. Revised Modules and Capabilities

### 4.1 Journey Intelligence Core

| Module | Capabilities | FE Requirements | BE Requirements |
|---|---|---|---|
| Unified Mother Profile | Pregnancy week, due date, unknown-week path, postpartum stage, child age up to 3, delivery type, feeding mode, baseline sleep/stress/support | Gentle onboarding, editable profile, "not sure" flows, privacy promise before sensitive inputs | `profiles`, `journey_states`, versioned onboarding answers, stage calculator, confidence levels |
| Journey Engine | Determines stage, check-in cadence, content eligibility, tone, nudge intensity | Invisible to user except relevant dashboard cards | Rules engine, state machine, feature flags, event triggers, audit logs |
| Timeline | Week-by-week pregnancy, postpartum recovery timeline, child age timeline | Pregnancy timeline, postpartum timeline, toddler milestone timeline | Timeline content schema by stage, localized content payloads |

### 4.2 Table-Stakes Pregnancy Toolkit

These must ship before public launch.

| Module | Capabilities | FE Requirements | BE Requirements |
|---|---|---|---|
| Due Date and Week Calculator | Due date, LMP estimate, manual week, unknown week | Simple date picker, week selector, "not sure" fallback | Calculator service, confidence model |
| Contraction Counter | Start/stop contractions, duration, frequency, hospital guidance thresholds | One-tap timer, large buttons, history list, safe guidance copy | `contractions`, summary calculations, threshold rules |
| Kick Counter | Count kicks, sessions, reminders, reduced movement guidance | Large tap target, session timer, reassurance and escalation copy | `kick_sessions`, `kick_events`, rules for concerning patterns |
| Pregnancy Weight Tracker | Weight logs, gain range, doctor-visit notes | Chart, log modal, unit switch, non-shaming copy | `weight_logs`, range reference by BMI where available |
| Symptom and Medication Log | Symptoms, severity, notes, medications, appointment prep | Fast chips, body map optional later, doctor summary | `symptom_logs`, `medication_logs`, exportable visit summary |
| 3D / Visual Baby Development | Weekly visual, development highlights, shareable card | Weekly hero visual, size comparison, WhatsApp/Instagram share card | Licensed visual asset CMS, media metadata, share-card generation |
| Saudi Baby Size Comparisons | Dates, figs, pomegranates, qahwa cup, local objects | Delight card in timeline and home | CMS entries by week, Arabic/English copy |
| Twin Mode | Twin pregnancy flag, adjusted visual/copy | Optional setting during pregnancy profile | Profile flag, content variants |

### 4.3 Mental Health and Emotional Safety

| Module | Capabilities | FE Requirements | BE Requirements |
|---|---|---|---|
| Daily Check-in | Mood, fatigue, sleep, stress, support, optional note | 10-second flow, swipe cards, mood words, no diagnosis language | `checkins`, trend calculations, privacy controls |
| PPD / Anxiety Screening | Localized screening, no public score, trend-based interpretation | Soft language, one question per card, result framed as next step | Screening templates, scoring rules, escalation thresholds, audit trail |
| Mood Trends | Simple trend view over time | "How things have been lately" chart | Aggregation tables, trend window logic |
| Crisis-Safe Mode | Scripted grounding, trusted person prompt, local urgent resources | Calm teal mode, no red panic UI, no paywall | Safety rules, crisis event flags, resource directory |
| Support Library | Short contextual cards, coping exercises, sleep-deprivation support | Stage-aware content cards | CMS, clinical-review workflow, citations/approval metadata |

### 4.4 AI Companion and What-To-Do-Now Guidance

| Module | Capabilities | FE Requirements | BE Requirements |
|---|---|---|---|
| Arabic AI Companion | Reflective Arabic chat, voice-ready, bounded medical responses | Chat screen, quick replies, optional voice input, private summaries | LLM gateway, safety filters, prompt templates, redaction, rate limits |
| Smart Action Cards | Reassure, try action, talk to family, prepare for clinic, urgent help | Home cards and post-check-in cards | Rules engine, recommendation service, content lookup |
| Doctor Visit Prep | Symptoms summary, questions, what to say in Arabic | Export/share summary screen | Visit summary generator, PDF/share payload |
| Saudi Care Pathway Helper | OB, family medicine, ER, hotline, telehealth guidance | "Who should I contact?" decision support | Care pathway rules, hospital/resource directory |

### 4.5 Baby, Postpartum, and 0-3 Year Retention

| Module | Capabilities | FE Requirements | BE Requirements |
|---|---|---|---|
| Baby Routines | Feeding, sleep, diapers, pumping, optional medication | Fast logs, minimal mode, pattern insight cards | `baby_logs`, routine aggregations, pattern rules |
| Postpartum Recovery | Bleeding, pain, C-section recovery, sleep, feeding stress | Recovery check-ins, body recovery cards | Recovery log tables, red-flag rules |
| Milestone Tracker | Month-by-month milestones to age 3 | Age timeline, milestone cards, pediatric visit prep | `milestones`, local milestone CMS |
| Baby Journal | Photos, firsts, notes, memory cards | Private journal, shareable Arabic cards | `journal_entries`, media storage, share renderer |
| Vaccination Schedule | Saudi MOH-aligned reminders | Vaccine timeline and reminders | Vaccine schedule CMS, reminders, completed records |

### 4.6 Saudi and GCC Moat

| Module | Capabilities | FE Requirements | BE Requirements |
|---|---|---|---|
| Ramadan Mode | Fasting guidance, suhoor/iftar-aware nudges, breastfeeding and pregnancy safety | Seasonal mode, gold/night palette, fasting check-ins | Ramadan calendar service, prayer-time integration, content rules |
| Islamic Pregnancy Guidance | Duas, spiritual support, Islamic baby names, scholar-reviewed guidance | Optional faith layer, never forced | Scholar-review metadata, content approval |
| Hijri and Gregorian Dates | Due date, birth date, milestones in both calendars | Date display toggle, default Saudi-friendly formatting | Hijri conversion service |
| Arabic Baby Name Finder | Meaning, origin, Quranic/Islamic relevance, Saudi usage, favorites | Search, filters, favorites, share card | `baby_names`, search index, content review |
| Family Context and Partner Mode | Husband view, support prompts, privacy boundaries, family support map | Invite partner, read-only support view, hidden mental health data | `family_members`, permissions, visibility matrix |
| Domestic Support Context | Guidance adjusts if mother has home help or family support | Private support-at-home settings | Profile field, rules variants |
| Hajj / Umrah Safety | Travel guidance for pregnancy/postpartum | Seasonal travel guidance cards | Content CMS, location-free rule prompts |

### 4.7 Planning, Commerce, and Growth

| Module | Capabilities | FE Requirements | BE Requirements |
|---|---|---|---|
| Birth Plan Builder | Saudi hospital-ready plan, preferences, Arabic export | Guided builder, PDF/share | `birth_plans`, template renderer |
| Registry / Gift List | Noon/Amazon.sa/Saudi retailers, baby essentials | Checklist, affiliate/product cards | Product catalog integration, affiliate tracking |
| Community, Carefully Moderated | Anonymous cohorts, expert AMAs, no open chaos | Closed groups, reporting, moderation UI | Moderation queue, identity controls, abuse detection |
| Telehealth Partners | Referral, visit prep, post-visit follow-up | Partner booking links, handoff summary | Partner API, referral records |
| B2B Sponsored Access | Employer-funded subscriptions, no individual visibility | Activation code, privacy explanation | Entitlements, org accounts, aggregate-only analytics |

## 5. Recommended MVP Cut

### MVP Must Include

1. Onboarding, privacy promise, anonymous or low-PII account path.
2. Journey profile, pregnancy week/due date, unknown-week flow.
3. Home dashboard with stage-aware cards.
4. Daily emotional check-in.
5. PPD/anxiety screening and crisis-safe mode.
6. AI companion with hard safety boundaries.
7. What-to-do-now action cards.
8. Contraction counter.
9. Kick counter.
10. Pregnancy weight tracker.
11. Symptom and medication log.
12. Baby size comparisons.
13. Basic weekly baby development visuals.
14. Feeding, sleep, diaper logs.
15. Privacy center, delete/export controls.
16. Basic CMS, admin console, content review tags.
17. Notifications, quiet hours, nudge cooldowns.
18. Subscriptions with crisis/paywall protections.

### MVP Should Not Include Yet

Open community, full marketplace, complex gamification, insurer integrations, unmoderated forums, aggressive social mechanics, employer dashboards that imply individual monitoring, or unsupported medical claims.

## 6. Detailed FE Phases and Subphases

### FE Phase 0: Product System and Design Foundation

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 0.1 Design tokens | Light mode and dark mode colors, typography, spacing, radius, elevation, RTL/LTR token behavior | All screens use tokens only; Arabic body >= 16px; light mode and dark mode both work |
| 0.2 Navigation model | Bottom nav, central companion/action FAB, deep links | Core flows reachable in <=2 taps from home |
| 0.3 Arabic-first UX kit | Buttons, inputs, chips, date pickers, charts, timers, modals | RTL works natively; no manual mirrored hacks |
| 0.4 Accessibility | Screen-reader labels, 48px touch targets, dynamic text | Critical health flows usable at 200% text size |

### FE Phase 1: Onboarding and Trust

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 1.1 Splash and language | RIFQA brand entry, Arabic default, English available | User can choose language in first session |
| 1.2 Privacy promise | "Your data is yours" consent, sensitive-data explanation | Continue disabled until consent is explicit |
| 1.3 Anonymous/low-PII start | No name/email/phone required | User reaches home without PII |
| 1.4 Journey setup | Pregnant, postpartum, child age, trying later | Profile can be edited anytime |
| 1.5 Emotional baseline | Four to seven gentle baseline states | Baseline stored and visible only to mother |

### FE Phase 2: Pregnancy Table Stakes

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 2.1 Pregnancy home | Week, trimester, due date, today card, quick actions | First screen proves the app is a real pregnancy app |
| 2.2 Timeline | Week 1-42 timeline with current week | Unknown-week users see general mode, not broken UI |
| 2.3 Contraction counter | One-tap start/stop, frequency, duration, history | Works offline; large labor-safe controls |
| 2.4 Kick counter | Session start, count, timer, history | Reduced-movement guidance is calm and clear |
| 2.5 Weight tracker | Log, chart, visit notes | Copy is non-shaming; units handled |
| 2.6 Symptoms/meds | Chips, severity, notes, doctor summary | Summary can be shared/exported |
| 2.7 Baby size/visuals | Saudi comparisons, visual weekly content | Weekly card is shareable |

### FE Phase 3: Mental Health and Guidance

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 3.1 Daily check-in | Mood, fatigue, sleep, stress, support | Completed in under 15 seconds |
| 3.2 Screening flows | Localized question cards | No diagnosis language shown |
| 3.3 Mood trends | Simple trend summary | Avoids alarming charts and labels |
| 3.4 Crisis-safe mode | Breathing UI, trusted person, urgent resources | No paywall; no red panic visual language |
| 3.5 What-to-do-now | Reassurance/action/clinic/urgent cards | Every concerning input ends in a concrete next step |

### FE Phase 4: AI Companion

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 4.1 Chat UI | Arabic-first chat, quick replies, citations/limits when needed | User knows AI is support, not a doctor |
| 4.2 Context handoff | Chat can use stage/check-in context with consent | Sensitive context is clearly controlled |
| 4.3 Voice input | Arabic voice input for concerns and logs | Text fallback always available |
| 4.4 Private summary | "What I understood" summary for user only | User can delete summary |

### FE Phase 5: Baby and 0-3 Retention

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 5.1 Baby dashboard | Age, routines, today insight, reminders | Post-birth transition feels natural |
| 5.2 Logs | Feeding, sleep, diapers, pumping | One-handed logging in <=2 taps |
| 5.3 Milestones | Month timeline, milestone capture | Covers newborn through age 3 |
| 5.4 Journal | Firsts, photos, notes, share cards | Exportable/private by default |
| 5.5 Vaccines | Saudi schedule, reminders | Clear completed/upcoming states |

### FE Phase 6: Saudi/GCC Differentiators

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 6.1 Ramadan mode | Seasonal UI, fasting guidance, suhoor/iftar-aware cards | Can launch as PR-worthy feature |
| 6.2 Islamic guidance | Duas, spiritual support, reviewed content | Optional, respectful, not preachy |
| 6.3 Baby names | Arabic name finder, meanings, filters, favorites | Fast search; shareable name cards |
| 6.4 Partner mode | Husband/supporter read-only view | Mental health stays hidden by default |
| 6.5 Birth plan | Saudi hospital-ready preferences | Arabic export usable in clinic |

### FE Phase 7: Growth and Operations

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 7.1 Subscription UX | Ethical paywall, trial, restore purchases | No paywall in distress/crisis |
| 7.2 B2B activation | Employer code, sponsored plan badge | Privacy guarantee shown before activation |
| 7.3 Telehealth entry | Partner cards, visit prep, post-visit notes | No dependency on one provider |
| 7.4 Moderated community | Closed cohorts, expert AMA, reporting | Cannot launch without moderation console |

## 7. Detailed BE Phases and Subphases

### BE Phase 0: Architecture, Compliance, and Data Model

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 0.1 Supabase project | Auth, RLS, environments, secrets | RLS enabled on every user table |
| 0.2 Data minimization | UUID-first profile, no mandatory PII | User can use MVP without name/email/phone |
| 0.3 Core schema | Profiles, pregnancies, children, check-ins, logs, events | Migrations versioned and documented |
| 0.4 Audit and safety logs | Rule outcomes, escalation events, consent changes | Sensitive logs exclude raw chat by default |
| 0.5 PDPL posture | Consent, delete/export, retention policy | Delete/export works end to end |

### BE Phase 1: Journey Engine and Content CMS

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 1.1 Stage calculator | Pregnancy week, unknown week, postpartum stage, child age | Returns deterministic state for every profile |
| 1.2 Rules engine | Nudge eligibility, care pathway, safety thresholds | Rules are auditable and test-covered |
| 1.3 CMS | Cards, articles, visuals, translations, review states | Content can be updated without app release |
| 1.4 Clinical review workflow | Draft, reviewed, approved, retired | User-facing health content must be approved |

### BE Phase 2: Tracking and Logs

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 2.1 Pregnancy utilities | Due date, contractions, kicks, weight, symptoms, meds | Offline sync conflict rules documented |
| 2.2 Baby routines | Feeding, sleep, diaper, pumping logs | Aggregates support daily insight cards |
| 2.3 Milestones and journal | Milestone records, media storage, journal privacy | Media storage has signed URLs and deletion |
| 2.4 Vaccines and reminders | Saudi schedule CMS, reminder jobs | Schedule can be updated centrally |

### BE Phase 3: Mental Health and Safety

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 3.1 Check-in service | Mood, sleep, fatigue, stress, support | Trend calculations avoid single-day overreaction |
| 3.2 Screening service | Localized tools, scoring, thresholds | Scores never exposed as diagnosis |
| 3.3 Escalation service | Reassurance, specialist, urgent, crisis | Deterministic and testable |
| 3.4 Resource directory | Saudi hotlines, hospitals, telehealth links | Resources versioned and region-aware |
| 3.5 Safety monitoring | Anonymized safety event queue | Admin sees risk event, not raw private content unless policy permits |

### BE Phase 4: AI Platform

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 4.1 LLM gateway | Provider abstraction, rate limits, logging controls | No direct app-to-model calls |
| 4.2 Prompt system | Arabic tone, journey context, safety boundaries | Prompts versioned and testable |
| 4.3 Guardrails | Medical refusal, crisis detection, medication boundaries | Safety rules override model output |
| 4.4 Redaction | Remove PII and sensitive identifiers before model calls where possible | Redaction tests cover Arabic and English |
| 4.5 Conversation summaries | Optional private summaries | User can delete conversation and summary |

### BE Phase 5: Notifications and Personalization

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 5.1 Notification engine | Reminders, quiet hours, prayer-aware timing later | Cooldowns prevent spam |
| 5.2 Nudge optimization | Timing and content personalization | Never escalates safety decisions via black box |
| 5.3 Feature flags | Ramadan mode, partner mode, B2B, experiments | Can target by locale/stage safely |

### BE Phase 6: Monetization, B2B, and Integrations

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 6.1 Entitlements | Free/paid, trial, restore, sponsored access | Crisis flows bypass paywall |
| 6.2 B2B orgs | Employer plans, codes, seats, aggregate reporting | No individual visibility, ever |
| 6.3 Telehealth | Referral links, summaries, partner callbacks | Partner integrations cannot access mental health data without explicit consent |
| 6.4 Registry/commerce | Product catalog, affiliate links, gift lists | Clearly marked commercial content |

### BE Phase 7: Admin and Analytics

| Subphase | Build | Acceptance Criteria |
|---|---|---|
| 7.1 Admin console | Users support, content, resources, safety queue | Role-based access |
| 7.2 Privacy-safe analytics | Retention, activation, check-in completion, conversion | No raw chat content stored for analytics |
| 7.3 Quality dashboards | Crash, latency, failed sync, AI safety incidents | Production alerts defined |
| 7.4 Research exports | De-identified cohort data for clinical validation | Approval workflow before export |

## 8. Backend Development Status

### Current BE Slice: Vercel API Foundation

This repo has now moved from frontend-only prototype to a deployable Vercel full-stack foundation. The backend is intentionally thin but production-shaped: route contracts, validation boundaries, deterministic safety rules, localized responses, and a clear persistence handoff to Supabase.

| Area | Implemented Now | Still Missing |
|---|---|---|
| API runtime | Vercel serverless routes under `api/` | Supabase project, database migrations, RLS policies |
| Health and bootstrap | `GET /api/health`, `GET /api/bootstrap?lang=ar|en` | Environment checks, CMS-backed bootstrap payloads |
| Profile | `GET /api/profile`, `PUT /api/profile` with clamped pregnancy week | Authenticated user identity, persisted profile updates |
| Daily check-ins | `POST /api/checkins?lang=ar|en` with mood, sleep, symptoms, safety assessment | Stored check-ins, trends, screening templates |
| AI companion | `POST /api/companion?lang=ar|en` safety-first rules stub | OpenAI gateway, prompt versions, redaction, model telemetry |
| Kick counter | `POST /api/kick-sessions?lang=ar|en` with reduced-movement guidance | Session persistence, reminders, history charts |
| Contraction counter | `POST /api/contractions?lang=ar|en` with pattern guidance | Labor session persistence, clinician export |
| Symptom and weight logs | `POST /api/symptoms`, `POST /api/weight-logs` with Supabase persistence when authenticated | Visit summary generation and trend views |
| Consent and privacy | `POST /api/consents`, `POST /api/privacy` for export/delete request records | Automated export package and deletion workflow |
| Localization | Arabic and English API responses | Translation CMS and reviewer workflow |
| Safety | Rule-based urgent/watch/normal classification | Clinician-approved rule registry and audit trail |

### BE Phase 0A: Done in Code

| Item | Status | Notes |
|---|---|---|
| Serverless API structure | Done | `api/_lib` contains shared HTTP, content, and safety helpers |
| Bilingual response contracts | Done | `lang=ar|en` supported in user-facing endpoints |
| Safety-first companion stub | Done | No direct model call yet, which is correct until guardrails and redaction are ready |
| Tracker API contracts | Done | Kick and contraction endpoints define MVP data shapes |
| Supabase initial schema | Done | Migration covers profiles, pregnancies, consents, check-ins, kicks, contractions, symptoms, weights, privacy requests |
| RLS policies | Done | Every user-owned table has owner-only RLS policies |
| Demo/production split | Done | Demo works without auth; production requires Supabase env and Bearer token |
| Build/lint verification | Done | `npm run lint` and `npm run build` pass |

### BE Phase 0B: Next Required Backend Work

| Priority | Build | Why It Matters |
|---|---|---|
| P0 | Supabase project creation and migration execution | The schema exists in code but must be applied to the real Supabase project |
| P0 | Auth UI with anonymous/low-PII mode | Matches the privacy promise and removes signup friction |
| P0 | Frontend API integration for persisted trackers | Demo UI is clickable; production UI still needs authenticated API wiring |
| P0 | Export package and deletion worker | Request records exist; actual export/delete processing is next |
| P1 | OpenAI gateway with Arabic safety prompt, redaction, rate limits, and safety override | AI should not ship as raw chat completion |
| P1 | Content CMS tables for timeline, care pathways, and resources | Medical content must be reviewed and updateable without releases |
| P1 | Visit summary generator | Converts logs into practical clinical value |

### Blunt Backend Warning

The current backend is a good first move, not a real health-data backend yet. The next milestone must be persistence plus RLS. AI can wait; storing the mother's core journey safely cannot.

## 9. Suggested Release Plan

### Alpha: Saudi Foundation

Goal: prove the app feels trustworthy and Arabic-native.

Ships: onboarding, privacy, journey profile, home, check-in, basic AI chat, basic CMS, admin shell, RLS, anonymous/low-PII auth.

### Private Beta: Complete Pregnancy App

Goal: remove every obvious competitor gap.

Ships: contraction counter, kick counter, weight, symptoms, meds, weekly timeline, baby size comparisons, visual development, notifications, subscriptions skeleton.

### Public Launch: Companion Plus Tracker

Goal: launch as a complete pregnancy and postpartum companion.

Ships: PPD screening, crisis-safe mode, action cards, Saudi care pathway, baby logs, privacy center, paywall protections, doctor summary.

### Launch +90 Days: Retention Moat

Goal: keep mothers after birth.

Ships: milestone tracker, baby journal, vaccines, postpartum recovery, shareable cards, improved AI summaries.

### Launch +180 Days: Saudi Category Ownership

Goal: become impossible to dismiss as a translated Western app.

Ships: Ramadan mode, Islamic guidance, Arabic baby names, partner mode, birth plan, B2B sponsored access pilot.

### Year 2: Platform

Goal: become the maternal health platform.

Ships: telehealth partners, moderated community, registry, academic validation, advanced personalization, aggregate B2B insights.

## 10. Non-Negotiable Product Rules

1. Do not launch publicly without contraction counter, kick counter, and weight tracking.
2. Do not paywall crisis, distress, or urgent guidance.
3. Do not show diagnostic labels to users.
4. Do not store raw chat content for analytics.
5. Do not give employers individual-level visibility.
6. Do not treat Arabic as translation. Arabic is the default product.
7. Do not create an open community without moderation infrastructure.
8. Do not make the UI feel like a hospital form. Warm, calm, and precise.
9. Do not let AI make safety-critical decisions alone.
10. Do not overbuild marketplace/community before the core companion works.

## 10. Number-One App Bet

The biggest bet is this: **RIFQA must become the first app that understands the Saudi mother as a whole person: body, baby, emotions, faith, family, healthcare system, and privacy.**

That is bigger than WTE. Bigger than Bump. More useful than Amila. But only if the basics are flawless.

The strategy is simple:

1. Match the competitors on expected pregnancy utilities.
2. Beat them on emotional safety and Arabic AI.
3. Own Saudi/GCC cultural depth before anyone else wakes up.
4. Convert trust into retention, then retention into B2B and healthcare partnerships.

If executed with discipline, RIFQA can be the number one maternal app in Saudi Arabia and a serious MENA category leader.
