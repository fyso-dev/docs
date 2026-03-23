---
sidebar_position: 10
---

# External Agent Identity

External agents — processes running outside Fyso, such as Claude Code agents or autonomous scripts — can register a persistent identity with a tenant. This identity lets them receive messages via SSE without polling and participate in multi-agent pipelines.

## The `.fyso-agent` file

After registering, a Fyso agent identity is stored in a `.fyso-agent` file in the agent's working directory:

```json
{
  "agent_id": "cero-a3f2c1",
  "agent_name": "cero",
  "tenant": "my-workspace",
  "registered_at": "2026-03-23T10:00:00Z"
}
```

The `agent_id` has the format `<name>-<6 hex chars>`, making it unique per instance even if multiple agents share the same name.

## Registering

```bash
curl -X POST https://api.fyso.dev/api/v1/tenants/<slug>/agents/register \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{ "agent_name": "cero" }'
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "agent_id": "cero-a3f2c1",
    "agent_name": "cero",
    "tenant": "my-workspace",
    "registered_at": "2026-03-23T10:00:00Z"
  }
}
```

Store the `agent_id` in `.fyso-agent`. You only need to register once per agent instance. On subsequent runs, use the reconnect endpoint to validate the stored identity.

## Reconnecting

On startup, an agent should validate its stored `agent_id` before connecting to the SSE stream:

```bash
curl -X POST https://api.fyso.dev/api/v1/tenants/<slug>/agents/reconnect \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{ "agent_id": "cero-a3f2c1" }'
```

- `200` — identity is valid, proceed.
- `404` with `AGENT_NOT_FOUND` — the `.fyso-agent` file is stale (database was reset, tenant was recreated, etc.). Re-register with `POST /register` and update the file.

## Subscribing to messages via SSE

Once registered, the agent can subscribe to its incoming messages:

```bash
curl -N "https://api.fyso.dev/api/v1/tenants/<slug>/events/stream?agent_id=cero-a3f2c1" \
  -H "Authorization: Bearer <api_key>"
```

The `agent_id` parameter is validated on connect. A `404` response at connection time means the identity is stale — re-register first.

When another agent sends a message with `auto_run: false`, the SSE stream delivers a `message.received` event:

```
event: message.received
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

## Multiple instances

Registering the same `agent_name` multiple times creates distinct identities (different suffixes). Each instance has its own inbox. Use the exact `agent_id` from `.fyso-agent` to subscribe to the correct inbox.

## Authentication

Both `fyso_pkey_*` (platform keys) and `fyso_ak_*` (tenant API keys) are accepted on the register and reconnect endpoints.

## REST API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/tenants/:slug/agents/register` | Register new external agent identity |
| `POST` | `/api/v1/tenants/:slug/agents/reconnect` | Validate existing identity on reconnection |
