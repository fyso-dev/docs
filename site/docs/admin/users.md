# Users and Roles

Each tenant has its own user table, isolated from other tenants.

## MCP Tool: `create_user`

**Profile:** core

Creates a user within the tenant.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantSlug` | string | Yes | Tenant slug |
| `email` | string | Yes | Email (unique within the tenant) |
| `password` | string | Yes | Password (min 8 characters, hashed) |
| `name` | string | Yes | Full name |
| `role` | string | No | Role: `owner`, `admin`, `member`, `viewer`. Default: `member` |
| `permissions` | object | No | Per-entity permissions |
| `metadata` | object | No | Additional data (phone, department, position, avatar) |

### Roles

| Role | Description |
|------|-------------|
| `owner` | Full control. Can manage everything |
| `admin` | Can manage users and settings |
| `member` | Can create and edit records |
| `viewer` | Read only |

### Per-Entity Permissions

```json
{
  "entities": {
    "productos": ["create", "read", "update", "delete"],
    "facturas": ["read", "create"],
    "reportes": ["read"]
  },
  "canManageUsers": false,
  "canManageSettings": false
}
```

### Example

```
create_user({
  tenantSlug: "mi-empresa",
  email: "vendedor@empresa.com",
  password: "password123",
  name: "Carlos Vendedor",
  role: "member",
  permissions: {
    entities: {
      clientes: ["create", "read", "update"],
      productos: ["read"]
    }
  }
})
```

### Login After Creating

The user can authenticate via REST:

```bash
curl -X POST "https://api.fyso.dev/api/auth/tenant/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: mi-empresa" \
  -d '{"email":"vendedor@empresa.com","password":"password123"}'
```

Or via MCP:

```
tenant_login({
  tenantSlug: "mi-empresa",
  email: "vendedor@empresa.com",
  password: "password123"
})
```

## MCP Tool: `list_users`

**Profile:** core

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantSlug` | string | No | Tenant slug. Default: selected tenant |

### Example

```
list_users({ tenantSlug: "mi-empresa" })
```

### Response

```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "admin@empresa.com",
      "name": "Admin Principal",
      "role": "owner",
      "isActive": true,
      "lastLogin": "2026-02-18T10:00:00Z"
    }
  ],
  "total": 2
}
```

Passwords are never returned.

## RBAC: Custom Roles (v1.10.0)

In addition to the 4 basic roles, you can create custom roles with granular permissions.

### MCP Tool: `list_roles`

**Profile:** core

Lists all tenant roles (system + custom).

```
list_roles()
```

### MCP Tool: `create_role`

**Profile:** advanced

Creates a custom role with specific permissions per entity.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Role name (e.g., "vendedor") |
| `description` | string | No | Role description |
| `permissions` | object | Yes | Permissions per entity |

### Example

```
create_role({
  name: "vendedor",
  description: "Access to clients and products, read-only on invoices",
  permissions: {
    entities: {
      clientes: ["create", "read", "update"],
      productos: ["read"],
      facturas: ["read"]
    },
    canManageUsers: false,
    canManageSettings: false
  }
})
```

### MCP Tool: `assign_role`

**Profile:** advanced

```
assign_role({
  userId: "uuid-del-usuario",
  roleId: "uuid-del-rol"
})
```

### MCP Tool: `remove_role`

**Profile:** advanced

```
remove_role({
  userId: "uuid-del-usuario",
  roleId: "uuid-del-rol"
})
```

### System Roles

| Role | Editable | Deletable |
|------|----------|-----------|
| `owner` | No | No |
| `admin` | No | No |
| `member` | No | No |
| `viewer` | No | No |
| Custom | Yes | Yes |

## MCP Tool: `tenant_login`

**Profile:** advanced

Login as a tenant user. Returns a JWT for use with the REST API.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantSlug` | string | Yes | Tenant slug |
| `email` | string | Yes | User email |
| `password` | string | Yes | Password |

### Response

```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nombre",
    "role": "member"
  },
  "usage": {
    "header": "Authorization",
    "value": "Bearer eyJhbGci...",
    "note": "Use this token in the Authorization header for REST API calls"
  }
}
```
