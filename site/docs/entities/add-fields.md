# Agregar y gestionar campos

Los campos se pueden agregar al crear la entidad (via `generate_entity`) o despues usando `manage_custom_fields`.

## MCP Tool: `manage_custom_fields`

**Perfil:** advanced

Gestiona campos personalizados de una entidad. Permite listar, agregar, actualizar y eliminar campos creados por el usuario. Los campos custom NO se ven afectados por import/export de metadata.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string | Si | `"list"`, `"add"`, `"update"`, `"delete"` |
| `entityName` | string | Si | Nombre de la entidad |
| `fieldId` | string | Condicional | ID del campo (requerido para update y delete) |
| `type` | string | No | Filtro para list: `"custom"`, `"system"`, `"all"`. Default: `"custom"` |
| `fieldData` | object | Condicional | Datos del campo (requerido para add y update) |

### Listar campos

```
manage_custom_fields({
  action: "list",
  entityName: "clientes",
  type: "all"
})
```

**Respuesta:**

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

### Agregar un campo

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

Para campos con configuracion:

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

**Campos requeridos en fieldData para add:**
- `name` -- Nombre visible
- `fieldKey` -- Clave tecnica (snake_case)
- `fieldType` -- Tipo de dato

### Actualizar un campo

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

**Campos actualizables:** `name`, `description`, `isRequired`, `isUnique`, `isVisible`, `displayOrder`, `config`.

### Eliminar un campo

```
manage_custom_fields({
  action: "delete",
  entityName: "clientes",
  fieldId: "uuid-del-campo"
})
```

Solo se pueden eliminar campos custom (`isSystem=false`). Los campos del sistema estan protegidos.

## Campos del sistema vs custom

| Tipo | Creado por | Editable | Afectado por import/export |
|------|-----------|----------|---------------------------|
| System | `generate_entity` / metadata import | No | Si |
| Custom | `manage_custom_fields` | Si | No |
