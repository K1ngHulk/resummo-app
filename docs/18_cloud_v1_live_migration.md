# Resummo Cloud V1 — live migration state

Last verified: 2026-08-15 UTC

## Confirmed targets

- GitHub: `K1ngHulk/resummo-app`, branch `main`.
- Supabase project: `Resummo` (`ouzwkynthgogirmzvkoh`), region `us-west-2`.
- Render service: `resummo-app` (`srv-d9vsj3e1egvs73faiql0`), workspace `tea-d812l83tqb8s738jpqqg`.

## Supabase state already applied

The repository was linked to the Resummo project using the authenticated local Supabase CLI.

Applied to the empty `public` schema, in order:

1. `20260629203403_add_editor_admin_roles`
2. `20260629212248_add_content_status`
3. `20260630033027_set_content_status_draft`
4. `20260701000000_topic_status`
5. `20260811040000_add_notion_export_content`
6. `20260815024500_add_storage_bridge_config`
7. `20260815031500_add_flashcard_progress`

The seventh migration was added during Cloud V1 because `schema.prisma` already contained `QuestionType` and `UserFlashcardProgress`, but the migration history did not. That drift had to be closed before bootstrapping the cloud database.

`_prisma_migrations` was baselined with the exact SHA-256 checksum of all seven migration files so future Prisma migration checks recognize the schema as already applied.

Verified remote counts after bootstrap:

- Prisma migrations: `7`
- Storage bridge config rows: `1`
- Users: `0`
- Topics: `0`
- Articles: `0`

No seed or editorial corpus was imported.

## Persistent assets

Cloud asset persistence has been implemented behind `server/lib/contentAssetStore.js`.

Properties:

- local backend remains available for local QA;
- cloud backend preserves `/content-assets/<sha256>.<ext>` URLs;
- supported images: PNG, JPG, GIF, WEBP;
- SHA-256 naming and integrity verification are preserved;
- cloud create/dedupe/read/delete operations go through a private Storage bridge;
- import rollback deletes only assets created by the failed import;
- application startup can idempotently ensure the private bucket exists;
- `/api/ready` now requires both database and storage readiness.

Supabase Edge Function deployed:

- name/slug: `resummo-content-assets`
- status: `ACTIVE`
- deployed version verified: `1`
- auth: custom `x-resummo-storage-token` contract; platform JWT verification is disabled intentionally because the function performs its own constant-time token-hash authorization.
- bucket configured for the bridge: `resummo-content-assets` (private; the function creates/verifies it idempotently).

The bridge token itself is not stored in this document or Git.

## Local validation

After the Cloud V1 code changes:

- `npm.cmd test` -> `55/55 PASS`
- `npm.cmd run lint` -> PASS
- `npm.cmd run build` -> PASS
- build runs `prisma generate` through `prebuild`

This fixes the observed Render startup failure from the previous deploy: `Cannot find module '.prisma/client/default'`.

## Render runtime state

The existing Render service is connected to `K1ngHulk/resummo-app`, branch `main`, with auto-deploy enabled.

The local Render CLI is installed and authenticated in `Angel's workspace`. Production runtime configuration has been written directly to `resummo-app` without exposing secret values:

- `NODE_ENV=production`
- `CORS_ORIGIN=https://resummo-app.onrender.com`
- `PRIVATE_MVP_ACCESS=true`
- `SHOW_DEMO_CREDENTIALS=false`
- strong `JWT_SECRET`
- `DATABASE_URL` and `DIRECT_URL` use the Resummo Supavisor session pooler on port `5432`
- `RESUMMO_CONTENT_ASSET_BACKEND=supabase`
- `RESUMMO_STORAGE_BRIDGE_URL=https://ouzwkynthgogirmzvkoh.supabase.co/functions/v1/resummo-content-assets`
- matching private `RESUMMO_STORAGE_BRIDGE_TOKEN`

A dedicated PostgreSQL role `resummo_app` now exists with login enabled and without `SUPERUSER`, `CREATEDB`, or `CREATEROLE`. It has runtime DML privileges on the application schema but no schema-creation privilege. The runtime connection and the private Storage bridge have both been exercised successfully.

Render service configuration is now:

- build: `npm ci && npm run build`
- start: `npm run start`
- health check: `/api/ready`

The Notion ZIP routes were also corrected so a normal non-destructive import is allowed against the remote production database, while `replaceEditorial=true` remains restricted to the local `resummo` database.

## Remaining execution block

1. Review diff, stage only intended paths, commit and push `main`.
2. Verify Render build/start logs and `/api/health` + `/api/ready`.
3. Create temporary synthetic QA accounts without running the legacy demo seed.
4. Verify auth/RBAC with Student vs Editor/Admin.
5. Preview the original Notion ZIP and require the expected `35 Topics / 427 Articles / 386 assets / 462 internal links / 0 broken / 0 missing` gate.
6. Only then confirm the real import; verify `0 PUBLISHED` immediately after import.
7. Run representative Library/article/asset QA, remove temporary QA data if safe, and keep publication manual.

## Protected local state

`PROJECT_CONTEXT.md` was already untracked before this work and remains out of scope. Preserve it.

Temporary bootstrap SQL lives under ignored `.runtime/` and must never be committed.
