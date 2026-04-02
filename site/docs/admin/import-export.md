---
sidebar_position: 5
---

# Schema Export / Import

Fyso's metadata export/import system serializes the complete schema definition of a tenant — entities, fields, and business rules — into a portable JSON structure.

## Use cases

- **Backup and restore** — export a tenant's schema periodically and restore it on demand
- **Cloning** — copy a schema from one tenant to another
- **Presets** — industry templates that bootstrap a new tenant with a ready-made schema
- **Round-trip safety** — export → import → re-export produces equivalent output
- **App Distribution** — builder ships a schema to subscriber tenants as a managed update

---

## Export

### MCP tool

```
fyso_meta({ action: "export" })
```

### REST endpoint

```
GET /api/metadata/export
Authorization: Bearer <admin-token-or-api-key>
```

### Response envelope

The export endpoint wraps its response in the standard API envelope. The MCP tool unwraps it automatically.

```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "exportedAt": "2026-03-29T12:00:00.000Z",
    "entities": [...],
    "businessRules": [...]
  }
}
```

When working via REST, the schema payload lives inside `data`.

### What gets exported

- Only **published** entities (drafts are excluded)
- All field definitions with their configs
- All business rules with `ruleDsl`, `triggerType`, priority, and versioning data
- Relation fields include `config.targetEntity` (entity name, not ID)

### Content negotiation

For payloads larger than 10 KB, the server returns the response compressed as `application/gzip` — but **only** when the client sends the header:

```
Accept: application/gzip
```

The `Accept-Encoding: gzip` header is transport-level and does **not** trigger a gzip content-type response. If neither header is present (or `Accept: application/json` is used), the response is always `application/json`.

When gzip is returned, the response includes two diagnostic headers:

| Header | Description |
|--------|-------------|
| `X-Original-Size` | Uncompressed size in bytes |
| `X-Compressed-Size` | Compressed size in bytes |

---

## Import

### MCP tool

```
fyso_meta({ action: "import", data: "<json-string>" })
```

### REST endpoint

```
POST /api/metadata/import
Authorization: Bearer <admin-token-or-api-key>
Content-Type: application/json   (or application/gzip)
```

Accepts the same JSON structure returned by export. Both `application/json` and `application/gzip` content types are supported on import.

### Upsert behavior

Import is an **upsert, not a replace**. Existing objects are updated; objects in the target that are not in the import payload are left untouched.

| Object | Match key | Behavior |
|--------|-----------|----------|
| Entity | `name` | Existing → update metadata. New → create + partition. |
| Field | `(entityId, fieldKey)` | System field (`isSystem=true`) → update. Custom field (`isSystem=false`) → **skip**. New → create as `isSystem=true`. |
| Business Rule | `(entityId, name)` | Existing → update DSL, triggers, priority, status. New → create. |

Import **never deletes**. Entities, fields, or rules present in the target but absent from the import source are preserved.

### Entity ID mapping

Import maintains an internal `entityIdMap` (export ID → target ID) so that business rule `entityId` references resolve correctly. If a rule references an entity not in the import payload, the rule is skipped with a warning.

### Versioning data

Import carries over `status`, `version`, `publishedVersion`, `publishedAt`, and `publishedBy` from the source when present.

### Partitions

When a `schemaName` is available, new entities automatically get a dedicated record partition.

### DDL is not run on import

Import creates and updates definition rows (`entity_definitions`, `field_definitions`, `business_rules`) but does not execute `ALTER TABLE`. The publish step (`POST /api/metadata/entities/:name/publish`) is what runs DDL.

For presets and App Distribution, the source is already published so DDL columns exist from `createTenantTables`. If new fields are added via import to an already-published entity, a publish call is still required.

### Response

```json
{
  "success": true,
  "data": {
    "entities": { "created": 2, "updated": 0 },
    "fields":   { "created": 10, "updated": 0, "skipped": 0 },
    "rules":    { "created": 1, "updated": 0 }
  }
}
```

---

## Business rules in the export payload

Business rule objects use these field names:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Rule identifier |
| `triggerType` | string | When the rule fires — see enum below |
| `ruleDsl` | object | The DSL definition |
| `priority` | number | Execution order |
| `status` | string | `active` or `inactive` |

### `triggerType` enum

| Value | Description |
|-------|-------------|
| `field_change` | Fires when a specific field changes |
| `before_save` | Fires before the record is saved |
| `after_save` | Fires after the record is saved |
| `scheduled` | Fires on a cron schedule |
| `on_query` | Fires when a query is executed against the entity |

---

## System fields vs. custom fields

Fields created via import are marked `isSystem: true`. Fields created by tenant users through the custom fields endpoint are `isSystem: false`.

Import **never overwrites custom fields** — it skips them to preserve user customizations. This is the core contract for App Distribution: the builder's schema fields are system-protected, and the tenant user's additions are preserved across updates.

---

## Entity versioning

Each entity tracks its own version history.

| Property | Type | Description |
|----------|------|-------------|
| `version` | int | Current draft version number |
| `publishedVersion` | int, nullable | Last published version |
| `status` | string | `draft` or `published` |

Publishing creates a snapshot in `entity_versions` with the full entity and field state, a diff from the previous version, and the `publishedAt`, `publishedBy`, and `notes` fields.

### Versioning endpoints

```
GET /api/metadata/entities/:name/versions
GET /api/metadata/entities/:name/versions/:version
GET /api/metadata/entities/:name/versions/:version/diff
GET /api/metadata/entities/:name/diff
```

The last endpoint compares the current draft against the last published version.

---

## Server-side usage (internal)

`metadataService.exportMetadata(dbClient)` and `metadataService.importMetadata(data, dbClient, schemaName)` can be called directly from other services (for example, `tenantService.createTenant` for schema cloning). When running cross-tenant operations, set `search_path` before calling:

```typescript
// Export from source tenant
const sourceMetadata = await conn.transaction(async (tx) => {
  await tx.execute(sql.raw(`SET search_path TO "${sourceSchemaName}", public`));
  return metadataService.exportMetadata(tx);
});

// Import into target tenant
await conn.transaction(async (tx) => {
  await tx.execute(sql.raw(`SET search_path TO "${targetSchemaName}", public`));
  await metadataService.importMetadata(sourceMetadata, tx, targetSchemaName);
});
```

---

## Presets

Presets use the same import mechanism. `POST /api/presets/:name/install` loads a preset JSON and calls `metadataService.importMetadata`. The same upsert behavior applies.

---

## Known limitations

| Limitation | Notes |
|------------|-------|
| No delete propagation | Removing an entity or field from source and re-importing does not delete it from the target |
| Relation resolution by name | If the target entity for a relation field does not exist at import time, the field is created but the relation won't resolve until the target is imported |
| No diff on import | Import returns counts (`created`/`updated`/`skipped`) but not a detailed diff |
| No auto-publish | Import writes definitions only; publish must be called separately per entity if DDL changes are needed |
| No selective export | Always exports all published entities with no filtering |
| Skipped fields lack detail | Returns `skipped: N` count but not which fields were skipped |
