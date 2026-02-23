---
sidebar_position: 5
---

# Webhooks

Los webhooks te permiten recibir notificaciones HTTP en tiempo real cuando se crean, actualizan o eliminan registros en cualquier entidad. Suscríbete una vez, recibe notificaciones automáticamente.

## Tipos de eventos

| Evento | Cuándo se dispara |
|--------|------------------|
| `record.created` | Se crea un nuevo registro en la entidad |
| `record.updated` | Se actualiza un registro |
| `record.deleted` | Se elimina un registro |

## Crear una suscripción

**Herramienta MCP: `create_webhook`** (Perfil: advanced)

```
create_webhook({
  entity_name: "pedidos",
  event_types: ["record.created", "record.updated"],
  url: "https://tu-servidor.com/webhooks/fyso",
  secret: "tu-secreto-de-firma",
  description: "Sincronizar pedidos con ERP"
})
```

**REST API:**

```bash
curl -X POST https://api.fyso.dev/api/webhooks/subscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "pedidos",
    "event_types": ["record.created", "record.updated"],
    "url": "https://tu-servidor.com/webhooks/fyso",
    "secret": "tu-secreto-de-firma",
    "description": "Sincronizar pedidos con ERP"
  }'
```

Las suscripciones duplicadas (misma entidad + URL + eventos) devuelven `409`.

## Payload

Cada entrega hace un POST JSON a tu URL:

```json
{
  "id": "evt_01HXYZ...",
  "event": "record.created",
  "entity": "pedidos",
  "record_id": "rec_01HABC...",
  "data": {
    "id": "rec_01HABC...",
    "cliente": "Acme Corp",
    "total": 1500,
    "estado": "pendiente"
  },
  "timestamp": "2026-02-23T14:32:00.000Z",
  "tenant_id": "tenant_01HXY..."
}
```

Tu endpoint debe devolver un status `2xx` en menos de 30 segundos.

## Verificar firmas

Cuando configuras un `secret`, cada request incluye el header `X-Fyso-Signature` con el digest HMAC-SHA256 en hex del body JSON crudo.

```typescript
import { createHmac } from "crypto";

function verificarWebhook(body: string, firma: string, secreto: string): boolean {
  const esperado = createHmac("sha256", secreto).update(body).digest("hex");
  return esperado === firma;
}
```

Siempre verifica las firmas antes de procesar los payloads.

## Listar suscripciones

**Herramienta MCP: `list_webhooks`** (Perfil: advanced)

```
list_webhooks()                           // todas las suscripciones
list_webhooks({ entity_name: "pedidos" }) // filtrar por entidad
```

**REST API:**

```bash
GET /api/webhooks/subscriptions
GET /api/webhooks/subscriptions?entity=pedidos
```

## Actualizar una suscripción

```bash
curl -X PUT https://api.fyso.dev/api/webhooks/subscriptions/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "is_active": false }'
```

Pasa solo los campos que quieres cambiar: `url`, `event_types`, `secret`, `is_active`, `description`.

## Eliminar una suscripción

**Herramienta MCP: `delete_webhook`** (Perfil: advanced)

```
delete_webhook({ webhook_id: "sub_01HXYZ..." })
```

**REST API:**

```bash
DELETE /api/webhooks/subscriptions/<id>
```

## Historial de entregas

Consulta el estado de las entregas pasadas de una suscripción:

```bash
GET /api/webhooks/subscriptions/<id>/deliveries?limit=20
```

Cada entrega muestra:

```json
{
  "id": "...",
  "status": "delivered",
  "http_status": 200,
  "attempt_count": 1,
  "created_at": "2026-02-23T14:32:00Z",
  "completed_at": "2026-02-23T14:32:01Z"
}
```

Valores de status: `pending`, `delivered`, `failed`.

## Reintentos

Las entregas fallidas (respuesta no-2xx o timeout) se reintentan hasta **5 veces** con backoff exponencial. Después de agotar los reintentos, la entrega se marca como `failed`.

## Panel de administración

Desde el panel de admin, ve a **Configuración → Webhooks** para gestionar suscripciones visualmente:

- Crear suscripciones con selector de entidad, checkboxes de eventos, input de URL y secreto opcional
- Activar/desactivar cada suscripción
- Ver historial de entregas por suscripción
- Eliminar suscripciones con confirmación
