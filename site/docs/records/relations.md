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

## Has-Many Relations

A `has_many` field defines a reverse one-to-many relationship. Instead of storing a foreign key, it declares that another entity has records pointing back to this one.

### Define a has_many field

```
generate_entity({
  definition: {
    entity: { name: "facturas" },
    fields: [
      {
        name: "Lineas",
        fieldKey: "lineas",
        fieldType: "has_many",
        config: {
          relatedEntity: "lineas_factura",
          foreignKey: "factura_id"
        }
      }
    ]
  }
})
```

This declares: "each factura has many lineas_factura where `lineas_factura.factura_id` points to this factura."

### Resolving has_many

When you query a record with `resolve=true`, the `has_many` field is populated with an array of related records:

```
GET /api/entities/facturas/records/{id}?resolve=true
```

```json
{
  "id": "uuid-factura",
  "data": {
    "numero": "FAC-001",
    "lineas": [
      {
        "id": "uuid-linea-1",
        "data": { "producto": "Widget A", "cantidad": 3, "precio": 100 }
      },
      {
        "id": "uuid-linea-2",
        "data": { "producto": "Widget B", "cantidad": 1, "precio": 250 }
      }
    ]
  }
}
```

### Nested resolution with resolve_depth

Control how deep nested relations are resolved:

```
GET /api/entities/facturas/records/{id}?resolve=true&resolve_depth=2
```

With `resolve_depth=2`, if a `linea_factura` itself has a `relation` field pointing to `productos`, that relation is also resolved.

### Permission-aware resolution

Cascading resolution respects RBAC permissions per entity:

| Permission | Behavior |
|------------|----------|
| No `read` permission on related entity | Field is omitted entirely from the response |
| `rowFilter` on related entity | Only matching related records are returned |
| `fields` whitelist on related entity | Only whitelisted fields appear in related records |
| `excludeFields` blocklist on related entity | Listed fields are stripped from related records |

This means different users can see different related data based on their role configuration.

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
