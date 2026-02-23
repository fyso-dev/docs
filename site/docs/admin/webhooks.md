---
sidebar_position: 5
---

# Webhooks

Webhooks let you receive real-time HTTP notifications when records are created, updated, or deleted in any entity. Subscribe once, get notified automatically.

## Event types

| Event | When it fires |
|-------|--------------|
| `record.created` | A new record is created in the entity |
| `record.updated` | A record is updated |
| `record.deleted` | A record is deleted |

## Creating a subscription

**MCP Tool: `create_webhook`** (Profile: advanced)

```
create_webhook({
  entity_name: "orders",
  event_types: ["record.created", "record.updated"],
  url: "https://your-server.com/webhooks/fyso",
  secret: "your-signing-secret",
  description: "Sync orders to ERP"
})
```

**REST API:**

```bash
curl -X POST https://api.fyso.dev/api/webhooks/subscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_name": "orders",
    "event_types": ["record.created", "record.updated"],
    "url": "https://your-server.com/webhooks/fyso",
    "secret": "your-signing-secret",
    "description": "Sync orders to ERP"
  }'
```

Duplicate subscriptions (same entity + URL + events) return `409`.

## Payload

Every delivery POSTs a JSON body to your URL:

```json
{
  "id": "evt_01HXYZ...",
  "event": "record.created",
  "entity": "orders",
  "record_id": "rec_01HABC...",
  "data": {
    "id": "rec_01HABC...",
    "customer_name": "Acme Corp",
    "total": 1500,
    "status": "pending"
  },
  "timestamp": "2026-02-23T14:32:00.000Z",
  "tenant_id": "tenant_01HXY..."
}
```

Your endpoint must return a `2xx` status within 30 seconds.

## Verifying signatures

When you set a `secret`, each request includes an `X-Fyso-Signature` header containing the HMAC-SHA256 hex digest of the raw JSON body.

```typescript
import { createHmac } from "crypto";

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}
```

Always verify signatures before processing payloads.

## Listing subscriptions

**MCP Tool: `list_webhooks`** (Profile: advanced)

```
list_webhooks()                         // all subscriptions
list_webhooks({ entity_name: "orders" }) // filter by entity
```

**REST API:**

```bash
GET /api/webhooks/subscriptions
GET /api/webhooks/subscriptions?entity=orders
```

## Updating a subscription

```bash
curl -X PUT https://api.fyso.dev/api/webhooks/subscriptions/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "is_active": false }'
```

Pass only the fields you want to change: `url`, `event_types`, `secret`, `is_active`, `description`.

## Deleting a subscription

**MCP Tool: `delete_webhook`** (Profile: advanced)

```
delete_webhook({ webhook_id: "sub_01HXYZ..." })
```

**REST API:**

```bash
DELETE /api/webhooks/subscriptions/<id>
```

## Delivery history

Check the status of past deliveries for a subscription:

```bash
GET /api/webhooks/subscriptions/<id>/deliveries?limit=20
```

Each delivery shows:

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

Status values: `pending`, `delivered`, `failed`.

## Retries

Failed deliveries (non-2xx or timeout) are retried up to **5 times** with exponential backoff. After all retries are exhausted the delivery is marked `failed`.

## Admin dashboard

From the admin panel, go to **Settings → Webhooks** to manage subscriptions visually:

- Create subscriptions with entity selector, event checkboxes, URL input, and optional secret
- Toggle active/inactive per subscription
- View delivery history per subscription
- Delete subscriptions with confirmation
