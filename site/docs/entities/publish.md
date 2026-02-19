# Publish Entities

Entities in Fyso have a draft/published lifecycle. Changes are not visible until they are published.

## Publishing Flow

1. Create the entity with `generate_entity` -- it is created as a **draft** (unless you use `auto_publish`)
2. Verify the schema with `get_entity_schema({ version: "draft" })`
3. Publish with `publish_entity`

Each publication creates a new **version** with a descriptive message.

## MCP Tool: `publish_entity`

**Profile:** core

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |
| `version_message` | string | Yes | Version message (similar to a commit message) |

### Example

```
publish_entity({
  entityName: "productos",
  version_message: "Agregar campo precio_con_iva"
})
```

### Response

```json
{
  "success": true,
  "entity": { "name": "productos", "status": "published" },
  "version": 3
}
```

## MCP Tool: `list_entity_changes`

**Profile:** advanced

Lists the version history of an entity.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity name |

## Auto-publishing

When using `generate_entity` with `auto_publish: true`, the entity is created and published in a single step. Requires `version_message`.

```
generate_entity({
  definition: { ... },
  auto_publish: true,
  version_message: "Version inicial"
})
```
