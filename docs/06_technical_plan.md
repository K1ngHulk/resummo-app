# Technical Plan

## Estado tecnico actual

El repo es una app React + Vite en etapa inicial.

Confirmado:

- React 19.
- Vite 8.
- JavaScript + JSX.
- ESLint configurado.
- CSS global.
- Datos mock en `src/data/dashboardData.js`.
- Componentes separados en `src/components`.
- Una pagina principal en `src/pages/DashboardPage.jsx`.

No confirmado o no presente:

- TypeScript.
- Router.
- Backend.
- API client.
- Persistencia.
- Autenticacion.
- Tests.
- Configuracion de deploy.
- Sistema de design tokens formal fuera de CSS variables.

## Arquitectura propuesta

Sin modificar todavia la app, la direccion recomendada es organizar Learning por dominio:

```text
src/
  app/
    App.jsx
  features/
    learning/
      components/
      data/
      pages/
      types-or-models/
      services/
  shared/
    components/
    icons/
    styles/
    utils/
```

Esta estructura debe adoptarse solo cuando el crecimiento lo justifique. En el estado actual, la estructura existente todavia es suficiente para una maqueta pequena.

## Capas propuestas

### UI compartida

Componentes reutilizables sin conocimiento de negocio:

- SearchBar.
- Iconos.
- Progress primitives.
- Buttons.
- Empty, loading y error states.

### Learning feature

Componentes y paginas con lenguaje de dominio:

- Dashboard Learning.
- Tema.
- Sesion de preguntas.
- Progreso.
- Biblioteca.

### Datos

Comenzar con mocks estructurados, pero con forma cercana al contrato futuro:

- `topics`
- `articles` o `summaries`
- `questions`
- `practiceSessions`
- `progressSummary`

### Servicios

Cuando exista backend, encapsular lectura/escritura en servicios o hooks para evitar que las pantallas dependan de fetch directo.

## Routing

El MVP frontend-first puede usar routing minimo con History API mientras no existan rutas dinamicas, loaders ni backend. Si la navegacion crece, evaluar `react-router`.

Rutas candidatas:

- `/` o `/learning`: dashboard Learning.
- `/learning/topics`: biblioteca de temas.
- `/learning/topics/:slug`: vista de tema.
- `/learning/practice`: entrada a practica.
- `/learning/practice/:sessionId`: sesion de preguntas.
- `/learning/progress`: progreso.

Rutas del MVP frontend-first:

- `/learning/loading`: pantalla de carga.
- `/learning`: dashboard Learning.
- `/learning/qbank`: banco de preguntas mock.
- `/learning/study-plans`: planes de estudio mock.
- `/learning/library`: biblioteca mock.

## Estado y persistencia

Fase mock:

- Mantener datos en `src/mocks/learningMockData.js`.
- Evitar estado global prematuro.
- Usar props y estado local donde alcance.

Fase persistente:

- Definir backend y modelo de usuario.
- Persistir progreso, sesiones y respuestas.
- Separar contenido publicado de actividad del estudiante.

## Testing recomendado

Antes de datos reales:

- Lint obligatorio.
- Tests unitarios para transformaciones de progreso y sesiones.
- Tests de componentes criticos si se agrega logica.
- E2E minimo para dashboard, busqueda, practicar y progreso cuando haya rutas.

Herramientas a evaluar:

- Vitest para unit/component tests.
- React Testing Library para componentes.
- Playwright para flujos reales.

## Seguridad y cumplimiento

- No manejar datos de pacientes en Learning MVP.
- No presentar contenido como consejo clinico.
- Separar claramente contenido educativo de decisiones clinicas.
- No hardcodear secretos.
- Si hay autenticacion, usar variables de entorno y revisar permisos.

## Criterios antes de implementar

- Figma Learning identificado.
- Alcance cerrado por pantalla.
- Modelo de contenido minimo aprobado.
- Decidir si se mantiene JavaScript o se migra a TypeScript.
- Definir si MVP privado requiere login.
- Definir estrategia de contenido inicial.
- Agregar tests cuando haya logica no trivial.
