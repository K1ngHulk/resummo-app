# Figma Update Delta: Study Plans

## Fuente y alcance

Este documento registra el delta entre:

- Figma actualizado de Resummo Learning, revisado visualmente con Playwright/navegador.
- Frontend actual confirmado en `src/App.jsx`, `src/pages` y `src/mocks/learningMockData.js`.
- Documento previo `docs/09_learning_figma_flow_map.md`.

No se implementa codigo en esta pasada.

Limitacion de inspeccion: Figma expone nombres de frames y algunos textos en el DOM, pero el canvas no entrega una estructura completa de layers, medidas, constraints ni prototyping links desde Playwright. La interpretacion de flujo se basa en nombres visibles, posicion relativa en canvas y lectura visual de las pantallas.

## Estado frontend actual confirmado

Rutas Learning actuales:

- `/learning/loading`
- `/learning`
- `/learning/qbank`
- `/learning/qbank/new`
- `/learning/qbank/session`
- `/learning/qbank/session/correct`
- `/learning/qbank/session/incorrect`
- `/learning/study-plans`
- `/learning/study-plans/new/step-1`
- `/learning/study-plans/new/step-2`
- `/learning/library`

Paginas actuales:

- `LoadingScreen.jsx`
- `DashboardPage.jsx`
- `QbankPage.jsx`
- `QbankNewSessionPage.jsx`
- `QuestionSessionPage.jsx`
- `StudyPlansPage.jsx`
- `StudyPlanWizardPage.jsx`
- `LibraryPage.jsx`

Nota: `docs/09_learning_figma_flow_map.md` ya quedo parcialmente desactualizado porque aun marca como faltantes varias rutas que ahora existen: sesion QBank y wizard de Study Plans paso 1/paso 2.

## A. Resumen de cambios detectados

### Pantallas nuevas detectadas

- `Plan de estudio`
- `Plan de estudio - Elementos`

Ambas pertenecen a `Planes de estudio y cursos`.

### Pantallas cambiadas o que requieren confirmar

- `Crear plan de estudio personalizado (Paso1)`: sigue existiendo y coincide conceptualmente con la ruta actual `/learning/study-plans/new/step-1`. No se detecto un cambio de flujo, solo conviene revisar fidelidad visual cuando se implemente el siguiente bloque.
- `Crear plan de estudio personalizado (Paso 2)`: ahora tiene un destino visual mas claro. El boton `Crear plan` debe llevar al nuevo detalle `Plan de estudio`, no solo volver a la lista base.
- `Planes de estudio y cursos`: debe poder mostrar una transicion hacia plan creado/detalle, ademas del estado vacio actual.

### Pantallas sin accion nueva en esta pasada

- Pantalla de carga.
- Pantalla general.
- Banco de Preguntas.
- Crear sesion QBank.
- Filtros de QBank: Examenes, Dificultad y Estado.
- Sesion de preguntas correcta/incorrecta.
- Biblioteca.

No se detecto una nueva pantalla de Banco de Preguntas con contenido relevante desde la vista actual de Figma. Si existe fuera del viewport/canvas inspeccionado, no fue visible con esta sesion de navegador.

## B. Tabla de pantallas nuevas/cambiadas

| Nombre en Figma | Modulo | Estado frontend | Ruta actual o sugerida | Entrada del flujo | Salida del flujo | Accion recomendada |
|---|---|---|---|---|---|---|
| Planes de estudio y cursos | Study Plans | existente pero requiere ajuste | `/learning/study-plans` | Nav superior `Planes de estudio y cursos` | CTA `Crea un plan de estudio` hacia paso 1 | Mantener pantalla base; preparar estado con plan creado o acceso al plan actual. |
| Crear plan de estudio personalizado (Paso1) | Study Plans | existente pero requiere ajuste menor | `/learning/study-plans/new/step-1` | CTA desde `/learning/study-plans` | Boton `Continuar` hacia paso 2 | Mantener ruta actual; revisar fidelidad visual contra Figma antes de cerrar. |
| Crear plan de estudio personalizado (Paso 2) | Study Plans | existente pero requiere ajuste de salida | `/learning/study-plans/new/step-2` | Continuar desde paso 1 | Boton `Crear plan` hacia detalle del plan | Cambiar salida futura de `Crear plan` hacia `/learning/study-plans/current`. |
| Plan de estudio | Study Plans | nueva / faltante | `/learning/study-plans/current` | Boton `Crear plan` desde paso 2; tambien posible acceso desde lista de planes | Ver dias del plan o volver a planes | Implementar como P0: detalle/resumen del plan creado mock. |
| Plan de estudio - Elementos | Study Plans | nueva / faltante | `/learning/study-plans/current/elements` o estado interno de `/learning/study-plans/current` | Click en un dia, articulo o sesion dentro de `Plan de estudio` | Volver al detalle general o continuar actividad | Tratar inicialmente como estado interno/detalle del plan, no como pantalla de primer nivel. |
| Banco de Preguntas adicional sin contenido claro | QBank | irrelevante / no implementar todavia | sin ruta nueva | No confirmada | No confirmada | No implementar hasta que Figma muestre contenido o flujo claro. |

## C. Flujo actualizado de Study Plans

Entrada principal:

1. El usuario entra desde la nav superior en `Planes de estudio y cursos`.
2. Ruta actual: `/learning/study-plans`.
3. La pantalla base muestra el CTA `Crea un plan de estudio`.

Creacion de plan:

1. `Crea un plan de estudio` navega a `/learning/study-plans/new/step-1`.
2. Paso 1 permite configurar objetivo/examen, articulos, sistemas y estados de preguntas.
3. `Continuar` navega a `/learning/study-plans/new/step-2`.
4. Paso 2 permite configurar horas por dia y dias de estudio.
5. `Crear plan` ya no deberia volver solamente a `/learning/study-plans`; Figma muestra como destino natural la pantalla nueva `Plan de estudio`.

Destino posterior a crear plan:

1. `Plan de estudio` parece ser la pantalla de detalle/resumen del plan creado.
2. Visualmente muestra:
   - header de app;
   - boton `Volver a los planes`;
   - titulo del plan tipo `Step 1 Prep Condensed`;
   - subtitulo `30 Topics in 30 Days`;
   - card introductoria/welcome;
   - lista de dias con progreso.
3. Ruta sugerida: `/learning/study-plans/current`.

Interpretacion de `Plan de estudio - Elementos`:

1. Parece representar un estado de detalle dentro del plan, no una pantalla independiente de primer nivel.
2. Visualmente muestra:
   - sidebar izquierda con dias del plan;
   - contenido derecho del dia/plan seleccionado;
   - secciones `Articulos` y `Sesiones`;
   - CTA tipo `Continuar`;
   - acciones como ver/marcar articulo o continuar sesion.
3. Es razonable implementarla como:
   - ruta interna: `/learning/study-plans/current/elements`; o
   - estado interno de `/learning/study-plans/current` cuando el usuario selecciona un dia/elemento.
4. Para el siguiente bloque visual, conviene implementarla como ruta separada mock si se quiere navegabilidad explicita; para producto real, probablemente convenga modelarla como detalle de dia/elemento dentro del plan.

## D. Rutas recomendadas

Mantener:

- `/learning/study-plans`
- `/learning/study-plans/new/step-1`
- `/learning/study-plans/new/step-2`

Agregar en siguiente implementacion visual:

- `/learning/study-plans/current`
- `/learning/study-plans/current/elements`

Rutas alternativas si se prefiere una nomenclatura mas estable para futuro backend:

- `/learning/study-plans/:planId`
- `/learning/study-plans/:planId/elements`
- `/learning/study-plans/:planId/days/:dayId`

Para el MVP frontend-first actual, evitar parametros dinamicos hasta que haya una necesidad real. `current` es suficiente para mocks reemplazables.

## E. Backlog actualizado

### P0

- Implementar `Plan de estudio` como destino visual de `Crear plan`.
- Cambiar la accion mock `Crear plan` de paso 2 para navegar a `/learning/study-plans/current`.
- Agregar mocks temporales para:
  - titulo del plan;
  - duracion/resumen;
  - mensaje introductorio;
  - lista de dias;
  - progreso por dia.

### P1

- Implementar `Plan de estudio - Elementos` como detalle de dia/elemento.
- Decidir si `Plan de estudio - Elementos` sera ruta propia o estado dentro del detalle del plan.
- Agregar componentes reutilizables:
  - `StudyPlanDetailPage`;
  - `StudyPlanDayList`;
  - `StudyPlanWelcomeCard`;
  - `StudyPlanDayCard`;
  - `StudyPlanElementsPanel`;
  - `StudyPlanElementRow`.

### P2

- Reemplazar rutas mock `current` por parametros reales cuando exista backend.
- Agregar estados vacio/completado/en progreso para dias y elementos.
- Pulir interacciones de marcar articulo como visto o continuar sesion, siempre mock hasta que exista backend.

## F. Dudas reales para implementacion visual inmediata

- Confirmar si `Plan de estudio - Elementos` debe abrirse al hacer click en un dia especifico, en un articulo o en una sesion.
- Confirmar si el boton `Continuar` dentro de `Plan de estudio - Elementos` apunta a una sesion QBank existente o a una pantalla futura de contenido del plan.
- Confirmar si `Volver a los planes` desde `Plan de estudio` debe volver a `/learning/study-plans` o a una version de la lista con el plan creado visible.
- Confirmar si la ruta mock debe ser `/learning/study-plans/current` o si prefieres introducir desde ya una forma semantica como `/learning/study-plans/step-1-prep-condensed`.
