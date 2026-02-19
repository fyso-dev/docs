# Publicar entidades

Las entidades en Fyso tienen un ciclo de vida draft/published. Los cambios no son visibles hasta que se publican.

## Flujo de publicacion

1. Crear la entidad con `generate_entity` -- se crea como **draft** (a menos que uses `auto_publish`)
2. Verificar el schema con `get_entity_schema({ version: "draft" })`
3. Publicar con `publish_entity`

Cada publicacion crea una nueva **version** con un mensaje descriptivo.

## MCP Tool: `publish_entity`

**Perfil:** core

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |
| `version_message` | string | Si | Mensaje de version (similar a un commit message) |

### Ejemplo

```
publish_entity({
  entityName: "productos",
  version_message: "Agregar campo precio_con_iva"
})
```

### Respuesta

```json
{
  "success": true,
  "entity": { "name": "productos", "status": "published" },
  "version": 3
}
```

## MCP Tool: `list_entity_changes`

**Perfil:** advanced

Lista el historial de versiones de una entidad.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |

## Auto-publicacion

Al usar `generate_entity` con `auto_publish: true`, la entidad se crea y publica en un solo paso. Requiere `version_message`.

```
generate_entity({
  definition: { ... },
  auto_publish: true,
  version_message: "Version inicial"
})
```
