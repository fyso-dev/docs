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

## Estructura del registro

Los campos de la entidad estan dentro de `record.data`:

```
record.data.email     -- CORRECTO
record.email          -- INCORRECTO
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
