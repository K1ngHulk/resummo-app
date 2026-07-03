# Resummo Content Pipeline

This folder contains reusable prompts, rules, research workflow notes, and draft artifacts for generating educational medical content for Resummo.

## Purpose

The content pipeline helps contributors research, draft, audit, and standardize medical learning articles before they are considered for publication inside the product.

## Important disclaimer

Files in this folder are **not final clinical guidance** and must not be treated as published product content by default.

Drafts and research notes require human review before being used in the application, especially when they include:

- treatment recommendations;
- medication names or doses;
- Peruvian clinical context;
- diagnostic or therapeutic algorithms;
- claims based on external medical guidelines.

Resummo is an educational product. Content generated through this workflow must remain educational, cite verifiable sources, and avoid presenting itself as personalized medical advice.

## Folder structure

- `rules/`: reusable agent rules and content-generation constraints.
- `prompts/`: prompts for drafting, structuring, and auditing Resummo articles.
- `drafts/`: non-final research drafts and source compilations.
- `debug/`: notes about tooling, MCP startup, or pipeline debugging.

## Redaccion editorial

La fase de redaccion editorial de articulos dentro de este pipeline debe apoyarse en:

- `prompts/redactor_medico_high_yield.md`: prompt editorial para convertir borradores clinicos validos en articulos high-yield, fluidos y escaneables.

Este prompt esta vinculado a la skill local del proyecto:

- `.trae/skills/resummo-medical-copywriter/SKILL.md`

## Contribution rules

Before committing content generated through this pipeline:

1. Verify that no secrets, tokens, local-only paths, or private credentials are included.
2. Mark drafts clearly as drafts.
3. Preserve citations and source-tracking notes.
4. Do not move draft content into the product UI without content review.
5. Keep clinical claims conservative and source-backed.
