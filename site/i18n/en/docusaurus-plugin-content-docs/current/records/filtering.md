# Filters

Fyso supports simple and compound filters in `query_records` and field-based filters in the REST API.

## Filters in MCP (query_records)

The `filter` parameter accepts a simple or compound expression.

### Simple filter

```
field operator value
```

### Compound filter (AND/OR)

Conditions can be combined with `AND` and `OR`. `AND` takes precedence over `OR` (standard boolean algebra).

```
status = active AND category = food
status = active OR status = pending
category = tech AND status = active OR status = pending
```

The last expression evaluates as `(category = tech AND status = active) OR (status = pending)`.

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals (case-insensitive) | `status = active` |
| `!=` | Not equal | `status != inactive` |
| `>` | Greater than | `price > 1000` |
| `<` | Less than | `stock < 10` |
| `>=` | Greater than or equal | `total >= 500` |
| `<=` | Less than or equal | `discount <= 20` |
| `contains` | Contains text (case-insensitive) | `name contains john` |

### Examples

```
query_records({ entityName: "products", filter: "price > 100" })
query_records({ entityName: "clients", filter: "name contains smith" })
query_records({ entityName: "orders", filter: "status = active AND category = clothing" })
query_records({ entityName: "events", filter: "date >= 2026-02-01 AND date <= 2026-02-28" })
query_records({ entityName: "products", filter: "stock < 5 OR status = out_of_stock" })
```

### Notes

- String values do not need quotes, but they are supported: `name = "John Smith"`
- Date comparisons (`>`, `<`, `>=`, `<=`) recognize the `YYYY-MM-DD` format
- Numeric comparisons convert values to numbers automatically
- Backward compatible: simple filters without AND/OR work exactly as before

## Nested relations: `resolve_depth`

The `resolve_depth` parameter controls how many levels of relations are resolved when querying records.

| Value | Behavior |
|-------|----------|
| `1` (default) | First-level resolution (previous behavior) |
| `2` | Resolves relations within related records |
| `3` | Third-level resolution (maximum) |

```
query_records({
  entityName: "orders",
  resolve: true,
  resolve_depth: 2
})
```

With `resolve_depth: 2`, if `orders` has a `client` field (relation to `clients`), and `clients` has a `city` field (relation to `cities`), the returned record will include the full `city` object inside the `client` object.

## Filters in REST API

The REST API supports field-based filters using query parameters:

```
GET /api/entities/{entityName}/records?filter.status=active&filter.city=new+york
```

It also supports full-text search:

```
GET /api/entities/{entityName}/records?search=john+smith
```

## Semantic Search

Semantic search uses vectors to find records by meaning similarity, not by exact text match.

```
query_records({
  entityName: "products",
  semantic: "something to sit on in the office",
  minSimilarity: 0.6,
  limit: 10
})
```

When using `semantic`, the simple filter can be combined to post-filter the results.
