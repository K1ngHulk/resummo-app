# Recursos de demostración editorial

Esta carpeta contiene archivos controlados para demostrar dos flujos del panel editorial sin publicar automáticamente contenido.

## Importar un artículo desde Markdown

Archivo:

```text
resummo-demo-article-import.md
```

Uso:

1. Inicia Resummo y entra con una cuenta `EDITOR` o `ADMIN`.
2. Abre `Panel editorial → Importar artículos`.
3. Selecciona el archivo Markdown.
4. Usa **Previsualizar y validar**.
5. Revisa errores y advertencias.
6. Usa **Crear borrador**.
7. Abre el borrador desde el resultado y completa la revisión antes de publicar.

El frontmatter admite:

- `title` — requerido.
- `slug` — requerido, en minúsculas y guiones.
- `topic_slug` — requerido y debe existir.
- `summary` — requerido.
- `read_time_minutes` — requerido, entero positivo.
- `tags` — opcional, como lista YAML o arreglo en línea.
- `educational_only` — requerido y debe ser `true`.
- `evidence_cutoff` — recomendado, formato `YYYY-MM-DD`.
- `last_reviewed` — opcional hasta que exista revisión real.
- `reviewer` — opcional hasta que exista una persona revisora real.
- `review_status` — `DRAFT`, `CLINICAL_REVIEW`, `APPROVED` o `RETIRED`.

La importación siempre crea un artículo `DRAFT`, incluso si el archivo declara otro estado. No crea temas, no modifica artículos existentes y no publica automáticamente.

## Importar flashcards desde Anki TSV

Archivo:

```text
resummo-demo-anki-import.tsv
```

Uso:

1. Abre `Panel editorial → Importar Anki`.
2. Selecciona el TSV.
3. Usa **Previsualizar importación**.
4. Revisa que las filas sean válidas antes de confirmar.

Headers reconocidos:

- `topicSlug` — requerido y debe existir.
- `articleSlug` — opcional; si se incluye, debe pertenecer al tema.
- `prompt` — requerido; se usa como frente.
- `explanation` — requerido; se usa como reverso.
- `difficulty` — opcional, entero de 1 a 5.
- `hint` — opcional.

La importación crea preguntas `FLASHCARD` en estado `DRAFT`. Los prompts duplicados se omiten.

## Alcance

Los dos archivos contienen material educativo de demostración. No representan aprobación clínica ni deben publicarse fuera del entorno controlado sin revisión humana competente y evidencia verificable.
