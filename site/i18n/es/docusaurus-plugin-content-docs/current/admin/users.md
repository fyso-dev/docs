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

---

## Flujos de autogestión

Los usuarios del tenant pueden registrarse, recuperar su contraseña y cambiarla sin intervención del administrador. Estas funcionalidades están **deshabilitadas por defecto** y deben habilitarse explícitamente por tenant.

### Feature flags

Habilitá las funcionalidades de autogestión via `PUT /api/auth/tenants/:id/settings`:

```bash
curl -X PUT "https://api.fyso.dev/api/auth/tenants/<tenant-id>/settings" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "selfRegistrationEnabled": true,
    "passwordResetEnabled": true
  }'
```

| Flag | Default | Descripción |
|------|---------|-------------|
| `selfRegistrationEnabled` | `false` | Permite que usuarios se registren solos (crea rol `viewer`) |
| `passwordResetEnabled` | `false` | Habilita el flujo de forgot-password / reset-password (requiere Resend configurado) |

Todos los endpoints de autogestión son anónimos — no requieren auth de admin, solo el header `X-Tenant-ID`.

---

### Autoregistro

```bash
POST /api/auth/tenant/register
X-Tenant-ID: <tenant-slug>
Content-Type: application/json

{
  "name": "Jane Builder",
  "email": "jane@example.com",
  "password": "contraseñasegura"
}
```

Crea un usuario con rol `viewer`. Devuelve `403` si `selfRegistrationEnabled` es `false`, `409` si el email ya existe.

**Respuesta (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "jane@example.com",
    "name": "Jane Builder",
    "role": "viewer"
  }
}
```

---

### Recuperar contraseña

```bash
POST /api/auth/tenant/forgot-password
X-Tenant-ID: <tenant-slug>
Content-Type: application/json

{ "email": "jane@example.com" }
```

Envía un link de recuperación por email. Siempre devuelve `200` — la respuesta nunca revela si el email existe o no. Devuelve `403` si `passwordResetEnabled` es `false`.

Rate limit: **3 requests cada 15 minutos** por IP + tenant.

---

### Resetear contraseña

```bash
POST /api/auth/tenant/reset-password
X-Tenant-ID: <tenant-slug>
Content-Type: application/json

{
  "token": "<token-del-email>",
  "new_password": "nuevacontraseñasegura"
}
```

Aplica la nueva contraseña usando el token de un solo uso del email de recuperación. Los tokens vencen en **1 hora** y se invalidan en el primer uso. Devuelve `403` si `passwordResetEnabled` es `false`.

---

### Cambiar contraseña (autenticado)

```bash
POST /api/auth/tenant/change-password
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "current_password": "contraseñaactual",
  "new_password": "nuevacontraseñasegura"
}
```

Los usuarios autenticados pueden cambiar su propia contraseña. Valida la contraseña actual antes de aplicar el cambio. Devuelve `401` si `current_password` es incorrecta.

---

### Reset de contraseña por admin

```bash
PATCH /api/auth/tenant/users/:id/reset-password
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "new_password": "nuevacontraseña123" }
```

Owner o admin puede resetear la contraseña de cualquier usuario sin conocer la contraseña actual. Requiere rol `owner` o `admin`.

---

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
