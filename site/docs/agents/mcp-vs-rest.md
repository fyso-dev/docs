---
sidebar_position: 10
---

# MCP vs REST API

Fyso offers two integration paths: **MCP** (Model Context Protocol) for AI agents, and a **REST API** for traditional HTTP clients. This guide compares both approaches.

## When to Use Each

| | MCP | REST API |
|---|-----|----------|
| **Best for** | AI agents (Claude, GPT, etc.) | Web apps, mobile apps, scripts, CI/CD |
| **Auth setup** | Automatic (configured once in MCP client) | Manual headers on every request |
| **Tenant context** | Auto-injected after `select_tenant` | Manual `X-Tenant-ID` header per request |
| **Schema discovery** | `list_entities`, `get_entity_schema` tools | `GET /api/entities` endpoint |
| **Streaming** | Supported natively | Standard HTTP responses |
| **Batch operations** | Single tool call can handle complex workflows | One endpoint per operation |

## Authentication Differences

### MCP

Authentication is configured once in the MCP client settings (e.g., Claude Desktop `claude_desktop_config.json`). After connecting, tenant context is set with a single tool call:

```
select_tenant("my-company-abc123")
```

All subsequent tool calls automatically include the tenant context and credentials. No manual headers needed.

### REST API

Every request must include authentication and tenant headers explicitly:

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/products/records"
```

See [REST API - Required Headers](/docs/api/rest-api#required-headers) for the full header reference.

## Response Format Differences

### Querying Records

**MCP** (`query_records`) returns a flat list:

```json
{
  "records": [
    {
      "id": "uuid-1",
      "nombre": "Juan Perez",
      "email": "juan@example.com",
      "createdAt": "2026-02-03T12:51:15.352Z"
    },
    {
      "id": "uuid-2",
      "nombre": "Ana Lopez",
      "email": "ana@example.com",
      "createdAt": "2026-02-03T13:00:00.000Z"
    }
  ]
}
```

**REST API** (`GET /api/entities/{entity}/records`) wraps results with pagination metadata:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-1",
        "nombre": "Juan Perez",
        "email": "juan@example.com",
        "createdAt": "2026-02-03T12:51:15.352Z"
      },
      {
        "id": "uuid-2",
        "nombre": "Ana Lopez",
        "email": "ana@example.com",
        "createdAt": "2026-02-03T13:00:00.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

Key differences:
- MCP uses `records` as the array key; REST uses `data.items`
- REST includes pagination metadata (`total`, `page`, `limit`, `totalPages`)
- Both return flat records (fields at the top level, no nested `.data` wrapper)

### Creating a Record

**MCP:**

```
create_record("products", { "nombre": "Widget", "precio": 29.99 })
```

```json
{
  "id": "uuid-new",
  "nombre": "Widget",
  "precio": 29.99,
  "createdAt": "2026-03-01T10:00:00.000Z"
}
```

**REST:**

```bash
curl -X POST -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Widget", "precio": 29.99}' \
  "https://api.fyso.dev/api/entities/products/records"
```

```json
{
  "success": true,
  "data": {
    "id": "uuid-new",
    "nombre": "Widget",
    "precio": 29.99,
    "createdAt": "2026-03-01T10:00:00.000Z"
  }
}
```

## Side-by-Side Examples

### List records with filter

**MCP:**

```
query_records("tickets", filters: "status = open", limit: 10)
```

**REST:**

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/tickets/records?filter.status=open&limit=10"
```

### Update a record

**MCP:**

```
update_record("tickets", "uuid-123", { "status": "closed" })
```

**REST:**

```bash
curl -X PUT -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  -H "Content-Type: application/json" \
  -d '{"status": "closed"}' \
  "https://api.fyso.dev/api/entities/tickets/records/uuid-123"
```

### Delete a record

**MCP:**

```
delete_record("tickets", "uuid-123")
```

**REST:**

```bash
curl -X DELETE -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/tickets/records/uuid-123"
```
