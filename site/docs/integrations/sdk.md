---
sidebar_position: 2
---

# Integration SDK

Fyso supports third-party integrations that extend the platform with custom actions, tools, and data storage.

## Overview

An integration is a package with:
- A **manifest** (`fyso-integration.json`) describing the integration
- **Tool handlers** that execute actions
- **SQL migrations** for integration-specific tables (prefixed automatically)
- A **config schema** defining required credentials

## Manifest

```json
{
  "slug": "discord",
  "name": "Discord Webhooks",
  "version": "1.0.0",
  "description": "Send messages and embeds to Discord channels",
  "configSchema": {
    "type": "object",
    "properties": {
      "webhook_url": {
        "type": "string",
        "pattern": "^https://discord\\.com/api/webhooks/",
        "description": "Discord webhook URL"
      }
    },
    "required": ["webhook_url"]
  },
  "tools": [
    {
      "slug": "send-message",
      "name": "Send Message",
      "description": "Send a text message to a Discord channel",
      "handler": "tools/send-message.ts",
      "inputSchema": {
        "type": "object",
        "properties": {
          "content": { "type": "string", "maxLength": 2000 }
        },
        "required": ["content"]
      }
    }
  ]
}
```

Manifest validation enforces: valid slug pattern, semver version, valid JSON Schema for config and inputs, handler files must exist.

## Writing a Tool Handler

```typescript
import { defineAction, IntegrationContext } from '@fyso/integrations-sdk';

export default defineAction(async (ctx: IntegrationContext, input: { content: string }) => {
  const config = await ctx.getConfig();

  const res = await fetch(config.webhook_url + '?wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: input.content }),
  });

  if (!res.ok) {
    throw new IntegrationError('Discord API error', { statusCode: res.status, retryable: res.status === 429 });
  }

  return { success: true, messageId: (await res.json()).id };
});
```

`defineAction` wraps your handler with structured logging and an error boundary.

## Lifecycle

Integrations go through these states:

```
registered → installed → active ↔ deactivated → uninstalled
```

| State | Description |
|-------|-------------|
| `registered` | Manifest validated, available in catalog |
| `installed` | Migrations run, config stored (encrypted) |
| `active` | Tools available to agents and rules |
| `deactivated` | Tools disabled, config preserved |
| `uninstalled` | Config and data removed |

### MCP Tools

| Tool | Description |
|------|-------------|
| `list_integrations` | List available integrations and their status |
| `install_integration` | Install and configure an integration |
| `configure_integration` | Update integration config |
| `activate_integration` | Enable integration tools |
| `test_integration` | Test integration connectivity |
| `uninstall_integration` | Remove integration |
| `list_integration_logs` | View integration health logs |

## Credential Store

Fields with `format: "secret"` in the config schema are AES-256-GCM encrypted before storage. Credentials are stored in `tenant_registry.integration_installations`, outside tenant schemas.

Cross-tenant isolation is enforced — all queries are scoped by `(tenant_id, integration_slug)`.

## Integration Tools in Agents

Active integrations inject their tools into the agent runner as `integration:<slug>:<tool-slug>`. For example, when the Discord integration is active, agents can call `integration:discord:send-message`.

## Circuit Breaker

The runtime tracks consecutive failures. After 10 consecutive failures, the integration is automatically deactivated. A successful execution resets the counter.

## Testing

The SDK includes a 3-tier test battery:

| Tier | Focus | Checks |
|------|-------|--------|
| Structural | Manifest validity | Files exist, handlers export, no forbidden imports |
| Functional | Tool behavior | Success/error response shapes, 5s timeout guard |
| Security | Isolation | No raw SQL, no `SET search_path`, no cross-integration config |

```bash
bun run test:integration packages/integrations/discord
```

## Built-in: Discord

The Discord webhook integration ships with Fyso:

**Tools:**
- `send-message` — Send a text message (max 2000 chars, 429 rate limit handling)
- `send-embed` — Send a rich embed (title, description, color, fields, footer, timestamp)

**Config:** Requires a Discord webhook URL.
