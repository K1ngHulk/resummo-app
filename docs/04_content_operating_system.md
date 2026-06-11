# Content Operating System

## Objetivo

Definir como Resummo deberia organizar, crear, revisar y publicar contenido Learning antes de implementar un CMS o backend.

Este documento no implementa el sistema. Define el flujo operativo minimo.

## Tipos de contenido iniciales

Propuestos para Learning:

- Tema: unidad principal de estudio.
- Resumen: explicacion estructurada de un tema.
- Pregunta: item de practica asociado a uno o mas temas.
- Explicacion de respuesta: razonamiento posterior a una pregunta.
- Etiqueta: clasificacion por area, sistema, dificultad o estado.
- Sesion de practica: conjunto de preguntas respondidas por el estudiante.

## Estados de contenido

Estados propuestos:

- `draft`: contenido en preparacion.
- `review`: listo para revision.
- `approved`: validado para uso en producto.
- `published`: visible para estudiantes.
- `archived`: retirado o reemplazado.

## Flujo editorial

1. Definir tema y objetivo de aprendizaje.
2. Crear resumen inicial.
3. Asociar preguntas de practica.
4. Revisar precision medica y claridad educativa.
5. Aprobar version.
6. Publicar en el catalogo Learning.
7. Medir uso, errores reportados y desempeno.
8. Actualizar version cuando cambie el contenido o se detecte un problema.

## Metadatos minimos

Cada tema deberia tener:

- `id`
- `title`
- `slug`
- `summary`
- `area`
- `tags`
- `status`
- `version`
- `lastReviewedAt`
- `reviewedBy`

Cada pregunta deberia tener:

- `id`
- `stem`
- `options`
- `correctOptionId`
- `explanation`
- `topicIds`
- `difficulty`
- `status`
- `version`

## Reglas de calidad

- Todo contenido medico visible debe tener estado aprobado o publicado.
- Toda pregunta debe tener explicacion.
- Toda pregunta debe mapearse al menos a un tema.
- Los cambios importantes deben crear nueva version o dejar rastro de revision.
- El producto no debe presentar contenido como consejo clinico personalizado.

## Operacion en etapa temprana

Antes de construir backend:

- Mantener un dataset pequeno, revisado y controlado.
- Separar mocks visuales de contenido editorial real.
- Usar nombres de campos cercanos al modelo futuro.
- Registrar dudas de taxonomia en el decisions log.

## Dudas abiertas

- Quien revisa el contenido medico.
- Que fuentes son aceptadas.
- Si se permitira contenido generado por IA y bajo que revision.
- Cuanto detalle requiere la taxonomia medica inicial.
- Si las explicaciones deben tener referencias desde el MVP publico.
