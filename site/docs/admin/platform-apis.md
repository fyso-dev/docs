# Platform API Management

Platform APIs let you expose structured, role-based REST access to your tenant data — without giving callers full admin credentials.

Each **Platform API** is a named definition with a set of roles and a permission matrix. You issue keys per role. Callers authenticate with `fyso_pkey_*` keys and get exactly the permissions defined for their role.

## Concepts

| Term | Description |
|------|-------------|
| **API definition** | Named configuration with roles and a permission matrix |
| **Role** | A named access level within the API (e.g., `viewer`, `editor`) |
| **Permission matrix** | Map of `entity → role → allowed operations` |
| **Platform key** | `fyso_pkey_*` credential tied to one API + one role |

## Key format

Platform API keys use the prefix `fyso_pkey_`. They are distinct from:
- Tenant API keys (`fyso_ak_*`) — full owner-level access
- Anonymous keys (`anon_*`) — read-only public access

The full key value is shown **only once** at issuance time.

---

## Permission Matrix

The permission matrix controls which entities each role can access and which operations are allowed:

```json
{
  "contacts": { "viewer": ["read"], "editor": ["read", "create", "update"] },
  "deals":    { "viewer": ["read"], "editor": ["read", "create", "update", "delete"] }
}
```

### Operations

| Operation | HTTP methods |
|-----------|--------------|
| `read`    | `GET` |
| `create`  | `POST` |
| `update`  | `PUT`, `PATCH` |
| `delete`  | `DELETE` |

### Wildcard entity

Use `*` to grant a role access to **all entities**:

```json
{
  "permissions": {
    "*": { "admin": ["read", "create", "update", "delete"] }
  }
}
```

---

## Management Endpoints

All management endpoints require tenant admin authentication.

### List APIs

```bash
GET /api/apis
Authorization: Bearer <admin-token>
```

Returns all API definitions for the tenant.

### Create an API

```bash
POST /api/apis
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Public CRM API",
  "slug": "public-crm",
  "roles": ["viewer", "editor"],
  "permissions": {
    "contacts": { "viewer": ["read"], "editor": ["read", "create", "update"] },
    "deals":    { "viewer": ["read"], "editor": ["read", "create", "update", "delete"] }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable name |
| `slug` | string | Yes | URL-safe identifier (unique per tenant) |
| `roles` | string[] | Yes | Role names available in this API |
| `permissions` | object | Yes | Entity to role to operations matrix |

### Get API details

```bash
GET /api/apis/:id
Authorization: Bearer <admin-token>
```

### Update an API

```bash
PUT /api/apis/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated CRM API",
  "roles": ["viewer", "editor", "admin"],
  "permissions": {}
}
```

### Delete an API

```bash
DELETE /api/apis/:id
Authorization: Bearer <admin-token>
```

Deletes the API definition and **cascades to all issued keys**. All `fyso_pkey_*` keys for this API are immediately revoked.

---

## Key Management

### List keys

```bash
GET /api/apis/:id/keys
Authorization: Bearer <admin-token>
```

Returns all keys for the API. Key values are never returned — only metadata.

### Issue a key

```bash
POST /api/apis/:id/keys
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "viewer",
  "label": "External analytics system"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | Must be one of the roles defined in the API |
| `label` | string | No | Human-readable description |

**Response** (key shown only once):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "fyso_pkey_abc123...",
    "role": "viewer",
    "label": "External analytics system",
    "createdAt": "2026-02-24T00:00:00Z"
  }
}
```

### Revoke a key

```bash
DELETE /api/apis/:id/keys/:keyId
Authorization: Bearer <admin-token>
```

Immediately revokes the key. Returns `404` if the key does not exist or belongs to a different API.

---

## Using Platform API Keys

### Authentication

Include the key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer fyso_pkey_..." \
  https://api.fyso.dev/api/entities/contacts/records
```

### Access enforcement

The `requirePlatformApiKey` middleware enforces permissions on every request:

1. Validates the key format and looks up the associated API + role
2. Extracts the target entity from the request path
3. Maps the HTTP method to an operation (`read`, `create`, `update`, `delete`)
4. Checks the permission matrix: entity x role x operation
5. Returns `403` if the operation is not permitted

### Error responses

| Status | Cause |
|--------|-------|
| `401` | Missing or invalid key |
| `403` | Operation not permitted for this role/entity combination |

---

## Full Example

**Goal:** expose a public CRM API where viewers can read contacts, and editors can also create and update them.

**Step 1: Create the API definition**

```bash
POST /api/apis
{
  "name": "CRM Public API",
  "slug": "crm-public",
  "roles": ["viewer", "editor"],
  "permissions": {
    "contacts": {
      "viewer": ["read"],
      "editor": ["read", "create", "update"]
    }
  }
}
```

**Step 2: Issue keys per role**

```bash
POST /api/apis/<id>/keys
{ "role": "viewer", "label": "Dashboard read-only" }

POST /api/apis/<id>/keys
{ "role": "editor", "label": "CRM sync integration" }
```

**Step 3: Use the keys**

Viewer key reads contacts (200), cannot create (403). Editor key can create (201).

---

## Security Notes

- Key values are hashed. The plaintext is shown only once at issuance and never stored.
- Deleting an API cascades to all keys — no orphaned credentials.
- Existing `fyso_ak_*` tenant keys are completely unaffected by Platform API management.
- The wildcard entity (`*`) grants access to all current and future entities for that role — use carefully.
