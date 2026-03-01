# REST API

Fyso exposes a REST API for external access to tenant data.

## Authentication

Two available methods:

### 1. Tenant User Token

```bash
# 1. Login to obtain token
curl -X POST "https://api.fyso.dev/api/auth/tenant/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: mi-empresa" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response:
# { "success": true, "data": { "token": "jwt...", "user": {...} } }

# 2. Use the token
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://api.fyso.dev/api/entities/clientes/records"
```

### 2. API Key

```bash
curl -H "Authorization: Bearer API_KEY" \
  "https://api.fyso.dev/api/entities/clientes/records"

# Or alternative:
curl -H "X-API-Key: API_KEY" \
  "https://api.fyso.dev/api/entities/clientes/records"
```

## CRUD Endpoints

### List Records

```
GET /api/entities/{entityName}/records
```

**Query params:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | - | Field to sort by |
| `order` | string | `asc` | Direction: `asc` or `desc` |
| `search` | string | - | Full-text search across text fields |
| `resolve` | boolean | - | Expand relations to full objects |
| `filter.{fieldKey}` | string | - | Filter by field (e.g., `filter.estado=activo`) |

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "entityId": "uuid",
        "name": "Juan Perez",
        "data": {
          "nombre": "Juan Perez",
          "email": "juan@example.com"
        },
        "createdAt": "2026-02-03T12:51:15.352Z",
        "updatedAt": "2026-02-03T12:51:15.352Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Get a Record

```
GET /api/entities/{entityName}/records/{id}
```

**Query params:** `resolve` (boolean)

### Create a Record

```
POST /api/entities/{entityName}/records
Content-Type: application/json

{
  "nombre": "Juan Perez",
  "email": "juan@example.com"
}
```

### Update a Record

```
PUT /api/entities/{entityName}/records/{id}
Content-Type: application/json

{
  "email": "juan.nuevo@example.com"
}
```

Supports partial updates.

### Delete a Record

```
DELETE /api/entities/{entityName}/records/{id}
```

## Views

Views are filtered projections of entities with independent RBAC permissions. See [Entity Views](/entities/views) for the full guide.

### List Views

```
GET /api/views
```

Returns all views. Admin sees all; tenant users see only views they have `view:<slug>` read permission on.

### Create View

```
POST /api/views
Content-Type: application/json

{
  "entitySlug": "tickets",
  "slug": "my-tickets",
  "name": "My Tickets",
  "description": "Tickets reported by the current user",
  "filterDsl": {
    "validate": [{ "condition": "reporter == $currentUser" }]
  }
}
```

Requires admin access.

### Update View

```
PUT /api/views/{slug}
Content-Type: application/json

{
  "name": "Updated Name",
  "filterDsl": { "validate": [{ "condition": "status == 'open'" }] }
}
```

### Delete View

```
DELETE /api/views/{slug}
```

### List Records Through View

```
GET /api/views/{viewSlug}/records
```

Same query parameters as entity record listing (`page`, `limit`, `sort`, `order`, `search`, `resolve`, `filter.*`). The view's base filter is applied automatically and composes with any additional query filters.

### Get Single Record Through View

```
GET /api/views/{viewSlug}/records/{id}
```

Returns `404` if the record does not match the view's filter.

---

## Record Structure

Entity fields are inside `record.data`:

```
record.data.email     -- CORRECT
record.email          -- INCORRECT
```

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `NOT_FOUND` | 404 | Entity or record not found |
| `VALIDATION_ERROR` | 400 | Invalid data |
| `BUSINESS_RULE_ERROR` | 400 | A business rule prevented the operation |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | No permissions for the operation |
| `INTERNAL_ERROR` | 500 | Internal server error |

**Error format:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo 'nombre' es obligatorio"
  }
}
```

## Schema Health Check (Superadmin)

Detect and fix migration gaps across tenant schemas. Requires superadmin authentication.

### Get Schema Health Report

```
GET /health/schema
```

Returns a full report with per-tenant issues and suggested fix SQL.

```bash
curl -H "X-Admin-Secret: ADMIN_SECRET" \
  "https://api.fyso.dev/health/schema"
```

**Response:**

```json
{
  "status": "degraded",
  "checked_at": "2026-02-23T12:00:00.000Z",
  "tenants_checked": 5,
  "tenants_healthy": 4,
  "tenants_degraded": 1,
  "issues": [
    {
      "tenant": "tenant_acme",
      "check": "column_exists",
      "table": "documents",
      "column": "content_text",
      "severity": "critical",
      "fix": "ALTER TABLE \"tenant_acme\".documents ADD COLUMN IF NOT EXISTS content_text TEXT"
    }
  ]
}
```

Checks performed per tenant (6 total):

| Check | Severity | What it detects |
|-------|----------|----------------|
| `extension_exists` | critical | pgvector extension missing |
| `table_exists` | critical | Required tables missing (`entity_definitions`, `field_definitions`, `entity_records`, `business_rules`, `documents`, `chunks`, `roles`, `users`) |
| `column_exists` | critical | Required columns missing (e.g. `documents.content_text`, `field_definitions.is_system`) |
| `system_entity_flag` | warning | `_fyso_*` entities with `is_system = false` |
| `trigger_exists` | warning | `trg_enforce_fyso_system` trigger missing |
| `hnsw_index_exists` | warning | HNSW index on `chunks.embedding` missing |

### Fix Degraded Tenants

```
POST /health/schema/fix
```

Re-runs `getTenantDDL()` on all degraded tenants. Idempotent.

```bash
curl -X POST -H "X-Admin-Secret: ADMIN_SECRET" \
  "https://api.fyso.dev/health/schema/fix"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "fixed": 1,
    "errors": []
  }
}
```

## Tenant Invitations

Manage member invitations for a tenant. Requires tenant user authentication and tenant context (`X-Tenant-Slug` header).

### List Invitations

```
GET /api/invitations
```

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-Slug: my-company" \
  "https://api.fyso.dev/api/invitations"
```

### Create Invitation

```
POST /api/invitations
```

With tenant context, creates a tenant member invitation. Without tenant context, creates a platform registration code (legacy flow).

```bash
# Tenant member invitation (optional email lock)
curl -X POST -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-Slug: my-company" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "expiresInDays": 7}' \
  "https://api.fyso.dev/api/invitations"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "a1b2c3...",
    "inviteUrl": "https://app.fyso.dev/invite/a1b2c3..."
  }
}
```

### Revoke Invitation

```
DELETE /api/invitations/{token}
```

```bash
curl -X DELETE -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-Slug: my-company" \
  "https://api.fyso.dev/api/invitations/a1b2c3..."
```

### Preview Invitation (Public)

```
GET /auth/invite/{token}
```

No authentication required. Used by the frontend to show invitation details before accepting.

```bash
curl "https://api.fyso.dev/auth/invite/a1b2c3..."
```

**Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "email": "newuser@example.com",
    "tenantSlug": "my-company"
  }
}
```

### Accept Invitation (Public)

```
POST /auth/invite/accept
```

Accepts a tenant invitation and creates a tenant user account. No prior authentication needed — the invitation token acts as the gate.

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"token": "a1b2c3...", "email": "newuser@example.com", "name": "New User", "password": "securepass123"}' \
  "https://api.fyso.dev/auth/invite/accept"
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "member"
  }
}
```

### Superadmin: List All Invitations

```
GET /api/admin/platform/invitations
```

Cross-tenant view of all invitations. Supports filtering and pagination.

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `pending`, `accepted`, `expired`, `revoked` |
| `tenantId` | string | Filter by tenant ID |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |

```bash
curl -H "X-Admin-Secret: ADMIN_SECRET" \
  "https://api.fyso.dev/api/admin/platform/invitations?status=pending&page=1&limit=20"
```

## Related MCP Tools

- `get_rest_api_spec` -- Generates the full specification with example curl commands
- `generate_api_client` -- Generates a complete TypeScript client with types
- `tenant_login` -- Login as a tenant user (returns JWT)
