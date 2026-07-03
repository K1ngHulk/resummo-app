# Articulos Finales

Esta carpeta concentra los entregables finales listos para consulta rapida, sin depender de la estructura operativa de `content-pipeline`.

## Ruta canonica

`docs/articulos_finales/`

## Objetivo

- Separar los entregables finales del flujo de produccion.
- Mantener una ubicacion estable para consulta humana y busqueda futura.
- Estandarizar nombres, categorias y metadatos minimos.

## Estructura

Cada articulo final debe guardarse con esta jerarquia:

```text
docs/articulos_finales/
  <especialidad>/
    <subcategoria>/
      <slug_articulo>/
        <slug_articulo>__ficha_final__YYYY-MM-DD.md
        metadata.json
```

## Nomenclatura estandar

- Carpetas: minusculas, ASCII, separadas por guiones bajos solo si es necesario.
- `slug_articulo`: nombre clinico corto y estable en minusculas.
- Archivo final: `<slug_articulo>__ficha_final__YYYY-MM-DD.md`
- Metadatos: `metadata.json`

## Catalogacion minima

Cada articulo depositado debe registrarse tambien en `catalogo_articulos.md` con:

- titulo
- slug
- especialidad
- subcategoria
- tipo de pieza
- fecha de deposito
- ruta final
- fuente de origen
- palabras clave
- estado editorial

## Articulo inicial cargado

- Dengue
  - especialidad: `infectologia`
  - subcategoria: `arbovirosis`
  - ruta final: `docs/articulos_finales/infectologia/arbovirosis/dengue/dengue__ficha_final__2026-07-01.md`
