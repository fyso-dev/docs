---
sidebar_position: 5
---

# Entity Views

A **view** is a named, filtered projection of an entity with its own RBAC permissions. Views let you expose a subset of an entity's records to specific roles without granting access to the full entity.

## Use Case

A `tickets` entity contains all support tickets. You want support agents to see only their own tickets:

1. Create a view `my-tickets` on the `tickets` entity with filter `reporter == $currentUser`
2. Grant the `agent` role read access to `view:my-tickets`
3. Agents query `/api/views/my-tickets/records` and only see their own tickets

Admins (API key access) bypass the filter and see all records through the view.

## Creating a View

### Via MCP

```
create_view({
  entitySlug: "tickets",
  slug: "my-tickets",
  name: "My Tickets",
  description: "Tickets reported by the current user",
  filterDsl: {
    validate: [
      { condition: "reporter == $currentUser" }
    ]
  }
})
```

### Via REST API

```bash
curl -X POST "https://api.fyso.dev/api/views" \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "entitySlug": "tickets",
    "slug": "my-tickets",
    "name": "My Tickets",
    "filterDsl": {
      "validate": [{ "condition": "reporter == $currentUser" }]
    }
  }'
```

## Filter DSL

View filters use the same syntax as `on_query` business rules:

| Element | Examples |
|---------|---------|
| Field references | `status`, `reporter`, `priority` |
| Operators | `==`, `!=`, `>`, `>=`, `<`, `<=` |
| Variables | `$currentUser`, `$currentTenant` |
| Logical operators | `and`, `or`, `not` |
| Literals | `'active'`, `42` |
| Grouping | `(status == 'open' or status == 'pending') and priority > 3` |

The filter is compiled to a SQL `WHERE` clause and applied server-side. It composes with any additional query-string filters the caller passes.

### Variable Reference

| Variable | Resolves to |
|----------|------------|
| `$currentUser` | The authenticated tenant user's ID |
| `$currentTenant` | The current tenant ID |

When accessed via admin API key (no user context), view filters that reference `$currentUser` are skipped -- the admin sees all records.

## Permissions

Views use the RBAC system with the entity key format `view:<slug>`.

To grant a role access to a view, include `view:<slug>` in the role's entity permissions:

```json
{
  "entities": {
    "view:my-tickets": ["read"]
  }
}
```

- Admin API key access bypasses RBAC -- all views and records are accessible.
- Tenant users without `read` on `view:<slug>` receive `403 Forbidden`.
- The wildcard `*` entity permission also grants access to all views.

## Querying Records Through a View

### List Records

```
GET /api/views/{viewSlug}/records
```

Supports the same query parameters as entity record listing:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sort` | string | - | Field to sort by |
| `order` | string | `asc` | `asc` or `desc` |
| `search` | string | - | Full-text search |
| `resolve` | boolean | false | Expand relations |
| `resolve_depth` | number | 1 | Nesting depth (max 3) |
| `filter.{field}` | string | - | Additional field filter |

Additional filters compose with the view's base filter (AND logic).

### Get Single Record

```
GET /api/views/{viewSlug}/records/{id}
```

Returns a single record if it matches the view's filter. Returns `404` if the record exists but does not match the filter.

## Managing Views

All management operations require admin access (API key or admin role).

| Operation | MCP Tool | REST Endpoint |
|-----------|----------|---------------|
| Create | `create_view` | `POST /api/views` |
| List all | `list_views` | `GET /api/views` |
| Update | `update_view` | `PUT /api/views/{slug}` |
| Delete | `delete_view` | `DELETE /api/views/{slug}` |

### Slug Rules

- Lowercase alphanumeric with hyphens only: `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`
- Maximum 100 characters
- Must be unique across all views in the tenant

### Update Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name |
| `description` | string | Description |
| `filterDsl` | object | New filter definition |
| `isActive` | boolean | Enable/disable the view |

Deactivated views (`isActive: false`) are excluded from list results and return `404` on record queries.
