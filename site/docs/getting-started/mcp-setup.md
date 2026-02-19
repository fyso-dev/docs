# Configure MCP

Fyso connects to AI agents through the MCP (Model Context Protocol) protocol.

## Requirements

- Node.js 18+
- Fyso API key (obtained from the admin panel or the setup script)

## Configuration in Claude Desktop

Add the following configuration to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "fyso": {
      "command": "npx",
      "args": ["-y", "@fyso/mcp-server"],
      "env": {
        "FYSO_API_KEY": "tu-api-key",
        "FYSO_API_URL": "https://api.fyso.dev/api",
        "FYSO_TOOLS": "core"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FYSO_API_KEY` | Yes | API key for authentication |
| `FYSO_API_URL` | Yes | Base URL of the API (e.g., `https://api.fyso.dev/api`) |
| `FYSO_TOOLS` | No | Tool profile: `core` (default), `advanced`, `all` |

## Verify Connection

Once configured, the agent can verify the connection:

```
list_tenants()
```

It should return the list of accessible tenants.

## Typical MCP Session Flow

1. `list_tenants()` -- see available tenants
2. `select_tenant({ tenantSlug: "mi-empresa" })` -- select context
3. `list_entities()` -- see existing entities
4. Work with entities, records, and rules

All tools after `select_tenant` operate in the context of the selected tenant.

## Tool Profiles

See [Tool Profiles](../api/tool-profiles.md) for details on which tools each profile includes.
