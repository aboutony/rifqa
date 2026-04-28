# RIFQA Production Readiness

Status: launch checklist draft.

## Deployment Seed And Sync

Reviewed health content must be synced after migrations and before launch:

```bash
RIFQA_BASE_URL=https://your-production-domain.example \
RIFQA_REVIEWER_ACCESS_TOKEN=reviewer_or_admin_bearer_token \
npm run seed:reviewed-content
```

The script calls `/api/sync-reviewed-content`, writes review audit entries, and requires a clinical reviewer or admin token in production.

## Monitoring And Error Logging

Current production hooks:

- API errors from auth/context failures are logged with structured JSON.
- Rate-limit events are logged with route, bucket, limit, and request id.
- Vercel captures `console.error`, `console.warn`, and `console.info`.
- OpenAI request ids are returned where available and should be included in support tickets.

Recommended external monitors:

- Uptime check: `/api/health`.
- Synthetic mother app check: home page, check-in, AI fallback.
- Synthetic admin check: `/admin` gate loads.
- Alert on repeated `api_error` or `rate_limited` events.

## Rate Limits

Protected paths:

- AI: `/api/companion`, `/api/visit-summary`.
- Admin mutations: `/api/review-queue`, `/api/reviewer-roles`, `/api/prompt-config`, `/api/sync-reviewed-content`, `/api/b2b-reports`.

Defaults:

- `RIFQA_AI_RATE_LIMIT=20` per minute per bearer token or IP.
- `RIFQA_ADMIN_RATE_LIMIT=60` per minute per bearer token or IP.

Serverless in-memory limits are a first line of defense. Production should add provider-level controls such as Vercel WAF or an API gateway if traffic grows.

## Privacy And Safety Release Gates

- No raw chat analytics enabled by default.
- Crisis, urgent safety, kick counter, contraction timer, export, and deletion remain unpaywalled.
- B2B reports must remain aggregate-only and enforce 10+ user thresholds.
- Community remains delayed until moderation tooling is ready.
- User-facing health content must show reviewer, specialty, approval date, expiry date, and citations.

## Launch Smoke Test

Run:

```bash
npm run test:api
npm run build
npx playwright test --list
```

For visual baseline release testing, run:

```bash
npx playwright test --update-snapshots
npx playwright test
```

Review and commit screenshots only after human inspection.
