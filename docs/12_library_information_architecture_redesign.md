# Rediseño de arquitectura de información de Biblioteca

## Resumen ejecutivo

La Biblioteca actual de Resummo tiene una presentación moderna y una vista de artículo bien encaminada, pero su navegación no representa una biblioteca médica profunda. Los chips superiores y el panel lateral ejecutan el mismo filtro sobre una lista plana de nueve artículos. La duplicación ocupa espacio, mantiene dos estados activos para una sola decisión y no crea una relación real entre dominio, disciplina, subcategoría y artículo.

AMBOSS resuelve mejor la arquitectura: cada selección abre una capa nueva y mantiene visibles los niveles anteriores. En la revisión se observó la secuencia `Library` → `Basic sciences` → `By discipline` → `Microbiology`, con carpetas y artículos diferenciados dentro de las columnas. El resultado comunica escala y ubicación, aunque su presentación es deliberadamente sobria y aprovecha poco las oportunidades de jerarquía visual y descubrimiento editorial.

La recomendación para Resummo V2 es un modelo híbrido:

- eliminar los chips como navegación principal permanente;
- convertir el lateral en navegación de dominios raíz, no en una copia del filtro;
- mostrar subcategorías mediante paneles progresivos y breadcrumbs;
- reservar las cards atractivas para artículos, recomendados y carpetas destacadas;
- limitar la navegación progresiva a tres paneles visibles en desktop;
- hacer que la búsqueda global de Biblioteca reemplace temporalmente el contexto de exploración;
- separar siempre `id`, `slug` y `label`, sin exponer valores técnicos en la interfaz;
- eliminar las secciones de artículos recomendados o destacados por ahora, ya que no existe algoritmo, historial del usuario, ni criterio editorial o comercial para respaldarlas. El overview se centrará 100% en exploración por dominios y búsqueda global.

## Diagnóstico de Resummo actual

### Estructura observada

La ruta `/learning/library` contiene:

- hero con título, descripción y buscador local;
- nueve chips de categoría, incluyendo `Todas`;
- panel lateral `Explorar por categoría` con las mismas nueve opciones;
- bloque de artículos recomendados en el estado `Todas`;
- grid de artículos filtrados;
- búsqueda local sobre título, categoría, resumen, tags y badges.

La ruta `/learning/library/articles/bacteria-overview` ya tiene una estructura de lectura útil: regreso a Biblioteca, índice lateral, metadata, puntos clave, secciones, relacionados y conexión visual con QBank. Esa pantalla necesita evolucionar con contenido, no un rediseño estructural en esta fase.

### Problemas principales

1. **Dos controles para la misma decisión.** Los chips y el panel lateral cambian exactamente `activeCategory`. No son dos niveles; son el mismo filtro en dos ejes.
2. **Estado visual duplicado.** Al seleccionar `Cardiología`, quedan activos a la vez el chip horizontal y la fila lateral. Esto añade ruido sin aportar contexto.
3. **Búsqueda con contexto contradictorio.** Si `Cardiología` está activa y se busca `asma`, el resultado global muestra `Asma bronquial` de `Neumología`, mientras ambos controles siguen marcando `Cardiología`.
4. **Taxonomía de un solo nivel.** `Ciencias básicas`, `Cardiología`, `Pediatría` y `Medicina interna` conviven como pares aunque pertenecen a clases conceptuales distintas: dominio, sistema, etapa clínica o especialidad.
5. **El contador no equivale a profundidad.** Mostrar `Cardiología 2` informa volumen, pero no explica cómo se organiza ese contenido.
6. **Escalabilidad limitada.** Un grid de cards funciona con nueve artículos; con cientos obliga a scroll extenso, repite metadata y dificulta comparar temas relacionados.
7. **Carpetas sin comportamiento de carpeta.** El panel se llama `Carpetas`, pero sus elementos solo filtran artículos. No abren ramas, subcategorías ni rutas navegables.
8. **Demasiado peso en cards de igual jerarquía.** Recomendados y catálogo usan variaciones del mismo patrón. Falta distinguir entre descubrir, explorar una taxonomía y leer.

### Evaluación de elementos actuales

| Elemento | Acierto | Problema | Decisión V2 |
|---|---|---|---|
| Buscador local | Visible, claro y específico de Biblioteca | No explica que ignora la categoría activa | Mantener; al buscar, entrar en un estado global de resultados |
| Chips | Rápidos y amigables con pocos elementos | Duplican el panel y no escalan | Retirar como navegación principal; reutilizar solo para filtros secundarios |
| Panel lateral | Da una primera sensación de repositorio | Repite chips y mezcla niveles taxonómicos | Convertir en dominios raíz y ubicación persistente |
| Recomendados | Aporta dinamismo al estado inicial | No tiene algoritmo, historial, criterio editorial ni promoción | Eliminar de V2 hasta que exista una decisión clara y un sistema real que los respalde |
| Cards de artículos | Claras, atractivas y coherentes con la marca | Muy grandes para catálogos extensos | Mantener cards completas para destacados y usar filas compactas para listados |
| Vista de artículo | Buena base para lectura y conexión con QBank | Solo existe una ruta mock | Conservar estructura; hacerla consumidora del nuevo árbol |

## Diagnóstico de AMBOSS Library

### Patrones observados

- La entrada muestra una columna raíz `Library` con carpetas principales.
- Abrir una carpeta agrega una columna hija sin ocultar las anteriores.
- Se observó el recorrido `Library` → `Basic sciences` → `By discipline` → `Microbiology`.
- `Microbiology` contiene nuevas carpetas, como `Bacteriology`, y artículos terminales en la misma lista.
- Los elementos accesibles distinguen explícitamente `Open library folder` de `Open article`.
- Las carpetas usan affordance de avance; los artículos son destinos de lectura.
- La URL cambia con cada rama, por lo que la ubicación es recuperable y compartible.
- El buscador abre un overlay separado del árbol y divide sugerencias entre destinos directos (`Go to`) y búsquedas (`Search for`).

### Aciertos de AMBOSS

- **Jerarquía visible:** cada columna responde qué nivel está abierto y de dónde viene.
- **Profundidad progresiva:** el usuario puede explorar sin cargar una página completamente distinta por cada carpeta.
- **Carpeta y artículo no son lo mismo:** tienen semántica, iconografía y acciones diferentes.
- **Sensación de repositorio amplio:** la interfaz comunica que existen más ramas aunque solo se vea una porción.
- **Escalabilidad:** listas densas y columnas manejan mejor cientos de nodos que un grid continuo de cards.
- **Ubicación recuperable:** la ruta representa el camino seleccionado.
- **Búsqueda desacoplada:** buscar no finge ser una subcategoría del árbol actual.

### Problemas de AMBOSS

- La presentación es funcional pero fría; casi todo tiene el mismo peso visual.
- Las listas largas ofrecen poco contexto editorial o ayuda para priorizar.
- Cuatro columnas de ancho fijo funcionan en desktop grande, pero reducen rápidamente el espacio útil.
- Las categorías y artículos dependen mucho de iconos pequeños para diferenciarse.
- El modelo puede sentirse administrativo para quien todavía no conoce la taxonomía médica.
- Copiar todas sus ramas, guías, medios y colecciones introduciría complejidad fuera del MVP de Resummo.

## Aciertos a conservar de Resummo

- Identidad visual guinda `#8A342C` y componentes coherentes con Learning.
- Buscador de Biblioteca visible desde el primer viewport.
- Cards con título, resumen, tiempo de lectura, tags y estado.
- Empty state claro para búsquedas sin resultados.
- Vista de artículo con índice, callouts, relacionados y CTA hacia QBank.
- Mocks separados del JSX y labels humanos visibles.

## Aciertos a adoptar de AMBOSS

- Árbol de navegación real, no filtros planos disfrazados de carpetas.
- Columnas o paneles progresivos que mantengan visible el camino.
- Distinción visual y semántica entre carpeta, subcategoría y artículo.
- Rutas que representen la rama seleccionada.
- Buscador como modo separado con destinos directos y resultados.
- Listados compactos en niveles con alta densidad de contenido.
- Persistencia visual de ubicación mediante breadcrumbs.

## Errores actuales a corregir

1. Eliminar la doble navegación de categorías.
2. Dejar de mezclar dominios, sistemas y especialidades en un único array plano.
3. No mantener una categoría marcada cuando una búsqueda global devuelve otra rama.
4. No usar cards grandes para representar todos los nodos del repositorio.
5. No llamar `carpeta` a un filtro que no contiene hijos.
6. No mostrar recomendados ajenos dentro de una categoría o subcategoría.
7. No exponer slugs, enums, IDs ni claves internas en títulos, breadcrumbs, chips o URLs visibles dentro de la UI.

## Propuesta de Biblioteca V2

### Modelo de navegación

La Biblioteca debe tener dos modos claramente separados:

1. **Explorar:** navegación por árbol, breadcrumbs y contenido de la rama.
2. **Buscar:** resultados globales de Biblioteca con la ruta humana de cada resultado.

El overview `/learning/library` funciona como la entrada principal. Debe mostrar:

- buscador global de Biblioteca;
- cards pequeñas de los dominios raíz;
- acceso a la última rama visitada solo cuando exista persistencia local o real.

**Aclaración sobre recomendados:** La sección de "artículos recomendados" o "featured" fue descartada de este rediseño. El overview no mostrará contenido recomendado, reciente ni "high-yield" general, porque el producto aún no cuenta con lógica de historial, algoritmo de personalización ni un criterio editorial estricto para priorizar material de estudio.

### Navegación jerárquica

Desktop grande puede usar hasta tres paneles visibles:

1. **Dominio raíz:** Ciencias básicas, Sistemas, Clínica.
2. **Rama activa:** disciplina, sistema o especialidad.
3. **Contenido:** subcarpetas y artículos de la selección actual.

Si existe un cuarto nivel, el panel más antiguo sale de la vista, pero permanece en breadcrumbs. No conviene copiar una secuencia ilimitada de columnas: Resummo necesita reservar ancho para títulos, summaries, metadata y cards.

**Regla de retroceso explícito y contexto profundo**: Las rutas profundas deben mantener visible el contexto del padre. El breadcrumb indica la ruta, pero no sustituye la necesidad de un control cercano para volver. En el panel lateral de carpetas debe existir una acción explícita `← Volver a [Padre]` que devuelva al usuario al nivel anterior de la jerarquía. Estas acciones de retroceso deben tener un tratamiento visual **secundario y discreto** (tipo ghost/link o texto atenuado), nunca compitiendo visualmente con los CTAs principales o la carpeta actualmente activa.

**Regla de Layout**: El panel principal nunca debe usar `align-items: center`, `justify-content: center` o espacios vacíos masivos al inicio de la columna para simular cambios de contexto o estados intermedios. El contenido debe iniciar en el borde superior respetando el padding normal de forma consistente en todos los niveles.
En laptop, mantener un rail de dominio y un panel principal. En tablet/mobile, usar navegación drill-down: una lista por pantalla, botón volver y breadcrumb compacto. No usar scroll horizontal de columnas como interacción primaria.

### Representación de nodos

**Carpeta o subcategoría**

- icono de carpeta;
- label humano;
- cantidad de hijos, o cantidad de artículos en la rama completa. El texto debe evitar la ambigüedad (ej. usar `3 elementos` o `3 artículos en la rama`, nunca decir simplemente `3 artículos` si incluye los descendientes indirectos);
- descripción de una línea opcional;
- chevron de avance;
- sin tiempo de lectura ni badges editoriales.

**Artículo**

- icono de documento;
- título humano;
- ruta humana compacta, por ejemplo `Ciencias básicas / Microbiología / Bacteriología`;
- tiempo de lectura;
- tags y estados editoriales;
- acción `Leer artículo`.

En destacados se conservan las cards visuales actuales. En listados de una rama se recomienda una fila-card más densa para soportar decenas de artículos sin scroll excesivo.

### Estado de una categoría

Ejemplo al abrir `Ciencias básicas`:

- breadcrumb: `Biblioteca / Ciencias básicas`;
- rail con `Ciencias básicas` activo;
- panel de subcategorías: `Microbiología`, `Farmacología`, `Fisiología`;
- área principal con una breve descripción, subcategorías destacadas y artículos directamente asociados;
- sin recomendados de otras ramas.

### Estado de una subcategoría

Ejemplo al abrir `Microbiología`:

- breadcrumb: `Biblioteca / Ciencias básicas / Microbiología`;
- panel previo conserva las disciplinas hermanas;
- el panel lateral de carpetas muestra el botón explícito `← Volver a Ciencias básicas`;
- el contexto del contenido indica `Dentro de Ciencias básicas`;
- contenido muestra carpetas `Bacteriología`, `Virología`, `Parasitología`;
- si existen artículos directos en Microbiología, se listan bajo "Artículos disponibles". Los artículos que pertenecen a una subcarpeta (como `Bacteriología`) no se listan en Microbiología para evitar desdibujar la jerarquía. Si Microbiología no tiene artículos directos, se muestra un estado útil (`No hay artículos directos en esta carpeta. Explora sus subcategorías.`);
- al abrir `Bacteriología`, la lista principal muestra sus artículos directos en formato compacto.

### Estado de búsqueda

Cuando hay una consulta activa:

- el heading cambia a `Resultados de búsqueda`;
- el árbol deja de mostrar una rama activa como filtro aplicado;
- cada resultado muestra su breadcrumb humano;
- pueden existir filtros secundarios por tipo, dominio o estado, representados como chips;
- al cerrar la búsqueda se restaura la rama anterior.

Así los chips se conservan donde aportan valor: como filtros temporales de resultados, no como una segunda taxonomía permanente.

### Modelo de datos recomendado

El frontend mock debe separar identidad y presentación:

```js
{
  id: 'folder-basic-sciences',
  slug: 'basic-sciences',
  label: 'Ciencias básicas',
  type: 'folder',
  parentId: null,
}
```

`id` y `slug` sirven para estado y rutas; `label` es el único valor visible. El mismo contrato aplica a artículos. Los componentes deben renderizar labels y breadcrumbs construidos desde labels, nunca transformar slugs para mostrarlos.

## Árbol mock de información

El árbol inicial usa hasta tres niveles de carpetas; el artículo es una hoja terminal y no cuenta como nivel de navegación.

```text
Biblioteca
├── Ciencias básicas
│   ├── Microbiología
│   │   ├── Bacteriología
│   │   │   ├── Bacteria overview
│   │   │   ├── Bacterias grampositivas
│   │   │   └── Bacterias gramnegativas
│   │   ├── Virología
│   │   └── Parasitología
│   ├── Farmacología
│   │   ├── Principios generales
│   │   └── Antimicrobianos
│   └── Fisiología
│       ├── Cardiovascular
│       └── Respiratoria
├── Sistemas
│   ├── Cardiovascular
│   │   ├── Cardiopatía isquémica
│   │   │   └── Síndrome coronario agudo
│   │   └── Riesgo cardiovascular
│   │       └── Hipertensión arterial
│   ├── Respiratorio
│   │   ├── Vía aérea obstructiva
│   │   │   └── Asma bronquial
│   │   └── Infecciones respiratorias
│   │       └── Tuberculosis
│   └── Endocrino
│       └── Diabetes
│           └── Diabetes mellitus tipo 2
└── Clínica
    ├── Pediatría
    │   └── Infecciones frecuentes
    │       └── Infecciones respiratorias agudas
    ├── Ginecología y obstetricia
    │   └── Medicina materno-fetal
    │       └── Restricción del crecimiento fetal
    └── Medicina interna
        └── Oftalmología
            └── Cataratas
```

Los artículos pueden tener tags adicionales y aparecer en búsqueda o recomendados, pero deben tener una ubicación primaria para breadcrumbs. Evitar duplicar físicamente el mismo artículo en varias ramas.

## Layout recomendado

### Desktop grande

```text
[ Título + buscador global de Biblioteca ]
[ Breadcrumbs humanos ]

[ Dominios 240px ] [ Rama 280px ] [ Contenido flexible: subcarpetas + artículos ]
```

- El rail izquierdo usa una superficie blanca compacta, no una card flotante por cada sección.
- El panel intermedio muestra listas densas con separación sutil.
- El área principal conserva cards y color de marca para contenidos destacados.
- Los paneles comparten altura visual y divisores; no deben parecer tres dashboards independientes.

### Laptop

```text
[ Breadcrumbs ]
[ Rail colapsable 220px ] [ Subcategorías y artículos ]
```

### Tablet y mobile

```text
[ Volver ] [ Breadcrumb compacto ]
[ Lista del nivel actual ]
[ Artículos de la rama ]
```

Cada tap reemplaza el nivel actual. El árbol completo puede abrirse en un drawer futuro, pero no es necesario para el primer mock.

## Rutas recomendadas

### Primera implementación con router manual

Mantener rutas mock explícitas para validar el flujo sin introducir React Router:

- `/learning/library`
- `/learning/library/browse/basic-sciences`
- `/learning/library/browse/basic-sciences/microbiology`
- `/learning/library/browse/basic-sciences/microbiology/bacteriology`
- `/learning/library/articles/bacteria-overview`

La URL puede contener slugs; la interfaz no. El breadcrumb debe mostrar `Ciencias básicas / Microbiología / Bacteriología`, nunca `basic-sciences / microbiology / bacteriology`.

### Evolución posterior

Cuando existan suficientes ramas y artículos para justificar routing dinámico:

- `/learning/library/browse/:path`
- `/learning/library/articles/:slug`
- `/learning/library/search?q=...`

No conviene crear decenas de condiciones manuales. Las rutas explícitas son correctas para el siguiente mock; el cambio a routing dinámico debe ocurrir antes de cargar un catálogo editorial real.

## Backlog P0/P1/P2

### P0

- Definir el árbol mock y un contrato único `folder | article`.
- Eliminar `CategoryList` como filtro permanente.
- Convertir `CategoryPanel` en rail de dominios raíz.
- Implementar breadcrumbs con labels humanos.
- Implementar una rama completa: `Ciencias básicas` → `Microbiología` → `Bacteriología` → `Bacteria overview`.
- Diferenciar visual y semánticamente carpetas y artículos.
- Convertir búsqueda en modo global separado del árbol.
- Eliminar lógicas de "recomendados" o "featured" para enfocar el overview a exploración jerárquica.
- Agregar rutas mock explícitas del recorrido principal.

### P1

- Agregar las ramas `Sistemas` y `Clínica` con los artículos mock existentes.
- Crear cards compactas para catálogos largos.
- Agregar conteos derivados del árbol, no escritos manualmente.
- Mostrar breadcrumbs en resultados de búsqueda.
- Restaurar la última rama después de cerrar búsqueda.
- Adaptar la navegación progresiva a tablet/mobile.
- Reutilizar el árbol en relacionados de la vista de artículo.

### P2

- Migrar a rutas dinámicas cuando el catálogo crezca.
- Agregar colecciones y guardados persistentes.
- Añadir búsqueda full-text, filtros avanzados y ranking.
- Soportar múltiples objetivos de estudio o currículos.
- Conectar contenido editorial real, referencias y multimedia.
- Integrar progreso real y sesiones QBank relacionadas.

## Qué NO implementar todavía

- Copia literal del layout o contenido propietario de AMBOSS.
- Cuatro o más columnas permanentes en todos los viewports.
- Backend, CMS, búsqueda real o persistencia.
- Contenido médico final.
- Colecciones reales, favoritos sincronizados o historial real.
- Personalización por IA.
- Clinical Care, Teaching, auth, admin, pagos o roles.
- Migración a React Router solo para demostrar una rama mock.
- Taxonomía exhaustiva de medicina antes de validar el patrón con una rama completa.

## Dudas reales para implementación

1. Confirmar si los tres dominios raíz serán `Ciencias básicas`, `Sistemas` y `Clínica`; esta decisión define todos los breadcrumbs y mocks siguientes.
2. Definir una ubicación primaria cuando un artículo pertenezca a varias áreas. La recomendación es una sola rama primaria y tags secundarios.
3. Confirmar si el siguiente bloque debe implementar solo la rama completa de Microbiología o también poblar Sistemas y Clínica en la misma pasada.
4. Acordar el máximo de niveles de carpeta. La propuesta asume tres niveles visibles antes del artículo terminal.

