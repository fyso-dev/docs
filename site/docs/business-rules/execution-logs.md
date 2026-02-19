# Execution Logs

Execution logs allow you to debug business rules and understand what happened in each execution.

## MCP Tool: `get_rule_logs`

**Profile:** advanced

Gets the execution logs of rules for an entity.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |
| `ruleId` | string | No | Filter by specific rule |
| `limit` | number | No | Maximum logs to return |

### Example

```
get_rule_logs({
  entityName: "facturas",
  limit: 20
})
```

### Information in the Logs

Each log includes:

- Rule that was executed (name and ID)
- Affected record (ID)
- Trigger that fired the execution
- Result: success, failure, or error
- Input and output values
- Timestamp

## MCP Tool: `test_business_rule`

**Profile:** advanced

Tests a rule with test data without affecting real records.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |
| `ruleId` | string | Yes | ID of the rule to test |
| `testData` | object | Yes | Test data |

### Example

```
test_business_rule({
  entityName: "facturas",
  ruleId: "uuid-de-la-regla",
  testData: {
    cantidad: 10,
    precio_unitario: 100,
    iva_pct: 21
  }
})
```

The result shows the calculated values without saving anything to the database.
