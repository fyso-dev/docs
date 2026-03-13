---
sidebar_position: 3
---

# Bot Identity

Bots are service accounts that authenticate against the Entity API using a name and a long-lived secret. They receive short-lived JWTs (1 hour TTL by default) and carry scoped permissions defined at registration time.

Use bots when you need a persistent, non-human identity — for example, a webhook handler, a scheduled sync job, or a secondary agent running inside a multi-agent pipeline.

---

## When to use bots vs other auth methods

| Method | Best for | Permissions |
|--------|----------|-------------|
| API Key (`fyso_ak_*`) | MCP servers, admin scripts | Full tenant access |
| Platform Key (`fyso_pkey_*`) | Public REST APIs | Role-based matrix, static |
| Bot identity | Automated services, agents | Explicit entity-level, dynamic JWT |
| Tenant user token | User-facing apps | Role-based |

Choose bots over API keys when you want explicit, least-privilege scoping per service. Choose bots over Platform keys when the credential must be managed programmatically (register, rotate, revoke via API without touching the admin panel).

---

## Registration

Bot endpoints accept two caller types: an **admin JWT** (from `POST /api/auth/login`) or a **tenant user JWT** (from a user session). The only exception is `reset-secret`, which is admin-only.

### Admin registration

Admins register bots for any tenant they own. The request must include `tenantSlug`.

**Step 1 — Log in as admin**

```bash
curl -X POST https://api.fyso.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'

# Response:
# { "success": true, "data": { "token": "eyJhbGci...", "admin": { ... } } }
```

**Step 2 — Register the bot**

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
#     "id":        "a1b2c3d4-...",
#     "name":      "inventory-agent",
#     "secret":    "dK9mXqP3nR8vTw2zAe7yLs4cBhJfGu6i",
#     "tenantSlug":"my-workspace"
#   }
# }
```

The `secret` is shown exactly once. Store it in a secret manager or environment variable immediately.

### User self-registration

Tenant users can also register bots scoped to their own tenant. The `tenantSlug` field is not required — the tenant is resolved from the user's session. API key authentication (`fyso_ak_*`) is not accepted for this flow; a user JWT is required.

Permissions requested for the bot must be a strict subset of the user's own permissions. A user cannot grant a bot more access than they themselves have.

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/register \
  -H "Authorization: Bearer USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sync-agent",
    "permissions": {
      "entities": {
        "contacts": ["read", "update"]
      }
    }
  }'

# Response (201):
# {
#   "success": true,
#   "data": {
#     "id":       "a1b2c3d4-...",
#     "name":     "sync-agent",
#     "secret":   "dK9mXqP3nR8vTw2zAe7yLs4cBhJfGu6i",
#     "tenantId": "f8e7d6c5-..."
#   }
# }
```

**Errors specific to user registration:**

| Status | Condition |
|--------|-----------|
| `403` | Requested permissions exceed the user's own scope, or wildcard entity requested |
| `403` | API key used instead of user JWT |
| `429` | Per-user bot limit reached (default: 5 active bots per user) |

---

## Permissions

Permissions follow this structure:

```json
{
  "entities": {
    "<entity-name>": ["create", "read", "update", "delete"]
  }
}
```

Each entry maps an entity name (the slug used in API paths) to an array of allowed CRUD actions. You can include any subset of the four actions.

**Constraints:**
- All four actions (`create`, `read`, `update`, `delete`) are the only valid values. Any other string returns a `400`.
- Wildcard entity names (e.g., `"*"`) are **not allowed** for bots. You must list each entity explicitly.
- `permissions` is optional at registration. If omitted, the bot has no entity access until you reset and re-register with permissions.

**Example — read-only bot:**

```json
{
  "entities": {
    "contacts": ["read"],
    "deals":    ["read"]
  }
}
```

**Example — write-only ingestion bot:**

```json
{
  "entities": {
    "events": ["create"]
  }
}
```

---

## Identify — getting a JWT

Once registered, a bot identifies itself to receive a short-lived JWT. The caller must be the admin or user who created the bot:

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/identify \
  -H "Authorization: Bearer ADMIN_OR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":   "inventory-agent",
    "secret": "dK9mXqP3nR8vTw2zAe7yLs4cBhJfGu6i"
  }'

# Response (200):
# {
#   "success": true,
#   "data": {
#     "id":          "a1b2c3d4-...",
#     "name":        "inventory-agent",
#     "tenantSlug":  "my-workspace",
#     "tenantId":    "f8e7d6c5-...",
#     "permissions": { "entities": { "products": ["read", "update"], ... } },
#     "token":       "eyJhbGci...",
#     "expiresIn":   3600
#   }
# }
```

### Use the JWT on entity endpoints

```bash
curl https://api.fyso.dev/api/entities/products/records \
  -H "Authorization: Bearer BOT_JWT"

curl -X POST https://api.fyso.dev/api/entities/inventory/records \
  -H "Authorization: Bearer BOT_JWT" \
  -H "Content-Type: application/json" \
  -d '{ "sku": "ABC-123", "quantity": 50 }'
```

Requests that exceed the bot's declared permissions receive `403 Forbidden`.

---

## JWT refresh pattern

The JWT has a 1 hour TTL (`expiresIn: 3600`). Re-identify when the token expires. Pattern for long-running services:

```typescript
let botToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getBotToken(): Promise<string> {
  // Re-identify if token is missing or within 60s of expiry
  if (!botToken || Date.now() / 1000 >= tokenExpiresAt - 60) {
    const res = await fetch("https://api.fyso.dev/api/auth/bots/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        name:   process.env.BOT_NAME,
        secret: process.env.BOT_SECRET,
      }),
    });

    const json = await res.json();
    if (!json.success) throw new Error(`Bot identify failed: ${json.error}`);

    botToken = json.data.token;
    tokenExpiresAt = Math.floor(Date.now() / 1000) + json.data.expiresIn;
  }

  return botToken!;
}

// Usage:
const token = await getBotToken();
const response = await fetch("https://api.fyso.dev/api/entities/products/records", {
  headers: { "Authorization": `Bearer ${token}` },
});
```

The 60-second buffer avoids race conditions where the token expires mid-request.

---

## Lockout behavior

Failed `identify` calls (wrong secret) are tracked per bot:

| Failed attempts | Lockout duration |
|-----------------|-----------------|
| 1-4 | No lockout |
| 5 | 1 minute |
| 6 | 5 minutes |
| 7 | 30 minutes |
| 8 | 1 hour |
| 9+ | 2 hours |

A successful identify resets the counter. If your bot is locked, wait for the lockout to clear before retrying — additional failed attempts extend the lockout.

---

## Listing bots

Admins see all bots in the tenant. Users see only bots they created.

```bash
curl https://api.fyso.dev/api/auth/bots \
  -H "Authorization: Bearer ADMIN_OR_USER_TOKEN"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id":           "a1b2c3d4-...",
#       "name":         "inventory-agent",
#       "tenantSlug":   "my-workspace",
#       "isActive":     true,
#       "lastSeenAt":   "2026-03-11T10:30:00Z",
#       "permissions":  { "entities": { ... } },
#       "createdAt":    "2026-03-01T09:00:00Z"
#     }
#   ]
# }
```

---

## Revocation

Revoking a bot immediately invalidates further `identify` calls. Active JWTs remain valid until their TTL expires (max 1 hour).

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/BOT_ID/revoke \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response:
# { "success": true, "data": { "revoked": true } }
```

Revocation is permanent. To re-enable, register a new bot.

---

## Secret rotation

Reset a bot's secret when it is compromised or as part of regular key rotation. The old secret stops working immediately.

```bash
curl -X POST https://api.fyso.dev/api/auth/bots/BOT_ID/reset-secret \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Response:
# {
#   "success": true,
#   "data": {
#     "id":     "a1b2c3d4-...",
#     "name":   "inventory-agent",
#     "secret": "newSecretValueShownOnce"
#   }
# }
```

Only active bots can have their secret reset. Revoked bots return `404`.

`reset-secret` is admin-only. There is no user-level equivalent.

---

## Security considerations

**Secrets:** Stored as bcrypt hashes server-side. The plaintext value is returned only once at registration or reset. There is no recovery path — if lost, reset the secret.

**JWT scope:** Bot JWTs carry `"aud": "fyso-bot"` and `"scope": "bot"`. They are validated separately from user tokens and API keys. A bot JWT cannot be used to access admin endpoints.

**Least privilege:** Register each bot with the minimum set of entities and actions it actually needs. A bot with `["read"]` on `contacts` cannot write to `contacts` or access `invoices`, even if the tenant has those entities.

**No wildcards:** Unlike Platform API keys, bot permissions cannot use `"*"` to grant access to all entities. This is intentional — bots are meant to have narrow, explicit scopes.

**Revoke before you delete:** If a bot's credentials are leaked, revoke immediately. Active JWTs cannot be invalidated before their TTL, but revocation stops new JWTs from being issued.

---

## API reference

### `POST /api/auth/bots/register`

Register a new bot.

**Auth:** Admin JWT or tenant user JWT. API keys are not accepted.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Bot name. 3-50 chars, lowercase, alphanumeric and hyphens. Cannot start or end with a hyphen. Must be unique within the tenant. |
| `tenantSlug` | string | Admin only | Slug of the tenant this bot belongs to. Resolved from session for user callers. |
| `permissions` | object | No | Entity permissions map. See [Permissions](#permissions). User callers: must not exceed the caller's own permissions. |

**Response (201) — admin caller:** `{ id, name, secret, tenantSlug }`. Secret shown once.

**Response (201) — user caller:** `{ id, name, secret, tenantId }`. Secret shown once.

---

### `POST /api/auth/bots/identify`

Authenticate a bot and receive a JWT.

**Auth:** Admin JWT or tenant user JWT.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Bot name. |
| `secret` | string | Yes | Bot secret. |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id":          "uuid",
    "name":        "inventory-agent",
    "tenantSlug":  "my-workspace",
    "tenantId":    "uuid",
    "permissions": { "entities": { "products": ["read", "update"] } },
    "token":       "eyJhbGci...",
    "expiresIn":   3600
  }
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401` | Bot not found, wrong secret, or lockout active |
| `403` | Bot has been revoked |

---

### `GET /api/auth/bots`

List bots.

**Auth:** Admin JWT or tenant user JWT.

- Admin: returns all bots in the tenant (including user-created bots).
- User: returns only bots created by that user.

**Response (200):** Array of bot objects (no `secret` field).

---

### `POST /api/auth/bots/:id/revoke`

Revoke a bot permanently.

**Auth:** Admin JWT or tenant user JWT.

- Admin: can revoke any bot in the tenant.
- User: can only revoke bots they created.

**Response (200):**

```json
{ "success": true, "data": { "revoked": true } }
```

Returns `404` if the bot does not exist or belongs to a different admin.

---

### `POST /api/auth/bots/:id/reset-secret`

Generate a new secret for an active bot.

**Auth:** Admin JWT required. Admin-only — no user-level equivalent.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id":     "uuid",
    "name":   "inventory-agent",
    "secret": "new-plaintext-secret-shown-once"
  }
}
```

Returns `404` if the bot is revoked or not found.
