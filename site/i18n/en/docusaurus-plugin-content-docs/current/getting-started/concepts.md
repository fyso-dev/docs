# Key Concepts

## Tenant

A tenant is an isolated workspace. Each tenant has its own database schema, entities, rules, users, and configurations. Data between tenants is completely separated.

- Each tenant has a unique **slug** (e.g., `mi-empresa`)
- An admin can have access to multiple tenants
- The active tenant is selected at the start of each MCP session

## Entity

An entity defines the data structure -- it is equivalent to a table. It has a name, fields, and configuration.

**Lifecycle:**
1. Created as a **draft**
2. **Published** with a version message
3. Each change creates a new draft that must be published

Each entity has system fields (`id`, `created_at`, `updated_at`) and user-defined fields.

## Field

Fields define the columns of an entity.

| Property | Description |
|----------|-------------|
| `name` | Display name (e.g., "Customer Name") |
| `fieldKey` | Technical key (e.g., `nombre_cliente`) |
| `fieldType` | Data type (see [Field Types](../entities/field-types.md)) |
| `isRequired` | Whether it is required |
| `isUnique` | Whether the value must be unique |
| `config` | Type-specific configuration |

**Available field types:** `text`, `textarea`, `number`, `email`, `phone`, `date`, `boolean`, `select`, `relation`, `file`, `location`.

## Record

A record is a row within an entity. The database structure is:

```json
{
  "id": "uuid",
  "entityId": "uuid",
  "data": {
    "nombre": "Juan Perez",
    "email": "juan@example.com"
  },
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-01-15T10:00:00Z"
}
```

**Important:** Entity fields are inside `record.data`, not at the root of the record. Correct access: `record.data.email`.

## Business Rule

Rules automate logic over data. They are defined using a DSL (Domain Specific Language).

**Types:**
- **compute** -- Calculates fields automatically (e.g., `total = cantidad * precio`)
- **validate** -- Validates data before saving (e.g., "the price must be positive")
- **action** -- Executes side effects after saving (e.g., update a parent record)

Rules also have a draft/published lifecycle.

## Tool Profiles

Fyso exposes MCP tools in three levels:

| Profile | Count | Usage |
|---------|-------|-------|
| `core` | ~26 tools | For daily use -- create entities, CRUD, rules, deploy |
| `advanced` | ~38 tools | Adds delete, test, flows, secrets, logs |
| `all` | ~49 tools | Everything, including channels and bots |

Configured via the `FYSO_TOOLS` environment variable (values: `core`, `advanced`, `all`). Default: `core`.
