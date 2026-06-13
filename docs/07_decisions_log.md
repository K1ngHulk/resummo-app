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
