# Sunday controlled demo checklist

Target date: 2026-08-09
Stage: controlled demo
Owner: Angel
Last technical validation: 2026-08-06

This checklist records evidence for the Library-first walkthrough. A generic PASS is not sufficient.

## P0 — Product and scope

- [x] Library is defined as the initial sellable surface.
- [x] Clinical Care and Teaching remain out of scope.
- [x] Analysis and Study Plans are not presented as finished core modules.
- [x] QBank and Flashcards are secondary.
- [x] Public claims remain educational and do not promise diagnosis or exam results.

Evidence:

- `PRODUCT.md`
- `docs/13_library_first_release_scope.md`
- `docs/07_decisions_log.md`

## P0 — Repository

- [x] Branch and remote state inspected.
- [x] Working tree reviewed.
- [x] Pre-existing untracked `PROJECT_CONTEXT.md` preserved and excluded from the block.
- [x] Generated browser artifacts excluded from Git through `.gitignore`.
- [x] Final diff passed `git diff --check`.
- [ ] Commit selected for the Library-first closure block.
- [ ] Push completed after explicit approval.

Current state:

- Branch: `main`.
- The branch already contained one local commit ahead of `origin/main`: `568615f docs(medical): add reviewed Resummo authoring workflow`.
- The Library-first closure changes remain uncommitted pending final review.

## P0 — Technical validation

- [x] `npm.cmd run db:validate` — PASS.
- [x] `npm.cmd run db:generate` — PASS.
- [x] Unit tests — 13/13 PASS.
- [x] `npm.cmd run lint` — PASS.
- [x] `npm.cmd run build` — PASS.
- [x] `git diff --check` — PASS.
- [x] Private access smoke — PASS.
- [x] Admin smoke — PASS.
- [x] Library smoke — PASS.
- [x] Demo showcase smoke — PASS.
- [x] Markdown import HTTP preview and confirmation smoke — PASS.
- [x] First learning pack regression smoke — PASS.
- [x] QBank regression smoke — PASS.

Known non-blocking warning:

- Vite reports a JavaScript chunk above 500 kB after minification. This is a P2 optimization and does not block the controlled desktop demo.

## P0 — Database availability

### Remote Supabase

- [ ] Connection restored or intentionally replaced for the presentation.

Evidence on 2026-08-06:

```text
[database-check] FAIL target=SUPABASE-MASKED
(ENOTFOUND) tenant/user ... not found
```

Both configured Pooler ports used the same missing tenant. This is an environment/configuration blocker, not a frontend failure. The current `.env` must not be relied on for the Sunday walkthrough unless the Supabase project connection is corrected and revalidated.

### Local fallback

- [x] Docker Desktop startup verified.
- [x] PostgreSQL 16 started on `127.0.0.1:5433`.
- [x] Safety gate confirmed the authorized local database before schema or seed operations.
- [x] Local schema initialization passed.
- [x] Local seed passed and created the three controlled users.
- [x] Demo content loader passed.
- [x] Local database check passed with three users.
- [x] Student and Editor login passed.
- [x] Local launcher prepared: `start-resummo-local-demo.bat`.

Local demo content verified:

- 3 published topics.
- 7 published articles.
- 20 published multiple-choice questions.
- 15 published flashcards.

## P0 — Library flow

- [x] Login lands directly in Library.
- [x] Human hierarchical navigation exists.
- [x] Unknown topics remain visible through a fallback branch.
- [x] Search is separated from tree navigation.
- [x] Global header search routes to Library.
- [x] Article breadcrumbs use human labels.
- [x] Article detail includes educational scope.
- [x] Article detail does not invent reviewer metadata.
- [x] Analysis and Study Plans were removed from primary navigation.
- [x] Non-working bookmark/help actions were removed from the main header.
- [x] Student UI did not expose raw `DRAFT`, `PUBLISHED`, `ARCHIVED`, `IN_PROGRESS` or `NOT_STARTED` values in the tested flow.

## P0 — Editorial flow

- [x] Manual article creation exists.
- [x] Article review and explicit publication exist.
- [x] Markdown parser supports Notion-style frontmatter.
- [x] Preview validates required fields and unresolved markers.
- [x] Empty reviewer/date values become honest warnings.
- [x] Duplicate article slugs are blocked.
- [x] Import always creates `DRAFT`.
- [x] Stored frontmatter is forced to `review_status: DRAFT`.
- [x] Import never creates topics or publishes automatically.
- [x] Imported Markdown cannot publish until review status is `APPROVED` and reviewer, review date and evidence cutoff are present.
- [x] Legacy published articles without frontmatter remain compatible.
- [x] Demo Markdown file exists and validates.
- [x] HTTP confirmation created one local draft and the smoke removed it afterward.

## P0 — Browser and interaction QA

Automated desktop walkthrough at `1440 × 900`:

- [x] Private login notice visible and public registration hidden.
- [x] Student login lands in Library.
- [x] Three Library roots visible.
- [x] Search returns the ECG article.
- [x] Article opens with educational label, pending-review status and disclaimer.
- [x] Editor opens the article importer.
- [x] Markdown preview displays a human topic title, not its slug.
- [x] Create-draft action appears only after a valid preview.
- [x] No horizontal overflow on Library, search, article or importer.
- [x] No browser console errors.
- [x] No page errors.
- [x] No failed network requests.

Evidence:

- `output/playwright/qa-report.json` — 28/28 checks PASS.
- Five local screenshots under `output/playwright/`.
- Browser artifacts are ignored by Git and retained only as local validation evidence.

## P1 — Content integrity

- [x] Content without confirmed approval is labeled as pending review.
- [x] Import and publication guards do not invent clinical approval.
- [ ] Every article intended for an external audience receives competent human review.
- [ ] Medical claims and references are checked against adequate sources.
- [ ] Evidence cutoff, reviewer and review date are completed for approved Markdown articles.
- [ ] No fake DOI, PMID, doctor, institution or endorsement is introduced during editorial review.

Human clinical approval cannot be completed autonomously and remains an explicit release gate for external publication. It does not block a controlled product demonstration when the pending-review state is shown honestly.

## Demonstration sequence

1. Run `start-resummo-local-demo.bat` unless Supabase has been restored and revalidated.
2. Login with the controlled student account.
3. Show Library as the first surface.
4. Explore one branch and search for `ECG`.
5. Open `Lectura sistemática del ECG`.
6. Explain educational scope and pending editorial review.
7. Logout and login with the controlled Editor account.
8. Open `Panel editorial → Importar artículos`.
9. Preview `docs/demo/resummo-demo-article-import.md`.
10. Explain that confirmation creates a draft and publication requires explicit review.

## Stop conditions

Do not present the environment when:

- the selected database is unreachable;
- login fails;
- Library has no visible published content;
- article detail returns an error;
- the importer bypasses review;
- medical approval is claimed without evidence;
- the final environment has not been walked through once after any subsequent code change.
