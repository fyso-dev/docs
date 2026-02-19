# Apps (Catalog)

Fyso allows publishing a tenant as an installable app. Other users can install a copy of the app in their own tenant.

## Flow

1. Design the app (entities, fields, rules) in a tenant
2. Publish with `publish_app` -- exports the metadata and registers it in the catalog
3. Share the installation link
4. Other users install the app -- the metadata is imported into their tenant

## MCP Tool: `publish_app`

**Profile:** core

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Display name (e.g., "CRM Taller Pro") |
| `slug` | string | Yes | URL identifier (e.g., `"crm-taller-pro"`). Only lowercase letters, numbers, and hyphens |
| `description` | string | No | Short description |
| `icon` | string | No | Emoji or icon identifier |

### Example

```
publish_app({
  name: "Sistema de Turnos",
  slug: "sistema-turnos",
  description: "Gestion de turnos para profesionales de salud",
  icon: "calendar"
})
```

## MCP Tool: `update_app`

**Profile:** core

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | App slug |
| `name` | string | No | New name |
| `description` | string | No | New description |
| `icon` | string | No | New icon |
| `refreshMetadata` | boolean | No | Re-export metadata from the current tenant to the app |

Use `refreshMetadata: true` after modifying entities or rules to update the published app.

```
update_app({
  slug: "sistema-turnos",
  refreshMetadata: true
})
```

## MCP Tool: `unpublish_app`

**Profile:** core

Deactivates the app from the catalog. This is a soft delete -- it can be published again later.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | App slug |

```
unpublish_app({ slug: "sistema-turnos" })
```
