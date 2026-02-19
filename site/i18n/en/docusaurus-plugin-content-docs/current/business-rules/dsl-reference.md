# DSL Reference

Complete reference for the DSL (Domain Specific Language) for business rules in Fyso.

## General Structure

```json
{
  "type": "compute | validate | action",
  "triggers": ["campo1", "campo2"],
  "triggerType": "field_change | before_save | after_save | on_load",
  "compute": { ... },
  "validate": [ ... ],
  "transform": { ... },
  "actions": [ ... ]
}
```

## Compute

Calculates values automatically. Supports several formats:

### Simple Formula (shorthand)

```json
{
  "compute": {
    "total": "cantidad * precio"
  }
}
```

The shorthand is internally normalized to:

```json
{
  "compute": {
    "total": { "type": "formula", "expression": "cantidad * precio" }
  }
}
```

### Explicit Formula

```json
{
  "compute": {
    "iva": { "type": "formula", "expression": "subtotal * 0.21" },
    "total": { "type": "formula", "expression": "subtotal + iva" }
  }
}
```

### Conditional

Calculates a value based on conditions:

```json
{
  "compute": {
    "descuento": {
      "type": "conditional",
      "conditions": [
        { "when": "cantidad >= 100", "then": "0.15" },
        { "when": "cantidad >= 50", "then": "0.10" },
        { "when": "cantidad >= 10", "then": "0.05" }
      ],
      "default": "0"
    }
  }
}
```

### Lookup

Looks up a value in another entity:

```json
{
  "compute": {
    "precio_unitario": {
      "type": "lookup",
      "entity": "productos",
      "matchField": "id",
      "matchValue": "producto_id",
      "resultField": "precio"
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `entity` | string | Entity to search in |
| `matchField` | string | Field in the target entity to match against |
| `matchValue` | string | Field in the current record containing the value to search for |
| `resultField` | string | Field in the target entity whose value to return |

### Aggregate

Aggregates values from multiple records of another entity:

```json
{
  "compute": {
    "total_lineas": {
      "type": "aggregate",
      "entity": "lineas_factura",
      "aggregateOp": "sum",
      "aggregateField": "subtotal",
      "filter": { "factura_id": "id" }
    },
    "cantidad_items": {
      "type": "aggregate",
      "entity": "lineas_factura",
      "aggregateOp": "count",
      "filter": { "factura_id": "id" }
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `entity` | string | Entity to aggregate |
| `aggregateOp` | string | Operation: `"sum"` or `"count"` |
| `aggregateField` | string | Field to sum (required for `sum`) |
| `filter` | object | Filter: `{ target_field: "current_field" }` |

## Validate

Array of validation rules:

```json
{
  "validate": [
    {
      "id": "precio_positivo",
      "condition": "precio > 0",
      "message": "El precio debe ser mayor a cero",
      "severity": "error",
      "field": "precio"
    }
  ]
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the validation |
| `condition` | string | Yes | Boolean expression that must be true |
| `message` | string | Yes | Error message if the condition is false |
| `severity` | string | Yes | `"error"` (blocks save), `"warning"`, `"info"` |
| `field` | string | No | Field to associate the error with in the UI |

## Transform

Transforms field values:

```json
{
  "transform": {
    "nombre": { "type": "uppercase" },
    "email": { "type": "lowercase" },
    "descripcion": { "type": "trim" },
    "precio": { "type": "round", "decimals": 2 }
  }
}
```

| Type | Description |
|------|-------------|
| `uppercase` | Converts to uppercase |
| `lowercase` | Converts to lowercase |
| `trim` | Removes leading and trailing whitespace |
| `round` | Rounds to N decimal places |

## Actions

Side effects that execute after saving:

```json
{
  "actions": [
    {
      "type": "update_related",
      "entity": "pedidos",
      "recordId": "pedido_id",
      "data": {
        "total": {
          "type": "aggregate",
          "entity": "lineas",
          "aggregateOp": "sum",
          "aggregateField": "subtotal",
          "filter": { "pedido_id": "pedido_id" }
        }
      }
    }
  ]
}
```

## Allowed Operators

| Category | Operators |
|----------|-----------|
| Arithmetic | `+`, `-`, `*`, `/` |
| Comparison | `>`, `<`, `>=`, `<=`, `==`, `!=` |
| Logical | `and`, `or` |

## Allowed Functions

| Function | Description | Example |
|----------|-------------|---------|
| `round(x, n)` | Rounds to n decimal places | `round(total, 2)` |
| `coalesce(a, b)` | First non-null value | `coalesce(descuento, 0)` |
| `abs(x)` | Absolute value | `abs(diferencia)` |
| `min(a, b)` | Minimum | `min(stock, pedido)` |
| `max(a, b)` | Maximum | `max(precio, precio_minimo)` |
| `floor(x)` | Round down | `floor(cantidad)` |
| `ceil(x)` | Round up | `ceil(horas)` |
| `len(s)` | String length | `len(nombre)` |
| `upper(s)` | Uppercase | `upper(codigo)` |
| `lower(s)` | Lowercase | `lower(email)` |
| `trim(s)` | Remove whitespace | `trim(nombre)` |
| `now()` | Current date and time | `now()` |
| `today()` | Current date | `today()` |
