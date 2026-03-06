---
sidebar_position: 1
---

# Agents Overview

Fyso is a backend-as-a-service that AI agents can operate directly. An agent can create data models, store and query records, enforce business logic, manage users, and deploy sites — all through tool calls or HTTP requests. No manual setup required: connect, select a tenant, and start building.

## Integration Paths

### MCP (recommended for AI agents)

The Fyso MCP server exposes every platform capability as a tool. Connect it to Claude, Cursor, or any MCP-compatible client.

```json
{
  "mcpServers": {
    "fyso": {
      "command": "npx",
      "args": ["-y", "@fyso/mcp-server"],
      "env": {
        "FYSO_API_KEY": "your-api-key",
        "FYSO_API_URL": "https://api.fyso.dev/api",
        "FYSO_TOOLS": "core"
      }
    }
  }
}
```

See [Configure MCP](/docs/getting-started/mcp-setup) for full setup instructions.

### REST API (for apps and services)

Standard HTTP endpoints for any language or framework. Authenticate with a token or key and call JSON endpoints directly.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.fyso.dev/api/entities/products/records?limit=10
```

See [REST API](/docs/api/rest-api) for endpoint reference.

---

## Capabilities

| Area | What you can do |
|------|----------------|
| **Data** | Define entities (tables), create/read/update/delete records, create filtered views, compound filters (AND/OR), semantic search across records |
| **Logic** | Business rules (event-driven or scheduled), automation flows, webhook subscriptions |
| **Users** | Create tenant users, define roles with entity-level permissions, assign/revoke roles, invitation codes |
| **Content** | Knowledge base with RAG (upload PDFs, HTML, URLs — then semantic search), PDF generation from templates |
| **Deploy** | Static sites on `*.sites.fyso.dev`, custom domains (Pro), persistent deploy tokens for CI/CD |
| **Integration** | Channels (custom MCP tools for bots), bot identity system, publishable apps catalog, n8n community node |

---

## Authentication Methods

| Method | Format | Best for |
|--------|--------|----------|
| API Key | `fyso_ak_*` | MCP servers, admin scripts — full tenant access |
| Platform Key | `fyso_pkey_*` | Public REST APIs with role-based access control |
| Public Key | `fyso_pk_*` | Client-side apps — read-only, rate-limited, scoped to a role |
| Bot credentials | `name` + `secret` | Multi-agent systems, service accounts |
| Tenant user token | JWT | User-facing apps with login flows |

Each method has different permissions and use cases. See [Authentication](./authentication.md) for details, headers, and examples.

---

## Quick Start

1. Get an API key from the Fyso admin panel
2. [Configure MCP](../getting-started/mcp-setup.md) or use the REST API directly
3. Select a tenant and start building:

```
fyso_auth({ action: "select_tenant", tenantSlug: "my-workspace" })
fyso_schema({ action: "list" })
fyso_data({ action: "query", entity: "contacts", limit: 5 })
```
