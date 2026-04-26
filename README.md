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
| `/api/kick-sessions?lang=ar|en` | `POST` | Kick count session guidance |
| `/api/contractions?lang=ar|en` | `POST` | Contraction pattern guidance |

This slice does not persist health data yet. The next backend milestone is Supabase auth, migrations, RLS, consent, export, and delete flows.

## Product Direction

RIFQA should be both a complete pregnancy tracker and a culturally fluent maternal wellness companion. The FE foundation is designed around:

- warm intelligent glass visual language
- native RTL
- Arabic as the primary product language
- calm mental-health flows
- no clinical panic styling
- light and dark mode parity
