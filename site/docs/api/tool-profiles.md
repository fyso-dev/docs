---
sidebar_position: 3
---

# Tool Profiles

Tool profiles control which MCP tools are exposed to the agent. Fyso uses a 3-tier system (`core`, `advanced`, `all`) with optional per-user overrides.

## Available Profiles

### `core` — Default

The standard profile for everyday use. Includes all tools needed to build and operate applications.

Includes: tenant selection, entity management, records CRUD, business rules, RBAC, users, files, PDF, static sites, apps, scheduling, Knowledge Base, API spec, metadata import/export.

**~60 tools**

### `advanced`

Everything in `core` plus destructive operations, testing tools, flows, secrets, webhooks, deploy tokens, and execution logs.

Adds: `delete_entity`, `delete_record`, `test_business_rule`, `delete_business_rule`, `get_rule_logs`, `delete_static_site`, `generate_deploy_token`, `set_custom_domain`, `set_secret`, `delete_secret`, `create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`, `create_webhook`, `list_webhooks`, `delete_webhook`, `delete_document`, `tenant_login`, `manage_custom_fields`, `list_entity_changes`.

**~76 tools**

### `all`

Everything in `advanced` plus channel and bot management tools.

**~91 tools**

## Profile Resolution Order

The active tool profile for a user is resolved in this order (highest priority first):

1. **User-level override** — the `tool_profile` column on `admin_users`. When set, this takes priority over everything else. Admins can assign a specific profile to individual users.
2. **Server environment variable** — `FYSO_TOOLS=core|advanced|all`. Applies to all users on the server unless overridden at the user level.
3. **Default** — `core`. Used when neither a user-level override nor an environment variable is set.

This means an admin can run the server with `FYSO_TOOLS=core` but grant specific power users `advanced` or `all` via the `admin_users.tool_profile` column.

## Super Admin Tools

A separate set of super admin tools exists outside the 3-tier profile system. These tools are gated by the `FYSO_SA_KEY` environment variable and are not included in any of the profiles above. They are intended for platform operators only and are not exposed to regular users regardless of their profile.

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
