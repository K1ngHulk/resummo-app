# Library-first validation report

Date: 2026-08-06
Target: controlled demo on 2026-08-09
Environment validated: local PostgreSQL demo environment
Branch: `main`

## Result

**PASS for a controlled Library-first desktop demonstration using the isolated local environment.**

This report does not approve public production use or medical content for external publication.

## Scope validated

- Private login.
- Library as the first authenticated surface.
- Hierarchical Library navigation.
- Global Library search.
- Published article reading.
- Honest editorial status and educational disclaimer.
- Editor/Admin access enforcement.
- Markdown preview from a Notion-style export.
- Draft-only article import.
- Publication blocking until editorial approval metadata is complete.
- Local fallback environment independent from Supabase.

## Database evidence

### Remote Supabase

Result: **FAIL / BLOCKED**.

The configured Supabase Pooler rejected the tenant/user on both configured ports. The connection string shape was valid, but the referenced tenant was not found. No remote schema, seed, migration or data mutation was attempted.

### Local fallback

Result: **PASS**.

- Docker Desktop started successfully.
- PostgreSQL 16 started at `127.0.0.1:5433`.
- Safety gate confirmed the local host, port and database name.
- Prisma schema push completed against the local database only.
- Seed completed.
- Demo showcase loader completed.
- Database check returned `target=LOCAL users=3`.

Verified demo content:

- 3 published topics.
- 7 published articles.
- 20 published multiple-choice questions.
- 15 published flashcards.

## Commands and results

### Prisma

- `npm.cmd run db:validate` — PASS.
- `npm.cmd run db:generate` — PASS.
- `npm.cmd run db:push` — PASS against local database only.
- `npm.cmd run db:seed` — PASS against local database only.

### Automated tests

```text
13 tests
13 pass
0 fail
```

Coverage included:

- Library tree mapping and fallback.
- Markdown frontmatter parsing.
- Required metadata and date validation.
- Empty metadata normalization.
- Duplicate article handling.
- Forced `review_status: DRAFT`.
- Legacy article compatibility.
- Imported article publication gate.

### Smokes

- Private access smoke — PASS.
- Admin smoke — PASS.
- Library smoke — PASS.
- Demo showcase smoke — PASS.
- Markdown article import smoke — PASS.
- First learning pack smoke — PASS.
- QBank regression smoke — PASS.

The Markdown import smoke verified:

1. unauthenticated preview returns `401`;
2. Editor login succeeds;
3. preview validates the sample and forces draft state;
4. local confirmation creates exactly one draft;
5. premature publication returns `400` with the editorial approval guard;
6. the smoke article is removed afterward.

### Build and static checks

- `npm.cmd run lint` — PASS.
- `npm.cmd run build` — PASS.
- `git diff --check` — PASS.
- Secret scan — no Supabase tenant, service key or remote credential found in the closure files.
- Protected-path check — no Prisma schema, migration, auth route, middleware or `.env` modification.

Known P2 warning:

- Vite reports a JavaScript chunk above 500 kB after minification.

## Browser QA

Viewport: `1440 × 900`.

Two final automated browser walkthroughs passed. The latest report contains:

```text
28 checks
28 pass
0 console errors
0 page errors
0 failed requests
5 screenshots
```

Validated screens:

1. Library root.
2. Library search results.
3. Article detail.
4. Empty Markdown importer.
5. Valid Markdown preview.

The browser check also confirmed:

- login lands in Library;
- Analysis and Study Plans are absent from primary navigation;
- no horizontal overflow in the tested surfaces;
- student UI does not expose raw content/progress enums;
- article review status remains honest;
- the importer shows the human topic title instead of its slug;
- create-draft action appears only after a valid preview.

Local evidence:

- `output/playwright/qa-report.json`
- `output/playwright/01-library-root.png`
- `output/playwright/02-library-search.png`
- `output/playwright/03-library-article.png`
- `output/playwright/04-article-import-empty.png`
- `output/playwright/05-article-import-preview.png`

The output directory is intentionally ignored by Git.

## Files and capabilities added

- Markdown parser and validator.
- Draft-only article import API.
- Editorial publication gate.
- Article importer UI.
- Human editorial metadata rendering.
- Functional global Library search.
- Library-first login and primary navigation.
- Remote database preflight.
- Safety-gated local demo launcher.
- Demo Markdown file and editorial documentation.

## Explicit exclusions

- No Supabase mutation.
- No Prisma schema or migration changes.
- No auth/RBAC changes.
- No package installation or lockfile changes.
- No public registration enablement.
- No automated medical approval.
- No Clinical Care or Teaching.
- No deployment.
- No commit or push for this closure block yet.

## Residual risks and decisions

### P0 before using Supabase

The remote Supabase connection must be corrected and all database-dependent smokes rerun. Until then, use `start-resummo-local-demo.bat` for the Sunday meeting.

### P1 before external content publication

A competent human reviewer must verify medical claims, evidence and references. Approved Markdown articles require:

- `review_status: APPROVED`;
- reviewer;
- review date;
- evidence cutoff.

### P2 after the meeting

- Replace the temporary topic-to-tree mapping with a persistent taxonomy when content volume justifies it.
- Optimize bundle splitting and large brand assets.
- Decide whether Notion remains a controlled Markdown export or becomes a synchronized integration.

## Release recommendation

Use the isolated local environment for the Sunday controlled demonstration. Present Resummo as a Library-first educational product with a controlled editorial workflow. Do not present it as public production, a clinical decision tool or a medically approved content catalog.
