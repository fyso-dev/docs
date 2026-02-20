---
sidebar_position: 3
---

# Configurar MCP

Conectá un agente de IA (Claude, Cursor, etc.) a tu espacio de trabajo de Fyso usando el servidor MCP.

## Opción 1: Claude Desktop (config manual)

Agregá a `claude_desktop_config.json`:

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

## Opción 2: Smithery

Instalá directamente desde Smithery.ai:

```bash
npx @smithery/cli install @fyso/mcp-server --client claude
```

## Opción 3: Directorio de conectores de Anthropic

Encontrá Fyso en el directorio de conectores MCP de Anthropic e instalá con un clic.

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `FYSO_API_KEY` | Sí | Tu API key de Fyso |
| `FYSO_API_URL` | Sí | `https://api.fyso.dev/api` |
| `FYSO_TOOLS` | No | Perfil de herramientas: `core` (por defecto), `advanced`, `all` |

## Flujo típico

```
list_tenants()
→ select_tenant({ tenantSlug: "mi-empresa" })
→ list_entities()
→ query_records({ entityName: "clientes", limit: 10 })
```

## Clientes compatibles

- Claude Desktop
- Cursor
- Claude Code (CLI)
- Codex
- Gemini
- Cualquier cliente compatible con MCP
