---
sidebar_position: 3
---

# Configure MCP

Connect an AI agent (Claude, Cursor, etc.) to your Fyso workspace using the MCP server.

## Option 1: Claude Desktop (manual config)

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

## Option 2: Smithery

Install directly from Smithery.ai:

```bash
npx @smithery/cli install @fyso/mcp-server --client claude
```

## Option 3: Anthropic Connectors Directory

Find Fyso in the Anthropic MCP Connectors Directory and install with one click.

## Environment Variables

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

- Claude Desktop
- Cursor
- Claude Code (CLI)
- Codex
- Gemini
- Any MCP-compatible client
