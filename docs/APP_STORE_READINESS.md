# App Store And Play Store Readiness

Status: pre-submission checklist.

## Store Listing

- App name: RIFQA / رفقة.
- Category: Health & Fitness or Medical only after legal review.
- Age rating reviewed for pregnancy, postpartum, mental-health, and crisis support content.
- Arabic and English listing text reviewed by localization and legal.
- Screenshots include Arabic-first flows and English parity.
- Do not claim diagnosis, treatment, emergency response, or guaranteed medical outcomes.

## Privacy Labels

Confirm declarations for:

- Health and fitness data.
- User content such as journal/check-ins.
- Identifiers for account/auth.
- Usage data if analytics are added.
- Diagnostics if crash reporting is added.
- AI processing provider disclosure where required.

## Review Notes

Provide reviewers:

- Test account for mother app.
- Test account for admin app if required, or explain admin area is private.
- Medical disclaimer summary.
- Privacy policy URL.
- Terms URL.
- Explanation that crisis/urgent guidance is not paywalled.

## Technical Checks

- Mobile viewport checked across core screens.
- RTL and LTR screenshots reviewed.
- No clipped text in Arabic.
- Voice features degrade gracefully when browser speech APIs are unavailable.
- Push notification copy reviewed in Arabic and English.
- Account deletion/export reachable from Privacy Center.

## Release Blocking Items

- Missing legal/clinical approval.
- Unreviewed medical claims in listing or screenshots.
- Any B2B copy implying employer/insurer access to individual data.
- In-app community enabled before moderation tooling is live.
- AI direct-to-model calls from client.
