# Notion → Resummo Document Contract V1

Status: IMPLEMENTED_LOCAL_AND_REAL_CORPUS_VALIDATED
Date: 2026-08-10
Last verified: 2026-08-12
Owner surface: Library / editorial import

## 1. Purpose

Define the structural contract between the one-time Notion export and Resummo, while retaining the direct Notion API as a secondary path.

The product decision is now:

1. `Notion ZIP export` is the primary MVP migration source.
2. `Notion API` remains available as an optional secondary source.
3. `Markdown individual` remains as the legacy import path.
4. After the one-time migration, Resummo becomes the editorial system of record for this corpus.

The implementation preserves the original Markdown as fallback and stores a structured rendering/search projection separately.

## 2. Real export audit and executed local migration

The real `Markdown & CSV` export with subpages and subpage folders was audited before this implementation block. The recorded corpus is:

- 849 files total;
- 463 Markdown pages;
- 386 PNG images;
- hierarchy: `RESUMMO MIR → 35 specialties → 427 articles`;
- 462 internal links;
- 32 external links;
- 0 broken internal links in the export audit;
- 0 orphan images in the export audit;
- approximately 94,396,369 uncompressed bytes;
- approximately 1,660 callouts and 705 tables.

The original upload name was:

`e61b14fd-a57a-4aee-b977-d3f63b290f6e_ExportBlock-ab50821a-e379-4ce6-b590-f5cf365b3175.zip`

The export contains an outer ZIP wrapper with the actual Notion export ZIP inside. The implemented parser supports that single-wrapper shape as well as a direct Notion ZIP.

The original ZIP was recovered and matched byte-for-byte with the local copy used by DevSpace (`86,930,826` compressed bytes; SHA-256 `c5799b957aa2ce5264e31b2d74f34da84ed9385c1b042858578210a2534ee960`). The real preview and local migration were executed against `127.0.0.1:5433/resummo`.

Verified real result:

- `35` Topics, all `DRAFT`;
- `427` Articles, all `DRAFT`;
- `386` referenced assets copied to controlled local storage;
- `462` internal links resolved and `32` external links retained;
- `0` broken internal links;
- `0` missing or orphan assets;
- `0` empty structured articles;
- `0` duplicate source IDs or slugs;
- `0` empty `plainText` / `contentJson` records;
- `3` existing users preserved;
- old demo/editorial content and dependent progress/session data removed FK-safely after backup.

The parser observed `1,660` callouts, `702` structured tables, `386` images, `15,539` lists, `21` block equations and `19` blockquotes in Article content. The `52` remaining import warnings are Notion-generated decorative `<img src="https://app.notion.com" ... width="40px">` icons inside callouts; their surrounding content and the original Markdown are preserved.

## 3. Current Resummo persistence state

`Article` is no longer Markdown-only for Notion imports:

- `body` preserves the complete original Markdown as immutable fallback for structured imports;
- `contentJson` stores the structured renderable projection;
- `plainText` stores the search-oriented text projection, including table/callout/list text;
- source provenance and snapshot metadata provide deterministic import identity;
- explicit editorial approval is stored as `editorialApprovedAt`, `editorialApprovedByUserId` and `editorialApprovedSnapshotHash`, so approval applies only to the exact imported snapshot;
- the renderer consumes `contentJson` and falls back to the legacy Markdown flow for existing articles.

Structured editing itself remains intentionally out of scope for this migration block. To prevent divergence, the admin API rejects direct edits to `body` when `contentJson` exists.

## 4. Normalized Resummo Document V1

The first implementation lives in:

`server/lib/notionDocumentNormalizer.js`

A normalized document contains:

- `version`;
- `source.type = NOTION`;
- source page ID, URL and last-edited timestamp;
- human title;
- ordered recursive `blocks`;
- stable block anchors derived from Notion block IDs;
- extracted `plainText`;
- structured heading list;
- import warnings;
- transient asset manifest kept outside the persistable document;
- internal-link references;
- search chunks with heading paths and exact anchors.

### Rich text

Rich-text spans preserve:

- bold;
- italic;
- underline;
- strikethrough;
- inline code;
- color;
- links;
- mentions;
- inline equations.

## 5. Block mapping contract

This table describes V1 technical support, not actual corpus usage.

| Notion block | Resummo representation | Fidelity | Caveats |
|---|---|---|---|
| paragraph | `paragraph` block + rich text | High | Nested children preserved recursively. |
| heading_1..heading_4 | `heading` + level + stable anchor | High | TOC and search heading path derive from structure. |
| bulleted_list_item | `bulleted_list_item` | High | Group rendering still needs frontend renderer. |
| numbered_list_item | `numbered_list_item` | High | Group rendering still needs frontend renderer. |
| to_do | `to_do` + checked | High | Student-facing semantics must be decided from real corpus. |
| quote | `quote` | High | Visual style is Resummo-owned. |
| callout | `callout` + icon/color/rich text | High | Visual style is Resummo-owned. |
| toggle | `toggle` + recursive children | High | Interaction renderer not implemented yet. |
| code | `code` + language + rich text | High | Syntax highlighting is not part of V1. |
| equation | `equation` + expression | High | Rendering library decision remains separate. |
| divider | `divider` | High | No content loss expected. |
| table | `table` + width/header flags | High | Requires `table_row` children. |
| table_row | cells as arrays of rich-text spans | High | Cell-level nested blocks are not represented by Notion table rows. |
| image/video/pdf/file/audio | `media` + asset key + caption | Medium–High | Notion-hosted signed URL is kept only in transient import manifest and must be copied before persistence. |
| child_page | `child_page` hierarchy node | High | Child page content is intentionally not flattened into the parent article. |
| child_database | `child_database` hierarchy node | Medium | Schema/properties require separate database/data-source inspection. |
| link_to_page | `internal_link` target | High | Converted to Resummo route only when target page has a known imported mapping. |
| rich-text page mention/link | internal-link reference | High | Same resolution rule as `link_to_page`. |
| synced_block | `synced_block` + source block + children | Medium–High | Update semantics remain source-owned by Notion; Resummo stores an imported snapshot. |
| column_list | `column_list` | High structurally | Responsive Resummo renderer may stack columns instead of copying Notion layout. |
| column | `column` + optional width ratio | High structurally | Resummo owns responsive layout. |
| bookmark | `bookmark` | Medium | Preview metadata is not fetched in V1. |
| embed | `embed` | Medium | Allowlist/security policy required before rendering arbitrary embeds. |
| link_preview | `link_preview` | Medium | Resummo should render a safe link/card, not depend on Notion preview internals. |
| table_of_contents | generated/structural marker | Medium | Resummo TOC should be generated from normalized headings, not copied as static content. |
| breadcrumb | structural marker | Low–Medium | Resummo breadcrumbs come from Library hierarchy. |
| meeting_notes/tab/template and unknown future blocks | explicit `unsupported` until audited | Low | Never drop silently. Surface warning and preserve descendants when available. |
| Notion `unsupported` | explicit `unsupported` with original `block_type` | Low | Blocking vs non-blocking policy must be decided from real examples. |

## 6. Asset rule

Notion-hosted file URLs are temporary signed URLs. They must never be written into persistent article JSON as durable asset URLs.

V1 therefore separates:

- persistable block reference: `assetKey`;
- transient import manifest: signed URL + expiry + block ID;
- future controlled-storage result: Resummo-owned URL/object key.

An import cannot be confirmed while a required Notion-hosted asset still points only to its transient URL.

## 7. Search contract

Every content-bearing normalized block can produce a search chunk:

- `blockId`;
- stable `anchor`;
- `blockType`;
- `headingPath`;
- exact block text.

This is sufficient to support later PostgreSQL full-text indexing and exact navigation to the matching block without RAG or embeddings.

No Search V2 persistence is implemented yet because schema ownership and the real Notion taxonomy are still pending.

## 8. Hierarchy contract

`child_page` is treated as a Library hierarchy boundary, not as inline article text.

The direct Notion preview service intentionally:

- recursively fetches nested content blocks;
- resolves pagination;
- does not flatten child pages into the parent document;
- reports child pages separately for later tree reconstruction.

This prevents a large Notion tree from becoming one article and preserves the option to map pages/subpages to Library nodes/articles after corpus inspection.

## 9. Persistence direction — implemented additively

The local schema now keeps:

- `Article.body` as the original Markdown/fallback;
- `Article.contentJson` as the structured rendering representation;
- `Article.plainText` as the future search projection;
- source provenance (`sourceType`, `sourceId`, `sourcePath`, import/snapshot metadata);
- equivalent source identity metadata on `Topic` for deterministic idempotency.

`sourceType = NOTION_EXPORT` identifies ZIP imports. `(sourceType, sourceId)` is the logical idempotency key. No generic LibraryNode abstraction was introduced because the audited hierarchy maps directly to root → Topic → Article.

## 10. Gate before confirm/import

The ZIP confirm path is enabled only after preview and enforces:

1. local PostgreSQL (`localhost` / `127.0.0.1`, database `resummo`) for the destructive replacement flow;
2. valid ZIP structure and security limits;
3. resolved hierarchy;
4. zero missing referenced assets;
5. zero unresolved internal links;
6. backup before replacing existing editorial content;
7. FK-safe removal of editorial content while preserving users/auth/roles;
8. `DRAFT` for every imported Topic and Article;
9. deterministic upsert by source identity on re-import;
10. local controlled asset copies addressed by SHA-256 rather than ZIP-relative paths;
11. zero articles with no importable blocks after the stripped title;
12. bounded actual DEFLATE output even when ZIP metadata lies about uncompressed size.

`NOTION_EXPORT` content remains non-publishable immediately after import. EDITOR/ADMIN can explicitly approve or revoke the exact imported snapshot from the article review surface. Approval is never inferred from the source export. Every re-import explicitly clears prior approval metadata and returns the article to `DRAFT`; publication also uses an optimistic snapshot/approval guard so a concurrent re-import or revocation cannot publish a snapshot that changed after review. Revoking approval from an already published article automatically returns it to `DRAFT`.

## 11. Verification implemented

Automated and local integration validation currently covers:

- existing direct-API rich-text normalization and pagination behavior;
- direct ZIP and one-level wrapper ZIP parsing;
- ZIP path-traversal rejection, compression-ratio limits and bounded actual inflation even with forged ZIP size metadata;
- deterministic root/Topic/Article hierarchy reconstruction;
- deterministic slug collision handling without changing visible titles;
- Markdown preservation plus structured headings, tables, callouts, lists, blockquotes, images, links, code and equations;
- safe handling of inline `<strong>` HTML generated by Notion;
- SHA-256 asset addressing and missing/orphan asset accounting;
- internal-link rewriting to Resummo routes;
- plain-text extraction including tables/callouts/lists;
- additive Prisma schema validation/generation;
- local PostgreSQL schema application;
- backup before destructive editorial replacement;
- preservation of users while old editorial/progress data is removed;
- `DRAFT` persistence and idempotent re-import;
- HTTP authorization: unauthenticated import denied, STUDENT import denied, EDITOR import/review allowed;
- STUDENT cannot read imported DRAFT through the public article API;
- `NOTION_EXPORT` publication is rejected until explicit editorial approval exists for the current snapshot;
- editorial approval can be registered and revoked through the role-protected admin API; revocation of published content forces `DRAFT` and immediately removes STUDENT visibility;
- re-import clears prior approval metadata, requires re-approval, and publication is version-guarded against concurrent snapshot/revocation changes;
- missing heading fragments are treated as broken links rather than silently dropping anchors;
- SPA navigation preserves and scrolls to valid article anchors, including the adversarial `#A → native #B → SPA #A` hashchange flow.

Real-corpus visual QA was executed with Playwright/Edge on `El agua y las disoluciones`, `Hipertensión arterial` and `Bioquímica → Metabolismo`. Across those real pages the structured DOM contained tables, callouts, loaded images, nested lists, equations, strong/emphasis formatting, with no missing-asset or broken-link markers and no browser console errors. A 390 px viewport had no page-level horizontal overflow; wide tables remain scrollable inside their own wrapper.

Final deterministic gate after the adversarial fixes on 2026-08-12: Prisma validate/generate PASS, `44/44` tests PASS, ESLint PASS, Vite build PASS and `git diff --check` PASS. The HTTP smoke additionally verifies approval → re-import clears approval → publication blocked → re-approval → publish → revoke → `DRAFT`. Antigravity/Playwright verified the real article approval/revocation UI and the `#A → native #B → SPA #A` navigation flow with zero browser console errors. The Vite build retains the existing >500 kB chunk-size warning.
