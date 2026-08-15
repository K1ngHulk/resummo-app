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

- `npm.cmd test` -> `58/58 PASS` after the 2026-08-15 import incident hardening.
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

- build: `npm ci --include=dev && npm run build`
- start: `npm run start`
- health check: `/api/ready`

The Notion ZIP routes were also corrected so a normal non-destructive import is allowed against the remote production database, while `replaceEditorial=true` remains restricted to the local `resummo` database.

## 2026-08-15 import incident and hardening

The first manual production confirm of the audited Notion ZIP passed preview (`35 Topics / 427 Articles / 386 assets / 462 internal links / 0 critical issues`) but caused the Render web process to become unavailable before persistence completed. Render recorded `server_failed` with `/api/ready` receiving `connection reset by peer`; the instance restarted automatically. Remote verification after the incident showed `0 Topics`, `0 Articles`, `0 PUBLISHED` and `0` objects in the private Storage bucket, so no partial editorial state remained.

A real-ZIP local baseline showed the previous parser/model path reaching approximately `461 MiB RSS` before Storage work. Hardening applied after the incident:

- the raw request body is transferred to a consumable holder so the outer ZIP can be released before the inner model is built;
- image entries are integrity-checked lazily/streaming (CRC32 + SHA-256 + binary signature) instead of keeping 386 uncompressed image buffers in the model;
- image bytes are inflated only when that asset is uploaded, one at a time;
- asset data and lazy loaders are released immediately after each Storage request;
- persistence validation paginates Article `contentJson` in batches of 40 rather than loading every article at once;
- heavy model arrays are released before the final persistence validation;
- ZIP CRC work yields periodically so the Node event loop can continue servicing health checks;
- normal cloud import remains idempotent and destructive replacement remains local-only.

With the same audited ZIP, the post-hardening local simulation of parse + model + all 386 asset uploads peaked at approximately `435 MiB RSS` while preserving the exact expected corpus counts.

## Current manual completion block

1. Deploy the import hardening and verify `/api/health` + `/api/ready`.
2. The operator manually uploads the original Notion ZIP and requires the expected `35 Topics / 427 Articles / 386 assets / 462 internal links / 0 broken / 0 missing` preview gate.
3. The operator manually confirms the import.
4. Verify remotely that the final corpus is `35 Topics / 427 Articles`, all imported editorial content remains `DRAFT`, `0 PUBLISHED`, Storage references resolve and there are no missing assets.
5. Keep publication manual and subject to editorial approval.

## Protected local state

`PROJECT_CONTEXT.md` was already untracked before this work and remains out of scope. Preserve it.

Temporary bootstrap SQL lives under ignored `.runtime/` and must never be committed.
