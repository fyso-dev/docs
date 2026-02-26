---
sidebar_position: 7
---

# Gestion de APIs

La gestion de APIs permite definir APIs con nombre y control de acceso basado en roles (RBAC), y emitir llaves para cada rol. Cada definicion de API tiene su propia matriz de permisos que controla que entidades y operaciones puede acceder cada rol.

## Conceptos

- **Definicion de API**: Una API con nombre, slug, uno o mas roles y una matriz de permisos.
- **Rol**: Un nivel de acceso dentro de la API (por ejemplo, `viewer`, `editor`). Los roles son independientes de los roles de usuario del tenant.
- **Matriz de permisos**: Mapea entidades a roles, y roles a operaciones permitidas (`read`, `create`, `update`, `delete`).
- **Llave de plataforma** (`fyso_pkey_*`): Una llave emitida para una combinacion API + rol. Se muestra solo una vez al crearla.

## Matriz de permisos

```json
{
  "contactos": {
    "viewer": ["read"],
    "editor": ["read", "create", "update"]
  },
  "negocios": {
    "viewer": ["read"],
    "editor": ["read", "create", "update", "delete"]
  }
}
```

Usa `"*"` como nombre de entidad para otorgar acceso a todas las entidades para un rol:

```json
{
  "*": {
    "readonly": ["read"]
  }
}
```

## Endpoints REST

Todos los endpoints de gestion requieren autenticacion de admin del tenant.

### Listar APIs

```bash
GET /api/apis
Authorization: Bearer <token-admin>
```

### Crear una definicion de API

```bash
POST /api/apis
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "name": "API CRM Publica",
  "slug": "public-crm",
  "roles": ["viewer", "editor"],
  "permissions": {
    "contactos": { "viewer": ["read"], "editor": ["read", "create", "update"] },
    "negocios":  { "viewer": ["read"], "editor": ["read", "create", "update", "delete"] }
  }
}
```

Devuelve `201` con la definicion creada. Devuelve `409` si el slug ya existe.

### Actualizar una API

```bash
PUT /api/apis/:id
Authorization: Bearer <token-admin>
```

### Eliminar una API

```bash
DELETE /api/apis/:id
Authorization: Bearer <token-admin>
```

Elimina la definicion y en cascada todas las llaves emitidas para esa API.

---

## Gestion de llaves

### Emitir una llave

```bash
POST /api/apis/:id/keys
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "role": "viewer",
  "label": "Socio A - acceso lectura",
  "ttlDays": 365
}
```

**Respuesta** (llave visible solo una vez):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "fyso_pkey_abc123...",
    "role": "viewer",
    "label": "Socio A - acceso lectura",
    "expiresAt": "2027-02-26T00:00:00Z"
  }
}
```

### Revocar una llave

```bash
DELETE /api/apis/:id/keys/:keyId
Authorization: Bearer <token-admin>
```

---

## Usar llaves de plataforma

```bash
curl -H "Authorization: Bearer fyso_pkey_abc123..." \
  https://api.fyso.dev/api/entities/contactos/records
```

El middleware aplica la matriz de permisos en cada request. Las requests a entidades no incluidas en la matriz, o con operaciones no permitidas para el rol de la llave, devuelven `403 Forbidden`.

---

## Panel de administracion

Ve a **Configuracion → Gestion de APIs** en el panel para gestionar las definiciones visualmente:

- Crear y editar definiciones de API con editor visual de matriz de permisos
- Emitir llaves de plataforma por rol — la llave se revela una sola vez
- Revocar llaves individuales
- Soporte de entidad comodin `*` en el editor de matriz
