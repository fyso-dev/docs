# Public Keys

Public keys (`fyso_pk_*`) allow public clients — browsers, widgets, embedded apps — to access tenant resources without user authentication.

Public keys are **role-based**: each key references a role in your tenant, inheriting its entity-level permissions. This means you can fine-tune what data a public key can access by configuring the role.

Use public keys to power public-facing features: read-only data feeds, embedded changelogs, public search, or any endpoint that should be accessible without a login.

## Key Format

Keys have the prefix `fyso_pk_`. The full key is shown **only once** at creation. Store it securely in your frontend build — it cannot be retrieved after creation.

## Required: Role

Every public key must reference a role in your tenant. The key inherits the role's entity permissions — which entities are accessible and which fields may be excluded.

Pass a `roleId` when creating a key. You can list available roles via `GET /api/roles`.

## Scopes

Public keys support read-only scopes only:

| Scope | Description |
|-------|-------------|
| `records:read` | Read records from published entities |
| `channels:read` | Read channel messages |

Write scopes are not available for public keys.

## TTL

TTL is **mandatory** — public keys always expire. You cannot create a permanent public key.

| Parameter | Default | Max |
|-----------|---------|-----|
| `ttlDays` | 90 days | 365 days |

## Rate Limits

Each key has independent rate limits. Requests exceeding the limits return `429`.

| Parameter | Default | Max |
|-----------|---------|-----|
| `rateLimitPerMin` | 60 req/min | 10,000 req/min |
| `rateLimitPerDay` | 1,000 req/day | 1,000,000 req/day |

## CORS

Optionally restrict which origins can send requests using this key. An empty `allowedOrigins` array allows all origins.

```json
"allowedOrigins": ["https://myapp.com", "https://preview.myapp.com"]
```

---

## Entity & Field-Level Permissions

Entity access and field exclusions are configured on the **role** the key references. When a role restricts access to specific entities or excludes fields, all public keys using that role inherit those restrictions automatically.

### Entity-level filtering

Configure entity access at the role level. Requests to entities not permitted by the role return `403 Forbidden`.

### Field-level exclusion

Roles can exclude sensitive fields from responses. Excluded fields are removed server-side and never appear in list or detail responses, regardless of what the client requests.

```json
{
  "entityPermissions": {
    "products": {
      "excludeFields": ["cost_price", "supplier_id", "internal_notes"]
    },
    "blog_posts": {
      "excludeFields": ["author_email"]
    }
  }
}
```

Changing the role's permissions affects all public keys referencing that role immediately — no key rotation required.

---

## MCP Tools

### `create_public_key`

**Profile:** advanced

Creates a public API key. The key value is only visible in the response — it is not stored and cannot be retrieved again.

```
create_public_key({
  label: "Public changelog widget",
  role_id: "uuid-of-role",
  scopes: ["records:read"],
  ttl_days: 90,
  allowed_origins: ["https://mysite.com"],
  rate_limit_per_min: 30,
  rate_limit_per_day: 500
})
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `label` | string | Yes | Human-readable name |
| `role_id` | string | Yes | Role UUID — key inherits this role's permissions |
| `scopes` | string[] | Yes | One or more valid scopes |
| `ttl_days` | number | No | Lifetime in days (1–365, default: 90) |
| `allowed_origins` | string[] | No | CORS allowlist. Empty = all origins |
| `rate_limit_per_min` | number | No | Requests per minute (default: 60) |
| `rate_limit_per_day` | number | No | Requests per day (default: 1,000) |

**Response** (key shown only once):

```json
{
  "id": "uuid",
  "key": "fyso_pk_abc123...",
  "keyPrefix": "fyso_pk_ab",
  "label": "Public changelog widget",
  "scopes": ["records:read"],
  "roleId": "uuid-of-role",
  "allowedOrigins": ["https://mysite.com"],
  "rateLimitPerMin": 30,
  "rateLimitPerDay": 500,
  "expiresAt": "2026-11-30T00:00:00Z",
  "createdAt": "2026-02-26T12:00:00Z"
}
```

---

### `list_public_keys`

**Profile:** advanced

Lists all public keys for the current tenant. Key values are never returned — only metadata.

```
list_public_keys()
```

---

### `revoke_public_key`

**Profile:** advanced

Immediately revokes a public key. Revocation is instant — no grace period. The key cannot be restored.

```
revoke_public_key({ key_id: "uuid" })
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key_id` | string | Yes | UUID of the key (from `list_public_keys`) |

---

## REST Endpoints

All management endpoints require tenant admin authentication.

### List keys

```bash
GET /api/auth/public-keys
Authorization: Bearer <admin-token>
```

### Create a key

```bash
POST /api/auth/public-keys
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "label": "Public changelog widget",
  "roleId": "uuid-of-role",
  "scopes": ["records:read"],
  "ttlDays": 90,
  "allowedOrigins": ["https://mysite.com"],
  "rateLimitPerMin": 30,
  "rateLimitPerDay": 500
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | Human-readable name |
| `roleId` | string | Yes | Role UUID |
| `scopes` | string[] | Yes | Valid scopes (`records:read`, `channels:read`) |
| `ttlDays` | number | No | Lifetime in days (1–365, default: 90) |
| `allowedOrigins` | string[] | No | CORS allowlist |
| `rateLimitPerMin` | number | No | Requests per minute |
| `rateLimitPerDay` | number | No | Requests per day |

**Response** (key shown only once):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "fyso_pk_abc123...",
    "keyPrefix": "fyso_pk_ab",
    "label": "Public changelog widget",
    "scopes": ["records:read"],
    "roleId": "uuid-of-role",
    "allowedOrigins": ["https://mysite.com"],
    "rateLimitPerMin": 30,
    "rateLimitPerDay": 500,
    "expiresAt": "2026-11-30T00:00:00Z",
    "createdAt": "2026-02-26T12:00:00Z"
  }
}
```

### Revoke a key

```bash
DELETE /api/auth/public-keys/:id
Authorization: Bearer <admin-token>
```

Immediate revocation. Returns `404` if the key does not exist or belongs to a different tenant.

---

## Using Public Keys

### Authentication

Include the key via `X-Public-Key` header, `X-Anon-Key` header (legacy), or `Authorization: Bearer`:

```bash
# Option 1: X-Public-Key header (recommended)
curl -H "X-Public-Key: fyso_pk_..." \
  https://api.fyso.dev/api/entities/products/records

# Option 2: Authorization header
curl -H "Authorization: Bearer fyso_pk_..." \
  https://api.fyso.dev/api/entities/products/records

# Option 3: X-Anon-Key header (legacy, still supported)
curl -H "X-Anon-Key: fyso_pk_..." \
  https://api.fyso.dev/api/entities/products/records
```

### Supported Endpoints

| Endpoint | Required scope |
|----------|----------------|
| `GET /api/entities/*` | `records:read` |
| `GET /api/channels/*` | `channels:read` |

Public keys are **read-only**. Requests using `POST`, `PUT`, or `DELETE` methods return `401`.

### Errors

| Status | Cause |
|--------|-------|
| `401` | Missing, expired, or invalid key |
| `403` | Entity not permitted by the key's role |
| `429` | Per-key rate limit exceeded |

Authentication failures return a generic `401` — no information is leaked about key existence or revocation status.

---

## Security Notes

- Key values are bcrypt-hashed. The plaintext is never stored or re-exposed after creation.
- TTL is mandatory — no indefinite public keys are possible.
- Revocation is synchronous (immediate DB update).
- Role permissions are evaluated live — changing a role's permissions affects all keys referencing that role immediately.
- Field exclusions happen server-side and cannot be bypassed by clients.

---

## Migration from Anonymous Keys

Previous anonymous keys (`anon_*`) are still accepted for backward compatibility. The management endpoints at `/api/auth/anonymous-keys` also remain available.

New keys should be created via `/api/auth/public-keys` with the `fyso_pk_` prefix and a `roleId`.
