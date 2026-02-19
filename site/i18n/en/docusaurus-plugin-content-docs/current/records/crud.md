# Record CRUD

Basic operations on records: create, read, update, and delete.

## Record Structure

Entity fields are stored inside `data`:

```json
{
  "id": "6bd2d1db-d104-4a15-977a-a759c38608a9",
  "entityId": "79d376b6-b00d-4d07-83b6-62276bc57fee",
  "name": "Test Company S.L.",
  "data": {
    "nombre": "Test Company S.L.",
    "email": "test@company.com",
    "phone": "+34 912345678"
  },
  "createdAt": "2026-02-03T12:51:15.352Z",
  "updatedAt": "2026-02-03T12:51:15.352Z"
}
```

**Important:** Access fields via `record.data.email`, NOT `record.email`.

---

## create_record

**Profile:** core

Creates a new record in an entity.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |
| `data` | object | Yes | Record data (entity fields) |

### Example

```
create_record({
  entityName: "clientes",
  data: {
    nombre: "Maria Lopez",
    email: "maria@example.com",
    telefono: "+54 11 9876-5432",
    estado: "activo"
  }
})
```

### Response

```json
{
  "success": true,
  "message": "Record created in clientes",
  "record": {
    "id": "uuid-del-registro",
    "nombre": "Maria Lopez",
    "email": "maria@example.com",
    "telefono": "+54 11 9876-5432",
    "estado": "activo"
  }
}
```

Use `get_entity_schema` first to know the required fields.

---

## query_records

**Profile:** core

Queries records from an entity with filters, pagination, sorting, and semantic search.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |
| `filter` | string | No | Simple filter (see [Filters](filtering.md)) |
| `limit` | number | No | Maximum records. Default: 50, max: 200 |
| `offset` | number | No | Offset for pagination |
| `orderBy` | string | No | Field to sort by |
| `orderDir` | string | No | Direction: `"asc"` or `"desc"` |
| `semantic` | string | No | Natural language semantic search |
| `minSimilarity` | number | No | Similarity threshold (0-1) for semantic search |

### Basic Example

```
query_records({
  entityName: "clientes",
  limit: 20,
  orderBy: "nombre",
  orderDir: "asc"
})
```

### Example with Filter

```
query_records({
  entityName: "clientes",
  filter: "estado = activo",
  limit: 10
})
```

### Example with Semantic Search

```
query_records({
  entityName: "productos",
  semantic: "muebles de oficina modernos",
  minSimilarity: 0.7,
  limit: 5
})
```

### Response

```json
{
  "entityName": "clientes",
  "total": 3,
  "records": [
    {
      "id": "uuid",
      "nombre": "Maria Lopez",
      "email": "maria@example.com",
      "estado": "activo"
    }
  ]
}
```

For semantic search, each record includes a `similarity` field with the score.

---

## update_record

**Profile:** core

Updates an existing record. Only send the fields to modify (partial update).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |
| `recordId` | string | Yes | Record ID |
| `data` | object | Yes | Fields to update |

### Example

```
update_record({
  entityName: "clientes",
  recordId: "uuid-del-registro",
  data: {
    estado: "inactivo",
    email: "maria.nueva@example.com"
  }
})
```

### Response

```json
{
  "success": true,
  "message": "Record uuid-del-registro updated",
  "record": {
    "id": "uuid-del-registro",
    "nombre": "Maria Lopez",
    "email": "maria.nueva@example.com",
    "estado": "inactivo"
  }
}
```

---

## delete_record

**Profile:** core

Deletes a record. This action cannot be undone.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |
| `recordId` | string | Yes | Record ID |

### Example

```
delete_record({
  entityName: "clientes",
  recordId: "uuid-del-registro"
})
```

### Response

```json
{
  "success": true,
  "message": "Record uuid-del-registro deleted from clientes",
  "deleted": true
}
```
