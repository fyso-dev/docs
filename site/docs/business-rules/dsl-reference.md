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

Side effects that execute after saving. Actions run sequentially and can share data through the [execution context](#execution-context).

### `update_related`

Updates a record in a different entity:

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

### `update_record`

Updates fields on the current record. Unlike `update_related`, this does not require `entity` or `recordId` — it targets the record that triggered the rule.

```json
{
  "type": "update_record",
  "fields": {
    "estado": "aprobado",
    "aprobado_por": "$ctx.approver_name"
  }
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `fields` | object | Yes | Field→value pairs to set on the current record |

Values can reference execution context variables using `$ctx.*` syntax. This is useful for chaining actions — for example, storing an AI classification result and then writing it back to the record.

### `ai_call`

Invokes an AI model as a rule action. Useful for classification, extraction, summarization, or any text generation task triggered by record changes.

```json
{
  "type": "ai_call",
  "prompt": "Classify this support ticket: {{descripcion}}",
  "system_prompt": "You are a ticket classifier. Respond with exactly one of: bug, feature, question",
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "max_tokens": 100,
  "store_result_as": "$ctx.classification"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `prompt` | string | Yes (unless `prompt_template`) | The prompt to send. Supports `{{field}}` substitution from the current record. |
| `prompt_template` | string | No | Slug of a reusable prompt template (resolves from `_fyso_ai_templates`) |
| `system_prompt` | string | No | System prompt for the AI call |
| `system_prompt_template` | string | No | Slug of a system prompt template |
| `model` | string | No | Override model. Uses the tenant default if omitted. |
| `temperature` | number | No | 0–2. Uses the provider default if omitted. |
| `max_tokens` | number | No | 1–32000 |
| `store_result_as` | string | No | Store the AI response in execution context. Must follow the format `$ctx.<identifier>`. |

**Guardrails:**

- A budget check runs before every AI call. If the tenant has exhausted its AI budget, the call is skipped.
- A rate limit check runs before the budget check.
- Failures are captured as `error` validations — the pipeline continues with remaining actions.
- All calls are logged to `_fyso_ai_call_logs`.

### `webhook_send`

Sends an HTTP POST request to an external URL. Useful for notifications, integrations, and event forwarding.

```json
{
  "type": "webhook_send",
  "url": "https://hooks.example.com/notify",
  "headers": {
    "X-Api-Key": "my-token"
  },
  "payload": {
    "ticket_id": "id",
    "status": "estado",
    "customer": "nombre_cliente"
  },
  "timeoutMs": 5000
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `url` | string | Yes | Destination URL. Supports `{{field}}` templates. SSRF protection enforced. |
| `headers` | object | No | Custom HTTP headers. Supports `{{field}}` templates. |
| `payload` | object | No | Key→value payload. Values resolve from the current record at fire time. `_record_id` is injected automatically. |
| `timeoutMs` | number | No | 100–30000 ms (default: 5000) |

**Behavior:**

- Always sends a `POST` request with a JSON body.
- 1 automatic retry on failure (fire-and-forget — does not block the rule pipeline).
- SSRF filter blocks private/internal IPs both at rule save time and at execution time.

## Execution Context

Business rules can share data between actions using the **execution context** (`$ctx`). This is how you chain actions together — for example, calling an AI model and then writing the result back to the record.

The flow:

1. An `ai_call` action stores its result via `store_result_as: "$ctx.classification"`.
2. A subsequent `update_record` action references `$ctx.classification` in its `fields`.

```json
{
  "actions": [
    {
      "type": "ai_call",
      "prompt": "Classify: {{descripcion}}",
      "system_prompt": "Respond with one of: bug, feature, question",
      "store_result_as": "$ctx.classification"
    },
    {
      "type": "update_record",
      "fields": {
        "categoria": "$ctx.classification"
      }
    }
  ]
}
```

Context variables are scoped to a single rule execution. They do not persist across separate rule triggers.

## Optimistic Locking

All records include a `_record_version` field in API responses. When you update a record via the API and include `_record_version` in the payload, the server checks that the version matches the stored value. If it doesn't match (another update happened in between), the request is rejected with a version conflict error.

Actions triggered by business rules (`update_related`, `update_record`) bypass the version check to avoid conflicts during automated processing.

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
