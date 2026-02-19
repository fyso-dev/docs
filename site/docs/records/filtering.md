# Filters

Fyso supports simple filters in `query_records` and field-based filters in the REST API.

## Filters in MCP (query_records)

The `filter` parameter accepts an expression with the format:

```
field operator value
```

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals (case-insensitive) | `estado = activo` |
| `!=` | Not equal | `estado != inactivo` |
| `>` | Greater than (numeric) | `precio > 1000` |
| `<` | Less than (numeric) | `stock < 10` |
| `>=` | Greater than or equal | `total >= 500` |
| `<=` | Less than or equal | `descuento <= 20` |
| `contains` | Contains text (case-insensitive) | `nombre contains juan` |

### Examples

```
query_records({ entityName: "productos", filter: "precio > 100" })
query_records({ entityName: "clientes", filter: "nombre contains perez" })
query_records({ entityName: "facturas", filter: "estado = pagada" })
```

### Notes

- The filter is applied in memory after fetching the records (except for semantic search)
- String values do not need quotes, but they are supported: `nombre = "Juan Perez"`
- Numeric comparisons (`>`, `<`, `>=`, `<=`) convert values to numbers

## Filters in REST API

The REST API supports field-based filters using query parameters:

```
GET /api/entities/{entityName}/records?filter.estado=activo&filter.ciudad=buenos+aires
```

It also supports full-text search:

```
GET /api/entities/{entityName}/records?search=juan+perez
```

## Semantic Search

Semantic search uses vectors to find records by meaning similarity, not by exact text match.

```
query_records({
  entityName: "productos",
  semantic: "algo para sentarse en la oficina",
  minSimilarity: 0.6,
  limit: 10
})
```

When using `semantic`, the simple filter can be combined to post-filter the results.
