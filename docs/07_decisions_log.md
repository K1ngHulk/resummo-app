# Decisions Log

## Formato

Cada decision debe registrar:

- Fecha.
- Decision.
- Estado.
- Motivo.
- Consecuencias.
- Dudas abiertas.

## Decisiones iniciales

### 2026-06-09 - MVP centrado solo en Learning

Estado: decidido.

Decision: El MVP de Resummo cubre exclusivamente Learning: aprender, repasar, practicar y medir progreso.

Motivo: El alcance inicial debe ser enfocado para validar utilidad educativa antes de abrir dominios adicionales.

Consecuencias:

- Clinical Care queda fuera de alcance.
- Teaching queda fuera de alcance.
- Toda pantalla nueva debe mapearse a Learning.

Dudas abiertas:

- En que momento se evaluara si Clinical Care o Teaching merecen una fase separada.

### 2026-06-09 - No implementar durante la fase documental

Estado: decidido.

Decision: Esta etapa solo crea documentacion base y audita el repo. No modifica codigo funcional.

Motivo: El proyecto esta en etapa inicial y necesita orden documental antes de crecer pantallas.

Consecuencias:

- No se cambia la UI actual.
- No se agregan rutas, backend ni dependencias.
- El plan tecnico queda como propuesta.

Dudas abiertas:

- Que documento o Figma sera la fuente principal para la primera implementacion.

### 2026-06-09 - Mantener datos mock hasta definir contratos

Estado: propuesto.

Decision: Mantener datos mock estructurados mientras se define modelo de contenido, preguntas y progreso.

Motivo: Evita acoplar pantallas a una API prematura.

Consecuencias:

- Las futuras pantallas deben usar shapes cercanos al modelo esperado.
- Se debe separar contenido editorial de actividad del estudiante.

Dudas abiertas:

- Backend objetivo.
- Necesidad de autenticacion en MVP privado.
- Persistencia local temporal vs persistencia real.

### 2026-06-09 - Figma debe convertirse en componentes, no en paginas aisladas

Estado: propuesto.

Decision: Las pantallas de Figma se deben traducir a componentes reutilizables, tokens y contratos de datos.

Motivo: Reduce duplicacion y prepara crecimiento del modulo Learning.

Consecuencias:

- Cada pantalla necesita inventario de componentes.
- Se deben definir estados visuales antes de implementar.

Dudas abiertas:

- URL o archivo Figma fuente.
- Estrategia final de estilos.

### 2026-06-10 - MVP frontend-first navegable

Estado: decidido.

Decision: El siguiente entregable sera un MVP frontend-first con cinco pantallas Learning navegables: loading, dashboard, qbank, study plans y library.

Motivo: El objetivo inmediato es validar navegacion y estructura visual basada en Figma antes de backend, auth, admin, pagos o contenido real.

Consecuencias:

- Se permite routing minimo en frontend.
- Los datos deben vivir como mocks temporales separados.
- No se agrega Clinical Care ni Teaching.
- No se migra a TypeScript en esta fase.

Dudas abiertas:

- El conector Figma no pudo acceder al archivo desde esta sesion; se necesita confirmar permisos o compartir nodos especificos si se requiere paridad visual exacta.

### 2026-06-13 - Color principal oficial de marca

Estado: decidido.

Decision: El color principal oficial de Resummo para el frontend Learning es `#8A342C`.

Motivo: Evitar que nuevas pantallas introduzcan tonos guinda/rojo distintos y mantener consistencia visual con la marca.

Consecuencias:

- `#8A342C` debe ser la base de `--color-primary`.
- Los fondos, botones, nav, cards, chips y bordes de marca deben usar tokens derivados de `#8A342C`.
- No se deben introducir nuevos colores guinda hardcodeados sin justificarlo en este log.
- Los colores semanticos se mantienen separados: verde de correcto, rojo de error/incorrecto, grises, overlays y estados disabled.

Dudas abiertas:

- Definir si el equipo quiere documentar una paleta completa de marca mas adelante.

### 2026-08-15 - Publicación de biblioteca como acción editorial de primer nivel

Estado: decidido.

Decision: El bootstrap y la publicación masiva de contenido importado no deben depender de seleccionar cientos de artículos y ejecutar cientos de updates. La superficie `/admin/articles` se presenta como `Biblioteca editorial` y ofrece a Admin una acción `Publicar biblioteca` que valida el snapshot actual, registra la aprobación editorial, publica las especialidades asociadas y publica los artículos importados mediante operaciones de conjunto.

Motivo: El flujo anterior ocultaba las acciones hasta seleccionar filas y ejecutaba cientos de updates Prisma, lo que produjo errores de servidor con el corpus de 427 artículos. Además, el concepto funcional es biblioteca (especialidades + artículos), no solo una colección de artículos aislados.

Consecuencias:

- La revisión artículo por artículo y las acciones por lote siguen disponibles.
- La aprobación/publicación masiva usa unas pocas operaciones de conjunto y conserva la validación editorial antes de hacer contenido visible a Student.
- `Publicar biblioteca` requiere rol ADMIN y una confirmación explícita en UI.
- Las especialidades necesarias se publican automáticamente junto con sus artículos.

Dudas abiertas:

- Definir más adelante si la publicación completa debe admitir selección por especialidad o release editorial versionado.

### 2026-08-15 - Resumen como entrada autenticada por defecto

Estado: decidido.

Decision: La entrada autenticada por defecto de Resummo vuelve a ser `Resumen` (`/learning`). Biblioteca sigue siendo la superficie principal de contenido, pero deja de ser el destino automático al entrar, iniciar sesión, pulsar la marca Resummo o volver desde el panel editorial.

Motivo: El usuario debe aterrizar primero en una vista general de su actividad y acceder a Biblioteca como sección explícita, no quedar forzado directamente al repositorio de contenido.

Consecuencias:

- `/` normaliza a `/learning`.
- El fallback de rutas Learning y el post-login apuntan a `/learning`.
- El logo principal y “Ir a la App” desde admin vuelven a Resumen.
- Las acciones específicas de búsqueda y navegación de Biblioteca conservan `/learning/library`.
- Esta decisión reemplaza únicamente la parte de la decisión 2026-08-06 que priorizaba `/learning/library` como ruta de entrada autenticada; Biblioteca continúa siendo el producto de contenido principal.

Dudas abiertas:

- Ninguna para Cloud V1.

### 2026-08-15 - Bootstrap editorial cloud fuera del web service

Estado: decidido; reemplaza el perfil constrained temporal de Render Free.

Decision: La carga inicial de RESUMMO MIR se ejecuta desde un CLI local que usa la PC como ejecutor y escribe directamente en Supabase PostgreSQL + Storage. El web service de Render deja de aplicar límites especiales de RSS, fases o reintentos para este bootstrap.

Motivo: El ZIP auditado es válido, pero la importación pesada dentro del web service gratuito de Render supera o deja demasiado cerca el límite de 512 MB. El perfil constrained evitó el OOM, pero terminó pausándose antes de poder iniciar de forma fiable sobre una instancia con memoria residente alta. Mantener lógica temporal en producción no aporta valor una vez que el bootstrap puede ejecutarse fuera del servidor web.

Consecuencias:

- Se retiraron de Render `RESUMMO_IMPORT_PROFILE`, `RESUMMO_IMPORT_MAX_RSS_MB` y `RESUMMO_IMPORT_ARTICLE_BATCH_SIZE`.
- La UI y el endpoint web vuelven al flujo estándar; no contienen lógica especial de memoria ni reintentos por fases.
- El CLI local exige el proyecto Supabase Resummo exacto, valida el corpus `35 / 427 / 386 / 462 / 0 / 0` y requiere una base editorial vacía antes de escribir.
- Los assets se pueden cargar localmente por chunks idempotentes; el contenido se persiste solo cuando Storage está completo.
- Topics y Articles permanecen `DRAFT`; el bootstrap no publica automáticamente.
- El CLI queda como herramienta operacional reproducible para migraciones/bootstrap, no como dependencia del runtime web.

Dudas abiertas:

- Si futuras importaciones masivas pasan a ser una función recurrente de producto, diseñar un worker/job asíncrono independiente del web service en vez de reintroducir límites ad hoc en Render.

### 2026-08-06 - Biblioteca como producto vendible inicial

Estado: decidido.

Decision: La primera superficie comercial y demostrable de Resummo sera Library-first. Biblioteca concentra la navegacion, lectura, busqueda y flujo editorial. QBank y Flashcards quedan como extensiones secundarias; Analysis y Study Plans no son bloqueantes ni se presentan como capacidades terminadas.

Motivo: El equipo puede producir y revisar articulos con mayor velocidad y consistencia que preguntas de alta calidad. La Biblioteca permite validar valor antes de ampliar practica, analitica o personalizacion.

Consecuencias:

- La ruta de entrada autenticada prioriza `/learning/library`.
- La navegacion principal muestra Biblioteca primero y reduce el protagonismo de modulos incompletos.
- El flujo editorial acepta Markdown exportado de Notion y crea siempre borradores.
- Ningun importador publica automaticamente.
- El contenido publicado debe distinguir alcance educativo, estado editorial y revision humana real.
- La demo del domingo se clasifica como demo controlada, no produccion publica.

Dudas abiertas:

- Quien asumira la revision clinica y con que evidencia se registrara la aprobacion de cada articulo.
- Cuando migrar el mapping temporal de carpetas a un modelo persistente de taxonomia.
- Si el pipeline de Notion evolucionara a sincronizacion automatica o se mantendra como exportacion Markdown controlada.
