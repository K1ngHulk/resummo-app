# Frontend MVP Plan

## Objetivo

Convertir Resummo en un MVP frontend-first, navegable y responsive basado en las pantallas Learning del Figma indicado por el equipo.

El entregable inmediato no resuelve backend, autenticacion, administracion, pagos, migracion desde Notion, contenido medico final ni banco real de preguntas.

## Fuente visual

- Figma: `https://www.figma.com/design/TTXI5rJ97ZG2YApr3AjJ7n/Untitled?node-id=0-1`
- Estado de acceso durante esta implementacion: el conector Figma no pudo acceder al archivo desde esta sesion. La implementacion usa las pantallas nombradas por el usuario y la estetica ya presente en el repo como referencia local.
- Referencia adicional: capturas provistas por el usuario para loading, dashboard, QBank, Study Plans y Library.

## Pantallas a implementar

- Loading screen.
- Dashboard / pantalla general.
- Qbank / banco de preguntas.
- Study Plans / planes de estudio.
- Library / biblioteca.

## Alcance Learning-only

Todo el MVP debe pertenecer a una de estas superficies:

- Aprender.
- Repasar.
- Practicar.
- Medir progreso.

No se deben agregar entradas de navegacion, componentes o copy para Clinical Care ni Teaching.

## Mocks temporales

Los datos deben vivir separados del codigo visual y estar marcados como temporales.

Ubicacion propuesta:

```text
src/mocks/learningMockData.js
```

Reglas:

- No mezclar mocks con componentes.
- Usar nombres cercanos a contratos futuros.
- Mantener contenido medico como placeholder, no como contenido final.
- Poder reemplazar el archivo por API, CMS o dataset real sin reescribir las paginas.

## Exclusiones explicitas

- Clinical Care.
- Teaching.
- Backend.
- Auth/login.
- Roles admin/student.
- Pagos.
- Panel admin.
- Migracion real desde Notion.
- Subida real de contenido.
- IA.
- Contenido medico final.
- Preguntas reales.
- Progreso persistente.
- Migracion a TypeScript salvo necesidad estricta.

## Rutas propuestas

- `/learning/loading`
- `/learning`
- `/learning/qbank`
- `/learning/study-plans`
- `/learning/library`

Para esta fase se puede usar routing minimo con History API. `react-router` debe evaluarse cuando aparezcan rutas dinamicas, loaders o transiciones mas complejas.

La pestaña `Analisis` se mantiene visible porque aparece en el Figma, pero queda deshabilitada en esta fase porque no fue una de las pantallas solicitadas para implementar.

## Componentes candidatos

Existentes:

- `AppHeader`
- `SearchBar`
- `AppIcon`
- `CircularProgress`
- `DonutChart`
- `ContinueLearningCard`
- `QuestionSessionCard`
- `RecentArticlesCard`
- `ProgressOverviewCard`

Nuevos candidatos:

- `LearningPageHeader`
- `LearningMetricCard`
- `LearningItemCard`
- `LoadingScreen`
- `QbankPage`
- `StudyPlansPage`
- `LibraryPage`

## Criterios de aceptacion visual

- Las cinco pantallas existen y son navegables por URL.
- La navegacion principal solo muestra secciones Learning implementadas.
- La UI conserva la estetica actual de Resummo: fondo claro, rojo primario, tarjetas claras, bordes suaves y progreso visual.
- No hay paginas gigantes duplicadas; las pantallas comparten componentes.
- Los mocks estan separados del codigo visual.
- Las acciones profundas pueden ser botones mock sin persistencia.
- El copy no promete uso clinico ni decision medica.

## Criterios responsive

- Desktop primero con ancho maximo estable.
- En tablet, grids de dos columnas pasan a una columna cuando sea necesario.
- En mobile, la navegacion puede desplazarse horizontalmente.
- Las tarjetas no deben solaparse ni cortar texto critico.
- Los botones deben mantener area tactil suficiente.

## Validacion tecnica

- `npm.cmd run lint` debe pasar.
- `npm.cmd run build` debe pasar.
- No se deben agregar dependencias salvo necesidad justificada.
- No se debe tocar backend porque no existe en esta fase.
