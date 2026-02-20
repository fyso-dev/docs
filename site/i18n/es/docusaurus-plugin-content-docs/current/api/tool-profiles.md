---
sidebar_position: 3
---

# Perfiles de herramientas

Los perfiles de herramientas controlan qué herramientas MCP se exponen al agente. Usá la variable de entorno `FYSO_TOOLS` para configurar el perfil.

## Perfiles disponibles

### `core` — Por defecto

El perfil estándar para uso diario. Incluye todas las herramientas necesarias para construir y operar aplicaciones.

Incluye: selección de tenant, gestión de entidades, CRUD de registros, reglas de negocio, RBAC, usuarios, archivos, PDF, sitios estáticos, apps, scheduling, Base de conocimiento, spec de API, importación/exportación de metadata.

**~55 herramientas**

### `advanced`

Todo lo de `core` más operaciones destructivas, herramientas de testing, flows, secretos, tokens de deploy y logs de ejecución.

Agrega: `delete_entity`, `delete_record`, `test_business_rule`, `delete_business_rule`, `get_rule_logs`, `delete_static_site`, `generate_deploy_token`, `set_secret`, `delete_secret`, `create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`, `delete_document`, `tenant_login`, `manage_custom_fields`, `list_entity_changes`.

**~73 herramientas**

### `all`

Todo lo de `advanced` más herramientas de gestión de canales y bots.

**~85 herramientas**

## Configuración

En `claude_desktop_config.json` o el cliente MCP equivalente:

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

## Elegir un perfil

| Caso de uso | Perfil recomendado |
|-------------|-------------------|
| Construir apps, gestionar datos | `core` |
| CI/CD, flows, debugging avanzado | `advanced` |
| Gestión de bots/canales | `all` |
