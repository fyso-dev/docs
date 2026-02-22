# Admin API Keys

Admin API keys (`fyso_adm_*`) allow programmatic access to platform-level administration endpoints. They are separate from tenant API keys and from super-admin session credentials.

Use admin API keys to automate tenant provisioning, platform monitoring, or other administrative tasks from external systems.

## Key Format

Keys follow the format `fyso_adm_<48-char-hex>`. The full key is shown **only once** at creation time. Store it securely — it cannot be retrieved again.

## Scopes

Every key is created with one or more scopes that define what it can access:

| Scope | Description |
|-------|-------------|
| `platform:read` | Read platform metadata and key listings |
| `platform:write` | Create and revoke admin API keys |
| `tenants:manage` | Create, modify, and delete tenants |

## Authentication

Include the key in one of two ways:

```bash
# Option 1: X-Admin-Key header
curl -H "X-Admin-Key: fyso_adm_..." https://api.fyso.dev/api/admin/platform/keys

# Option 2: Authorization header
curl -H "Authorization: AdminKey fyso_adm_..." https://api.fyso.dev/api/admin/platform/keys
```

## Endpoints

All endpoints require super-admin authentication in addition to a valid admin key scope.

### List keys

```bash
GET /api/admin/platform/keys
```

Returns all active and revoked admin keys (key values are never returned, only prefixes).

```bash
curl -H "X-Admin-Key: fyso_adm_..." \
  https://api.fyso.dev/api/admin/platform/keys
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "CI Pipeline",
      "keyPrefix": "fyso_adm_abc123",
      "scopes": ["tenants:manage"],
      "isActive": true,
      "lastUsedAt": "2026-02-22T10:00:00Z",
      "expiresAt": null,
      "createdAt": "2026-02-01T00:00:00Z"
    }
  ]
}
```

### Create a key

```bash
POST /api/admin/platform/keys
Content-Type: application/json

{
  "name": "CI Pipeline",
  "scopes": ["tenants:manage"],
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable label for the key |
| `scopes` | string[] | Yes | One or more valid scopes |
| `expiresAt` | ISO date | No | Expiration date. Omit for a non-expiring key |

**Response** (key shown only once):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "fyso_adm_abc123...",
    "keyPrefix": "fyso_adm_abc123",
    "name": "CI Pipeline",
    "scopes": ["tenants:manage"],
    "expiresAt": "2027-01-01T00:00:00Z",
    "createdAt": "2026-02-22T12:00:00Z"
  }
}
```

### Revoke a key

```bash
DELETE /api/admin/platform/keys/:id
```

Immediately deactivates the key. All subsequent requests using it return `401`.

```bash
curl -X DELETE -H "X-Admin-Key: fyso_adm_..." \
  https://api.fyso.dev/api/admin/platform/keys/uuid
```

### Audit log

```bash
GET /api/admin/platform/keys/:id/audit?limit=100
```

Returns the usage history for a specific key: creation, every API call, and revocation. Maximum 500 entries per request.

```json
{
  "success": true,
  "data": [
    {
      "action": "created",
      "actorId": "admin-uuid",
      "createdAt": "2026-02-01T00:00:00Z"
    },
    {
      "action": "used",
      "endpoint": "POST /api/admin/platform/keys",
      "ip": "203.0.113.5",
      "createdAt": "2026-02-22T10:00:00Z"
    }
  ]
}
```

## Security Notes

- Key values are hashed with bcrypt. The plaintext is never stored or re-exposed.
- Expired keys are rejected at validation time even if still marked active.
- Every creation, usage, and revocation is recorded in the audit log.
- Prefix-based lookup (`fyso_adm_` + first 9 chars) narrows candidates before hash verification.
