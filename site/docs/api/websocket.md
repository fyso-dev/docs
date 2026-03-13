---
sidebar_position: 4
---

# WebSocket — Real-Time Records

Fyso exposes a WebSocket endpoint for real-time record change events. When a record is created, updated, or deleted, subscribed clients receive a push notification instantly.

## Connection

| Environment | URL |
|-------------|-----|
| Production  | `wss://api.fyso.dev/ws` |
| Development | `ws://localhost:3001/ws` |

The connection is tenant-scoped. The server identifies the tenant from the authenticated token presented during the handshake.

## Authentication

The **first message** sent after connecting must be an `auth` message. The connection is not usable until authentication succeeds.

Three token types are accepted:

```json
{ "type": "auth", "token": "fyso_pkey_..." }
```

```json
{ "type": "auth", "token": "550e8400-e29b-41d4-a716-446655440000" }
```

```json
{ "type": "auth", "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

| Token format | Description |
|---|---|
| `fyso_pkey_...` | Platform API key (recommended for applications) |
| UUID (session token) | Admin session token from the auth endpoint |
| `eyJ...` | Bot JWT issued by `POST /api/auth/bots/identify` |

## Protocol Messages

All messages are JSON objects with a `type` field. Text frames only — binary frames are not supported.

### auth

Sent by client. Must be the first message.

```json
{ "type": "auth", "token": "<token>" }
```

**Server responses:**

Success:

```json
{ "type": "auth_ok" }
```

Failure:

```json
{ "type": "auth_error", "code": "not_authenticated", "message": "Invalid or expired token" }
```

---

### subscribe

Subscribe to real-time events for an entity. Must be sent after a successful `auth`.

```json
{ "type": "subscribe", "entity": "tickets" }
```

**Server responses:**

Success:

```json
{ "type": "subscribed", "entity": "tickets" }
```

Limit exceeded:

```json
{
  "type": "error",
  "code": "limit_exceeded",
  "message": "A single connection may subscribe to at most 10 entities."
}
```

Entity not found:

```json
{ "type": "error", "code": "entity_not_found", "message": "Entity 'tickets' does not exist" }
```

---

### unsubscribe

Stop receiving events for an entity.

```json
{ "type": "unsubscribe", "entity": "tickets" }
```

**Server response:**

```json
{ "type": "unsubscribed", "entity": "tickets" }
```

---

### ping / pong

Keep the connection alive. Useful for environments that aggressively close idle WebSockets.

```json
{ "type": "ping" }
```

**Server response:**

```json
{ "type": "pong" }
```

---

### Server push events

The server pushes events whenever a record changes in a subscribed entity.

**record.created**

```json
{
  "type": "record.created",
  "entity": "tickets",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Fix login bug",
    "status": "open",
    "created_at": "2026-03-07T12:00:00.000Z"
  }
}
```

**record.updated**

```json
{
  "type": "record.updated",
  "entity": "tickets",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "closed",
    "updated_at": "2026-03-07T13:00:00.000Z"
  }
}
```

**record.deleted**

```json
{
  "type": "record.deleted",
  "entity": "tickets",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
```

## Event Data Shape

```json
{
  "type": "record.created" | "record.updated" | "record.deleted",
  "entity": "<entity_name>",
  "data": {
    "id": "<uuid>",
    "<field>": "<value>"
  }
}
```

The `data` object contains the record with RBAC field filtering applied — only fields the authenticated token is permitted to read are included.

## RBAC and Event Filtering

Events are filtered per-connection based on the role associated with the authenticated token.

**Field-level filtering:** If the role defines a `fields` whitelist or `excludeFields` blocklist for an entity, only permitted fields are included in the `data` payload. This mirrors the same filtering applied to REST API responses.

**Row-level filtering:** If the role defines a `rowFilter` for an entity, events for that entity are suppressed for this connection. Full predicate evaluation against push events is not yet supported.

## Limits

| Limit | Value |
|-------|-------|
| Max subscriptions per connection | 10 |
| Max concurrent connections per tenant | 100 |

Exceeding either limit returns an `error` message — the connection is not closed.

## Error Types

| `code` | When |
|--------|------|
| `not_authenticated` | Message sent before `auth`, or token is invalid/expired |
| `auth_expired` | Token was valid but has since expired; re-authenticate |
| `limit_exceeded` | Per-connection subscription limit (10) or per-tenant connection limit (100) reached |
| `entity_not_found` | Subscribed entity does not exist in this tenant |

## Reconnection Strategy

Implement exponential backoff on disconnect.

| Attempt | Wait before reconnect |
|---------|----------------------|
| 1 | 1s |
| 2 | 2s |
| 3 | 4s |
| 4 | 8s |
| 5 | 16s |
| 6+ | 30s (max) |

Formula: `min(1000 * 2^(attempt - 1), 30000)` ms.

On reconnect, repeat the full handshake: send `auth`, wait for `auth_ok`, then re-send all `subscribe` messages.

## Code Examples

### JavaScript / TypeScript (browser)

```typescript
class FysoWebSocket {
  private ws: WebSocket | null = null;
  private attempt = 0;
  private readonly maxBackoffMs = 30_000;
  private subscriptions = new Set<string>();

  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      this.attempt = 0;
      this.send({ type: 'auth', token: this.token });
    });

    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'auth_ok') {
        // Re-subscribe after reconnect
        for (const entity of this.subscriptions) {
          this.send({ type: 'subscribe', entity });
        }
      } else if (msg.type === 'record.created') {
        console.log('created', msg.entity, msg.data);
      } else if (msg.type === 'record.updated') {
        console.log('updated', msg.entity, msg.data);
      } else if (msg.type === 'record.deleted') {
        console.log('deleted', msg.entity, msg.data);
      }
    });

    this.ws.addEventListener('close', () => this.scheduleReconnect());
    this.ws.addEventListener('error', () => this.ws?.close());
  }

  subscribe(entity: string) {
    this.subscriptions.add(entity);
    this.send({ type: 'subscribe', entity });
  }

  private send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private scheduleReconnect() {
    const delay = Math.min(1_000 * 2 ** this.attempt, this.maxBackoffMs);
    this.attempt++;
    setTimeout(() => this.connect(), delay);
  }
}

// Usage
const client = new FysoWebSocket('wss://api.fyso.dev/ws', 'fyso_pkey_...');
client.connect();
client.subscribe('tickets');
```

---

### Node.js

```javascript
const WebSocket = require('ws');

const TOKEN = 'fyso_pkey_...';
const URL = 'wss://api.fyso.dev/ws';
const ENTITIES = ['tickets', 'comments'];

let attempt = 0;

function connect() {
  const ws = new WebSocket(URL);

  ws.on('open', () => {
    attempt = 0;
    ws.send(JSON.stringify({ type: 'auth', token: TOKEN }));
  });

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);

    if (msg.type === 'auth_ok') {
      for (const entity of ENTITIES) {
        ws.send(JSON.stringify({ type: 'subscribe', entity }));
      }
    } else if (msg.type.startsWith('record.')) {
      console.log(`[${msg.type}] ${msg.entity}`, msg.data);
    } else if (msg.type === 'error') {
      console.error('WS error:', msg.code, msg.message);
    }
  });

  ws.on('close', () => {
    const delay = Math.min(1000 * 2 ** attempt, 30_000);
    attempt++;
    console.log(`Reconnecting in ${delay}ms...`);
    setTimeout(connect, delay);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    ws.terminate();
  });

  // Keepalive
  const ping = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30_000);

  ws.on('close', () => clearInterval(ping));
}

connect();
```

---

### Python

Requires the [`websockets`](https://websockets.readthedocs.io/) library (`pip install websockets`).

```python
import asyncio
import json
import websockets

TOKEN = "fyso_pkey_..."
URL = "wss://api.fyso.dev/ws"
ENTITIES = ["tickets", "comments"]


async def connect_with_backoff():
    attempt = 0
    while True:
        try:
            async with websockets.connect(URL) as ws:
                attempt = 0

                await ws.send(json.dumps({"type": "auth", "token": TOKEN}))

                async for raw in ws:
                    msg = json.loads(raw)

                    if msg["type"] == "auth_ok":
                        for entity in ENTITIES:
                            await ws.send(json.dumps({"type": "subscribe", "entity": entity}))

                    elif msg["type"].startswith("record."):
                        print(f"[{msg['type']}] {msg['entity']}: {msg['data']}")

                    elif msg["type"] == "error":
                        print(f"Error: {msg['code']} — {msg['message']}")

        except (websockets.ConnectionClosed, OSError) as exc:
            delay = min(1 * 2 ** attempt, 30)
            attempt += 1
            print(f"Disconnected ({exc}). Reconnecting in {delay}s...")
            await asyncio.sleep(delay)


asyncio.run(connect_with_backoff())
```

---

### websocat CLI

Useful for quick testing.

```bash
websocat wss://api.fyso.dev/ws
```

Then send messages manually:

```
{"type":"auth","token":"fyso_pkey_..."}
{"type":"subscribe","entity":"tickets"}
{"type":"ping"}
```

**Pipe a sequence:**

```bash
(
  echo '{"type":"auth","token":"fyso_pkey_..."}'
  sleep 0.5
  echo '{"type":"subscribe","entity":"tickets"}'
  sleep 3600
) | websocat wss://api.fyso.dev/ws
```
