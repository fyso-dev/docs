# Configurar MCP

Fyso se conecta a agentes de IA a traves del protocolo MCP (Model Context Protocol).

## Requisitos

- Node.js 18+
- API key de Fyso (obtenida desde el panel admin o el script de setup)

## Configuracion en Claude Desktop

Agrega la siguiente configuracion en tu archivo `claude_desktop_config.json`:

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

## Variables de entorno

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `FYSO_API_KEY` | Si | API key para autenticacion |
| `FYSO_API_URL` | Si | URL base de la API (ej: `https://api.fyso.dev/api`) |
| `FYSO_TOOLS` | No | Perfil de herramientas: `core` (default), `advanced`, `all` |

## Verificar conexion

Una vez configurado, el agente puede verificar la conexion:

```
list_tenants()
```

Deberia devolver la lista de tenants accesibles.

## Flujo tipico de sesion MCP

1. `list_tenants()` -- ver tenants disponibles
2. `select_tenant({ tenantSlug: "mi-empresa" })` -- seleccionar contexto
3. `list_entities()` -- ver entidades existentes
4. Trabajar con entidades, registros y reglas

Todos los tools posteriores a `select_tenant` operan en el contexto del tenant seleccionado.

## Perfiles de herramientas

Ver [Tool Profiles](../api/tool-profiles.md) para el detalle de que herramientas incluye cada perfil.
