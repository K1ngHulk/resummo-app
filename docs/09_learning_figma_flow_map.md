# Learning Figma Flow Map

## Fuente y alcance

Este mapa cruza tres fuentes:

- Figma abierto en navegador con Playwright.
- Frontend local en `http://localhost:5173`.
- Estado real del repo: `src/App.jsx`, `src/pages` y `src/mocks/learningMockData.js`.

Limitacion de Figma: el navegador muestra el archivo, pero la mayor parte del canvas no aparece como DOM inspeccionable. El MCP de Figma tampoco pudo acceder al archivo por permisos/rate limit. Por eso, este documento usa inspeccion visual del canvas, nombres visibles de layers, capturas previas y la lista de pantallas indicada por el usuario.

No se implementa nada en este documento.

## Estado frontend confirmado

Rutas existentes:

- `/learning/loading`
- `/learning`
- `/learning/qbank`
- `/learning/qbank/new`
- `/learning/study-plans`
- `/learning/library`

Paginas existentes:

- `LoadingScreen.jsx`
- `DashboardPage.jsx`
- `QbankPage.jsx`
- `QbankNewSessionPage.jsx`
- `StudyPlansPage.jsx`
- `LibraryPage.jsx`

Mocks existentes:

- Header, usuario y navegacion Learning.
- Dashboard y progreso.
- Qbank overview.
- Nueva sesion Qbank.
- Temas de sesion Qbank.
- Criterios de sesion Qbank.
- Modales mock de Examenes, Dificultad y Estado.
- Study Plans base.
- Library base.

## Tabla de pantallas

| Nombre en Figma | Modulo | Estado frontend | Ruta sugerida | Accion de entrada | Accion de salida | Notas |
|---|---|---:|---|---|---|---|
| Pantalla de carga | Learning shell | existente | `/learning/loading` | Abrir ruta directa / estado inicial mock | Continua hacia dashboard si se agrega transicion | Usa logo guinda real. |
| Pantalla general | Dashboard | existente | `/learning` | Nav `General` | CTAs internos mock | No revisar de cero; solo confirmar existencia. |
| Banco de preguntas | Qbank | existente | `/learning/qbank` | Nav `Banco de Preguntas` | Boton `Crear una sesion de QBank` hacia `/learning/qbank/new` | Existe con hero e historial mock. |
| Crear sesion QBank | Qbank | existente | `/learning/qbank` -> `/learning/qbank/new` | CTA en Banco de preguntas | Abre nueva sesion personalizada | Es un estado/transicion, no necesariamente pantalla separada. |
| Nueva sesion personalizada de estudio | Qbank | parcial | `/learning/qbank/new` | CTA `Crear una sesion de QBank` | Boton `Crear sesion` deberia ir a sesion de preguntas | Existe visualmente con panels y modales; falta conectar a pantalla de preguntas. |
| Seleccionar filtros | Qbank | parcial | `/learning/qbank/new?modal=exams` | Click en `Examenes` | `Listo`, cerrar overlay | Implementado como modal mock de Examenes. |
| Establece los temas de tu sesion | Qbank | existente | `/learning/qbank/new` | Entrar a nueva sesion | Seleccion de filas/temas | Existe con Examenes, Articulos, Sistemas, Disciplinas y Sintomas. |
| Criterios de sesion | Qbank | existente | `/learning/qbank/new` | Entrar a nueva sesion | Click en Dificultad/Estado o `Crear sesion` | Existe con titulo, switches mock y recuento de preguntas. |
| Dificultad | Qbank | parcial | `/learning/qbank/new?modal=difficulty` | Click en `Dificultad` | `Listo`, cerrar overlay | Implementado como modal mock con niveles. |
| Estado | Qbank | parcial | `/learning/qbank/new?modal=status` | Click en `Estado` | `Listo`, cerrar overlay | Implementado como modal mock con estados y modo de aplicacion. |
| Sesion de preguntas | Qbank | faltante | `/learning/qbank/session` | Boton `Crear sesion` desde `/learning/qbank/new` o `Continuar` desde historial | Seleccionar respuesta / avanzar pregunta | Pantalla final de responder preguntas no existe todavia. |
| Sesion de preguntas con respuesta incorrecta | Qbank | faltante | `/learning/qbank/session/incorrect` | Responder incorrectamente en sesion | Ver explicacion / siguiente pregunta | Requiere variante visual de feedback incorrecto. |
| Sesion de preguntas con respuesta correcta | Qbank | faltante | `/learning/qbank/session/correct` | Responder correctamente en sesion | Ver explicacion / siguiente pregunta | No estaba en la lista inicial, pero conviene proponerla para paridad con incorrecta. |
| Preguntas guardadas | Qbank | faltante | `/learning/qbank/saved` | Icono `Guardados` o tab interna de Qbank | Abrir pregunta guardada / volver | Existe icono de Guardados en header; no hay pantalla. Confirmar si Figma la tiene. |
| Planes de estudio y cursos | Study Plans | parcial | `/learning/study-plans` | Nav `Planes de estudio y cursos` | Boton `Crea un plan de estudio` | Pantalla base existe; Figma muestra cards de planes. Falta flujo crear plan. |
| Crear plan de estudio personalizado paso 1 | Study Plans | faltante | `/learning/study-plans/new/step-1` | Boton `Crea un plan de estudio` | Continuar a paso 2 | Visible en Figma/layers como `Crear plan de estudio personalizado (Paso1)`. |
| Crear plan de estudio personalizado paso 2 | Study Plans | faltante | `/learning/study-plans/new/step-2` | Continuar desde paso 1 | Guardar/crear plan o volver a Study Plans | Visible parcialmente en canvas como segundo paso. Confirmar destino posterior. |
| Biblioteca | Library | existente | `/learning/library` | Nav `Biblioteca` | Pendiente segun flujo futuro | Figma parece mostrar pantalla muy vacia; frontend existe como base. |
| Cerrar sesion | Shell / cuenta | faltante | sin ruta recomendada por ahora | Perfil / menu usuario si Figma lo define | Volver a loading o estado anonimo mock | Auth esta fuera de alcance; si se implementa, debe ser solo visual/mock. |

## Flujo de Banco de Preguntas

Entrada:

- El usuario entra desde el header/nav con `Banco de Preguntas`.
- Ruta actual: `/learning/qbank`.

Flujo observado/propuesto:

1. `/learning/qbank` muestra el hero `Crear sesion de QBank` y el historial de sesiones.
2. El boton `Crear una sesion de QBank` navega a `/learning/qbank/new`.
3. `/learning/qbank/new` muestra:
   - panel izquierdo `Establece los temas de tu sesion`;
   - filtros de temas: Examenes, Articulos, Sistemas, Disciplinas, Sintomas;
   - panel derecho `Criterios de sesion`;
   - titulo de sesion;
   - filtros Dificultad y Estado;
   - switches mock;
   - recuento de preguntas;
   - boton `Crear sesion`.
4. Modales/filtros ya existentes:
   - `Examenes`: checklist con buscador y acciones `Restablecer` / `Listo`.
   - `Dificultad`: checklist visual por niveles.
   - `Estado`: checklist de estados y radio group para aplicar filtros.
5. El boton `Crear sesion` deberia llevar a `/learning/qbank/session`.
6. La sesion de preguntas deberia tener variantes visuales:
   - estado neutral: pregunta sin responder;
   - respuesta correcta: feedback positivo y explicacion;
   - respuesta incorrecta: feedback de error y explicacion.

No hay que implementar logica real de preguntas todavia. Todo debe seguir mock y frontend-first.

## Flujo de Planes de Estudio

Entrada:

- El usuario entra desde el header/nav con `Planes de estudio y cursos`.
- Ruta actual: `/learning/study-plans`.

Flujo observado/propuesto:

1. `/learning/study-plans` muestra el hero `¿Estas por dar un examen pronto?`.
2. El boton `Crea un plan de estudio` deberia navegar a `/learning/study-plans/new/step-1`.
3. Paso 1: `Crear plan de estudio personalizado (Paso1)`.
   - Figma muestra campos/preguntas de configuracion inicial.
   - Accion principal: `Continuar`.
4. Paso 2: `Crear plan de estudio personalizado (Paso2)`.
   - Figma muestra una segunda etapa, posiblemente rutina/calendario de estudio.
   - Accion posterior pendiente de confirmar: crear plan, guardar plan o volver a la lista.
5. Despues del paso 2, si Figma lo muestra, deberia terminar en:
   - `/learning/study-plans` con plan creado mock; o
   - `/learning/study-plans/:id` si aparece un detalle de plan.

La pantalla base existe, pero el flujo de creacion no esta implementado.

## Pantallas faltantes

### P0

- `/learning/qbank/session`: pantalla neutral de sesion de preguntas.
- `/learning/qbank/session/incorrect`: estado visual de respuesta incorrecta.
- `/learning/qbank/session/correct`: estado visual de respuesta correcta.
- `/learning/study-plans/new/step-1`: primer paso del plan personalizado.
- `/learning/study-plans/new/step-2`: segundo paso del plan personalizado.

### P1

- `/learning/qbank/saved`: preguntas guardadas si Figma confirma esa pantalla.
- Estado de Study Plans con plan creado mock despues del paso 2.
- Acciones de historial Qbank (`Continuar`) apuntando a sesion de preguntas mock.
- Confirmar si `Articulos`, `Sistemas`, `Disciplinas` y `Sintomas` necesitan modales propios o quedan como filas visuales.

### P2

- `Cerrar sesion` como modal/menu visual mock, sin auth real.
- Ruta de detalle de plan de estudio si Figma la agrega.
- Pulido fino de microinteracciones de filtros.

## Rutas recomendadas

Mantener existentes:

- `/learning/loading`
- `/learning`
- `/learning/qbank`
- `/learning/qbank/new`
- `/learning/study-plans`
- `/learning/library`

Agregar en una siguiente implementacion:

- `/learning/qbank/session`
- `/learning/qbank/session/correct`
- `/learning/qbank/session/incorrect`
- `/learning/qbank/saved`
- `/learning/study-plans/new/step-1`
- `/learning/study-plans/new/step-2`

No agregar React Router todavia solo por estas rutas si el router actual sigue siendo suficiente. Evaluarlo cuando haya parametros dinamicos o nested flows reales.

## Backlog de implementacion recomendado

Orden sugerido:

1. Conectar `Crear sesion` en `/learning/qbank/new` a una pantalla mock neutral de sesion de preguntas.
2. Crear componentes compartidos para sesion de preguntas:
   - `QuestionStem`;
   - `AnswerOptionList`;
   - `QuestionProgress`;
   - `QuestionFeedbackPanel`;
   - `QuestionActions`.
3. Agregar variantes mock correcta/incorrecta reutilizando la misma estructura.
4. Crear flujo Study Plans paso 1 y paso 2.
5. Conectar CTA `Crea un plan de estudio` hacia paso 1.
6. Definir si preguntas guardadas es pantalla real en Figma; si si, implementarla como lista mock.
7. Solo despues, revisar si el router manual sigue siendo mantenible.

Componentes reutilizables candidatos:

- `LearningShell` o mantener `AppHeader` actual.
- `FigmaPageLayout` para paginas con ancho y spacing comun.
- `QbankFilterPanel`.
- `FilterModal`.
- `ChecklistOption`.
- `MockSwitch`.
- `StudyPlanWizardLayout`.
- `WizardStepHeader`.
- `QuestionSessionLayout`.
- `QuestionFeedbackCard`.

## Dudas reales para implementacion visual inmediata

- En Figma, confirmar el destino exacto despues de `Crear sesion` en Qbank: pantalla neutral, pregunta 1 o algun interstitial.
- Confirmar si existen variantes separadas para respuesta correcta y respuesta incorrecta, o si ambas viven como estados de la misma pantalla.
- Confirmar que pasa despues de `Crear plan de estudio personalizado (Paso2)`: vuelve a lista, muestra detalle o muestra confirmacion.
- Confirmar si `Preguntas guardadas` existe como pantalla en Figma o solo como icono de header.
- Confirmar si `Cerrar sesion` debe implementarse como menu/modal visual mock o mantenerse fuera por alcance de auth.
