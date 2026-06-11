# Resummo Project Brief

## Estado del proyecto

Resummo es una plataforma web educativa para estudiantes de medicina. La fase inicial se limita a Learning: aprender, repasar, practicar y medir progreso.

Este documento registra el estado real del repositorio antes de implementar nuevas pantallas o flujos.

## Objetivo inicial

Preparar la base documental y tecnica para construir el modulo Learning de Resummo sin mezclar, todavia, Clinical Care ni Teaching.

## Alcance de producto para la fase actual

Incluido:

- Aprender contenido medico organizado.
- Repasar temas vistos o pendientes.
- Practicar con sesiones de preguntas.
- Medir progreso del estudiante.
- Preparar una ruta clara desde Figma a componentes React.

Fuera de alcance por ahora:

- Clinical Care.
- Teaching.
- Gestion institucional.
- Flujos clinicos de pacientes reales.
- Herramientas para docentes.
- Marketplace, pagos o suscripciones.

## Auditoria del repositorio

Stack confirmado:

- React `^19.2.6`.
- React DOM `^19.2.6`.
- Vite `^8.0.12`.
- JavaScript con JSX.
- ESLint `^10.3.0`.
- CSS global en `src/styles/index.css`.
- Package manager: npm, con `package-lock.json`.

Scripts confirmados:

- `npm.cmd run dev`: servidor de desarrollo Vite.
- `npm.cmd run build`: build de produccion Vite.
- `npm.cmd run lint`: ESLint sobre el repo.
- `npm.cmd run preview`: preview local del build.

Estructura actual:

```text
src/
  App.jsx
  main.jsx
  data/
    dashboardData.js
  pages/
    DashboardPage.jsx
  components/
    dashboard/
    layout/
    ui/
  styles/
    index.css
```

Estado funcional observado:

- Existe una sola pantalla tipo dashboard.
- La navegacion principal vive en datos estaticos.
- Las tarjetas actuales cubren continuar aprendizaje, sesion de preguntas, articulos recientes y progreso.
- No hay routing configurado.
- No hay backend, API client, persistencia, autenticacion ni tests configurados.
- No hay TypeScript.
- No hay configuracion de deploy detectada.
- `node_modules` y `package-lock.json` ya estaban presentes al momento de la auditoria.

## Riesgos tempranos

- La app ya contiene texto y navegacion de Learning, pero todavia no existe un modelo de informacion estable para contenido, preguntas o progreso.
- Si se implementan pantallas desde Figma sin contrato de componentes, el CSS global puede crecer rapido y volverse dificil de mantener.
- La ausencia de tests es aceptable para la maqueta inicial, pero debe corregirse antes de conectar datos reales o progreso persistente.
- El producto necesita definir cuanto contenido medico sera curado, generado, revisado o importado.

## Principio de fase

Primero ordenar decisiones, alcance, datos y componentes. Despues implementar.
