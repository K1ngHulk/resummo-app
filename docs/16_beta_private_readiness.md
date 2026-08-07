# Beta privada readiness — Resummo Library-first

Fecha de evaluación: 2026-08-06

## Veredicto

Resummo supera el nivel de demo técnica improvisada: dispone de flujo Library-first, proceso editorial a borrador, validaciones reproducibles, base local aislada, liveness/readiness y CI preparado.

Todavía no debe abrirse como beta privada real. El estado correcto es:

```text
CANDIDATE_FOR_PRIVATE_BETA
```

La promoción a `PRIVATE_BETA_READY` requiere cerrar los P0 pendientes con evidencia.

## Controles aprobados

| Control | Estado | Evidencia |
|---|---|---|
| Rama y entrega reproducible | PASS | `main`, commits trazables y CI en `.github/workflows/ci.yml` |
| Prisma schema | PASS | `npm run db:validate` |
| Tests deterministas | PASS | `npm test` |
| Lint | PASS | `npm run lint` |
| Build | PASS | `npm run build` |
| Acceso privado | PASS técnico | Registro bloqueado en modo privado; smoke por roles |
| JWT de producción | PASS código | El servidor rechaza secretos ausentes, débiles o de ejemplo |
| Liveness | PASS | `/api/health` no depende de la DB |
| Readiness | PASS | `/api/ready` devuelve `200` con DB y `503` sin DB |
| Biblioteca y artículos | PASS | Smoke HTTP y QA desktop |
| Importación Markdown | PASS | Preview, DRAFT obligatorio y gate editorial |
| Datos de demo aislados | PASS | PostgreSQL local en `127.0.0.1:5433` |
| Valores internos en UI | PASS | Mappings humanos y QA visual |

## P0 antes de una beta privada real

### 1. Base remota recuperada y validada

Estado: `FAIL`.

La conexión Supabase configurada devuelve `tenant/user not found`. Debe obtenerse una cadena vigente, verificar proyecto y región, ejecutar únicamente el procedimiento de schema aprobado y repetir la batería completa contra un entorno de staging o beta.

No usar `db:push`, seed destructivo ni loaders de demo sobre una base real sin plan y respaldo.

### 2. Despliegue y rollback

Estado: `PENDING`.

Debe existir:

- proveedor y entorno beta definidos;
- variables obligatorias configuradas;
- build y arranque reproducibles;
- procedimiento de rollback;
- commit o release identificable;
- CORS limitado al dominio real.

### 3. Backups y restauración

Estado: `PENDING`.

Antes de depender de contenido y progreso persistente:

- activar backups automáticos;
- documentar retención;
- ejecutar al menos una restauración de prueba;
- registrar responsable y resultado.

### 4. Revisión clínica del contenido publicado

Estado: `PENDING HUMAN REVIEW`.

El software bloquea publicaciones Markdown sin metadata editorial aprobada, pero los artículos demo heredados siguen siendo contenido introductorio pendiente de revisión humana. No presentar el catálogo como validado clínicamente hasta completar el workflow del author kit.

### 5. Protección de login y endpoints costosos

Estado: `PENDING`.

Falta rate limiting proporcional para:

- login;
- registro cuando se habilite;
- importaciones editoriales;
- creación de sesiones o endpoints que puedan automatizarse en volumen.

Debe implementarse sin confiar solo en el cliente y con pruebas de respuesta `429`.

### 6. Observabilidad y soporte

Estado: `PENDING`.

La beta necesita como mínimo:

- captura de excepciones sin secretos;
- logs consultables;
- uptime sobre `/api/health` y `/api/ready`;
- responsable de alertas;
- canal de soporte y runbook básico.

## P1 después de cerrar los P0

- Sesiones revocables o estrategia de invalidación de JWT.
- Política de eliminación y retención de cuentas/progreso.
- Responsive validado en los tamaños que usará la beta.
- Baseline de rendimiento y bundle splitting.
- Búsqueda full-text cuando el catálogo justifique el cambio.
- Taxonomía persistida en backend en lugar del mapping temporal frontend.
- Historial editorial estructurado en DB.
- Pruebas E2E incorporadas al repositorio si el coste de mantenimiento se justifica.

## Comando de gate técnico

Con PostgreSQL aislado y datos controlados preparados:

```text
npm run verify:ci
```

El comando ejecuta Prisma validate, tests, lint, acceso privado, readiness, Admin, Library, catálogo demo, importador Markdown, First Learning Pack, QBank y build.

## Regla de promoción

Resummo solo puede pasar a `PRIVATE_BETA_READY` cuando:

1. todos los P0 estén en `PASS`;
2. exista evidencia fechada;
3. el commit desplegado sea identificable;
4. la revisión clínica del contenido mostrado esté registrada;
5. se haya probado rollback o recuperación según el riesgo.
