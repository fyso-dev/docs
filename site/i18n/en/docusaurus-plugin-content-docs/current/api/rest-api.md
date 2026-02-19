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

## Related MCP Tools

- `get_rest_api_spec` -- Generates the full specification with example curl commands
- `generate_api_client` -- Generates a complete TypeScript client with types
- `tenant_login` -- Login as a tenant user (returns JWT)
