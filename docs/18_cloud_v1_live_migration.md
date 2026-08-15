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

- `npm.cmd test` -> `61/61 PASS` after retiring the constrained runtime and adding the local cloud bootstrap gate.
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

With the same audited ZIP, the first post-hardening local simulation of parse + model + all 386 asset uploads peaked at approximately `435 MiB RSS` while preserving the exact expected corpus counts. A second manual production attempt still exceeded Render Free's 512 MB instance limit; Render explicitly reported `Ran out of memory (used over 512MB) while running your code` and restarted the instance.

### Final bootstrap strategy: local executor, cloud destination

The temporary constrained Render profile was retired after it correctly prevented OOM but repeatedly paused before phase 1 could start on the 512 MB free instance. The bootstrap was moved outside the web service instead of preserving runtime-specific limits.

Operational path:

- executor: the local Windows PC;
- source: the audited Notion ZIP on the user's Desktop/OneDrive;
- database destination: Supabase Resummo via the dedicated `resummo_app` runtime role;
- asset destination: the private `resummo-content-assets` bucket through the authenticated Storage bridge;
- CLI gate: exact audited corpus `35 Topics / 427 Articles / 386 assets / 462 internal links / 0 broken / 0 missing`;
- database safety: bootstrap refuses to run unless editorial content is empty;
- assets: uploaded in idempotent chunks using content-addressed SHA-256 names;
- content: persisted only after all 386 required assets are confirmed present;
- publication: all imported Topics/Articles remain `DRAFT` and automatic publication is forbidden.

The local bootstrap encountered two DevSpace transport-level 502 interruptions while long-running operations were in progress. Those did not corrupt editorial state: asset uploads were resumable by hash, and the content write used one Prisma transaction. After completing the remaining asset chunks, Storage contained exactly `386` objects. The content transaction completed and the final independent verification returned:

- users: `3`;
- Topics: `35`;
- Articles: `427`;
- Published Articles: `0`;
- empty `plainText`: `0`;
- empty `contentJson`: `0`;
- duplicate source IDs: `0`;
- Articles without Topic: `0`;
- unique asset files referenced: `386`;
- missing asset files: `0`.

Render variables `RESUMMO_IMPORT_PROFILE`, `RESUMMO_IMPORT_MAX_RSS_MB` and `RESUMMO_IMPORT_ARTICLE_BATCH_SIZE` were removed. The Admin UI and HTTP import endpoint returned to the standard flow; no memory-budget limiter or automatic constrained retry remains in the production runtime.

## Cloud V1 completion state

1. Supabase schema and runtime role: complete.
2. Private Storage + Edge Function bridge: complete.
3. Render runtime/deploy: complete.
4. Production auth/RBAC smoke: complete.
5. RESUMMO MIR bootstrap: complete (`35 / 427 / 386 / 462 / 0 / 0`).
6. Automatic publication: `0` — PASS.
7. Publication remains manual and subject to editorial approval.

## Protected local state

`PROJECT_CONTEXT.md` was already untracked before this work and remains out of scope. Preserve it.

Temporary bootstrap SQL lives under ignored `.runtime/` and must never be committed.
