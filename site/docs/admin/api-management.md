---
sidebar_position: 7
---

# API Management

API Management lets you define named APIs with role-based access control (RBAC) and issue keys for each role. Each API definition has its own permission matrix that controls which entities and operations each role can access.

Use API Management to expose a controlled subset of your Fyso data to external consumers — partner integrations, third-party apps, or public APIs — without granting full admin access.

## Concepts

- **API definition**: A named API with a slug, one or more roles, and a permission matrix.
- **Role**: A named access level within the API (e.g., `viewer`, `editor`). Roles are defined per API and are independent of tenant user roles.
- **Permission matrix**: Maps entities to roles, and roles to allowed operations (`read`, `create`, `update`, `delete`).
- **Platform key** (`fyso_pkey_*`): A key issued for a specific API + role combination. Shown only once at creation.

## Permission Matrix

```json
{
  "contacts": {
    "viewer": ["read"],
    "editor": ["read", "create", "update"]
  },
  "deals": {
    "viewer": ["read"],
    "editor": ["read", "create", "update", "delete"]
  }
}
```

Use `"*"` as the entity name to grant access to all entities for a role:

```json
{
  "*": {
    "readonly": ["read"]
  }
}
```

## REST Endpoints

All management endpoints require tenant admin authentication.

### List APIs

```bash
GET /api/apis
Authorization: Bearer <admin-token>
```

### Create an API definition

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
| `slug` | string | Yes | Lowercase alphanumeric slug (e.g., `public-crm`) |
| `roles` | string[] | Yes | Role names for this API |
| `permissions` | object | Yes | Permission matrix: `{ entityName: { roleName: operation[] } }` |

Returns `201` with the created API definition. Returns `409` if the slug is already in use.

### Get an API

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
  "name": "Updated Name",
  "roles": ["viewer", "editor", "admin"],
  "permissions": { ... }
}
```

### Delete an API

```bash
DELETE /api/apis/:id
Authorization: Bearer <admin-token>
```

Deletes the API definition and cascades to all issued keys for that API.

---

## Key Management

### List keys for an API

```bash
GET /api/apis/:id/keys
Authorization: Bearer <admin-token>
```

### Issue a key

```bash
POST /api/apis/:id/keys
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "viewer",
  "label": "Partner A read access",
  "ttlDays": 365
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | Role name (must exist in the API's `roles` array) |
| `label` | string | No | Human-readable label for auditing |
| `ttlDays` | number | No | Key lifetime in days |

**Response** (key shown only once):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "fyso_pkey_abc123...",
    "role": "viewer",
    "label": "Partner A read access",
    "expiresAt": "2027-02-26T00:00:00Z",
    "createdAt": "2026-02-26T12:00:00Z"
  }
}
```

### Revoke a key

```bash
DELETE /api/apis/:id/keys/:keyId
Authorization: Bearer <admin-token>
```

---

## Using Platform Keys

Include the key via `Authorization: Bearer`:

```bash
curl -H "Authorization: Bearer fyso_pkey_abc123..." \
  https://api.fyso.dev/api/entities/contacts/records
```

The middleware enforces the permission matrix for every request:
- `GET /api/entities/:entity/*` → requires `read`
- `POST /api/entities/:entity/records` → requires `create`
- `PUT/PATCH /api/entities/:entity/records/:id` → requires `update`
- `DELETE /api/entities/:entity/records/:id` → requires `delete`

Requests to entities not in the permission matrix, or operations not granted for the key's role, return `403 Forbidden`.

---

## Admin Panel

Go to **Settings → API Management** in the admin panel to manage API definitions visually:

- Create and edit API definitions with a visual permission matrix editor
- Issue platform keys for each role — key revealed once, copy-and-store
- Revoke individual keys inline
- Wildcard entity `*` support in the matrix editor
