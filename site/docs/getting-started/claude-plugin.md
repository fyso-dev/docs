---
sidebar_position: 4
---

# Claude Code Plugin

The `@fyso/claude-plugin` package installs the full Fyso development experience into Claude Code: skills, hooks, and MCP server connection — in one command.

## What it includes

| Component | Description |
|-----------|-------------|
| Skills | 19 slash commands (`/fyso-plan`, `/fyso-build`, `/fyso-verify`, `/fyso-ui`, and more) |
| Hooks | `PostToolUse` hook that auto-syncs `FYSO-REFERENCE.md` when reference files change |
| MCP server | Connects Claude Code to `https://app.fyso.dev/mcp` via OAuth |
| Reference docs | `FYSO-REFERENCE.md` — consolidated API and DSL reference, always loaded |

## Installation

```bash
bunx @fyso/claude-plugin install
```

That command:
1. Symlinks each skill into `~/.claude/skills/`
2. Merges the sync hook into `~/.claude/settings.json`
3. Copies `FYSO-REFERENCE.md` into `~/.claude/`

Restart Claude Code after install.

### Alternative install methods

```bash
# From a local clone of the fyso repo
bun packages/claude-plugin/bin/cli.ts install

# Silent mode (runs automatically via postinstall)
bunx @fyso/claude-plugin install --auto
```

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

## CLI commands

```bash
fyso-plugin install      # Install skills, hooks, and reference docs
fyso-plugin uninstall    # Remove installed skills
fyso-plugin status       # Show what is installed
fyso-plugin sync         # Regenerate FYSO-REFERENCE.md from source files
fyso-plugin help         # Show usage
```

All commands can also be run with `bunx @fyso/claude-plugin <command>`.

## Verify the install

```bash
fyso-plugin status
```

Expected output (green dots = installed):

```
Skills:
  ● /fyso-plan   (symlink)
  ● /fyso-build  (symlink)
  ...

Hooks:
  ● PostToolUse: sync-reference hook

Reference:
  ● FYSO-REFERENCE.md
```

## Uninstall

```bash
fyso-plugin uninstall
```

Removes all skill symlinks from `~/.claude/skills/`. The hook in `settings.json` and `FYSO-REFERENCE.md` are left in place — remove them manually if needed.

## Plugin manifest fields

The `.claude-plugin/plugin.json` manifest declares:

| Field | Value |
|-------|-------|
| `skills` | `./skills/` |
| `hooks` | `./hooks/hooks.json` |
| `mcpServers` | `./.mcp.json` |

The `agents` field is not used — agents are referenced by skills at runtime, not installed as separate components.

## Troubleshooting

**Skills not showing up after install**

Restart Claude Code. Skill discovery runs at startup.

**OAuth browser window does not open**

Make sure `npx` is available in your PATH and that `mcp-remote` can resolve `https://app.fyso.dev/mcp`. Run the connection once manually:

```bash
npx -y mcp-remote https://app.fyso.dev/mcp
```

**`FYSO_API_KEY` errors**

The plugin no longer uses `FYSO_API_KEY`. If you see this error, you may have an older version of the plugin. Re-install with `bunx @fyso/claude-plugin install`.

**Reference out of date**

```bash
fyso-plugin sync
```
