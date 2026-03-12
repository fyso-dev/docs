---
sidebar_position: 2
---

# Authentication

Every request to Fyso needs two things: proof of identity and a tenant context. This page covers all authentication methods with working examples.

---

## API Keys (`fyso_ak_*`)

Created in the admin panel. Grants full owner-level access to the bound tenant. This is what the MCP server uses.

**Header:**

```
Authorization: Bearer fyso_ak_...
```

**REST example:**

```bash
curl -H "Authorization: Bearer fyso_ak_abc123..." \
  https://api.fyso.dev/api/entities
```

**MCP setup:** Pass the key as the `FYSO_API_KEY` environment variable:

```json
{
  "env": {
    "FYSO_API_KEY": "fyso_ak_abc123...",
    "FYSO_API_URL": "https://api.fyso.dev/api"
  }
}
```

The key is shown once at creation. Store it securely — it cannot be retrieved again.

---

## Platform API Keys (`fyso_pkey_*`)

Role-based keys for controlled external access. You define an API with a permission matrix (which entities, which operations, per role), then issue keys for each role.

**Header:**

```
Authorization: Bearer fyso_pkey_...
```

**Permissions are enforced per request:**

| HTTP method | Required permission |
|-------------|-------------------|
| `GET /api/entities/:entity/*` | `read` |
| `POST /api/entities/:entity/records` | `create` |
| `PUT/PATCH /api/entities/:entity/records/:id` | `update` |
| `DELETE /api/entities/:entity/records/:id` | `delete` |

### Example: Create an API, issue a key, use it

**Step 1 — Define the API:**

```bash
curl -X POST https://api.fyso.dev/api/apis \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Partner CRM API",
    "slug": "partner-crm",
    "roles": ["viewer", "editor"],
    "permissions": {
      "contacts": { "viewer": ["read"], "editor": ["read", "create", "update"] },
      "deals":    { "viewer": ["read"], "editor": ["read", "create", "update", "delete"] }
    }
  }'
```

**Step 2 — Issue a key for the `viewer` role:**

```bash
curl -X POST https://api.fyso.dev/api/apis/API_ID/keys \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "viewer",
    "label": "Partner A read access",
    "ttlDays": 365
  }'

# Response (key shown only once):
# { "success": true, "data": { "key": "fyso_pkey_abc123...", "role": "viewer", ... } }
```

**Step 3 — Use the key:**

```bash
# This works (viewer has read on contacts):
curl -H "Authorization: Bearer fyso_pkey_abc123..." \
  https://api.fyso.dev/api/entities/contacts/records

# This fails with 403 (viewer can't create):
curl -X POST -H "Authorization: Bearer fyso_pkey_abc123..." \
  -H "Content-Type: application/json" \
  -d '{"data": {"name": "New Contact"}}' \
  https://api.fyso.dev/api/entities/contacts/records
```

Use `"*"` as the entity name in the permission matrix to grant access to all entities for a role.

See [API Management](/docs/admin/api-management) for full CRUD reference.

---

## Public Keys (`fyso_pk_*`)

Read-only, rate-limited keys for client-side use. Each key is bound to a role that controls which entities and fields are visible.

**Headers (any of these):**

```
X-Public-Key: fyso_pk_...
Authorization: Bearer fyso_pk_...
X-Anon-Key: fyso_pk_...          # legacy, still supported
```

**Constraints:**

- Read-only — `POST`, `PUT`, `DELETE` return `401`
- TTL is mandatory (1-365 days, default 90)
- Per-key rate limits (default: 60/min, 1,000/day)
- Optional CORS origin allowlist
- Field exclusions configured on the role (server-side, cannot be bypassed)

**Supported scopes:** `records:read`, `channels:read`

### Example: Create a public key

```bash
curl -X POST https://api.fyso.dev/api/auth/public-keys \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Public product catalog",
    "roleId": "ROLE_UUID",
    "scopes": ["records:read"],
    "ttlDays": 180,
    "allowedOrigins": ["https://mystore.com"],
    "rateLimitPerMin": 120,
    "rateLimitPerDay": 10000
  }'

# Response (key shown only once):
# { "success": true, "data": { "key": "fyso_pk_abc123...", ... } }
```

**Use the key:**

```bash
curl -H "X-Public-Key: fyso_pk_abc123..." \
  https://api.fyso.dev/api/entities/products/records
```

See [Public Keys](/docs/admin/anonymous-keys) for full reference including role permissions and field exclusions.

---

## Bot Identity

For multi-agent systems and service accounts. Bots are registered per tenant, authenticated by name + secret, and receive a short-lived JWT (1 hour TTL) scoped to the entity permissions defined at registration.

All bot management endpoints require admin authentication.

### Register a bot

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/register \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "inventory-agent",
    "tenantSlug": "my-workspace",
    "permissions": {
      "entities": {
        "products":  ["read", "update"],
        "inventory": ["create", "read", "update", "delete"]
      }
    }
  }'

# Response (201):
# {
#   "success": true,
#   "data": {
#     "id":        "uuid",
#     "name":      "inventory-agent",
#     "secret":    "dK9mXqP3nR8vTw2z...",
#     "tenantSlug":"my-workspace"
#   }
# }
```

The `secret` is shown only once. Store it immediately.

### Identify — get a JWT

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/identify \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":   "inventory-agent",
    "secret": "dK9mXqP3nR8vTw2z..."
  }'

# Response (200):
# {
#   "success": true,
#   "data": {
#     "id":          "uuid",
#     "name":        "inventory-agent",
#     "tenantSlug":  "my-workspace",
#     "tenantId":    "uuid",
#     "permissions": { "entities": { "products": ["read", "update"], ... } },
#     "token":       "eyJhbGci...",
#     "expiresIn":   3600
#   }
# }
```

Use the `token` in the `Authorization: Bearer` header for entity API calls. Re-identify when the token expires.

### Bot endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/bots/register` | POST | Register a bot with permissions |
| `/api/auth/bots/identify` | POST | Authenticate — returns JWT |
| `/api/auth/bots` | GET | List bots (scoped to authenticated admin) |
| `/api/auth/bots/:id/revoke` | POST | Revoke permanently |
| `/api/auth/bots/:id/reset-secret` | POST | Rotate secret (admin only) |

### MCP tools

| Tool | Description |
|------|-------------|
| `register_bot` | Register a new bot |
| `identify_bot` | Authenticate a bot by name + secret |
| `list_bots` | List bots in the tenant |
| `whoami_bot` | Get current bot identity |
| `revoke_bot` | Revoke a bot |

See [Bot Identity](/docs/agents/bot-identity) for permissions structure, JWT refresh pattern, lockout behavior, and security considerations.

---

## Tenant User Login

For user-facing apps where end users log in with email and password.

### Login

```bash
curl -X POST https://api.fyso.dev/api/auth/tenant/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-workspace" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGci...",
#     "user": { "id": "uuid", "email": "user@example.com", "name": "Jane", "role": "member" }
#   }
# }
```

Use the JWT in subsequent requests:

```bash
curl -H "Authorization: Bearer eyJhbGci..." \
  https://api.fyso.dev/api/entities/contacts/records
```

### Self-service flows

These endpoints don't require admin auth — only the `X-Tenant-ID` header. They must be enabled in tenant settings.

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/tenant/register` | Self-registration (creates `viewer` role) |
| `POST /api/auth/tenant/forgot-password` | Send password reset email |
| `POST /api/auth/tenant/reset-password` | Apply new password with reset token |
| `POST /api/auth/tenant/change-password` | Authenticated password change |

See [Users](/docs/admin/users) for full details on self-service configuration and rate limits.

### MCP tool

```
tenant_login({ tenantSlug: "my-workspace", email: "user@example.com", password: "securepassword" })
```

Returns a JWT you can use with the REST API.

---

## Tenant Context

Every operation targets a specific tenant. Fyso resolves the tenant from (in priority order):

| Method | How |
|--------|-----|
| `X-Tenant-ID` header | `X-Tenant-ID: my-workspace` |
| `X-Tenant-Slug` header | `X-Tenant-Slug: my-workspace` |
| API key binding | Keys created in a tenant automatically target that tenant |
| Host-based | Subdomain resolution (for custom domain setups) |

**MCP:** Use `select_tenant` at the start of a session to set the active tenant. All subsequent tool calls operate on that tenant.

```
select_tenant({ tenantSlug: "my-workspace" })
```

If you're using an API key (`fyso_ak_*`), the tenant is already bound to the key — no header needed. Platform keys (`fyso_pkey_*`) also carry their tenant binding. For tenant user tokens and public keys, include the tenant header explicitly.
