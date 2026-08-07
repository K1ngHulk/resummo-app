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

La batería completa se ejecuta con:

```powershell
npm.cmd run verify:ci
```

Incluye Prisma validate, tests, lint, acceso privado, readiness, Admin, Library, catálogo demo, importación Markdown, First Learning Pack, QBank y build.

Los smokes que usan datos persistentes requieren una base aislada preparada y las cuentas controladas del entorno correspondiente. GitHub Actions reproduce ese entorno con PostgreSQL efímero en `.github/workflows/ci.yml`.

Endpoints operativos:

- `/api/health` — liveness de la API.
- `/api/ready` — readiness de la base; devuelve `503` sin exponer la conexión cuando PostgreSQL no está disponible.

En `NODE_ENV=production`, el servidor no inicia con un `JWT_SECRET` ausente, débil o de ejemplo.

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

## Estado de beta privada

Consulta `docs/16_beta_private_readiness.md`. El estado vigente es `CANDIDATE_FOR_PRIVATE_BETA`: el gate técnico local y CI están preparados, pero todavía faltan base remota válida, despliegue/rollback, backups, rate limiting, observabilidad y revisión clínica humana.

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
