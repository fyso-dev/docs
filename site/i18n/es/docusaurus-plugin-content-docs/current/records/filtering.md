# Filtros

Fyso soporta filtros simples en `query_records` y filtros por campo en la REST API.

## Filtros en MCP (query_records)

El parametro `filter` acepta una expresion con el formato:

```
campo operador valor
```

### Operadores

| Operador | Descripcion | Ejemplo |
|----------|-------------|---------|
| `=` | Igual (case-insensitive) | `estado = activo` |
| `!=` | Distinto | `estado != inactivo` |
| `>` | Mayor que (numerico) | `precio > 1000` |
| `<` | Menor que (numerico) | `stock < 10` |
| `>=` | Mayor o igual | `total >= 500` |
| `<=` | Menor o igual | `descuento <= 20` |
| `contains` | Contiene texto (case-insensitive, sensible a tildes) | `nombre contains juan` |

### Ejemplos

```
query_records({ entityName: "productos", filter: "precio > 100" })
query_records({ entityName: "clientes", filter: "nombre contains perez" })
query_records({ entityName: "facturas", filter: "estado = pagada" })
```

### Comportamiento de `contains`

`contains` se ejecuta como una consulta `ILIKE` de PostgreSQL contra el valor almacenado en el campo.

**Sensibilidad a mayusculas:** `contains cafe` encuentra `Cafe`, `CAFE` y `cafe`. Las mayusculas se ignoran.

**Sensibilidad a tildes:** `ILIKE` no normaliza Unicode. `contains cafe` **no** encuentra `Café`. Para encontrar registros con tildes, incluir la tilde en el valor de busqueda: `nombre contains Café`.

**Coincidencias parciales:** el valor se busca en cualquier posicion del campo. `contains an` encuentra `Juan`, `Ana` y `Mariana`.

### Notas

- Los valores string no necesitan comillas, pero se soportan: `nombre = "Juan Perez"`
- Las comparaciones numericas (`>`, `<`, `>=`, `<=`) convierten los valores a numero
- Los filtros `contains` y `startsWith` se ejecutan como consultas en base de datos (lado servidor). El resto de operadores tambien se ejecutan lado servidor al usar la sintaxis de expresion `filters=`

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
