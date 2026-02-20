# Usuarios y roles

Cada tenant tiene su propia tabla de usuarios, aislada de otros tenants.

## MCP Tool: `create_user`

**Perfil:** core

Crea un usuario dentro del tenant.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `tenantSlug` | string | Si | Slug del tenant |
| `email` | string | Si | Email (unico en el tenant) |
| `password` | string | Si | Password (min 8 caracteres, se hashea) |
| `name` | string | Si | Nombre completo |
| `role` | string | No | Rol: `owner`, `admin`, `member`, `viewer`. Default: `member` |
| `permissions` | object | No | Permisos por entidad |
| `metadata` | object | No | Datos adicionales (telefono, departamento, posicion, avatar) |

### Roles

| Rol | Descripcion |
|-----|-------------|
| `owner` | Control total. Puede gestionar todo |
| `admin` | Puede gestionar usuarios y configuraciones |
| `member` | Puede crear y editar registros |
| `viewer` | Solo lectura |

### Permisos por entidad

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

### Ejemplo

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

### Login despues de crear

El usuario puede autenticarse via REST:

```bash
curl -X POST "https://api.fyso.dev/api/auth/tenant/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: mi-empresa" \
  -d '{"email":"vendedor@empresa.com","password":"password123"}'
```

O via MCP:

```
tenant_login({
  tenantSlug: "mi-empresa",
  email: "vendedor@empresa.com",
  password: "password123"
})
```

## MCP Tool: `list_users`

**Perfil:** core

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `tenantSlug` | string | No | Slug del tenant. Default: tenant seleccionado |

### Ejemplo

```
list_users({ tenantSlug: "mi-empresa" })
```

### Respuesta

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

Las passwords nunca se retornan.

## RBAC: Roles custom (v1.10.0)

Ademas de los 4 roles basicos, puedes crear roles personalizados con permisos granulares.

### MCP Tool: `list_roles`

**Perfil:** core

Lista todos los roles del tenant (sistema + custom).

```
list_roles()
```

### MCP Tool: `create_role`

**Perfil:** advanced

Crea un rol custom con permisos especificos por entidad.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `name` | string | Si | Nombre del rol (ej: "vendedor") |
| `description` | string | No | Descripcion del rol |
| `permissions` | object | Si | Permisos por entidad |

### Ejemplo

```
create_role({
  name: "vendedor",
  description: "Acceso a clientes y productos, solo lectura en facturas",
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

**Perfil:** advanced

```
assign_role({
  userId: "uuid-del-usuario",
  roleId: "uuid-del-rol"
})
```

### MCP Tool: `remove_role`

**Perfil:** advanced

```
remove_role({
  userId: "uuid-del-usuario",
  roleId: "uuid-del-rol"
})
```

### Roles del sistema

| Rol | Editable | Eliminable |
|-----|----------|------------|
| `owner` | No | No |
| `admin` | No | No |
| `member` | No | No |
| `viewer` | No | No |
| Custom | Si | Si |

## MCP Tool: `tenant_login`

**Perfil:** advanced

Login como usuario del tenant. Retorna un JWT para usar con la REST API.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `tenantSlug` | string | Si | Slug del tenant |
| `email` | string | Si | Email del usuario |
| `password` | string | Si | Password |

### Respuesta

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
