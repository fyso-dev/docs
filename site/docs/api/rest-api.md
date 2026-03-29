# REST API

Fyso exposes a REST API for external access to tenant data.

## Base URL

All API requests use a single centralized host:

```
https://api.fyso.dev/api
```

> **Important:** Do NOT use tenant subdomains (e.g., `my-tenant.fyso.dev`) for API calls. The API is centralized — tenant isolation is handled via the `X-Tenant-ID` header.

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
  -H "X-Tenant-ID: mi-empresa" \
  "https://api.fyso.dev/api/entities/clientes/records"
```

### 2. API Key

```bash
curl -H "Authorization: Bearer API_KEY" \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/clientes/records"

# Or alternative:
curl -H "X-API-Key: API_KEY" \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/clientes/records"
```

### Required Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer {JWT}` or `Bearer {API_KEY}` or `Bearer {fyso_pk_*}` |
| X-Tenant-ID | Yes | Tenant slug (e.g., `my-company-abc123`) |
| Content-Type | Yes (POST/PUT) | `application/json` |

### 3. Developer Token

Developer tokens are long-lived session tokens intended for external app development — agent UIs, scripts, and integrations that need persistent access without re-authenticating every 24 hours.

```bash
curl -X POST "https://api.fyso.dev/api/auth/tenant/developer-token" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-workspace" \
  -d '{"email":"dev@example.com","password":"password123","ttl_days":90}'
```

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | Yes | Tenant user email |
| `password` | string | Yes | Tenant user password |
| `ttl_days` | number | No | Token lifetime in days. Default: 360. Max: 365. |

**Required header:** `X-Tenant-ID` — the tenant slug.

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "expiresAt": "2027-03-28T00:00:00Z",
    "user": { "id": "uuid", "email": "dev@example.com" }
  }
}
```

Use the returned token in the `Authorization: Bearer` header on any subsequent request. The token authenticates as the tenant user — it carries the same permissions as a normal session token, but lasts as long as `ttl_days` specifies.

**When to use developer tokens vs. API keys:**

| | Developer token | API key |
|--|----------------|---------|
| TTL | Up to 365 days | Non-expiring (until revoked) |
| Bound to | A specific user (with their roles) | The tenant (entity-scoped permissions) |
| Typical use | Development, agent UIs, external scripts | Server-to-server integrations, bots |

### 4. Bot JWT

Bots are service accounts that authenticate with a name and secret to receive a short-lived JWT. The JWT is then used on entity endpoints exactly like any other token.

```bash
# 1. Identify the bot to get a JWT
curl -X POST https://api.fyso.dev/api/auth/bots/identify \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "my-bot", "secret": "bot-secret" }'

# Response includes: { "token": "eyJhbGci...", "expiresIn": 3600 }

# 2. Use the JWT on entity endpoints
curl -H "Authorization: Bearer BOT_JWT" \
  "https://api.fyso.dev/api/entities/products/records"
```

Bots carry scoped permissions (`entities: { entityName: ["create", "read", "update", "delete"] }`) defined at registration. Requests that exceed declared permissions return `403`.

See [Bot Identity](/docs/agents/bot-identity) for the full guide: registration, permissions, JWT refresh pattern, lockout behavior, and secret rotation.

## Bot Endpoints

All bot endpoints are under `/api/auth/bots` and require an admin JWT.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/bots/register` | Register a new bot with permissions |
| `POST` | `/api/auth/bots/identify` | Authenticate — returns JWT |
| `GET` | `/api/auth/bots` | List bots (scoped to authenticated admin) |
| `POST` | `/api/auth/bots/:id/revoke` | Revoke a bot permanently |
| `POST` | `/api/auth/bots/:id/reset-secret` | Rotate bot secret (admin only) |

### Register — `POST /api/auth/bots/register`

**Request body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | 3-50 chars, lowercase, alphanumeric and hyphens. Unique per tenant. |
| `tenantSlug` | string | Yes | Tenant the bot belongs to. |
| `permissions` | object | No | `{ entities: { [entityName]: string[] } }`. No wildcards. |

**Response (201):** `{ id, name, secret, tenantSlug }`. Secret shown once.

### Identify — `POST /api/auth/bots/identify`

**Request body:** `{ name, secret }`

**Response (200):** `{ id, name, tenantSlug, tenantId, permissions, token, expiresIn }`. Token TTL: 3600 seconds.

**Errors:** `401` (wrong secret, locked), `403` (revoked).

### List — `GET /api/auth/bots`

Returns all bots belonging to the authenticated admin. No `secret` field.

### Revoke — `POST /api/auth/bots/:id/revoke`

Permanent. Active JWTs issued before revocation remain valid until their TTL.

**Response (200):** `{ revoked: true }`

### Reset secret — `POST /api/auth/bots/:id/reset-secret`

Old secret is invalidated immediately. Returns new secret (shown once).

**Response (200):** `{ id, name, secret }`

## CRUD Endpoints

### List Records

```
GET /api/entities/{entityName}/records
```

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/clientes/records?page=1&limit=20"
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
| `resolve_depth` | number | - | Relation resolution depth (max 2 on list endpoints, max 3 on single record). Example: `?resolve_depth=1` |
| `filters` | string | - | Filter expression. Example: `?filters=status = active`. Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`. Combine with `AND`: `?filters=status = active AND role = admin` |
| `filter.{fieldKey}` | string | - | Legacy per-field filter (e.g., `filter.estado=activo`). Prefer `filters` for compound logic. |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "entityId": "uuid",
        "nombre": "Juan Perez",
        "email": "juan@example.com",
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

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/clientes/records/{id}"
```

**Query params:** `resolve` (boolean)

### Create a Record

```
POST /api/entities/{entityName}/records
```

```bash
curl -X POST -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Perez", "email": "juan@example.com"}' \
  "https://api.fyso.dev/api/entities/clientes/records"
```

### Update a Record

```
PUT /api/entities/{entityName}/records/{id}
PATCH /api/entities/{entityName}/records/{id}
```

Both verbs share the same handler and support partial updates — only the fields included in the request body are written.

```bash
# PUT and PATCH are interchangeable
curl -X PATCH -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  -H "Content-Type: application/json" \
  -d '{"email": "juan.nuevo@example.com"}' \
  "https://api.fyso.dev/api/entities/clientes/records/{id}"
```

### Delete a Record

```
DELETE /api/entities/{entityName}/records/{id}
```

```bash
curl -X DELETE -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/clientes/records/{id}"
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

Records use a flat format introduced in v1.26.0. Entity fields are at the top level of the record object alongside system fields:

```json
{
  "id": "uuid",
  "entityId": "uuid",
  "nombre": "Juan Perez",
  "email": "juan@example.com",
  "createdAt": "2026-03-01T12:00:00.000Z",
  "updatedAt": "2026-03-01T12:00:00.000Z"
}
```

```
record.email          -- CORRECT (flat)
record.nombre         -- CORRECT (flat)
record.data.email     -- WRONG (old nested format, removed in v1.26.0)
```

**Response envelope for lists:**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Reserved field names

The following names cannot be used as custom field keys — they are system fields always present at the top level:

`id`, `entityId`, `name`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

Attempting to create an entity field with one of these names returns a `400 VALIDATION_ERROR`.

### Filtering examples

```bash
# Simple equality filter
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company" \
  "https://api.fyso.dev/api/entities/clientes/records?filters=status%20%3D%20activo"

# Compound AND filter
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company" \
  "https://api.fyso.dev/api/entities/tickets/records?filters=status%20%3D%20open%20AND%20priority%20%3D%20high"

# Contains filter (text search)
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company" \
  "https://api.fyso.dev/api/entities/clientes/records?filters=nombre%20contains%20juan"

# Combine contains with AND
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company" \
  "https://api.fyso.dev/api/entities/clientes/records?filters=nombre%20contains%20juan%20AND%20estado%20%3D%20activo"

# Resolve relations (depth 1)
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: my-company" \
  "https://api.fyso.dev/api/entities/pedidos/records?resolve_depth=1"
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
