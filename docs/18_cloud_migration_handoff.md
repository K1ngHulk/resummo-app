# Resummo — Cloud Migration Handoff

Last verified: 2026-08-14

## Goal

Move the verified local Resummo MVP to a cloud setup without turning real editorial content into seed data and without losing the controlled Notion import/review/publish workflow.

Target direction:

- Render Web Service: React/Vite build + Express API, same origin.
- Supabase: PostgreSQL as the canonical database.
- Supabase Storage: persistent imported article assets.
- RESUMMO MIR ZIP: one-time editorial bootstrap/import, not `db:seed`.

## Current verified repository state

The repository supports a single production Node process:

1. `npm run build` creates the Vite `dist/` bundle.
2. `npm start` starts Express.
3. With `NODE_ENV=production`, Express serves:
   - `/api/*` as API routes;
   - `/content-assets/*` from the current local asset backend;
   - hashed `/assets/*` from `dist/` with immutable long-lived cache headers;
   - SPA routes such as `/learning/library` through `dist/index.html`.
4. The server binds on `0.0.0.0` and reads `PORT`.

Production-mode local smoke verified:

- `/api/health` -> `200`.
- `/` -> `200`, HTML.
- `/learning/library` -> `200`, SPA shell.
- hashed JS asset -> `200` with `Cache-Control: public, max-age=31536000, immutable`.
- SPA HTML -> `Cache-Control: no-cache`.

## Database migration evidence

A fresh disposable PostgreSQL database was created locally and `prisma migrate deploy` was executed from an empty schema.

Verified result:

- all 5 repository migrations applied successfully;
- 11 public tables created;
- 5 rows recorded in `_prisma_migrations`;
- `prisma validate` passed;
- disposable database was removed afterwards.

Therefore a fresh cloud database should be bootstrapped with migrations, not with the legacy demo seed.

## Content is not seed data

Do not package RESUMMO MIR as `prisma/seed.js` or as demo/showcase content.

The intended flow is:

1. create/migrate the cloud database;
2. create persistent cloud asset storage;
3. sign in as Editor/Admin;
4. upload the original Notion ZIP through the Resummo importer;
5. validate expected counts;
6. import as editorial review content;
7. approve/publish explicitly from Resummo.

Expected real corpus:

- 35 Topics/specialties;
- 427 Articles;
- 386 referenced assets;
- 462 internal links;
- 0 broken internal links;
- 0 missing assets;
- 0 automatic publications.

Once editorial work is performed in cloud, Supabase becomes the canonical state. Re-importing the Notion ZIP is not a substitute for backing up later approvals, publication state, metadata edits, or user activity.

## Remaining cloud blocker: asset backend

The current local importer persists files under:

- `RESUMMO_CONTENT_ASSET_DIR`, or
- `.runtime/content-assets` by default.

Structured articles currently reference stable URLs under `/content-assets/<sha256>.<ext>`.

This is correct for local QA but must not remain dependent on an ephemeral Render filesystem.

Before the first real cloud ZIP import:

1. create a private or appropriately scoped Supabase Storage bucket;
2. introduce a storage adapter for imported assets;
3. preserve SHA-256 naming/deduplication semantics;
4. produce stable asset URLs or signed delivery behavior compatible with the renderer;
5. verify upload rollback/error handling;
6. verify the same 386 assets after cloud import.

Do not import the real ZIP to Render filesystem first and plan to move the files later.

## Recommended Render contract

Use one Node Web Service unless evidence during deployment shows a reason to split frontend/API.

Recommended commands:

- Build: `npm ci && npm run db:generate && npm run build`
- Start: `npm start`
- Health check: `/api/ready` after the database is configured

Runtime requirements:

- `NODE_ENV=production`
- a strong `JWT_SECRET` (minimum enforced by the app)
- `DATABASE_URL`
- `DIRECT_URL` for migration/direct database operations when required
- production `CORS_ORIGIN` if a cross-origin client is ever introduced; same-origin Render hosting is preferred
- `PORT` is supplied by Render

Pin a supported Node 24 runtime in Render rather than relying indefinitely on a moving default.

## Supabase database connection gate

Before creating the Render service, resolve which Supabase connection endpoint is used for:

- long-running application traffic (`DATABASE_URL`);
- direct migration operations (`DIRECT_URL`).

`server/lib/prisma.js` uses `pg.Pool` + `@prisma/adapter-pg`.

Do not guess connection mode or pooling settings. Validate with the actual Supabase project and current official guidance, then run:

- migrations;
- `/api/ready`;
- representative authenticated reads;
- import smoke;
- concurrent Library reads.

## Performance baseline before cloud

Pre-cloud work completed:

- Library no longer renders false `0 / 0` metrics while `/api/topics` is loading;
- first load uses skeleton states;
- authenticated Library data is prefetched;
- recent Library data is cached in memory and revalidated instead of blanking on tab changes;
- concurrent Library fetches are deduplicated;
- editorial mutations mark the cache stale;
- logout clears per-user Library cache;
- `/api/topics` selects only metadata required by Library instead of fetching full Markdown/contentJson/plainText rows from PostgreSQL;
- non-critical routes/admin screens are lazy-loaded;
- main production JS reduced from roughly 675 KB to roughly 440 KB before gzip;
- main CSS reduced from roughly 148 KB to roughly 91 KB;
- the prior >500 KB Vite chunk warning was eliminated;
- Poppins loading moved from CSS `@import` to `<head>` preconnect/stylesheet loading;
- document language is `es`;
- Vite local proxy fallback uses `127.0.0.1` to avoid localhost resolution issues.

Local `/api/topics?view=editorial` measurement with 35 specialties / 427 articles was approximately 24 ms and 205 KB uncompressed JSON. Measure again against Supabase/Render; do not extrapolate local latency to cloud.

## Deployment sequence

1. Confirm the intended Supabase project and Render workspace/service name.
2. Create a dedicated Resummo Supabase project; do not reuse unrelated projects without an explicit decision.
3. Configure/verify Supabase Storage adapter before importing content.
4. Apply Prisma migrations to the empty Supabase PostgreSQL database.
5. Verify schema and `/api/ready` from a controlled environment.
6. Create/configure the Render Web Service from the Resummo GitHub repository.
7. Set runtime secrets/environment variables without exposing their values in chat/logs.
8. Deploy without importing RESUMMO MIR yet.
9. Run smoke checks on the public private-MVP URL.
10. Import the original Notion ZIP through the cloud Admin UI.
11. Verify `35 Topics / 427 Articles / 386 assets` and `0 PUBLISHED` immediately after import.
12. Verify Student cannot read editorial-only content and Editor/Admin can review it.
13. Perform representative visual QA for table/callout/image/list/equation/internal-link articles.
14. Only after successful cloud QA should editorial approval/publication begin.

## Rollback / stop conditions

Stop the migration before importing real content if any of these fail:

- migrations do not apply cleanly to an empty Supabase database;
- Render `/api/ready` is not stable;
- asset persistence still points to ephemeral Render storage;
- auth/RBAC behavior differs from local verified behavior;
- ZIP preview differs materially from 35/427/386/462;
- missing assets or broken internal links are non-zero.

Keep the local PostgreSQL backup and original Notion ZIP until the cloud import and representative QA are complete.
