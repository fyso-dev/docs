---
sidebar_position: 6
---

# Channel Tools

Channels let a tenant expose custom MCP tools that other tenants and agents can discover and execute. Think of it as publishing an API built from your entity data, without writing backend code.

## What are Channels?

A channel = one tenant publishing a set of tools that operate on its entities. Other agents call these tools through the execution endpoint.

Key properties:

- **One channel per tenant.** Each tenant can publish exactly one channel.
- **Tool isolation.** Tools belong to the channel owner's tenant. Cross-tenant tool CRUD is blocked -- tenant A cannot modify tenant B's tools.
- **Triple authorization.** Every tool execution checks three layers: (1) channel is active, (2) tool permissions allow the operation, (3) record-level permission check.
- **Data stays with the owner.** When a consumer executes a channel tool, the query runs against the channel owner's data, not the consumer's.

## Publishing a Channel

**REST:**

```bash
curl -X POST https://api.fyso.dev/api/channels \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Catalog",
    "description": "Search and browse our product inventory",
    "tags": ["ecommerce", "products"]
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "name": "Product Catalog",
    "slug": "product-catalog",
    "description": "Search and browse our product inventory",
    "tags": ["ecommerce", "products"],
    "is_active": true,
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-03-01T10:00:00Z"
  }
}
```

The slug is auto-generated from the name. Publishing a second channel for the same tenant returns an error with the existing slug -- use `PATCH` to update instead.

### Channel Permissions

Channels default to `read` access on publish. Set permissions explicitly:

```bash
curl -X PUT https://api.fyso.dev/api/channels/product-catalog/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": {
      "defaultAccess": "readwrite",
      "entityRules": [
        {"entityName": "orders", "access": "read"}
      ]
    }
  }'
```

| Access Level | What consumers can do |
|-------------|----------------------|
| `none` | No access |
| `read` | Query tools only |
| `readwrite` | Query + create/update/delete tools |

Entity rules override the default for specific entities.

## Defining Tools

Tools are defined against the channel owner's entities using a DSL (domain-specific language). Each tool maps to an operation on an entity.

### Creating a Tool

```bash
curl -X POST https://api.fyso.dev/api/tools \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search-products",
    "description": "Search products by name",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search term"
        }
      },
      "required": ["query"]
    },
    "tool_dsl": {
      "operation": "query",
      "entity": "products",
      "fieldMapping": {
        "query": "name"
      },
      "filters": [
        {
          "field": "name",
          "operator": "contains",
          "valueFrom": "query"
        }
      ]
    }
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "channel_id": "uuid",
    "name": "search-products",
    "slug": "search-products",
    "description": "Search products by name",
    "input_schema": { "..." : "..." },
    "version": 1,
    "is_active": true
  }
}
```

### Tool DSL Structure

```json
{
  "operation": "query | create | update | delete",
  "entity": "entity-name",
  "fieldMapping": {
    "<input-param>": "<entity-field>"
  },
  "filters": [
    {
      "field": "<entity-field>",
      "operator": "contains | equals | gt | gte | lt | lte",
      "valueFrom": "<input-param>"
    }
  ],
  "defaults": {
    "<entity-field>": "static-value | {{uuid}} | {{timestamp}}"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `operation` | Yes | What the tool does: `query`, `create`, `update`, `delete` |
| `entity` | Yes | Which entity the tool operates on. Must exist in the owner's tenant. |
| `fieldMapping` | Yes | Maps input parameters to entity fields |
| `filters` | No | Query filters. Only used with `query` operation. |
| `defaults` | No | Default values for fields not provided by the caller |

### Dynamic Defaults

Defaults support special expressions that resolve at execution time:

| Expression | Resolves to |
|-----------|------------|
| `{{uuid}}` | A new random UUID (v4). Unique per execution. |
| `{{timestamp}}` | Current ISO 8601 timestamp |
| Any other string | Used as a static literal value |

Example: a "create order" tool that auto-generates an order ID and timestamp:

```json
{
  "operation": "create",
  "entity": "orders",
  "fieldMapping": {
    "customer_name": "customer_name",
    "total": "total"
  },
  "defaults": {
    "order_id": "{{uuid}}",
    "created_at": "{{timestamp}}",
    "status": "pending"
  }
}
```

The caller only provides `customer_name` and `total`. The `order_id`, `created_at`, and `status` fields are filled automatically.

### Input Schema

Standard JSON Schema for validating caller parameters:

```json
{
  "type": "object",
  "properties": {
    "customer_name": {
      "type": "string",
      "description": "Customer full name"
    },
    "total": {
      "type": "number",
      "description": "Order total in cents"
    }
  },
  "required": ["customer_name", "total"]
}
```

Required parameters are validated before execution. Missing required params return `400` with a clear error.

## Executing Tools

Consumers call tools through the channel execution endpoint.

**REST:**

```bash
curl -X POST https://api.fyso.dev/api/channels/product-catalog/tools/search-products/execute \
  -H "Authorization: Bearer <consumer-token>" \
  -H "Content-Type: application/json" \
  -d '{"query": "wireless"}'
```

Response:

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "rec-uuid",
        "name": "Wireless Mouse",
        "price": 2999,
        "category": "peripherals"
      }
    ],
    "total": 1
  },
  "meta": {
    "executionTimeMs": 42
  }
}
```

For `create` operations, the response includes the new record's ID:

```json
{
  "success": true,
  "data": {
    "id": "new-record-uuid",
    "data": {
      "order_id": "generated-uuid",
      "customer_name": "Acme Corp",
      "status": "pending"
    }
  },
  "meta": {
    "executionTimeMs": 38
  }
}
```

### Cross-Tenant Consumption

Any authenticated tenant can execute public channel tools. The data returned comes from the **channel owner's** schema, not the caller's. This is the core feature -- expose your data through controlled tools without giving direct database access.

## Tool Lifecycle

### CRUD Operations

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Create | `/api/tools` | POST |
| Update | `/api/tools/:slug` | PATCH |
| Delete | `/api/tools/:slug` | DELETE |
| List own | `/api/tools/mine` | GET |
| List by channel (public) | `/api/channels/:slug/tools` | GET |

### Create, Delete, Re-create

You can delete a tool and re-create one with the same slug. The old tool is hard-deleted, so the slug is immediately available. This works across multiple rounds -- create, delete, re-create as many times as you need.

### Unpublishing a Channel

`DELETE /api/channels/:slug` performs a **soft delete** -- sets `is_active = false`.

- Unpublished channels are not discoverable via `GET /api/channels/:slug`
- The owner can still see their channel via `GET /api/channels/mine`
- Re-publishing (calling `POST /api/channels` again) re-activates the channel with the new data
- Tools remain associated with the channel after unpublish

### Updating a Channel

```bash
curl -X PATCH https://api.fyso.dev/api/channels/product-catalog \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "tags": ["ecommerce", "products", "v2"]
  }'
```

Updatable fields: `name`, `description`, `tags`, `metadata`.

### Searching Channels

```bash
curl "https://api.fyso.dev/api/channels?query=product&tags=ecommerce&limit=10&offset=0"
```

No auth required. Only returns active channels. Supports text search on name/description and tag filtering.

## Bot Identity for Channels

Bots are service accounts that can authenticate and operate on a tenant without a human user. Useful for automated channel operations.

### Register a Bot

Requires admin auth:

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/register \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "catalog-sync-bot", "tenantSlug": "my-store"}'
```

Response (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "catalog-sync-bot",
    "secret": "a3f1b2c4d5e6...long-random-string",
    "tenantSlug": "my-store"
  }
}
```

**The secret is shown once.** Store it securely. If you lose it, you must reset it.

Bot name rules: minimum 3 characters, unique across the platform.

### Identify (Authenticate)

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/identify \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "catalog-sync-bot", "secret": "a3f1b2c4d5e6..."}'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "catalog-sync-bot",
    "tenantSlug": "my-store",
    "tenantId": "uuid"
  }
}
```

The bot context (tenant association) persists for channel operations.

### Secret Management

**Reset secret** (invalidates the old one immediately):

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/<bot-id>/reset-secret \
  -H "Authorization: Bearer <admin-token>"
```

Returns a new secret. The old secret stops working instantly.

**Revoke a bot** (permanent deactivation):

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/<bot-id>/revoke \
  -H "Authorization: Bearer <admin-token>"
```

Revoked bots cannot identify. Returns `401` on any subsequent identify attempt.

**List all bots:**

```bash
curl https://api.fyso.dev/api/auth/bots \
  -H "Authorization: Bearer <admin-token>"
```

Returns bot metadata (id, name, tenantSlug, isActive). Never returns the secret hash.

## Error Handling

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing required params, invalid DSL structure, invalid JSON |
| 401 | - | No auth token, invalid token, revoked bot |
| 403 | `PERMISSION_DENIED` | No tenant context, channel permissions deny the operation |
| 404 | `CHANNEL_NOT_FOUND` | Channel slug doesn't exist or is unpublished |
| 404 | `TOOL_NOT_FOUND` | Tool slug doesn't exist in the channel, or cross-tenant tool access attempted |
| 409 | - | Tool slug already exists in the channel, duplicate channel publish |

### Tenant Isolation

Cross-tenant tool CRUD is enforced at every level:

- Tenant A cannot create tools in tenant B's channel
- Tenant A cannot update or delete tenant B's tools (returns `404`, not `403` -- no information leak)
- Creating a tool that references another tenant's entity fails validation
- Tools with the same slug can coexist in different channels without conflict
