---
sidebar_position: 3
---

# Tool Profiles

Tool profiles control which MCP tools are exposed to the agent. Use the `FYSO_TOOLS` environment variable to configure the profile.

## Available Profiles

### `core` — Default

The standard profile for everyday use. Includes all tools needed to build and operate applications.

Includes: tenant selection, entity management, records CRUD, business rules, RBAC, users, files, PDF, static sites, apps, scheduling, Knowledge Base, API spec, metadata import/export.

**~55 tools**

### `advanced`

Everything in `core` plus destructive operations, testing tools, flows, secrets, deploy tokens, and execution logs.

Adds: `delete_entity`, `delete_record`, `test_business_rule`, `delete_business_rule`, `get_rule_logs`, `delete_static_site`, `generate_deploy_token`, `set_secret`, `delete_secret`, `create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`, `delete_document`, `tenant_login`, `manage_custom_fields`, `list_entity_changes`.

**~73 tools**

### `all`

Everything in `advanced` plus channel and bot management tools.

**~85 tools**

## Configuration

In `claude_desktop_config.json` or equivalent MCP client config:

```json
{
  "mcpServers": {
    "fyso": {
      "command": "npx",
      "args": ["-y", "@fyso/mcp-server"],
      "env": {
        "FYSO_API_KEY": "your-key",
        "FYSO_API_URL": "https://api.fyso.dev/api",
        "FYSO_TOOLS": "core"
      }
    }
  }
}
```

## Choosing a Profile

| Use case | Recommended profile |
|----------|-------------------|
| Building apps, managing data | `core` |
| CI/CD, flows, advanced debugging | `advanced` |
| Bot/channel management | `all` |
