# Relations

Relations connect records from different entities using `relation` type fields.

## Create a Relation

When defining a `relation` type field, the related entity is specified:

```
generate_entity({
  definition: {
    entity: { name: "facturas" },
    fields: [
      {
        name: "Cliente",
        fieldKey: "cliente_id",
        fieldType: "relation",
        config: { relatedEntity: "clientes" }
      }
    ]
  }
})
```

## Storage

The relation field stores the UUID of the related record:

```json
{
  "cliente_id": "6bd2d1db-d104-4a15-977a-a759c38608a9"
}
```

## Resolving Relations

When querying records, relations can be expanded with `resolve`:

### MCP

`query_records` resolves relations automatically (uses `resolve=true` internally).

### REST API

```
GET /api/entities/facturas/records?resolve=true
GET /api/entities/facturas/records/{id}?resolve=true
```

Without resolve, the field shows only the UUID. With resolve, it expands to the full object:

**Without resolve:**
```json
{
  "cliente_id": "6bd2d1db-..."
}
```

**With resolve:**
```json
{
  "cliente_id": {
    "id": "6bd2d1db-...",
    "data": {
      "nombre": "Juan Perez",
      "email": "juan@example.com"
    }
  }
}
```

## Create Records with Relations

When creating a record, pass the UUID of the related record:

```
create_record({
  entityName: "facturas",
  data: {
    numero: "FAC-001",
    cliente_id: "6bd2d1db-d104-4a15-977a-a759c38608a9",
    fecha: "2026-02-18",
    total: 1500
  }
})
```

## Relations in Business Rules

Rules can use lookups to access data from related entities:

```json
{
  "type": "compute",
  "triggers": ["cliente_id"],
  "compute": {
    "cliente_nombre": {
      "type": "lookup",
      "entity": "clientes",
      "matchField": "id",
      "matchValue": "cliente_id",
      "resultField": "nombre"
    }
  }
}
```
