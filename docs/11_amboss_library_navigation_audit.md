# AMBOSS Library Navigation Audit

## Resumen

La Library de AMBOSS funciona como una base de conocimiento navegable dentro del flujo Learning. Desde UX/producto, no se presenta como una landing editorial, sino como una herramienta de estudio orientada a dos entradas principales:

- busqueda global persistente;
- navegacion jerarquica por carpetas y categorias.

La revision se hizo con Playwright/navegador sobre la sesion abierta de AMBOSS. La cuenta disponible permitio inspeccionar la pantalla de Library, categorias, busqueda y shell de articulo, pero los articulos completos quedaron bloqueados por membresia. No se intento cambiar credenciales, activar licencia ni saltar permisos.

Para Resummo, el patron relevante no es copiar contenido ni complejidad editorial, sino adoptar una Biblioteca medica simple, buscable y conectada al resto de Learning.

## Mapa de navegacion AMBOSS Library

Flujo observado:

1. El usuario entra desde la navegacion secundaria de Learning en `Library`.
2. La pantalla principal muestra el titulo `Library` y una lista de carpetas principales.
3. La busqueda global permanece en el header y tambien sirve como entrada rapida a articulos.
4. Al abrir una carpeta, AMBOSS agrega columnas progresivas:
   - columna raiz de Library;
   - columna de subcategoria;
   - columna de especialidad/sistema o articulos.
5. Al elegir un articulo desde busqueda o carpeta, el usuario entra a una ruta de articulo.
6. La ruta de articulo conserva:
   - header principal;
   - busqueda global;
   - navegacion secundaria de Learning;
   - shell de contenido con espacio para navegacion lateral y articulo.
7. Con la cuenta actual, el articulo completo muestra un bloqueo de membresia antes de exponer contenido.

Salida hacia otros recursos:

- La UI mantiene Qbank, Analysis, Score predictor y Study plans como navegacion secundaria cercana.
- AMBOSS comunica explicitamente que la membresia conecta articulos y preguntas, lo que sugiere una relacion producto entre Library y Qbank.
- No se pudo confirmar una CTA interna articulo -> Qbank dentro de articulos completos por el bloqueo de acceso.

## Elementos principales detectados

| Elemento | Que hace | Valor para el estudiante | Posible equivalente en Resummo |
|---|---|---|---|
| Header Learning | Mantiene logo, busqueda global, acciones de usuario y navegacion | Da contexto estable y reduce perdida entre modulos | Reutilizar `AppHeader` actual sin agregar auth real |
| Busqueda global | Abre un overlay central con input y sugerencias | Permite llegar rapido a temas especificos | Buscador de Biblioteca con resultados mock |
| Sugerencias `Go to` | Muestran destinos directos a articulos conocidos | Aceleran navegacion cuando el estudiante sabe el tema | Top results de articulos mock |
| Sugerencias `Search for` | Ofrecen consultas relacionadas | Ayudan a explorar terminos cercanos | Sugerencias de busqueda simples |
| Carpetas principales | Agrupan la biblioteca en dominios amplios | Permiten explorar sin saber el nombre exacto del articulo | Categorias: Sistemas, Ciencias basicas, Examenes, Recientes |
| Columnas progresivas | Agregan profundidad sin cambiar de pantalla completa | Da sentido de jerarquia y ubicacion | Vista desktop con lista de categorias + lista de articulos |
| Item de carpeta | Abre otra columna o subcategoria | Navegacion predecible | Card/list item de categoria |
| Item de articulo | Abre la vista de articulo | Transicion natural de exploracion a lectura | Card/list item de articulo |
| Shell de articulo | Reserva area de lectura y navegacion lateral | Facilita lectura larga y secciones internas | Article detail mock con indice lateral |
| Acceso a colecciones | Boton superior para contenido guardado/colecciones | Permite retomar temas | Guardados visual mock, sin persistencia |
| Header responsive | En mobile cambia a menu + buscador ancho | Mantiene busqueda como accion primaria | Header actual de Resummo debe priorizar buscador en mobile |

## Vista de articulo

La vista de articulo completa no pudo auditarse por el bloqueo de membresia. Lo confirmado desde el shell visible:

- mantiene el header global;
- mantiene el buscador;
- mantiene la navegacion secundaria Learning;
- usa una zona izquierda para navegacion lateral o indice;
- usa una zona principal para el contenido;
- reserva un layout de lectura separado de la vista de carpetas;
- al no tener acceso, muestra un estado bloqueado con CTA de membresia.

Estructura recomendada para un articulo de Resummo V1, basada en el patron observado y sin copiar contenido propietario:

- header de articulo con titulo, categoria y estado mock;
- resumen corto o "puntos clave" mock;
- indice lateral o sticky en desktop;
- secciones internas simples;
- callouts de aprendizaje;
- bloque de articulos relacionados mock;
- CTA visual hacia Qbank relacionado, sin iniciar logica real;
- accion visual de guardar, sin persistencia.

## Patrones que Resummo deberia adoptar

### P0

- Biblioteca como herramienta Learning, no pagina de marketing.
- Buscador visible como accion principal.
- Lista de categorias o sistemas para exploracion.
- Lista de articulos mock por categoria.
- Vista de articulo con estructura de lectura clara.
- Indice interno simple en desktop.
- Datos mock separados de JSX.
- Contenido medico placeholder, no contenido final.
- Navegacion de vuelta a Biblioteca.

### P1

- Sugerencias de busqueda separadas entre `Ir a` y `Buscar`.
- Resultados agrupados por tipo: articulo, sistema, pregunta relacionada.
- Accion visual de guardar/bookmark.
- Articulos relacionados.
- CTA visual a Qbank relacionado.
- Estado de articulo leido/no leido mock.
- Indice colapsable en tablet/mobile.

### P2

- Colecciones reales.
- Busqueda full-text real.
- Links internos entre articulos.
- Figuras, tablas y multimedia.
- Referencias/citas editoriales.
- Personalizacion por objetivo de estudio.
- Progreso persistente por articulo.
- Integracion real articulo -> preguntas -> analisis.

## Patrones que Resummo NO deberia copiar todavia

- Paywall, membresia o prompts comerciales.
- Integraciones clinicas o Clinical Care.
- Teaching.
- Contenido medico propietario o textos largos de terceros.
- Articulos completos con rigor editorial final.
- Referencias/citas reales sin sistema editorial.
- Calculadoras, tablas clinicas complejas o herramientas interactivas.
- Busqueda avanzada respaldada por backend.
- Colecciones persistentes.
- Recomendaciones personalizadas por IA.

## Propuesta para Biblioteca Resummo V1 frontend

Pantallas necesarias:

1. Biblioteca principal.
   - Ruta: `/learning/library`.
   - Objetivo: buscar y explorar categorias.
   - Debe mostrar:
     - titulo `Biblioteca`;
     - buscador local;
     - categorias mock;
     - articulos recientes o recomendados mock;
     - estado vacio cuando no hay resultados.

2. Lista/resultado de categoria.
   - Puede vivir dentro de `/learning/library` como estado visual.
   - Objetivo: mostrar articulos de una categoria seleccionada.
   - Debe mostrar:
     - breadcrumb o chip de categoria;
     - lista de articulos;
     - tags mock;
     - accion `Leer articulo`.

3. Vista de articulo.
   - Ruta recomendada inicial: `/learning/library/articles/bacteria-overview`.
   - Ruta futura: `/learning/library/articles/:slug`.
   - Objetivo: validar estructura de lectura.
   - Debe mostrar:
     - titulo;
     - categoria;
     - resumen mock;
     - indice;
     - secciones placeholder;
     - CTA mock a Qbank relacionado;
     - accion visual de guardar.

Mocks necesarios:

- categorias;
- articulos;
- resultados de busqueda;
- secciones de articulo;
- articulos relacionados;
- preguntas relacionadas mock;
- estados visuales de guardado/leido.

Fuera de alcance para esta implementacion:

- backend;
- auth;
- admin;
- pagos;
- IA;
- contenido medico real;
- busqueda real;
- progreso persistente;
- migracion desde Notion;
- Clinical Care;
- Teaching.

## Rutas sugeridas para Resummo

Para el router manual actual:

- `/learning/library`
- `/learning/library/articles/bacteria-overview`

Si se agregan mas articulos mock antes de migrar router:

- `/learning/library/articles/cardiology-basics`
- `/learning/library/articles/pediatrics-overview`

Cuando el frontend necesite rutas dinamicas o nested routing:

- `/learning/library/articles/:slug`
- `/learning/library/search`
- `/learning/library/categories/:categoryId`

Recomendacion: mantener una ruta explicita mock al inicio. No introducir React Router solo por Biblioteca si el router actual sigue siendo suficiente.

## Backlog recomendado

### P0

- Reemplazar la Library vacia por una pantalla navegable mock.
- Agregar mocks separados para categorias y articulos.
- Implementar buscador visual con resultados filtrados en memoria.
- Implementar una vista mock de articulo.
- Conectar `Leer articulo` desde una card/list item.
- Mantener el alcance Learning-only.

### P1

- Agregar sugerencias de busqueda tipo overlay.
- Agregar indice lateral en articulo.
- Agregar related articles y related Qbank mock.
- Agregar bookmark visual sin persistencia.
- Agregar estado responsive de indice como drawer/accordion.

### P2

- Migrar a rutas dinamicas cuando haya mas contenido.
- Integrar backend o CMS cuando exista sistema editorial.
- Implementar busqueda real.
- Conectar progreso real de lectura.
- Conectar articulos con sesiones Qbank reales.

## Dudas reales

- Si la primera implementacion debe incluir una vista de articulo mock completa o solo el home de Biblioteca con cards.
- Si Biblioteca debe organizarse inicialmente por `Sistemas`, `Articulos recientes` o `Objetivo de estudio`.
- Si el CTA relacionado con Qbank debe llevar a `/learning/qbank/new` o a `/learning/qbank/session` en modo mock.
- Si conviene usar rutas explicitas de articulo mientras el router siga siendo manual.
