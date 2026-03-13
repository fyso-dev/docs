---
sidebar_position: 3
---

# Configure MCP

Connect an AI agent (Claude, Cursor, etc.) to your Fyso workspace using the MCP server.

## Option 1: Claude Code plugin (recommended)

The `@fyso/claude-plugin` package installs skills, hooks, and the MCP connection in one command:

```bash
bunx @fyso/claude-plugin install
```

Authentication uses OAuth — a browser window opens on first use, no API key needed. See [Claude Code Plugin](./claude-plugin.md) for full details.

## Option 2: Claude Desktop (manual config)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fyso": {
      "command": "npx",
      "args": ["-y", "@fyso/mcp-server"],
      "env": {
        "FYSO_API_KEY": "your-api-key",
        "FYSO_API_URL": "https://api.fyso.dev/api",
        "FYSO_TOOLS": "core"
      }
    }
  }
}
```

## Option 3: Smithery

Install directly from Smithery.ai:

```bash
npx @smithery/cli install @fyso/mcp-server --client claude
```

## Option 4: Anthropic Connectors Directory

Find Fyso in the Anthropic MCP Connectors Directory and install with one click.

## Environment Variables (manual config only)

These apply when configuring the MCP server manually (Option 2). The Claude Code plugin handles authentication via OAuth and does not require these variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `FYSO_API_KEY` | Yes | Your Fyso API key |
| `FYSO_API_URL` | Yes | `https://api.fyso.dev/api` |
| `FYSO_TOOLS` | No | Tool profile: `core` (default), `advanced`, `all` |

## Typical Workflow

```
list_tenants()
→ select_tenant({ tenantSlug: "mi-empresa" })
→ list_entities()
→ query_records({ entityName: "clientes", limit: 10 })
```

## Compatible Clients

- Claude Code (via `@fyso/claude-plugin`)
- Claude Desktop
- Cursor
- Codex
- Gemini
- Any MCP-compatible client
