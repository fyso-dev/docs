# Create Entities

An entity defines the data structure of your application. It is equivalent to a table.

## MCP Tool: `generate_entity`

**Profile:** core

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `definition` | object | Yes | Structure of the entity and its fields |
| `auto_publish` | boolean | No | Publish automatically (default: false) |
| `version_message` | string | Conditional | Required if `auto_publish=true` |

### Structure of `definition`

```json
{
  "entity": {
    "name": "productos",
    "displayName": "Productos",
    "description": "Catalogo de productos",
    "icon": "box"
  },
  "fields": [
    {
      "name": "Nombre",
      "fieldKey": "nombre",
      "fieldType": "text",
      "isRequired": true,
      "isUnique": false,
      "description": "Nombre del producto",
      "config": {}
    }
  ]
}
```

### Properties of `entity`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Technical name (snake_case) |
| `displayName` | string | No | Display name. Default: `name` |
| `description` | string | No | Entity description |
| `icon` | string | No | Icon. Default: `"box"` |

### Properties of each `field`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Display name of the field |
| `fieldKey` | string | Yes | Technical key (snake_case, unique) |
| `fieldType` | string | Yes | Data type (see [Field Types](field-types.md)) |
| `isRequired` | boolean | No | Required. Default: false |
| `isUnique` | boolean | No | Unique value. Default: false |
| `description` | string | No | Field description |
| `config` | object | No | Type-specific configuration |

### Full Example

```
generate_entity({
  definition: {
    entity: {
      name: "facturas",
      displayName: "Facturas",
      description: "Facturas de venta",
      icon: "file-text"
    },
    fields: [
      { name: "Numero", fieldKey: "numero", fieldType: "text", isRequired: true, isUnique: true },
      { name: "Cliente", fieldKey: "cliente_id", fieldType: "relation", config: { relatedEntity: "clientes" } },
      { name: "Fecha", fieldKey: "fecha", fieldType: "date", isRequired: true },
      { name: "Estado", fieldKey: "estado", fieldType: "select", config: { options: ["borrador", "emitida", "pagada", "anulada"] } },
      { name: "Total", fieldKey: "total", fieldType: "number" },
      { name: "Archivo PDF", fieldKey: "pdf_documento", fieldType: "file" }
    ]
  },
  auto_publish: true,
  version_message: "Crear entidad facturas"
})
```

### Successful Response

```json
{
  "success": true,
  "message": "Entity \"facturas\" created successfully",
  "fieldsProcessed": 6,
  "entity": {
    "name": "facturas",
    "displayName": "Facturas",
    "description": "Facturas de venta",
    "fields": [
      { "name": "Numero", "fieldKey": "numero", "type": "text", "required": true },
      { "name": "Cliente", "fieldKey": "cliente_id", "type": "relation", "required": false }
    ]
  }
}
```

## MCP Tool: `list_entities`

**Profile:** core

Lists the entities of the tenant. By default, only shows published ones.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `include_drafts` | boolean | No | Include drafts. Default: false |

### Example

```
list_entities({ include_drafts: true })
```

### Response

```json
[
  {
    "name": "clientes",
    "displayName": "Clientes",
    "description": "Base de clientes",
    "fieldCount": 5,
    "status": "published",
    "version": 2
  }
]
```

## MCP Tool: `get_entity_schema`

**Profile:** core

Gets the full definition of an entity, including structure hints for complex types (location, file, select).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |
| `version` | string | No | Version: number, `"draft"`, or `"published"` (default) |

### Example

```
get_entity_schema({ entityName: "clientes", version: "published" })
```

### Response

```json
{
  "name": "clientes",
  "displayName": "Clientes",
  "description": "Base de clientes",
  "version": 2,
  "status": "published",
  "fields": [
    {
      "name": "Nombre",
      "fieldKey": "nombre",
      "type": "text",
      "required": true,
      "isSystem": false,
      "description": "Nombre del cliente",
      "config": {}
    },
    {
      "name": "Ubicacion",
      "fieldKey": "ubicacion",
      "type": "location",
      "required": false,
      "isSystem": false,
      "config": { "displayFormat": "both" },
      "structureHint": {
        "format": "{ lat: number, lng: number, address?: string, city?: string, country?: string }",
        "description": "Geographic location with coordinates and optional address components",
        "configOptions": {
          "displayFormat": "\"map\" | \"text\" | \"both\" (default: \"both\")",
          "defaultZoom": "number 1-20 (default: 13)",
          "defaultCenter": "{ lat: number, lng: number }"
        }
      }
    }
  ]
}
```

## MCP Tool: `delete_entity`

**Profile:** advanced

Deletes an entity and all its records. This action cannot be undone.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Name of the entity to delete |
