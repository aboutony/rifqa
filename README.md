# RIFQA App

Arabic-first full-stack foundation for RIFQA, a Saudi and GCC maternal wellness companion.

## What Is Built

- Vite + React + TypeScript app shell
- RTL Arabic-first mobile UI adapted from the Stitch UI direction
- Light mode and dark mode token system
- Home dashboard with pregnancy progress and quick tools
- Pregnancy timeline with Saudi baby-size comparison
- Daily emotional check-in flow
- AI companion chat screen
- Mental-health support and care-pathway screen
- Vercel API backend foundation with bilingual contracts
- Safety-first backend stubs for check-ins, AI companion, kick sessions, and contractions
- Seeded demo mode where every visible button has a working destination or action
- Supabase production schema with RLS for profiles, pregnancies, consents, check-ins, kicks, contractions, symptoms, weight logs, and privacy requests

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Backend API

The current backend runs as Vercel serverless functions under `api/`.

| Endpoint | Method | Purpose |
|---|---:|---|
| `/api/health` | `GET` | API health and version |
| `/api/bootstrap?lang=ar|en` | `GET` | Demo profile, timeline, action cards, capabilities |
| `/api/profile` | `GET` / `PUT` | Demo journey profile contract |
| `/api/checkins?lang=ar|en` | `POST` | Daily check-in safety assessment |
| `/api/companion?lang=ar|en` | `POST` | Safety-first AI companion stub |
| `/api/visit-summary?lang=ar|en` | `POST` | AI-assisted doctor visit summary |
| `/api/kick-sessions?lang=ar|en` | `POST` | Kick count session guidance |
| `/api/contractions?lang=ar|en` | `POST` | Contraction pattern guidance |
| `/api/symptoms` | `POST` | Symptom log persistence |
| `/api/weight-logs` | `POST` | Pregnancy weight log persistence |
| `/api/consents` | `POST` | Consent event persistence |
| `/api/privacy` | `POST` | Export/delete privacy request persistence |
| `/api/recommendations?lang=ar|en` | `POST` | AI/rules wellness recommendations for relaxation audio and exercise |
| `/api/playlists` | `POST` | User relaxation playlist persistence |
| `/api/exercise-plans` | `POST` | Doctor or AI exercise plan persistence |

In `RIFQA_ENV=demo`, API routes return seeded/demo responses without requiring auth. In `RIFQA_ENV=production`, routes require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a valid `Authorization: Bearer <access_token>` header.

The initial Supabase migration is in `supabase/migrations/202604260001_initial_health_data.sql`.

## Legal Drafts

- `docs/legal/PRIVACY_POLICY_DRAFT.md`
- `docs/legal/TERMS_AND_MEDICAL_DISCLAIMER_DRAFT.md`

These drafts are Saudi-focused and reference PDPL/SDAIA posture, but they still require Saudi-qualified legal review before launch.

## Product Direction

RIFQA should be both a complete pregnancy tracker and a culturally fluent maternal wellness companion. The FE foundation is designed around:

- warm intelligent glass visual language
- native RTL
- Arabic as the primary product language
- calm mental-health flows
- no clinical panic styling
- light and dark mode parity
