# Import / Export Metadata

Export and import the structure (entities, fields, rules) of a tenant.

## MCP Tool: `export_metadata`

**Profile:** core

Exports the metadata of the current tenant to a JSON.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantId` | string | No | Tenant ID or slug. Default: selected tenant |

### Example

```
export_metadata()
```

### Response

Returns a JSON with the complete structure:

```json
{
  "entities": [
    {
      "name": "clientes",
      "displayName": "Clientes",
      "fields": [...],
      "rules": [...]
    }
  ],
  "version": "1.0",
  "exportedAt": "2026-02-18T10:00:00Z"
}
```

## MCP Tool: `import_metadata`

**Profile:** core

Imports metadata from a JSON into a tenant.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metadata` | string | Yes | JSON string with the metadata to import |
| `tenantId` | string | No | Destination tenant ID or slug. Default: selected tenant |

### Example

```
import_metadata({
  metadata: '{"entities":[...],"version":"1.0"}'
})
```

### Notes

- The import creates entities and system fields (`isSystem=true`)
- Custom fields (`isSystem=false`) created with `manage_custom_fields` are NOT affected
- If an entity already exists, its system fields are updated
- Business rules are imported as drafts

## Use Cases

- **Migrate between tenants** -- export from one, import into another
- **Structure backup** -- export periodically
- **Templates** -- create a model tenant and export to replicate
- **Publish as app** -- `publish_app` uses export_metadata internally
