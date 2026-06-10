# Figma To Frontend Plan

## Objetivo

Preparar el proceso para convertir pantallas de Figma en componentes React de Resummo sin implementar todavia nuevas pantallas.

## Principios

- Figma define intencion visual y estructura de experiencia.
- React define componentes, estados y comportamiento.
- No copiar pixeles sin convertirlos en sistema.
- No implementar pantallas fuera del alcance Learning.

## Flujo propuesto

1. Inventariar pantallas Learning en Figma.
2. Clasificar cada pantalla por superficie: aprender, repasar, practicar o progreso.
3. Extraer tokens visuales: color, tipografia, espaciado, radios, sombras y breakpoints.
4. Identificar componentes reutilizables.
5. Definir props y estados antes de escribir codigo.
6. Mapear datos mock a contratos futuros.
7. Implementar pantalla por pantalla con validacion responsive.
8. Comparar contra Figma y registrar diferencias aceptadas.

## Componentes candidatos

Ya existen en el repo:

- `AppHeader`
- `SearchBar`
- `AppIcon`
- `CircularProgress`
- `DonutChart`
- `ContinueLearningCard`
- `QuestionSessionCard`
- `RecentArticlesCard`
- `ProgressOverviewCard`

Potenciales componentes futuros:

- `LearningDashboard`
- `TopicCard`
- `TopicList`
- `QuestionCard`
- `PracticeSessionSummary`
- `ProgressMetricCard`
- `EmptyState`
- `LoadingState`
- `ErrorState`

## Contrato por componente

Antes de implementar un componente desde Figma, definir:

- Nombre del componente.
- Superficie Learning donde vive.
- Props.
- Estados visuales.
- Estados de datos: loading, empty, error, ready.
- Responsividad.
- Accesibilidad.
- Fuente de datos mock inicial.
- Criterio de aceptacion visual.

## Tokens

El CSS actual ya contiene variables globales en `src/styles/index.css`.

Antes de escalar UI, decidir si se mantiene CSS global o se migra a una estrategia mas modular. Mientras el repo siga pequeno, se puede conservar CSS global con convenciones claras.

Tokens a consolidar:

- Colores de marca.
- Colores semanticos de progreso.
- Tipografia.
- Espaciado.
- Radios.
- Sombras.
- Breakpoints.

## Checklist de implementacion futura

- La pantalla pertenece a Learning.
- La pantalla tiene datos mock definidos.
- Los componentes tienen props claras.
- Hay estados de carga, vacio y error cuando aplique.
- La UI es usable en desktop y mobile.
- El texto no promete uso clinico.
- La implementacion no introduce Clinical Care ni Teaching.

## Pendiente

- URL o archivo de Figma fuente: `https://www.figma.com/design/TTXI5rJ97ZG2YApr3AjJ7n/Untitled?node-id=0-1`.
- Definir si se usara una libreria de componentes.
- Routing minimo aceptado para el MVP frontend: `/learning/loading`, `/learning`, `/learning/qbank`, `/learning/study-plans`, `/learning/library`.
- Definir estrategia de assets visuales.

## Siguiente entregable

El siguiente entregable es un MVP frontend-first navegable basado en las pantallas Learning disponibles en Figma. Debe usar mocks temporales separados, mantenerse fuera de Clinical Care y Teaching, y no introducir backend, autenticacion, admin, pagos ni contenido medico real.
