# Filtros

Fyso soporta filtros simples y compuestos en `query_records` y filtros por campo en la REST API.

## Filtros en MCP (query_records)

El parametro `filter` acepta una expresion simple o compuesta.

### Filtro simple

```
campo operador valor
```

### Filtro compuesto (AND/OR)

Se pueden combinar condiciones con `AND` y `OR`. `AND` tiene precedencia sobre `OR` (comportamiento estandar de algebra booleana).

```
status = active AND category = food
status = active OR status = pending
category = tech AND status = active OR status = pending
```

La ultima expresion se evalua como `(category = tech AND status = active) OR (status = pending)`.

### Operadores

| Operador | Descripcion | Ejemplo |
|----------|-------------|---------|
| `=` | Igual (case-insensitive) | `estado = activo` |
| `!=` | Distinto | `estado != inactivo` |
| `>` | Mayor que | `precio > 1000` |
| `<` | Menor que | `stock < 10` |
| `>=` | Mayor o igual | `total >= 500` |
| `<=` | Menor o igual | `descuento <= 20` |
| `contains` | Contiene texto (case-insensitive) | `nombre contains juan` |

### Ejemplos

```
query_records({ entityName: "productos", filter: "precio > 100" })
query_records({ entityName: "clientes", filter: "nombre contains perez" })
query_records({ entityName: "facturas", filter: "estado = pagada" })
query_records({ entityName: "ordenes", filter: "estado = activo AND categoria = ropa" })
query_records({ entityName: "eventos", filter: "fecha >= 2026-02-01 AND fecha <= 2026-02-28" })
query_records({ entityName: "productos", filter: "stock < 5 OR estado = agotado" })
```

### Notas

- Los valores string no necesitan comillas, pero se soportan: `nombre = "Juan Perez"`
- Las comparaciones con fechas (`>`, `<`, `>=`, `<=`) reconocen el formato `YYYY-MM-DD`
- Las comparaciones numericas convierten los valores a numero automaticamente
- Retrocompatible: filtros simples sin AND/OR funcionan igual que antes

## Relaciones anidadas: `resolve_depth`

El parametro `resolve_depth` controla cuantos niveles de relaciones se resuelven al consultar registros.

| Valor | Comportamiento |
|-------|----------------|
| `1` (default) | Resolucion de primer nivel (comportamiento anterior) |
| `2` | Resuelve relaciones dentro de los registros relacionados |
| `3` | Resolucion de tercer nivel (maximo) |

```
query_records({
  entityName: "pedidos",
  resolve: true,
  resolve_depth: 2
})
```

Con `resolve_depth: 2`, si `pedidos` tiene un campo `cliente` (relacion a `clientes`), y `clientes` tiene un campo `ciudad` (relacion a `ciudades`), el registro retornado incluira el objeto completo de `ciudad` dentro del objeto de `cliente`.

## Filtros en REST API

La REST API soporta filtros por campo usando query parameters:

```
GET /api/entities/{entityName}/records?filter.estado=activo&filter.ciudad=buenos+aires
```

Tambien soporta busqueda full-text:

```
GET /api/entities/{entityName}/records?search=juan+perez
```

## Busqueda semantica

La busqueda semantica usa vectores para encontrar registros por similitud de significado, no por coincidencia exacta de texto.

```
query_records({
  entityName: "productos",
  semantic: "algo para sentarse en la oficina",
  minSimilarity: 0.6,
  limit: 10
})
```

Cuando se usa `semantic`, el filtro simple se puede combinar para post-filtrar los resultados.
