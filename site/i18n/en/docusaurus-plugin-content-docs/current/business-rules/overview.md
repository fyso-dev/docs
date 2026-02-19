# Business Rules

Business rules automate logic over data: computations, validations, and actions.

## Rule Types

### compute

Calculates fields automatically when other fields change.

```json
{
  "type": "compute",
  "triggers": ["cantidad", "precio"],
  "compute": {
    "total": "cantidad * precio"
  }
}
```

### validate

Validates data before saving the record. If the validation fails, the save is rejected.

```json
{
  "type": "validate",
  "triggers": ["precio"],
  "validate": [{
    "id": "precio_positivo",
    "condition": "precio > 0",
    "message": "El precio debe ser positivo",
    "severity": "error"
  }]
}
```

### action

Executes side effects after saving (e.g., update related records).

```json
{
  "type": "action",
  "triggerType": "after_save",
  "triggers": ["subtotal"],
  "actions": [{
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
  }]
}
```

## Lifecycle

Rules have the same draft/published lifecycle as entities:

1. Created as a **draft**
2. Published with `publish_business_rule`
3. Only published rules are executed

## Trigger Types

| Type | When it executes |
|------|-----------------|
| `field_change` | When one of the trigger fields changes (default) |
| `before_save` | Before saving the record |
| `after_save` | After saving the record |
| `on_load` | When loading the record |

## Related MCP Tools

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_business_rule` | core | Create rule (via DSL or prompt) |
| `create_business_rule` | advanced | Create rule with direct DSL |
| `list_business_rules` | core | List rules for an entity |
| `get_business_rule` | advanced | View rule details |
| `test_business_rule` | advanced | Test a rule with test data |
| `publish_business_rule` | core | Publish a draft rule |
| `delete_business_rule` | advanced | Delete a rule |
| `get_rule_logs` | advanced | View execution logs |
