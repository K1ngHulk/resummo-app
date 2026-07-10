# Demo Anki import

`resummo-demo-anki-import.tsv` contiene 10 flashcards educativas de bajo riesgo para demostrar el importador actual.

## Cómo usarlo

1. Inicia Resummo localmente.
2. Ingresa con una cuenta que tenga rol `EDITOR` o `ADMIN`.
3. Abre `/admin/import/anki` desde el Panel editorial.
4. Selecciona `resummo-demo-anki-import.tsv` y usa **Previsualizar importación**.
5. Revisa que las 10 filas sean válidas antes de confirmar.

El parser reconoce estos headers exactos del archivo:

- `topicSlug` — requerido y debe existir.
- `articleSlug` — opcional; si se incluye, debe pertenecer al topic.
- `prompt` — requerido; se usa como frente.
- `explanation` — requerido; se usa como reverso.
- `difficulty` — opcional, entero de 1 a 5.
- `hint` — opcional.

La importación crea preguntas `FLASHCARD` en estado `DRAFT`, aunque el archivo incluyera una columna `status`. No publica contenido automáticamente. Si los prompts ya fueron importados en ese topic, la vista previa los marcará como duplicados y no se volverán a crear.

El contenido es educativo y está preparado solo para la demo. Debe pasar revisión humana antes de reutilizarse fuera de este entorno.
