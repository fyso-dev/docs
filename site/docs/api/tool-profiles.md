---
sidebar_position: 3
---

# Tool Profiles

Tool profiles control which MCP tools are exposed to the agent. Fyso uses a 3-tier system (`core`, `advanced`, `all`) with optional per-user overrides.

## Available Profiles

### `core` — Default

The standard profile for everyday use. Includes all tools needed to build and operate applications.

Includes: `fyso_data` (records CRUD, scheduling), `fyso_schema` (entity management), `fyso_rules` (business rules), `fyso_auth` (users, roles, tenants), `fyso_views` (entity views), `fyso_knowledge` (search), `fyso_deploy` (static sites), `fyso_meta` (API spec, metadata, secrets, usage), `fyso_agents` (agent management), `fyso_ai` (AI providers and calls).

**10 grouped tools** (each with multiple actions)

### `advanced`

Everything in `core` plus all actions within the grouped tools. The `core` and `advanced` distinction now applies to which _actions_ within grouped tools are available, rather than separate tool names. Destructive actions (delete entity, delete record) and testing/debugging actions (test rule, rule logs, manage custom fields, entity change history) are gated behind `advanced`.

**10 grouped tools** (full action set)

### `all`

Everything in `advanced` plus channel management, bot identity, and invitation tools as individual tools.

**10 grouped + individual tools**

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
| CI/CD, advanced debugging, destructive ops | `advanced` |
| Bot/channel management | `all` |
