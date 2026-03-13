---
sidebar_position: 4
---

# Claude Code Plugin

The `@fyso/claude-plugin` package installs the full Fyso development experience into Claude Code: skills, hooks, and MCP server connection — in one command.

## What it includes

| Component | Description |
|-----------|-------------|
| Skills | 20 slash commands (`/fyso-plan`, `/fyso-build`, `/fyso-verify`, `/fyso-ui`, and more) |
| Hooks | 5 hooks across 4 lifecycle events — destructive op guard, reference sync, state tracking, project context loading, and draft verification |
| MCP server | Connects Claude Code to `https://app.fyso.dev/mcp` via OAuth |
| Reference docs | `FYSO-REFERENCE.md` — consolidated API and DSL reference, always loaded |

## Installation

### Claude Code Marketplace (recommended)

Search for **fyso** in the Claude Code plugins marketplace, or install directly from the repository:

```
https://github.com/fyso-dev/claude-plugin
```

### Manual install from a clone

```bash
git clone https://github.com/fyso-dev/claude-plugin
cd claude-plugin
# Follow instructions in README.md
```

Restart Claude Code after install.

## Authentication

The plugin connects to Fyso via OAuth — no API key needed.

When Claude Code first calls a Fyso MCP tool, `mcp-remote` will open a browser window for you to sign in to your Fyso account. The session token is stored locally and reused on subsequent runs.

The `.mcp.json` the plugin registers looks like this:

```json
{
  "mcpServers": {
    "fyso": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://app.fyso.dev/mcp"]
    }
  }
}
```

No environment variables are required.

## Hooks

The plugin installs 5 hooks across 4 Claude Code lifecycle events:

### PreToolUse — Destructive operation guard

Triggers before `delete_entity`, `delete_business_rule`, `purge_entity_data`, or `delete_record`. Before the operation runs, Claude is prompted to verify the entity has no records and no other entity holds a relation field pointing to it. If data or relations exist, Claude explains the impact and waits for explicit confirmation.

### PostToolUse — Reference sync

Triggers after any `Edit` or `Write` tool call that touches a reference `.md` file inside the skills directory. Automatically regenerates `FYSO-REFERENCE.md` so the reference stays current without manual intervention.

### PostToolUse — State tracking

Triggers after MCP calls that modify tenant state: `generate_entity`, `publish_entity`, `create_business_rule`, `publish_business_rule`, `update_entity`, and `import_metadata`. If `.planning/STATE.md` exists in the project, Claude silently updates it to reflect the change.

### SessionStart — Project context loading

At session start, Claude reads `.planning/PROJECT.md`, `.planning/STATE.md`, and `.planning/ROADMAP.md` if they exist — silently, without reporting them — to build accurate context about the current project and tenant state.

### Stop — Draft verification

Before a session ends, Claude checks whether any entities or rules are still in draft that should be published, and whether `STATE.md` reflects the real tenant state. If anything is unpublished or out of sync, Claude informs the user in 2–3 lines. If everything is in order, Claude says nothing.

## Plugin manifest fields

The `.claude-plugin/plugin.json` manifest declares:

| Field | Value |
|-------|-------|
| `skills` | `./skills/` |
| `hooks` | `./hooks/hooks.json` |
| `mcpServers` | `./.mcp.json` |

The `agents` field was removed from `plugin.json`. The `agents/` directory (5 agent personas) still ships with the plugin and is referenced by skills at runtime.

## Troubleshooting

**Skills not showing up after install**

Restart Claude Code. Skill discovery runs at startup.

**OAuth browser window does not open**

Make sure `npx` is available in your PATH and that `mcp-remote` can resolve `https://app.fyso.dev/mcp`. Run the connection once manually:

```bash
npx -y mcp-remote https://app.fyso.dev/mcp
```

**`FYSO_API_KEY` errors**

The plugin does not use `FYSO_API_KEY`. If you see this error, you may have an older version. Re-install from the marketplace or from a fresh clone.
