# Library-first release scope

Status: ACTIVE
Last reviewed: 2026-08-06
Target: controlled demo on 2026-08-09

## Product boundary

The first sellable and demonstrable Resummo surface is the medical learning Library.

The controlled demo must prove one coherent flow:

1. authenticated access;
2. hierarchical Library exploration;
3. global article search;
4. structured article reading;
5. explicit educational scope and editorial status;
6. Markdown import from a Notion export;
7. creation of a draft;
8. human editorial review before publication.

## Core surfaces

### Student

- `/learning/library`
- `/learning/library/article?slug=...`

### Editorial

- `/admin/topics`
- `/admin/articles`
- `/admin/articles/review?id=...`
- `/admin/import/articles`

### Secondary, non-blocking

- QBank.
- Flashcards.
- Anki TSV import.

### Not part of the sellable core

- Analysis.
- Study Plans.
- Clinical Care.
- Teaching.
- Public signup.
- Billing.
- Clinical decision support.
- Automated medical approval.

## Information architecture

The current frontend uses a temporary mapping from published topic slugs to a small human tree:

- Basic sciences.
- Clinical by systems.
- Public and preventive health.
- Other published topics.

This mapping is acceptable for the controlled demo. It is not the final taxonomy source of truth. New topics remain visible through the fallback instead of disappearing.

## Editorial contract

Markdown imports require frontmatter with:

- `title`;
- `slug`;
- `topic_slug`;
- `summary`;
- `read_time_minutes`;
- `educational_only: true`.

Recommended metadata:

- `tags`;
- `evidence_cutoff`;
- `last_reviewed`;
- `reviewer`;
- `review_status`.

The importer:

- validates the document;
- checks the topic;
- checks duplicate slugs;
- blocks unresolved editorial markers;
- always creates `DRAFT`;
- never creates a topic;
- never updates an existing article;
- never publishes automatically.

## Content integrity

A published article must not claim clinical approval unless a real reviewer and review date are recorded. When metadata is absent or incomplete, the student UI states that editorial review is pending.

All content remains educational and requires competent human review before external publication.

## Demo environments

### Remote

`start-resummo.bat` uses the database configured in `.env` and verifies connectivity before launching.

### Local fallback

`start-resummo-local-demo.bat` uses Docker PostgreSQL at `127.0.0.1:5433`. It contains a safety gate before any schema or seed command and does not modify Supabase.

## Exit criteria

The demo is ready when:

- lint passes;
- unit tests pass;
- build passes;
- the chosen database is reachable;
- login works;
- Library returns published topics and articles;
- article detail works;
- Admin content routes enforce authentication and roles;
- Markdown preview works;
- Markdown confirmation creates only a draft;
- no critical control appears interactive without working behavior;
- the final walkthrough is completed on the same environment that will be presented.
