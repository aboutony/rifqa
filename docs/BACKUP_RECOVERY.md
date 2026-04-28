# Backup And Recovery Plan

Status: production readiness draft.

## Backup Scope

Back up:

- Supabase Postgres database.
- Supabase auth users and role metadata.
- Storage buckets if added later.
- Vercel environment variable inventory, without printing secrets into tickets.
- Reviewed-content seed source in Git.

Do not back up local demo data as production truth.

## Schedule

- Daily automated Supabase backups.
- Weekly restore drill in a non-production project.
- Manual backup before high-risk migrations.
- Immediate backup before bulk privacy deletion or major schema changes.

## Recovery Objectives

- RPO target: 24 hours for production database.
- RTO target: 4 hours for critical mother-app flows.
- Crisis/safety content must be restorable before growth or community features.

## Restore Drill

1. Create a temporary Supabase restore project.
2. Restore the latest backup.
3. Apply migrations that exist after the backup timestamp.
4. Deploy preview Vercel environment against the restore project.
5. Run `npm run seed:reviewed-content` with a restore-project reviewer token.
6. Run `npm run test:api`.
7. Verify `/`, `/admin`, `/api/content-library`, `/api/checkins`, and `/api/privacy`.

## Incident Recovery Order

1. Freeze writes if corruption is suspected.
2. Preserve logs and deployment SHA.
3. Identify affected tables and time window.
4. Restore to isolated project.
5. Validate data integrity and RLS.
6. Promote restore or run a targeted repair.
7. Document user impact and legal/privacy notifications.

## Privacy Deletion Interaction

Do not restore deleted user data back into production unless legal counsel explicitly directs it. Backup retention must be reconciled with deletion obligations in the privacy policy.
