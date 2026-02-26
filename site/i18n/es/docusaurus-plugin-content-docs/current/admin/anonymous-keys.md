# Llaves publicas

Las llaves publicas (`fyso_pk_*`) permiten que clientes publicos — navegadores, widgets, apps embebidas — accedan a recursos del tenant sin autenticacion de usuario.

Las llaves publicas son **basadas en roles**: cada llave referencia un rol en el tenant y hereda sus permisos por entidad. Esto permite controlar con precision que datos son accesibles configurando el rol.

## Formato de las llaves

Las llaves tienen el prefijo `fyso_pk_`. El valor completo se muestra **una sola vez** al crearla. Guardala de forma segura en tu build de frontend — no puede recuperarse despues.

## Requerido: Rol

Cada llave publica debe referenciar un rol del tenant. La llave hereda los permisos del rol — que entidades son accesibles y que campos pueden excluirse.

Pasa un `roleId` al crear la llave. Puedes listar los roles disponibles via `GET /api/roles`.

## Scopes

Las llaves publicas solo admiten scopes de lectura:

| Scope | Descripcion |
|-------|-------------|
| `records:read` | Leer registros de entidades publicadas |
| `channels:read` | Leer mensajes de canales |

Los scopes de escritura no estan disponibles para llaves publicas.

## TTL

El TTL es **obligatorio** — las llaves publicas siempre vencen.

| Parametro | Default | Maximo |
|-----------|---------|--------|
| `ttlDays` | 90 dias | 365 dias |

## Rate limits

Cada llave tiene sus propios rate limits. Las requests que los superen reciben `429`.

| Parametro | Default | Maximo |
|-----------|---------|--------|
| `rateLimitPerMin` | 60 req/min | 10.000 req/min |
| `rateLimitPerDay` | 1.000 req/dia | 1.000.000 req/dia |

## CORS

Restringe de manera opcional que origenes pueden enviar requests con esta llave. Un array `allowedOrigins` vacio permite todos los origenes.

```json
"allowedOrigins": ["https://miapp.com", "https://preview.miapp.com"]
```

---

## Herramientas MCP

### `create_public_key`

**Perfil:** advanced

Crea una llave publica de API. El valor de la llave solo es visible en la respuesta — no se almacena y no puede recuperarse luego.

```
create_public_key({
  label: "Widget publico de changelog",
  role_id: "uuid-del-rol",
  scopes: ["records:read"],
  ttl_days: 90,
  allowed_origins: ["https://misitioweb.com"],
  rate_limit_per_min: 30,
  rate_limit_per_day: 500
})
```

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `label` | string | Si | Nombre legible |
| `role_id` | string | Si | UUID del rol — la llave hereda sus permisos |
| `scopes` | string[] | Si | Uno o mas scopes validos |
| `ttl_days` | number | No | Tiempo de vida en dias (1–365, default: 90) |
| `allowed_origins` | string[] | No | Lista CORS. Vacia = todos los origenes |
| `rate_limit_per_min` | number | No | Requests por minuto (default: 60) |
| `rate_limit_per_day` | number | No | Requests por dia (default: 1.000) |

---

### `list_public_keys`

**Perfil:** advanced

Lista todas las llaves publicas del tenant. Los valores de las llaves nunca se devuelven — solo metadata.

```
list_public_keys()
```

---

### `revoke_public_key`

**Perfil:** advanced

Revoca una llave publica de forma inmediata. La revocacion es instantanea — no hay periodo de gracia.

```
revoke_public_key({ key_id: "uuid" })
```

---

## Endpoints REST

Todos los endpoints de gestion requieren autenticacion de admin del tenant.

### Listar llaves

```bash
GET /api/auth/public-keys
Authorization: Bearer <token-admin>
```

### Crear una llave

```bash
POST /api/auth/public-keys
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "label": "Widget publico de changelog",
  "roleId": "uuid-del-rol",
  "scopes": ["records:read"],
  "ttlDays": 90,
  "allowedOrigins": ["https://misitioweb.com"],
  "rateLimitPerMin": 30,
  "rateLimitPerDay": 500
}
```

### Revocar una llave

```bash
DELETE /api/auth/public-keys/:id
Authorization: Bearer <token-admin>
```

Revocacion inmediata. Devuelve `404` si la llave no existe o pertenece a otro tenant.

---

## Usar llaves publicas

### Autenticacion

Incluye la llave via header `X-Public-Key`, `X-Anon-Key` (legacy) o `Authorization: Bearer`:

```bash
# Opcion 1: header X-Public-Key (recomendado)
curl -H "X-Public-Key: fyso_pk_..." \
  https://api.fyso.dev/api/entities/productos/records

# Opcion 2: Authorization header
curl -H "Authorization: Bearer fyso_pk_..." \
  https://api.fyso.dev/api/entities/productos/records

# Opcion 3: header X-Anon-Key (legacy, sigue siendo compatible)
curl -H "X-Anon-Key: fyso_pk_..." \
  https://api.fyso.dev/api/entities/productos/records
```

### Endpoints compatibles

| Endpoint | Scope requerido |
|----------|----------------|
| `GET /api/entities/*` | `records:read` |
| `GET /api/channels/*` | `channels:read` |

Las llaves publicas son **de solo lectura**. Los metodos `POST`, `PUT` y `DELETE` siempre devuelven `401`.

---

## Notas de seguridad

- Los valores de las llaves se hashean con bcrypt. El texto plano nunca se almacena ni se re-expone.
- El TTL es obligatorio — no es posible crear llaves publicas permanentes.
- La revocacion es sincrona (actualizacion inmediata en la base de datos).
- Los permisos del rol se evaluan en tiempo real — cambiar los permisos del rol afecta de inmediato a todas las llaves que lo referencian.

---

## Migracion desde llaves anonimas

Las llaves anonimas anteriores (`anon_*`) siguen siendo aceptadas por compatibilidad. Los endpoints de gestion en `/api/auth/anonymous-keys` tambien siguen disponibles.

Las nuevas llaves deben crearse via `/api/auth/public-keys` con el prefijo `fyso_pk_` y un `roleId`.
