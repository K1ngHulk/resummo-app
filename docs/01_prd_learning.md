# PRD Learning

## Resumen

El MVP de Resummo cubre exclusivamente Learning. El objetivo es que un estudiante de medicina pueda aprender, repasar, practicar y entender su progreso dentro de una experiencia web enfocada y simple.

Clinical Care y Teaching no forman parte del MVP.

## Usuario principal

Estudiante de medicina que necesita estudiar temas medicos, repasar conceptos, practicar preguntas y ver progreso de forma continua.

## Problema

El estudiante suele alternar entre apuntes, articulos, bancos de preguntas y registros manuales de avance. Esa fragmentacion reduce continuidad, hace dificil saber que estudiar despues y no siempre conecta lectura, practica y progreso.

## Objetivo del MVP

Crear una experiencia Learning inicial que permita:

- Continuar el ultimo tema o actividad.
- Buscar y abrir contenido educativo.
- Practicar preguntas relacionadas con temas de estudio.
- Ver progreso basico por preguntas, aciertos y actividades recientes.
- Preparar la base para que el contenido y las pantallas puedan crecer sin cambiar el alcance.

## No objetivos del MVP

- No diagnosticar pacientes.
- No recomendar tratamiento clinico para casos reales.
- No administrar pacientes ni historias clinicas.
- No crear herramientas para docentes.
- No incluir flujos institucionales.
- No implementar pagos.
- No implementar comunidad, foros o mensajeria.

## Superficies Learning

### Aprender

Permite consumir contenido educativo organizado por temas. En el MVP puede partir de articulos o resumenes estructurados.

Requisitos iniciales:

- Listado o busqueda de temas.
- Vista de contenido.
- Indicador simple de tema visto o en progreso.

### Repasar

Permite volver a temas recientes, pendientes o recomendados por actividad previa.

Requisitos iniciales:

- Continuar donde el usuario lo dejo.
- Mostrar temas vistos recientemente.
- Separar pendiente, en progreso y completado cuando exista persistencia.

### Practicar

Permite responder preguntas de estudio asociadas a temas.

Requisitos iniciales:

- Crear o continuar una sesion de preguntas.
- Mostrar avance de la sesion.
- Registrar respuestas correctas, incorrectas y con pistas cuando exista persistencia.

### Progreso

Permite entender avance del estudiante de forma accionable.

Requisitos iniciales:

- Resumen de preguntas respondidas.
- Porcentaje correcto.
- Separacion entre correcto, incorrecto y correcto con pista si el modelo de preguntas lo soporta.
- Acceso rapido a continuar estudio o practica.

## Requisitos funcionales iniciales

- El sistema debe mostrar una pantalla principal Learning.
- El sistema debe representar contenido educativo como datos estructurados, aunque al inicio sean mocks.
- El sistema debe permitir continuar una actividad de aprendizaje.
- El sistema debe permitir continuar o iniciar una sesion de preguntas.
- El sistema debe mostrar progreso basico.
- El sistema debe mantener Clinical Care y Teaching fuera de la navegacion principal del MVP.

## Requisitos no funcionales

- La UI debe ser responsive.
- El contenido medico debe ser versionable y revisable antes de publicarse.
- La arquitectura frontend debe separar componentes visuales, datos mock y logica de dominio.
- La implementacion debe permitir migrar de datos estaticos a API sin reescribir las pantallas.
- La experiencia debe evitar promesas clinicas o de decision medica.

## Metricas del MVP

- Estudiantes que completan una sesion de preguntas.
- Estudiantes que vuelven a continuar un tema.
- Temas vistos por estudiante.
- Preguntas respondidas por sesion.
- Porcentaje de respuestas correctas.
- Tiempo hasta retomar una actividad previa.

## Supuestos

- El primer usuario objetivo es estudiante individual, no institucion.
- El contenido inicial puede arrancar con un set curado pequeno.
- La app web sera el canal inicial.
- El backend y la persistencia se definiran despues de cerrar el modelo Learning.

## Dudas abiertas

- Fuente y formato inicial del contenido medico.
- Criterios de revision medica y responsables de aprobacion.
- Nivel de granularidad: tema, subtema, leccion, articulo o tarjeta.
- Si las preguntas tendran pistas, explicaciones, tags y dificultad desde el MVP privado.
- Si el login sera requerido en MVP privado o se puede trabajar con estado local temporal.
