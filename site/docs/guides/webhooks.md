# Webhooks

Fyso puede enviar notificaciones HTTP cuando se crean, actualizan o eliminan registros en cualquier entidad.

## Como funciona

1. Creas una subscripcion indicando: entidad, eventos (`created`, `updated`, `deleted`) y URL destino
2. Fyso hace un HTTP POST a esa URL cada vez que ocurre el evento
3. Si el endpoint falla, Fyso reintenta hasta 5 veces con backoff exponencial
4. Cada entrega queda registrada con su status HTTP y respuesta

## Crear una subscripcion (MCP)

```
create_webhook({
  entityName: "clientes",
  events: ["created", "updated"],
  url: "https://mi-app.com/webhooks/fyso",
  secret: "mi-secreto-opcional",
  description: "Notificar al CRM cuando cambia un cliente"
})
```

**Parametros:**

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Entidad a observar |
| `events` | string[] | Si | `created`, `updated`, `deleted` (o cualquier combinacion) |
| `url` | string | Si | URL que recibira los eventos (debe ser HTTPS) |
| `secret` | string | No | Secreto para firma HMAC-SHA256 |
| `description` | string | No | Descripcion libre |

## Crear una subscripcion (panel web)

Ir a **Settings** > **Webhooks** > **Nueva subscripcion**.

## Payload del evento

```json
{
  "event": "created",
  "entityName": "clientes",
  "recordId": "uuid-del-registro",
  "tenantSlug": "mi-empresa",
  "timestamp": "2026-02-21T10:30:00.000Z",
  "data": {
    "id": "uuid",
    "nombre": "Juan Perez",
    "email": "juan@example.com"
  }
}
```

## Verificar la firma

Si configuraste un `secret`, cada request incluye el header `X-Fyso-Signature`:

```
X-Fyso-Signature: sha256=abc123...
```

Para verificar:

```javascript
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## Responder al webhook

Tu endpoint debe responder `HTTP 2xx` dentro de 10 segundos. Cualquier otro codigo (o timeout) se considera un fallo y activa el reintento.

## Reintentos

| Intento | Espera |
|---------|--------|
| 1 | Inmediato |
| 2 | 1 min |
| 3 | 5 min |
| 4 | 30 min |
| 5 | 2 horas |

Despues de 5 intentos fallidos, la entrega queda con status `failed`.

## Ver historial de entregas

### Via MCP

```
list_webhooks({ entityName: "clientes" })
```

### Via panel web

**Settings** > **Webhooks** > click en la subscripcion > pestaña **Historial**.

Muestra el status HTTP, timestamp y respuesta de cada entrega.

## Listar subscripciones

```
list_webhooks()           -- todas las subscripciones
list_webhooks({ entityName: "clientes" })   -- filtradas por entidad
```

## Eliminar una subscripcion

```
delete_webhook({ webhookId: "uuid" })
```

## Activar/desactivar

Desde el panel web se puede pausar temporalmente una subscripcion sin eliminarla.

## Seguridad

- Las URLs de webhook son validadas contra IPs privadas (SSRF prevention)
- El secreto se devuelve enmascarado en la API (`wh_secret_****`) despues de la creacion
- Solo el momento de creacion devuelve el secreto en texto claro
