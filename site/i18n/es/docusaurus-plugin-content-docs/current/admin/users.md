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
| `isOwner` | boolean | No | Otorga privilegios de propietario (gestionar toda la configuracion). Default: `false` |
| `metadata` | object | No | Datos adicionales (telefono, departamento, posicion, avatar) |

### Modelo RBAC

Fyso usa un **modelo RBAC puro**. No hay roles fijos predefinidos. En su lugar, se crean roles personalizados con permisos especificos y se asignan a los usuarios.

Los roles semilla (admin, editor, viewer) se proporcionan como plantillas editables — se pueden renombrar, cambiar sus permisos o eliminarlos por completo.

El unico flag especial es `isOwner`, que otorga acceso administrativo completo al tenant (gestionar usuarios, configuracion, facturacion). Uno o mas usuarios por tenant pueden tener el flag de owner.

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
      "isOwner": true,
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

Habilita las funcionalidades de autogestión via `PUT /api/auth/tenants/:id/settings`:

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

Crea un usuario con el rol viewer por defecto. Devuelve `403` si `selfRegistrationEnabled` es `false`, `409` si el email ya existe.

Rate limit: **5 requests por hora** por IP + tenant.

**Respuesta (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "jane@example.com",
    "name": "Jane Builder"
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

Aplica la nueva contraseña usando el token de un solo uso del email de recuperación. Los tokens vencen en **1 hora** y se invalidan en el primer uso. Emitir un nuevo token de recuperacion invalida cualquier token pendiente anterior para ese usuario. Devuelve `403` si `passwordResetEnabled` es `false`.

Todas las sesiones activas del usuario se invalidan cuando se resetea la contraseña exitosamente.

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

Los usuarios autenticados pueden cambiar su propia contraseña. Valida la contraseña actual antes de aplicar el cambio. Devuelve `401` si `current_password` es incorrecta. Todas las demas sesiones activas se invalidan despues de un cambio exitoso.

---

### Reset de contraseña por admin

```bash
PATCH /api/auth/tenant/users/:id/reset-password
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "new_password": "nuevacontraseña123" }
```

Usuarios con permiso de gestion (o `isOwner`) pueden resetear la contraseña de cualquier usuario sin conocer la contraseña actual. Todas las sesiones activas del usuario afectado se invalidan.

Este endpoint tambien esta disponible como la herramienta MCP `update_user_password`.

---

## MCP Tool: `update_user_password`

**Perfil:** core

Resetea la contraseña de un usuario del tenant. Los owners y admins pueden establecer una nueva contraseña para cualquier usuario sin conocer la actual. Util para recuperacion de cuentas cuando el usuario no puede iniciar sesion.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `userId` | string | Si | UUID del usuario |
| `newPassword` | string | Si | Nueva contraseña (min 8 caracteres) |
| `tenantSlug` | string | No | Slug del tenant. Default: tenant seleccionado |

### Ejemplo

```
update_user_password({
  userId: "uuid-del-usuario",
  newPassword: "nuevacontraseña123"
})
```

Todas las sesiones activas del usuario se invalidan cuando se resetea la contraseña. El usuario puede iniciar sesion inmediatamente con la nueva contraseña.

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
    "isOwner": false
  },
  "usage": {
    "header": "Authorization",
    "value": "Bearer eyJhbGci...",
    "note": "Use this token in the Authorization header for REST API calls"
  }
}
```

---

## Codigos de invitacion

Los codigos de invitacion controlan quien puede unirse a tu tenant cuando el auto-registro esta deshabilitado. Cada codigo puede ser de uso unico o multiple, con vencimiento opcional y una nota para identificarlo.

Todos los endpoints de invitaciones requieren un token de administrador autenticado en el header `Authorization: Bearer <token>`.

### Generar una invitacion

```bash
curl -X POST https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"note": "equipo contratista", "maxUses": 5, "expiresAt": "2026-03-31T00:00:00Z"}'
```

**Parametros del cuerpo** (todos opcionales):

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `note` | string | Etiqueta interna para identificar el codigo |
| `maxUses` | number | Maxima cantidad de usos. Por defecto: `1` |
| `expiresAt` | string | Fecha de vencimiento en formato ISO 8601 |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "token": "FYSO-A3B4-C5D6",
    "inviteUrl": "https://app.example.com/invite/FYSO-A3B4-C5D6"
  }
}
```

Comparte el `inviteUrl` directamente con el invitado, o usa el `token` en un flujo de onboarding personalizado.

### Listar todas las invitaciones

```bash
curl https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>"
```

Devuelve todos los codigos de invitacion del tenant, incluyendo contadores de uso y estado.

### Invalidar una invitacion

```bash
curl -X DELETE https://api.fyso.dev/api/invitations/FYSO-A3B4-C5D6 \
  -H "Authorization: Bearer <admin-token>"
```

Desactiva el codigo (`is_active = false`). Cualquier intento posterior de uso devuelve un error. Retorna `404` si el token no se encuentra.

### Validar un codigo (publico)

```bash
curl -X POST https://api.fyso.dev/api/invitations/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "FYSO-A3B4-C5D6"}'
```

No requiere autenticacion. Retorna `{ "valid": true }` si el codigo esta activo, no vencido y tiene usos disponibles.

---

## Invitaciones de miembros del tenant

Las invitaciones de miembros permiten invitar a personas especificas a unirse a un tenant mediante un link de un solo uso. A diferencia de los codigos de invitacion (que controlan el registro en la plataforma), estas invitaciones crean un camino de onboarding directo a un tenant existente.

Todos los endpoints requieren un token de administrador autenticado en `Authorization: Bearer <admin-token>` y el header `X-Tenant-Slug: <slug>` para identificar el tenant.

### Crear una invitacion

```bash
curl -X POST https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Tenant-Slug: mi-tenant" \
  -H "Content-Type: application/json" \
  -d '{"email": "colega@empresa.com", "expiresInDays": 7}'
```

**Parametros del cuerpo** (todos opcionales):

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `email` | string | Limita la invitacion a este email. El invitado debe registrarse con esta direccion exacta. |
| `expiresInDays` | number | Dias hasta que vence la invitacion. Por defecto: `7` |

**Respuesta (201):**

```json
{
  "success": true,
  "data": {
    "token": "a3f1b2c4...hex64",
    "inviteUrl": "https://app.fyso.dev/invite/a3f1b2c4...hex64"
  }
}
```

Comparte el `inviteUrl` con el invitado. El link es valido hasta que se acepte o venza. Cada invitacion es de un solo uso.

### Listar invitaciones

```bash
curl https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Tenant-Slug: mi-tenant"
```

Devuelve todas las invitaciones del tenant ordenadas por fecha de creacion. Las invitaciones pendientes con fecha vencida se marcan automaticamente como `expired` al recuperarlas.

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "token": "a3f1b2c4...hex64",
      "email": "colega@empresa.com",
      "status": "pending",
      "accepted_at": null,
      "expires_at": "2026-03-02T12:00:00Z",
      "created_at": "2026-02-23T12:00:00Z",
      "invited_by_name": "Admin Principal",
      "invited_by_email": "admin@mi-tenant.com"
    }
  ]
}
```

**Valores de estado:**

| Estado | Descripcion |
|--------|-------------|
| `pending` | Invitacion enviada, aun no aceptada |
| `accepted` | El invitado se registro exitosamente |
| `expired` | Vencio sin ser aceptada |
| `revoked` | Cancelada manualmente por un admin |

### Revocar una invitacion

```bash
curl -X DELETE https://api.fyso.dev/api/invitations/<token> \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Tenant-Slug: mi-tenant"
```

Cambia el estado de la invitacion a `revoked`. Solo se pueden revocar invitaciones en estado `pending`. Retorna `404` si el token no se encuentra o ya fue usado o vencido.

### Previsualizar una invitacion (publico)

```bash
curl https://api.fyso.dev/auth/invite/<token>
```

No requiere autenticacion. Devuelve los detalles de la invitacion para que el frontend pueda mostrar una vista previa antes de que el usuario se registre.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "email": "colega@empresa.com",
    "tenantSlug": "mi-tenant"
  }
}
```

Retorna `400` con un mensaje de error si la invitacion es invalida, vencida, aceptada o revocada.

### Aceptar una invitacion

```bash
curl -X POST https://api.fyso.dev/auth/invite/accept \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token-de-invitacion>",
    "email": "colega@empresa.com",
    "name": "Juan Perez",
    "password": "contraseñasegura"
  }'
```

No requiere autenticacion previa. El token de invitacion actua como acceso.

**Parametros del cuerpo:**

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `token` | string | Si | Token de invitacion del link recibido |
| `email` | string | Si | Email del registro. Debe coincidir con el email de la invitacion si se especifico uno |
| `name` | string | Si | Nombre completo (minimo 1 caracter sin espacios) |
| `password` | string | Si | Contrasena (minimo 8 caracteres) |

**Respuesta (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "colega@empresa.com",
    "name": "Juan Perez"
  }
}
```

La invitacion se reclama de forma atomica — solicitudes concurrentes no pueden reclamar el mismo token dos veces. Retorna `409` si el email ya existe en el tenant, `403` si el email no coincide con la invitacion, y `403` si el token es invalido, vencido o revocado.

---

## Login de usuario del tenant

Los usuarios del tenant (invitados mediante invitaciones de miembros) inician sesion a traves de un endpoint dedicado:

```bash
POST /api/auth/tenant/login
X-Tenant-ID: <tenant-slug>
Content-Type: application/json

{ "email": "user@example.com", "password": "password123" }
```

El JWT retornado incluye un flag `isTenantUser`. El frontend inyecta automaticamente el header `X-Tenant-ID` en todas las llamadas posteriores a la API.

---

## Auditoria de asignacion de roles

Todas las asignaciones y revocaciones de roles se registran en `role_assignment_log`:

```bash
GET /api/roles/:roleId/audit
Authorization: Bearer <admin-token>
```

Retorna un registro cronologico de quien asigno o revoco el rol, cuando y para que usuario. Las acciones de administradores tambien se atribuyen — cada operacion CRUD registra que usuario administrador la realizo.

---

## Desactivar usuarios

Los propietarios del tenant pueden desactivar usuarios desde el panel de administracion. Los usuarios desactivados no pueden iniciar sesion pero sus datos se preservan. Cambie el estado activo desde la pagina de Usuarios.
