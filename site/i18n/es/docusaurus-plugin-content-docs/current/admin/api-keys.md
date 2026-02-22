# API Keys de Administración

Las API keys de administración (`fyso_adm_*`) permiten acceso programático a los endpoints de administración de plataforma. Son independientes de las keys de tenant y de las credenciales de sesión super-admin.

Usá las admin API keys para automatizar el aprovisionamiento de tenants, el monitoreo de plataforma u otras tareas administrativas desde sistemas externos.

## Formato de las keys

Las keys siguen el formato `fyso_adm_<48-char-hex>`. El valor completo se muestra **una sola vez** al crearla. Guardala de forma segura — no puede recuperarse después.

## Scopes

Cada key se crea con uno o más scopes que definen a qué puede acceder:

| Scope | Descripción |
|-------|-------------|
| `platform:read` | Leer metadatos de plataforma y listados de keys |
| `platform:write` | Crear y revocar admin API keys |
| `tenants:manage` | Crear, modificar y eliminar tenants |

## Autenticación

Incluí la key de una de estas dos formas:

```bash
# Opción 1: header X-Admin-Key
curl -H "X-Admin-Key: fyso_adm_..." https://api.fyso.dev/api/admin/platform/keys

# Opción 2: header Authorization
curl -H "Authorization: AdminKey fyso_adm_..." https://api.fyso.dev/api/admin/platform/keys
```

## Endpoints

Todos los endpoints requieren autenticación super-admin además de un scope de admin key válido.

### Listar keys

```bash
GET /api/admin/platform/keys
```

Devuelve todas las admin keys activas y revocadas (los valores de las keys nunca se devuelven, solo el prefijo).

```bash
curl -H "X-Admin-Key: fyso_adm_..." \
  https://api.fyso.dev/api/admin/platform/keys
```

**Respuesta:**

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

### Crear una key

```bash
POST /api/admin/platform/keys
Content-Type: application/json

{
  "name": "CI Pipeline",
  "scopes": ["tenants:manage"],
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Etiqueta legible para la key |
| `scopes` | string[] | Sí | Uno o más scopes válidos |
| `expiresAt` | fecha ISO | No | Fecha de expiración. Omitir para key sin vencimiento |

**Respuesta** (key visible solo una vez):

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

### Revocar una key

```bash
DELETE /api/admin/platform/keys/:id
```

Desactiva la key de forma inmediata. Todas las requests posteriores que la usen devuelven `401`.

```bash
curl -X DELETE -H "X-Admin-Key: fyso_adm_..." \
  https://api.fyso.dev/api/admin/platform/keys/uuid
```

### Log de auditoría

```bash
GET /api/admin/platform/keys/:id/audit?limit=100
```

Devuelve el historial de uso de una key: creación, cada llamada a la API y revocación. Máximo 500 entradas por request.

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

## Seguridad

- Los valores de las keys se hashean con bcrypt. El plaintext nunca se almacena ni se vuelve a exponer.
- Las keys expiradas se rechazan en la validación aunque estén marcadas como activas.
- Toda creación, uso y revocación queda registrada en el log de auditoría.
- La búsqueda por prefijo (`fyso_adm_` + 9 chars) reduce candidatos antes de verificar el hash.
