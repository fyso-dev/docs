---
sidebar_position: 13
---

# Channels

Channels connect AI agents to external messaging platforms. Each agent can be connected to multiple channels simultaneously.

## Supported Channels

| Channel | Streaming | Setup |
|---------|-----------|-------|
| **Web Widget** | SSE token streaming | Embed `<script>` tag |
| **Telegram** | Typing indicator | Connect bot token via MCP |

## Web Widget

Embed an agent as a floating chat bubble on any website.

### Setup

```html
<script
  src="https://api.fyso.dev/widget.js"
  data-tenant="my-tenant"
  data-agent="my-bot"
  data-title="Chat with us"
  data-color="#4F46E5"
  data-position="bottom-right"
></script>
```

The widget opens a chat interface that streams agent responses token-by-token via Server-Sent Events (SSE).

### Streaming endpoint

```
POST /api/tenants/:slug/agents/:agentSlug/chat/stream
Content-Type: application/json

{ "message": "Hello", "session_id": "optional-uuid" }
```

Response: SSE stream with `data: {"token": "Hello"}` chunks, ending with `data: {"done": true, "session_id": "uuid"}`.

If streaming fails, the widget falls back to the standard non-streaming endpoint.

## Telegram

Connect a Telegram bot to an agent so users can chat via Telegram.

### Connect via MCP

```
fyso_agents({ action: "connect_telegram", agentId: "my-bot", bot_token: "123456:ABC-DEF...", secret_token: "my-webhook-secret" })
```

This:
1. Verifies the bot token via Telegram's `getMe` API
2. Registers a webhook URL: `https://api.fyso.dev/api/webhooks/telegram/:tenantSlug`
3. Encrypts and stores the bot config in tenant secrets

### Disconnect

```
fyso_agents({ action: "disconnect_telegram", agentId: "my-bot" })
```

Removes the webhook from Telegram and deletes the stored config.

### How it works

1. User sends a message to the Telegram bot
2. Telegram POSTs the webhook to `https://api.fyso.dev/api/webhooks/telegram/:tenantSlug`
3. Webhook receiver validates the `X-Telegram-Bot-Api-Secret-Token` header
4. Loads bot config from tenant secrets
5. Runs the agent with the incoming message
6. Sends the response back via Telegram `sendMessage` (Markdown)

Supported Telegram message types: text, photo, document, location.

Before the LLM responds, a typing indicator (`sendChatAction: typing`) is sent so the user sees the bot is working.

### Webhook signature

The `secret_token` (optional but recommended) is verified on every incoming webhook. If the header doesn't match, the request is rejected with 401.

## Channel Architecture

Each channel implements the `ChannelAdapter` interface:

- `send(externalRef, message)` — Send a message to the user
- `receive(payload)` — Parse incoming webhook payload into a normalized `IncomingMessage`
- `getStatus()` — Health check (e.g., Telegram `getMe` probe)

Channels that support streaming also implement:
- `sendChunk(externalRef, chunk)` — Send a partial response
- `sendStreamStart(externalRef)` — Signal stream start (e.g., typing indicator)

## Agent-Channel Relationship

Each agent can have multiple channels (1:N). Connect channels via the agent editor UI or MCP tools. A channel connected to one agent receives messages only for that agent.
