# Tool Profiles

Tool profiles control which MCP tools are exposed to the agent. Fyso uses a 3-tier system (`core`, `advanced`, `all`) with the ability to assign a specific profile per user.

## Available profiles

### `core` — Default

The standard profile for daily use. Includes all tools needed to build and operate applications.

Includes: `fyso_data` (record CRUD, scheduling), `fyso_schema` (entity management), `fyso_rules` (business rules), `fyso_auth` (users, roles, tenants, invitations), `fyso_views` (entity views), `fyso_knowledge` (search), `fyso_deploy` (static sites), `fyso_meta` (API spec, metadata, secrets, usage).

**8 grouped tools** (each with multiple actions)

### `advanced`

Everything in `core` plus all actions within the grouped tools. The `core`/`advanced` distinction now applies to which _actions_ within the grouped tools are available, rather than separate tools. Destructive actions (delete entity, delete record) and testing/debugging actions (test rule, rule logs, manage custom fields, change history) are gated behind `advanced`.

**8 grouped tools** (full action set)

### `all`

Same as `advanced`. All MCP functionality is covered by the 8 grouped tools.

**8 grouped tools** (full action set)

## Super admin tools

A separate set of 7 super admin tools exists outside the 3-tier system. These tools are gated by the `FYSO_SA_KEY` environment variable and are not included in any of the profiles above. They are intended exclusively for platform operators and are never exposed to regular users regardless of their profile.

## Profile resolution order

The active tool profile for a user is resolved in this order (highest priority first):

1. **User level** — the `tool_profile` column in `admin_users`. When set, it takes priority over everything else. Admins can assign a specific profile to individual users.
2. **Server environment variable** — `FYSO_TOOLS=core|advanced|all`. Applies to all users on the server unless a user-level profile is set.
3. **Default** — `core`. Used when there is no user-level assignment or environment variable configured.

This allows an admin to run the server with `FYSO_TOOLS=core` but grant `advanced` or `all` to specific users via the `admin_users.tool_profile` column.

## Configuration

In `claude_desktop_config.json` or your MCP client equivalent:

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

## Choosing a profile

| Use case | Recommended profile |
|----------|---------------------|
| Building apps, managing data | `core` |
| CI/CD, advanced debugging, destructive ops | `advanced` |
| Full access (same as advanced) | `all` |
