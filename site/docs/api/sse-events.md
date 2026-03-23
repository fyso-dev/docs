---
sidebar_position: 5
---

# SSE Event Stream

The SSE (Server-Sent Events) stream delivers real-time tenant events to connected clients without polling. Events are pushed as they happen — record CRUD, rule executions, and agent messages.

## Endpoint

```
GET /api/v1/tenants/:slug/events/stream
```

## Authentication

Pass a tenant API key (`fyso_ak_*` or `fyso_pkey_*`) in the `Authorization` header:

```bash
curl -N "https://api.fyso.dev/api/v1/tenants/my-workspace/events/stream" \
  -H "Authorization: Bearer fyso_ak_..."
```

The key must belong to the specified tenant. Admin session tokens are not accepted on this endpoint.

## Connection limits

| Limit | Value |
|-------|-------|
| Max connections per tenant | 5 |
| Max connections globally | 100 |
| Backpressure threshold | 100 queued events |
| Idle timeout | 1 hour |
| Heartbeat interval | 30 seconds |

If the per-tenant or global limit is reached, the endpoint returns `429`.

Slow consumers that fall more than 100 events behind receive a `backpressure` error event and the connection is closed.

## Heartbeat

The server sends a `: ping` comment every 30 seconds to keep the connection alive through proxies and load balancers. Standard SSE clients ignore comments; custom parsers should discard lines that start with `:`.

## Query parameters

| Parameter | Description |
|-----------|-------------|
| `entities` | Comma-separated entity names to filter record events. Omit to receive all entities. Example: `?entities=invoices,clients` |
| `events` | Comma-separated event types to receive. Omit to receive all event types. Example: `?events=record.created,rule.executed` |
| `agent_id` | Agent ID from `.fyso-agent`. When set, also delivers `message.received` events addressed to this agent. |

You can combine filters:

```bash
curl -N "https://api.fyso.dev/api/v1/tenants/my-workspace/events/stream?entities=orders&events=record.created,rule.executed" \
  -H "Authorization: Bearer fyso_ak_..."
```

## Event types

| Type | Trigger |
|------|---------|
| `record.created` | A record was created in any entity |
| `record.updated` | A record was updated |
| `record.deleted` | A record was deleted |
| `rule.executed` | A business rule ran and completed successfully |
| `rule.failed` | A business rule ran and threw an error |
| `message.received` | An agent message was delivered (requires `?agent_id=`) |
| `message.chain_limit` | An auto-run chain was halted at depth 5 |
| `connected` | Sent immediately on connect (prevents proxy timeout) |
| `error` | Stream-level error (`IDLE_TIMEOUT`, `BACKPRESSURE`) |

## Event shapes

### Record events

```
event: record.created
id: 42
data: {
  "id": "evt_uuid",
  "type": "record.created",
  "timestamp": "2026-03-23T10:00:00Z",
  "tenant": "my-workspace",
  "entity": "orders",
  "record_id": "uuid",
  "data": {
    "fields": { "status": "pending", "total": 150.00 },
    "triggered_by": "api"
  }
}
```

The `triggered_by` field identifies what initiated the change:

| Value | Meaning |
|-------|---------|
| `mcp` | MCP tool call |
| `api` | Direct REST API call |
| `flow` | Automation flow |
| `webhook` | Incoming webhook |
| `ui` | Web admin panel |
| `rule` | Rules engine (e.g. `update_related`) |
| `system` | Internal (migrations, seeding) |

### Rule events

```
event: rule.executed
id: 43
data: {
  "id": "evt_uuid",
  "type": "rule.executed",
  "timestamp": "2026-03-23T10:00:00Z",
  "tenant": "my-workspace",
  "data": {
    "rule_name": "notify-on-payment",
    "trigger_type": "after_save",
    "entity": "orders",
    "record_id": "uuid",
    "result": "completed"
  }
}
```

`rule.failed` uses the same shape but includes `error` instead of `result`:

```json
{
  "data": {
    "rule_name": "notify-on-payment",
    "trigger_type": "after_save",
    "entity": "orders",
    "record_id": "uuid",
    "error": "Integration timeout after 10s"
  }
}
```

### Message events

Only delivered when `?agent_id=<id>` is set:

```
event: message.received
id: 44
data: {
  "id": "msg_uuid",
  "type": "message.received",
  "timestamp": "2026-03-23T10:00:00Z",
  "tenant": "my-workspace",
  "to_agent": "cero-a3f2c1",
  "from_agent": "pluma-b7e2d4",
  "message_id": "uuid",
  "subject": "PR review complete",
  "priority": "normal"
}
```

The payload of the message is not included in the SSE event. Fetch it with `GET /agent-messages/:messageId/read`.

### Error events

```
event: error
data: { "type": "error", "code": "IDLE_TIMEOUT", "message": "Connection closed due to inactivity" }
```

```
event: error
data: { "type": "error", "code": "BACKPRESSURE", "message": "Connection closed: client is too slow to consume events" }
```

## Reconnection

The SSE `id` field is set on every event. Standard clients that support `Last-Event-ID` will send it on reconnect; the server does not replay missed events in the current implementation. If replay is required, re-fetch the relevant records via the REST API after reconnecting.

## Example: Node.js client

```js
import EventSource from 'eventsource';

const stream = new EventSource(
  'https://api.fyso.dev/api/v1/tenants/my-workspace/events/stream?entities=orders',
  { headers: { Authorization: 'Bearer fyso_ak_...' } }
);

stream.addEventListener('record.created', (e) => {
  const event = JSON.parse(e.data);
  console.log('New order:', event.record_id, event.data.fields);
});

stream.addEventListener('error', (e) => {
  if (e.data) console.error('Stream error:', JSON.parse(e.data));
});
```

## Example: Using the Fyso Claude Code skill

The `/fyso:listen` skill connects the SSE stream to a Claude Code channel:

```
/fyso:listen
```

This establishes a live event bridge for the current tenant. Events appear as channel messages in the Claude Code session.
