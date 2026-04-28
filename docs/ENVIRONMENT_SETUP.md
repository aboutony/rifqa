# RIFQA Environment Setup

Status: production readiness draft, reviewed before every release.

## Required Environments

Use separate Supabase projects and Vercel projects for:

- `local`: developer machine, demo mode allowed.
- `preview`: Vercel preview deployments, no real users.
- `production`: live app, real users, backups and monitoring enabled.

## Environment Variables

Client:

- `VITE_SUPABASE_URL`: Supabase project URL for browser auth.
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key for browser auth.

Server:

- `RIFQA_ENV`: `demo` locally, `production` for live deployments.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY`: Supabase anon key, used only where explicitly needed.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service role key. Never expose to the client.
- `OPENAI_API_KEY`: server-only OpenAI key.
- `OPENAI_MODEL`: current production model for safe AI responses.
- `OPENAI_PROMPT_VERSION`: active prompt version label.
- `RIFQA_AI_RATE_LIMIT`: requests per minute for AI endpoints. Default: `20`.
- `RIFQA_ADMIN_RATE_LIMIT`: requests per minute for admin mutations. Default: `60`.
- `RIFQA_DISABLE_RATE_LIMITS`: only set to `1` during controlled local testing.
- `RIFQA_BASE_URL`: deployment base URL used by seed/sync scripts.
- `RIFQA_REVIEWER_ACCESS_TOKEN`: short-lived reviewer/admin bearer token for seed sync.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Keep `RIFQA_ENV=demo` unless testing real Supabase auth.
3. Run `npm install`.
4. Run `npm run dev`.
5. Run `npm run test:api` before pushing.

## Production Setup

1. Create Supabase production project.
2. Apply every migration in `supabase/migrations` in timestamp order.
3. Create at least one admin user and grant a reviewer/admin role.
4. Configure all Vercel environment variables.
5. Deploy with `npm run build`.
6. Run the reviewed-content seed sync.
7. Run smoke checks against `/`, `/admin`, `/api/health`, and `/api/content-library`.

## Key Handling

- Rotate `SUPABASE_SERVICE_ROLE_KEY` after any suspected exposure.
- Use short-lived reviewer tokens for `RIFQA_REVIEWER_ACCESS_TOKEN`.
- Do not store production tokens in screenshots, bug reports, or client logs.
