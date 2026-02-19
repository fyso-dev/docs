# Add and Manage Fields

Fields can be added when creating the entity (via `generate_entity`) or afterwards using `manage_custom_fields`.

## MCP Tool: `manage_custom_fields`

**Profile:** advanced

Manages custom fields of an entity. Allows listing, adding, updating, and deleting user-created fields. Custom fields are NOT affected by metadata import/export.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `"list"`, `"add"`, `"update"`, `"delete"` |
| `entityName` | string | Yes | Entity name |
| `fieldId` | string | Conditional | Field ID (required for update and delete) |
| `type` | string | No | Filter for list: `"custom"`, `"system"`, `"all"`. Default: `"custom"` |
| `fieldData` | object | Conditional | Field data (required for add and update) |

### List fields

```
manage_custom_fields({
  action: "list",
  entityName: "clientes",
  type: "all"
})
```

**Response:**

```json
{
  "success": true,
  "entity": "clientes",
  "filter": "all",
  "count": 5,
  "fields": [
    {
      "id": "uuid",
      "name": "Nombre",
      "fieldKey": "nombre",
      "fieldType": "text",
      "isSystem": false,
      "isRequired": true,
      "description": "Nombre del cliente",
      "config": {}
    }
  ]
}
```

### Add a field

```
manage_custom_fields({
  action: "add",
  entityName: "clientes",
  fieldData: {
    name: "Direccion",
    fieldKey: "direccion",
    fieldType: "text",
    description: "Direccion del cliente",
    isRequired: false
  }
})
```

For fields with configuration:

```
manage_custom_fields({
  action: "add",
  entityName: "clientes",
  fieldData: {
    name: "Estado",
    fieldKey: "estado",
    fieldType: "select",
    config: {
      options: ["activo", "inactivo", "suspendido"]
    }
  }
})
```

**Required fields in fieldData for add:**
- `name` -- Display name
- `fieldKey` -- Technical key (snake_case)
- `fieldType` -- Data type

### Update a field

```
manage_custom_fields({
  action: "update",
  entityName: "clientes",
  fieldId: "uuid-del-campo",
  fieldData: {
    name: "Nombre completo",
    isRequired: true,
    description: "Nombre y apellido del cliente"
  }
})
```

**Updatable fields:** `name`, `description`, `isRequired`, `isUnique`, `isVisible`, `displayOrder`, `config`.

### Delete a field

```
manage_custom_fields({
  action: "delete",
  entityName: "clientes",
  fieldId: "uuid-del-campo"
})
```

Only custom fields (`isSystem=false`) can be deleted. System fields are protected.

## System vs Custom fields

| Type | Created by | Editable | Affected by import/export |
|------|-----------|----------|---------------------------|
| System | `generate_entity` / metadata import | No | Yes |
| Custom | `manage_custom_fields` | Yes | No |
