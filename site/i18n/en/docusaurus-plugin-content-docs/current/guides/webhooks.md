# Webhooks

Fyso can send HTTP notifications when records are created, updated, or deleted in any entity.

## How it works

1. Create a subscription specifying: entity, events (`created`, `updated`, `deleted`), and destination URL
2. Fyso sends an HTTP POST to that URL whenever the event occurs
3. If the endpoint fails, Fyso retries up to 5 times with exponential backoff
4. Each delivery is logged with its HTTP status and response

## Create a subscription (MCP)

```
create_webhook({
  entityName: "clients",
  events: ["created", "updated"],
  url: "https://my-app.com/webhooks/fyso",
  secret: "my-optional-secret",
  description: "Notify CRM when a client changes"
})
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityName` | string | Yes | Entity to observe |
| `events` | string[] | Yes | `created`, `updated`, `deleted` (any combination) |
| `url` | string | Yes | URL that will receive events (must be HTTPS) |
| `secret` | string | No | Secret for HMAC-SHA256 signature |
| `description` | string | No | Free-form description |

## Create a subscription (web panel)

Go to **Settings** > **Webhooks** > **New subscription**.

## Event payload

```json
{
  "event": "created",
  "entityName": "clients",
  "recordId": "record-uuid",
  "tenantSlug": "my-company",
  "timestamp": "2026-02-21T10:30:00.000Z",
  "data": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john@example.com"
  }
}
```

## Verify the signature

If you configured a `secret`, each request includes the `X-Fyso-Signature` header:

```
X-Fyso-Signature: sha256=abc123...
```

To verify:

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

## Responding to webhooks

Your endpoint must respond `HTTP 2xx` within 10 seconds. Any other code (or timeout) is considered a failure and triggers a retry.

## Retries

| Attempt | Wait |
|---------|------|
| 1 | Immediate |
| 2 | 1 min |
| 3 | 5 min |
| 4 | 30 min |
| 5 | 2 hours |

After 5 failed attempts, the delivery is marked as `failed`.

## View delivery history

### Via MCP

```
list_webhooks({ entityName: "clients" })
```

### Via web panel

**Settings** > **Webhooks** > click on the subscription > **History** tab.

Shows the HTTP status, timestamp, and response per delivery.

## List subscriptions

```
list_webhooks()                              -- all subscriptions
list_webhooks({ entityName: "clients" })     -- filtered by entity
```

## Delete a subscription

```
delete_webhook({ webhookId: "uuid" })
```

## Enable/disable

From the web panel you can temporarily pause a subscription without deleting it.

## Security

- Webhook URLs are validated against private IPs (SSRF prevention)
- The secret is returned masked in the API (`wh_secret_****`) after creation
- Only the creation response returns the secret in plain text
