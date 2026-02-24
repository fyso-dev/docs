# Anonymous API Keys

Anonymous API keys (`anon_*`) allow public clients — browsers, widgets, embedded apps — to access tenant resources without user authentication.

Use anonymous keys to power public-facing features: read-only data feeds, embedded changelogs, public search, or any endpoint that should be accessible without a login.

## Key Format

Keys have the prefix `anon_`. The full key is shown **only once** at creation. Store it securely in your frontend build — it cannot be retrieved after creation.

## Scopes

Anonymous keys support read-only public scopes only:

| Scope | Description |
|-------|-------------|
| `records:read` | Read records from published entities |
| `channels:read` | Read channel messages |

Write scopes are not available for anonymous keys.

## TTL

TTL is **mandatory** — anonymous keys always expire. You cannot create a permanent anonymous key.

| Parameter | Default | Max |
|-----------|---------|-----|
| `ttlDays` | 90 days | 365 days |

## Rate Limits

Each key has independent rate limits. Requests exceeding the limits return `429`.

| Parameter | Default |
|-----------|---------|
| `rateLimitPerMin` | 60 req/min |
| `rateLimitPerDay` | 1,000 req/day |

## CORS

Optionally restrict which origins can send requests using this key. An empty `allowedOrigins` array allows all origins.

```json
"allowedOrigins": ["https://myapp.com", "https://preview.myapp.com"]
```

## Quota

Maximum **20 active anonymous keys** per tenant.

---

## Entity & Field-Level Permissions

Anonymous keys support fine-grained access control at the entity and field level via the `entityPermissions` configuration.

### Entity-level filtering

By default (empty `entityPermissions`), an anonymous key can access **all published entities** the tenant exposes. To restrict access to specific entities, provide an `entityPermissions` map:

```json
{
  "entityPermissions": {
    "products": {},
    "blog_posts": {}
  }
}
```

With this configuration, requests to any entity **not listed** (e.g., `customers`, `invoices`) return `403 Forbidden`. Unlisted entities are completely inaccessible.

### Field-level exclusion

Each entry in `entityPermissions` optionally accepts an `excludeFields` array. Fields listed there are stripped from **all responses** before they reach the client — they never appear in list or detail responses.

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

Excluded fields are removed server-side. They do not appear even if the client requests them explicitly.

### Backwards compatibility

Keys created before v1.17.0, or created without `entityPermissions`, retain **unrestricted access** to all published entities — existing behavior is unchanged.

### Example: Public product catalog key with restricted fields

```json
POST /api/auth/anonymous-keys
{
  "label": "Public product catalog",
  "scopes": ["records:read"],
  "ttlDays": 90,
  "allowedOrigins": ["https://myshop.com"],
  "entityPermissions": {
    "products": {
      "excludeFields": ["cost_price", "supplier_id"]
    }
  }
}
```

A request to `/api/entities/customers/records` with this key returns `403`. A request to `/api/entities/products/records` returns all product fields except `cost_price` and `supplier_id`.

---

## MCP Tools

### `create_anonymous_key`

**Profile:** advanced

Creates an anonymous API key. The key value is only visible in the response — it is not stored and cannot be retrieved again.

```
create_anonymous_key({
  label: "Public changelog widget",
  scopes: ["records:read"],
  ttl_days: 90,
  allowed_origins: ["https://mysite.com"],
  rate_limit_per_min: 30,
  rate_limit_per_day: 500,
  entity_permissions: {
    "posts": { "excludeFields": ["internal_tag"] }
  }
})
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `label` | string | Yes | Human-readable name |
| `scopes` | string[] | Yes | One or more valid scopes |
| `ttl_days` | number | No | Lifetime in days (1–365, default: 90) |
| `allowed_origins` | string[] | No | CORS allowlist. Empty = all origins |
| `rate_limit_per_min` | number | No | Requests per minute (default: 60) |
| `rate_limit_per_day` | number | No | Requests per day (default: 1,000) |
| `entity_permissions` | object | No | Entity/field access map. Empty = unrestricted |

**Response** (key shown only once):

```json
{
  "id": "uuid",
  "key": "anon_abc123...",
  "keyPrefix": "anon_abc1",
  "label": "Public changelog widget",
  "scopes": ["records:read"],
  "allowedOrigins": ["https://mysite.com"],
  "rateLimitPerMin": 30,
  "rateLimitPerDay": 500,
  "expiresAt": "2026-11-30T00:00:00Z",
  "entityPermissions": {
    "posts": { "excludeFields": ["internal_tag"] }
  },
  "createdAt": "2026-02-22T12:00:00Z"
}
```

---

### `list_anonymous_keys`

**Profile:** advanced

Lists all anonymous keys for the current tenant. Key values are never returned — only metadata.

```
list_anonymous_keys()
```

---

### `revoke_anonymous_key`

**Profile:** advanced

Immediately revokes an anonymous key. Revocation is instant — no grace period. The key cannot be restored.

```
revoke_anonymous_key({ key_id: "uuid" })
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key_id` | string | Yes | UUID of the key (from `list_anonymous_keys`) |

---

## REST Endpoints

All management endpoints require tenant admin authentication.

### List keys

```bash
GET /api/auth/anonymous-keys
Authorization: Bearer <admin-token>
```

### Create a key

```bash
POST /api/auth/anonymous-keys
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "label": "Public catalog",
  "scopes": ["records:read"],
  "ttlDays": 90,
  "allowedOrigins": ["https://mysite.com"],
  "rateLimitPerMin": 30,
  "rateLimitPerDay": 500,
  "entityPermissions": {
    "products": { "excludeFields": ["cost_price"] },
    "blog_posts": {}
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | Human-readable name |
| `scopes` | string[] | Yes | Valid scopes (`records:read`, `channels:read`) |
| `ttlDays` | number | No | Lifetime in days (1–365, default: 90) |
| `allowedOrigins` | string[] | No | CORS allowlist |
| `rateLimitPerMin` | number | No | Requests per minute |
| `rateLimitPerDay` | number | No | Requests per day |
| `entityPermissions` | object | No | Map of entity slug → `{ excludeFields?: string[] }`. Omit for unrestricted access |

**Response** (key shown only once):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "anon_abc123...",
    "keyPrefix": "anon_abc1",
    "label": "Public catalog",
    "scopes": ["records:read"],
    "allowedOrigins": ["https://mysite.com"],
    "rateLimitPerMin": 30,
    "rateLimitPerDay": 500,
    "expiresAt": "2026-11-30T00:00:00Z",
    "entityPermissions": {
      "products": { "excludeFields": ["cost_price"] },
      "blog_posts": {}
    },
    "createdAt": "2026-02-22T12:00:00Z"
  }
}
```

### Revoke a key

```bash
DELETE /api/auth/anonymous-keys/:id
Authorization: Bearer <admin-token>
```

Immediate revocation. Returns `404` if the key does not exist or belongs to a different tenant.

### Audit log

```bash
GET /api/auth/anonymous-keys/:id/audit?limit=100
Authorization: Bearer <admin-token>
```

Returns creation, rotation, and revocation events for the key. Maximum 500 entries per request.

```json
{
  "success": true,
  "data": [
    {
      "action": "created",
      "actor": "admin:uuid",
      "createdAt": "2026-02-22T12:00:00Z"
    },
    {
      "action": "revoked",
      "actor": "admin:uuid",
      "createdAt": "2026-02-23T09:00:00Z"
    }
  ]
}
```

---

## Using Anonymous Keys

Once you have a key, send it with requests to entity and channel endpoints.

### Authentication

Include the key via `X-Anon-Key` header or `Authorization: Bearer`:

```bash
# Option 1: X-Anon-Key header
curl -H "X-Anon-Key: anon_..." \
  https://api.fyso.dev/api/entities/products/records

# Option 2: Authorization header
curl -H "Authorization: Bearer anon_..." \
  https://api.fyso.dev/api/entities/products/records
```

### Supported Endpoints

| Endpoint | Required scope |
|----------|----------------|
| `GET /api/entities/*` | `records:read` |
| `GET /api/channels/*` | `channels:read` |

Anonymous keys are **read-only**. Requests using `POST`, `PUT`, or `DELETE` methods return `401`.

### Errors

| Status | Cause |
|--------|-------|
| `401` | Missing, expired, or invalid key |
| `403` | Entity not listed in `entityPermissions` |
| `429` | Per-key rate limit exceeded |

Authentication failures return a generic `401` — no information is leaked about key existence or revocation status.

### HTTPS

Anonymous key requests must use HTTPS in production. HTTP requests are rejected.

---

## Security Notes

- Key values are bcrypt-hashed. The plaintext is never stored or re-exposed after creation.
- TTL is mandatory — no indefinite anonymous keys are possible.
- Revocation is synchronous (immediate DB update).
- Every creation and revocation is recorded in the audit log.
- `entityPermissions` field stripping happens server-side — clients cannot bypass field exclusions.
