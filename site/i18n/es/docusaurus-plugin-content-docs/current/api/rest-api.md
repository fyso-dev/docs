# REST API

Fyso expone una REST API para acceso externo a los datos del tenant.

## Autenticacion

Dos metodos disponibles:

### 1. Token de usuario del tenant

```bash
# 1. Login para obtener token
curl -X POST "https://api.fyso.dev/api/auth/tenant/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: mi-empresa" \
  -d '{"email":"user@example.com","password":"password123"}'

# Respuesta:
# { "success": true, "data": { "token": "jwt...", "user": {...} } }

# 2. Usar el token
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://api.fyso.dev/api/entities/clientes/records"
```

### 2. API Key

```bash
curl -H "Authorization: Bearer API_KEY" \
  "https://api.fyso.dev/api/entities/clientes/records"

# O alternativa:
curl -H "X-API-Key: API_KEY" \
  "https://api.fyso.dev/api/entities/clientes/records"
```

## Endpoints CRUD

### Listar registros

```
GET /api/entities/{entityName}/records
```

**Query params:**

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `page` | number | 1 | Numero de pagina (1-indexed) |
| `limit` | number | 20 | Items por pagina (max 100) |
| `sort` | string | - | Campo para ordenar |
| `order` | string | `asc` | Direccion: `asc` o `desc` |
| `search` | string | - | Busqueda full-text en campos de texto |
| `resolve` | boolean | - | Expandir relaciones a objetos completos |
| `filter.{fieldKey}` | string | - | Filtro por campo (ej: `filter.estado=activo`) |

**Respuesta:**

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

### Obtener un registro

```
GET /api/entities/{entityName}/records/{id}
```

**Query params:** `resolve` (boolean)

### Crear un registro

```
POST /api/entities/{entityName}/records
Content-Type: application/json

{
  "nombre": "Juan Perez",
  "email": "juan@example.com"
}
```

### Actualizar un registro

```
PUT /api/entities/{entityName}/records/{id}
Content-Type: application/json

{
  "email": "juan.nuevo@example.com"
}
```

Soporta actualizaciones parciales.

### Eliminar un registro

```
DELETE /api/entities/{entityName}/records/{id}
```

## Vistas

Las vistas son proyecciones filtradas de entidades con permisos RBAC independientes. Ver [Vistas de entidades](/entities/views) para la guia completa.

### Listar vistas

```
GET /api/views
```

Retorna todas las vistas. Admin ve todas; los usuarios de tenant solo ven las vistas en las que tienen permiso `view:<slug>` de lectura.

### Crear vista

```
POST /api/views
Content-Type: application/json

{
  "entitySlug": "tickets",
  "slug": "mis-tickets",
  "name": "Mis Tickets",
  "description": "Tickets reportados por el usuario actual",
  "filterDsl": {
    "validate": [{ "condition": "reporter == $currentUser" }]
  }
}
```

Requiere acceso admin.

### Actualizar vista

```
PUT /api/views/{slug}
Content-Type: application/json

{
  "name": "Nombre actualizado",
  "filterDsl": { "validate": [{ "condition": "status == 'open'" }] }
}
```

### Eliminar vista

```
DELETE /api/views/{slug}
```

### Listar registros a traves de una vista

```
GET /api/views/{viewSlug}/records
```

Mismos parametros de query que el listado de registros de entidad (`page`, `limit`, `sort`, `order`, `search`, `resolve`, `filter.*`). El filtro base de la vista se aplica automaticamente y se compone con cualquier filtro adicional del query string.

### Obtener un registro a traves de una vista

```
GET /api/views/{viewSlug}/records/{id}
```

Retorna `404` si el registro no coincide con el filtro de la vista.

---

## Estructura del registro

Los campos de la entidad estan dentro de `record.data`:

```
record.data.email     -- CORRECTO
record.email          -- INCORRECTO
```

### Ejemplos de filtrado

```bash
# Filtro de igualdad simple
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: mi-empresa" \
  "https://api.fyso.dev/api/entities/clientes/records?filters=estado%20%3D%20activo"

# Filtro AND compuesto
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: mi-empresa" \
  "https://api.fyso.dev/api/entities/tickets/records?filters=estado%20%3D%20abierto%20AND%20prioridad%20%3D%20alta"

# Filtro contains (busqueda de texto)
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: mi-empresa" \
  "https://api.fyso.dev/api/entities/clientes/records?filters=nombre%20contains%20juan"

# Combinar contains con AND
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: mi-empresa" \
  "https://api.fyso.dev/api/entities/clientes/records?filters=nombre%20contains%20juan%20AND%20estado%20%3D%20activo"

# Resolver relaciones (profundidad 1)
curl -H "Authorization: Bearer JWT_TOKEN" \
  -H "X-Tenant-ID: mi-empresa" \
  "https://api.fyso.dev/api/entities/pedidos/records?resolve_depth=1"
```

## Codigos de error

| Codigo | HTTP | Descripcion |
|--------|------|-------------|
| `NOT_FOUND` | 404 | Entidad o registro no encontrado |
| `VALIDATION_ERROR` | 400 | Datos invalidos |
| `BUSINESS_RULE_ERROR` | 400 | Una regla de negocio impidio la operacion |
| `UNAUTHORIZED` | 401 | API key faltante o invalida |
| `FORBIDDEN` | 403 | Sin permisos para la operacion |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |

**Formato de error:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo 'nombre' es obligatorio"
  }
}
```

## MCP Tools relacionados

- `get_rest_api_spec` -- Genera la especificacion completa con curl de ejemplo
- `generate_api_client` -- Genera un cliente TypeScript completo con tipos
- `tenant_login` -- Login como usuario del tenant (retorna JWT)
