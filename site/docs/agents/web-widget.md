---
sidebar_position: 7
---

# Web Widget

The web widget lets you embed a Fyso agent as a floating chat bubble on any website. Add one `<script>` tag and the widget handles everything: session management, message delivery, and UI rendering.

## Quick Start

```html
<script src="https://api.fyso.dev/api/tenants/{tenantSlug}/agents/{agentSlug}/widget.js"></script>
```

Replace `{tenantSlug}` and `{agentSlug}` with your tenant and agent identifiers. The script tag is available from the agent's **Channels** tab in the admin panel.

The widget injects a floating chat button at the bottom-right corner of the page. Clicking it opens the chat interface connected directly to your agent.

## How It Works

### Endpoints

The web widget uses three public API endpoints. No tenant authentication is required — access is validated by tenant slug and agent slug matching.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tenants/:slug/agents/:agentSlug/widget.js` | Returns the embeddable JS snippet |
| `POST` | `/api/tenants/:slug/agents/:agentSlug/chat` | Send a user message; returns the agent reply |
| `GET` | `/api/tenants/:slug/agents/:agentSlug/chat/sse` | SSE stream for receiving replies (long-poll, max 30s) |

### Session Management

Sessions are identified by a token stored in `localStorage`. The token is issued on first contact and persists across page loads and browser restarts. It maps to an `externalRef` used throughout the Fyso session system. Users who clear their `localStorage` start a new session.

### CORS

Widget endpoints return `Access-Control-Allow-Origin: *` because they are designed to be embedded on arbitrary customer domains. Sessions use `localStorage` tokens (not cookies), so a wildcard CORS policy is safe.

## Configuration

Widget appearance and behavior is configured on the agent's web channel settings. Available options:

| Option | Default | Description |
|--------|---------|-------------|
| `title` | `Chat` | Text shown in the widget header |
| `primaryColor` | `#6366f1` | Button and header color (any CSS color) |
| `position` | `bottom-right` | Widget position: `bottom-right` or `bottom-left` |
| `welcomeMessage` | `Hello! How can I help you today?` | First message shown when the chat opens |

Configure these from the admin panel under **Agents → [your agent] → Channels → Web**.

## Agent Memory and Consent

The web widget generates a `session_token` as the `externalRef` for the session. This token is used as the key for:

- **Agent memory** — if `memory_enabled` is on, facts are stored and retrieved per `session_token`. See [Agent Memory](./agent-memory.md).
- **RGPD consent** — you can record AI consent for a widget session using the session ID returned in the chat response. See [RGPD Compliance](./rgpd-compliance.md).

## Template Selector

When creating a new agent, the admin panel shows a template selector that lets you start from a pre-configured template instead of from scratch. Templates include predefined rules, system prompts, and channel settings for common use cases. Select a template or choose **Start blank** to configure everything manually.

## Limitations

- The in-process response queue (`WebWidgetAdapter.pendingMessages`) is per-process. In multi-process deployments (multiple API containers behind a load balancer), a user's chat POST and their SSE connection must reach the same process. For horizontally-scaled deployments, back the queue with Redis pub/sub instead.
- The SSE stream long-polls for up to 30 seconds per connection, then closes. The client reconnects automatically.
- Widget endpoints do not enforce DPA or AI consent — those checks are the tenant operator's responsibility. See [RGPD Compliance](./rgpd-compliance.md).

## Security Notes

- The widget is intentionally unauthenticated. Protect against abuse using the agent's rate limiting settings and deterministic rules.
- Input is sanitized server-side (control characters stripped) to prevent prompt injection from the widget UI.
- The agent slug and tenant slug are validated on every request — a valid combination must exist in the database.
