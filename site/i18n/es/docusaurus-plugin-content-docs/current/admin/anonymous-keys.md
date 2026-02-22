# API Keys anónimas

Las API keys anónimas (`anon_*`) permiten que clientes públicos — navegadores, widgets, apps embebidas — accedan a recursos del tenant sin autenticación de usuario.

Usá las anonymous keys para funcionalidades públicas: feeds de datos de solo lectura, changelogs embebidos, búsqueda pública o cualquier endpoint accesible sin login.

## Formato de las keys

Las keys tienen el prefijo `anon_`. El valor completo se muestra **una sola vez** al crearla. Guardala de forma segura en tu build de frontend — no puede recuperarse después.

## Scopes

Las anonymous keys solo admiten scopes de lectura pública:

| Scope | Descripción |
|-------|-------------|
| `records:read` | Leer registros de entidades publicadas |
| `channels:read` | Leer mensajes de canales |

Los scopes de escritura no están disponibles para anonymous keys.

## TTL

El TTL es **obligatorio** — las anonymous keys siempre vencen. No es posible crear una key permanente.

| Parámetro | Default | Máximo |
|-----------|---------|--------|
| `ttlDays` | 90 días | 365 días |

## Rate limits

Cada key tiene sus propios rate limits. Las requests que los superen reciben `429`.

| Parámetro | Default |
|-----------|---------|
| `rateLimitPerMin` | 60 req/min |
| `rateLimitPerDay` | 1.000 req/día |

## CORS

Opcionalmente, restringí qué orígenes pueden enviar requests con esta key. Un array `allowedOrigins` vacío permite todos los orígenes.

```json
"allowedOrigins": ["https://miapp.com", "https://preview.miapp.com"]
```

## Cuota

Máximo **20 anonymous keys activas** por tenant.

---

## Herramientas MCP

### `create_anonymous_key`

**Perfil:** advanced

Crea una anonymous API key. El valor de la key solo es visible en la respuesta — no se almacena y no puede recuperarse después.

```
create_anonymous_key({
  label: "Widget changelog público",
  scopes: ["records:read"],
  ttl_days: 90,
  allowed_origins: ["https://misitioweb.com"],
  rate_limit_per_min: 30,
  rate_limit_per_day: 500
})
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `label` | string | Sí | Nombre legible |
| `scopes` | string[] | Sí | Uno o más scopes válidos |
| `ttl_days` | number | No | Vida en días (1–365, default: 90) |
| `allowed_origins` | string[] | No | Lista CORS. Vacío = todos los orígenes |
| `rate_limit_per_min` | number | No | Requests por minuto (default: 60) |
| `rate_limit_per_day` | number | No | Requests por día (default: 1.000) |

**Respuesta** (key visible solo una vez):

```json
{
  "id": "uuid",
  "key": "anon_abc123...",
  "keyPrefix": "anon_abc1",
  "label": "Widget changelog público",
  "scopes": ["records:read"],
  "allowedOrigins": ["https://misitioweb.com"],
  "rateLimitPerMin": 30,
  "rateLimitPerDay": 500,
  "expiresAt": "2026-11-30T00:00:00Z",
  "createdAt": "2026-02-22T12:00:00Z"
}
```

---

### `list_anonymous_keys`

**Perfil:** advanced

Lista todas las anonymous keys del tenant actual. Los valores de las keys nunca se devuelven — solo metadatos.

```
list_anonymous_keys()
```

---

### `revoke_anonymous_key`

**Perfil:** advanced

Revoca una anonymous key de forma inmediata. No hay período de gracia. La key no puede restaurarse.

```
revoke_anonymous_key({ key_id: "uuid" })
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `key_id` | string | Sí | UUID de la key (de `list_anonymous_keys`) |

---

## Endpoints REST

Todos los endpoints de gestión requieren autenticación de admin del tenant.

### Listar keys

```bash
GET /api/auth/anonymous-keys
Authorization: Bearer <admin-token>
```

### Crear una key

```bash
POST /api/auth/anonymous-keys
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "label": "Widget changelog público",
  "scopes": ["records:read"],
  "ttlDays": 90,
  "allowedOrigins": ["https://misitioweb.com"],
  "rateLimitPerMin": 30,
  "rateLimitPerDay": 500
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `label` | string | Sí | Nombre legible |
| `scopes` | string[] | Sí | Scopes válidos (`records:read`, `channels:read`) |
| `ttlDays` | number | No | Vida en días (1–365, default: 90) |
| `allowedOrigins` | string[] | No | Lista CORS |
| `rateLimitPerMin` | number | No | Requests por minuto |
| `rateLimitPerDay` | number | No | Requests por día |

**Respuesta** (key visible solo una vez):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "anon_abc123...",
    "keyPrefix": "anon_abc1",
    "label": "Widget changelog público",
    "scopes": ["records:read"],
    "allowedOrigins": ["https://misitioweb.com"],
    "rateLimitPerMin": 30,
    "rateLimitPerDay": 500,
    "expiresAt": "2026-11-30T00:00:00Z",
    "createdAt": "2026-02-22T12:00:00Z"
  }
}
```

### Revocar una key

```bash
DELETE /api/auth/anonymous-keys/:id
Authorization: Bearer <admin-token>
```

Revocación inmediata. Devuelve `404` si la key no existe o pertenece a otro tenant.

### Log de auditoría

```bash
GET /api/auth/anonymous-keys/:id/audit?limit=100
Authorization: Bearer <admin-token>
```

Devuelve eventos de creación, rotación y revocación de la key. Máximo 500 entradas por request.

```json
{
  "success": true,
  "data": [
    {
      "action": "created",
      "actor": "admin:uuid",
      "createdAt": "2026-02-22T12:00:00Z"
    },
    {
      "action": "revoked",
      "actor": "admin:uuid",
      "createdAt": "2026-02-23T09:00:00Z"
    }
  ]
}
```

---

## Seguridad

- Los valores de las keys se hashean con bcrypt. El plaintext nunca se almacena ni se vuelve a exponer.
- El TTL es obligatorio — no es posible crear anonymous keys indefinidas.
- La revocación es síncrona (UPDATE inmediato en DB).
- Toda creación y revocación queda registrada en el log de auditoría.
