---
sidebar_position: 9
---

# Agent Messaging

Fyso agents can send and receive messages to each other using the `_agent_messages` system entity. This enables multi-agent pipelines where agents coordinate work asynchronously.

## How it works

1. Agent A sends a message to Agent B using `fyso_agents({ action: "send_message", ... })`.
2. The message lands in Agent B's inbox with status `pending`.
3. If `auto_run: true`, the server runs Agent B automatically with the message as its input.
4. Agent B can reply by sending a message back with `in_reply_to` set to the original message ID, forming a thread.

Chains are limited to **5 hops**. If a chain would exceed the limit, the message is left as `pending` and a `message.chain_limit` SSE event is emitted.

## Sending a message

**MCP:**

```
fyso_agents({
  action: "send_message",
  to_agent: "inventory-agent",
  subject: "Low stock alert",
  payload: { product_id: "uuid", current_stock: 3 },
  priority: "high",
  auto_run: true
})
```

**REST:**

```bash
curl -X POST https://api.fyso.dev/api/tenants/<slug>/agent-messages/send \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_agent": "warehouse-monitor",
    "to_agent": "inventory-agent",
    "subject": "Low stock alert",
    "payload": { "product_id": "uuid", "current_stock": 3 },
    "priority": "high",
    "auto_run": true
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "message_id": "uuid",
    "from_agent": "warehouse-monitor",
    "to_agent": "inventory-agent-a3f2c1",
    "subject": "Low stock alert",
    "priority": "high",
    "status": "pending",
    "created_at": "2026-03-23T10:00:00Z"
  }
}
```

### Agent name resolution

The `to_agent` field supports fuzzy matching:

- Exact slug match → resolved immediately.
- Single prefix match: `"cero"` resolves to `"cero-b4e5d6"` if that is the only agent whose slug starts with `cero-`.
- Multiple prefix matches → error with a list of candidates.

### Message fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to_agent` | string | Yes | Recipient agent name or slug (fuzzy matching) |
| `from_agent` | string | No | Sender name. Defaults to `mcp-caller` when using MCP |
| `subject` | string | No | Optional subject line |
| `payload` | object | No | Arbitrary JSON data (max 64 KB) |
| `priority` | `normal` \| `high` \| `urgent` | No | Default: `normal` |
| `in_reply_to` | string | No | UUID of the parent message (enables threading) |
| `auto_run` | boolean | No | Run recipient agent automatically on delivery |

## Reading the inbox

```
fyso_agents({
  action: "inbox",
  agent_name: "inventory-agent",
  inbox_status: "pending"
})
```

| `inbox_status` | Returns |
|---------------|---------|
| `pending` | Unread messages (default) |
| `read` | Already-read messages |
| `all` | All messages |

**REST:**

```bash
GET /api/tenants/<slug>/agent-messages/inbox/<agentName>?status=pending&limit=50
```

## Reading a single message

Fetching a message marks it as `read`.

```
fyso_agents({ action: "read_message", message_id: "<uuid>" })
```

**REST:**

```bash
GET /api/tenants/<slug>/agent-messages/<messageId>/read
```

## Archiving a message

```
fyso_agents({ action: "archive_message", message_id: "<uuid>" })
```

**REST:**

```bash
POST /api/tenants/<slug>/agent-messages/<messageId>/archive
```

## Counting unread messages

```
fyso_agents({ action: "count_unread", agent_name: "inventory-agent" })
```

**REST:**

```bash
GET /api/tenants/<slug>/agent-messages/count/<agentName>
```

Response:

```json
{ "agent": "inventory-agent-a3f2c1", "unread": 4 }
```

## Auto-run and chain depth

When `auto_run: true` is set and the recipient is a Fyso agent, the server runs the agent immediately in the background. The HTTP response returns before the agent finishes — the run is fire-and-forget.

The agent receives the message as its user input with this context:

```
trigger=message
message_id=<uuid>
from_agent=<sender>
subject=<subject>
payload=<json>
thread_depth=<depth>
max_depth=5
```

**Chain depth limit:** If following the `in_reply_to` chain back to the root produces 5 or more hops, the auto-run is skipped. The message is left as `pending` and a `message.chain_limit` SSE event is emitted on the event stream. You can monitor this event to detect runaway loops.

## SSE notifications

External agents can subscribe to incoming messages via the SSE event stream. Pass your `agent_id` (from `.fyso-agent`) as a query parameter:

```bash
curl -N "https://api.fyso.dev/api/v1/tenants/<slug>/events/stream?agent_id=<agent_id>" \
  -H "Authorization: Bearer <api_key>"
```

Incoming messages arrive as `message.received` events. Chain-limit notifications arrive as `message.chain_limit`. See [SSE Event Stream](../api/sse-events.md) for full details.

## Access control

| Caller type | Can read/send |
|------------|---------------|
| Admin token / API key | Any agent inbox |
| Bot JWT (participant) | Own inbox only, own `from_agent` only |

## Inbox limits

Each agent inbox holds at most **1000 pending messages**. Sending to a full inbox returns an error.

## REST API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tenants/:slug/agent-messages/send` | Send a message |
| `GET` | `/api/tenants/:slug/agent-messages/inbox/:agentName` | List inbox |
| `GET` | `/api/tenants/:slug/agent-messages/:messageId/read` | Fetch + mark read |
| `POST` | `/api/tenants/:slug/agent-messages/:messageId/archive` | Archive |
| `GET` | `/api/tenants/:slug/agent-messages/count/:agentName` | Count unread |
