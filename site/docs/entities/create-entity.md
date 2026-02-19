# Crear entidades

Una entidad define la estructura de datos de tu aplicacion. Es equivalente a una tabla.

## MCP Tool: `generate_entity`

**Perfil:** core

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `definition` | object | Si | Estructura de la entidad y sus campos |
| `auto_publish` | boolean | No | Publicar automaticamente (default: false) |
| `version_message` | string | Condicional | Requerido si `auto_publish=true` |

### Estructura de `definition`

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

### Propiedades de `entity`

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `name` | string | Si | Nombre tecnico (snake_case) |
| `displayName` | string | No | Nombre visible. Default: `name` |
| `description` | string | No | Descripcion de la entidad |
| `icon` | string | No | Icono. Default: `"box"` |

### Propiedades de cada `field`

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `name` | string | Si | Nombre visible del campo |
| `fieldKey` | string | Si | Clave tecnica (snake_case, unico) |
| `fieldType` | string | Si | Tipo de dato (ver [Tipos de campo](field-types.md)) |
| `isRequired` | boolean | No | Obligatorio. Default: false |
| `isUnique` | boolean | No | Valor unico. Default: false |
| `description` | string | No | Descripcion del campo |
| `config` | object | No | Configuracion especifica del tipo |

### Ejemplo completo

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

### Respuesta exitosa

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

**Perfil:** core

Lista las entidades del tenant. Por defecto solo muestra las publicadas.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `include_drafts` | boolean | No | Incluir borradores. Default: false |

### Ejemplo

```
list_entities({ include_drafts: true })
```

### Respuesta

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

**Perfil:** core

Obtiene la definicion completa de una entidad, incluyendo hints de estructura para tipos complejos (location, file, select).

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |
| `version` | string | No | Version: numero, `"draft"`, o `"published"` (default) |

### Ejemplo

```
get_entity_schema({ entityName: "clientes", version: "published" })
```

### Respuesta

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

**Perfil:** advanced

Elimina una entidad y todos sus registros. Esta accion no se puede deshacer.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad a eliminar |
