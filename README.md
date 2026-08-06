# Resummo

Resummo es una aplicación web educativa para estudiantes de medicina. La etapa actual es una **demo controlada Library-first**: Biblioteca es la superficie principal y el panel editorial permite preparar, importar, revisar y publicar contenido de forma explícita.

No es una herramienta de diagnóstico, prescripción ni soporte a decisiones clínicas.

## Stack

- React 19 + Vite
- Express
- Prisma 7
- PostgreSQL / Supabase
- JWT + roles `STUDENT`, `EDITOR` y `ADMIN`
- CSS manual

## Inicio rápido

### Base configurada en `.env`

Ejecuta:

```text
start-resummo.bat
```

El launcher valida primero la conexión de base de datos. Si la conexión remota no está disponible, se detiene antes de abrir una app incompleta.

### Demo local aislada

Ejecuta:

```text
start-resummo-local-demo.bat
```

Este launcher:

1. comprueba que la base autorizada sea exclusivamente `127.0.0.1:5433`;
2. inicia PostgreSQL 16 mediante Docker Compose;
3. aplica el schema y carga datos solo en esa base local;
4. carga el contenido de demostración Library-first;
5. abre la Biblioteca en `http://localhost:5173/learning/library`.

No lee ni modifica la base de Supabase.

## Desarrollo manual

```powershell
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run dev:server
npm.cmd run dev:client
```

## Validación

```powershell
node --test src/data/libraryTree.test.mjs server/lib/articleMarkdownImport.test.mjs
npm.cmd run lint
npm.cmd run build
node scripts/smoke-http-admin.mjs
node scripts/smoke-http-library.mjs
node scripts/smoke-http-demo-showcase.mjs
```

Los smokes que usan datos reales requieren una base disponible y las cuentas controladas del entorno correspondiente.

## Superficies principales

- `/learning/library` — Biblioteca jerárquica y búsqueda.
- `/learning/library/article?slug=...` — Lectura de artículo.
- `/admin/articles` — Gestión editorial.
- `/admin/import/articles` — Importación Markdown exportado de Notion.
- `/admin/import/anki` — Importación de flashcards TSV.

## Flujo editorial

1. Redactar en Notion o Markdown con frontmatter.
2. Previsualizar en `Panel editorial → Importar artículos`.
3. Corregir errores o advertencias.
4. Crear un borrador.
5. Revisar contenido, evidencia y metadata.
6. Publicar de forma explícita desde el panel editorial.

Ningún importador publica automáticamente. El kit especializado vive en `resummo-author-kit/` y permanece como capacidad local no autoactivada.

## Recursos de demo

Consulta `docs/demo/README.md` para:

- artículo Markdown de muestra;
- archivo Anki TSV de muestra;
- contrato de frontmatter;
- pasos de demostración.

## Alcance actual

Incluido:

- Biblioteca con taxonomía visual mínima.
- Artículos estructurados y progreso básico.
- Panel editorial.
- Importación Markdown a borrador.
- QBank y Flashcards como extensiones secundarias.

Fuera del núcleo de la demo:

- Clinical Care.
- Teaching.
- Producción pública.
- Revisión médica automática.
- RAG, chat clínico o recomendaciones personalizadas.
- CMS enriquecido propio.
