---
sidebar_position: 3
---

# Perfiles de herramientas

Los perfiles de herramientas controlan qué herramientas MCP se exponen al agente. Fyso usa un sistema de 3 niveles (`core`, `advanced`, `all`) con la posibilidad de asignar un perfil específico por usuario.

## Perfiles disponibles

### `core` — Por defecto

El perfil estándar para uso diario. Incluye todas las herramientas necesarias para construir y operar aplicaciones.

Incluye: selección de tenant, gestión de entidades, CRUD de registros, reglas de negocio, RBAC, usuarios, archivos, PDF, sitios estáticos, apps, scheduling, Base de conocimiento, spec de API, importación/exportación de metadata.

**~60 herramientas**

### `advanced`

Todo lo de `core` más operaciones destructivas, herramientas de testing, flows, secretos, webhooks, tokens de deploy y logs de ejecución.

Agrega: `delete_entity`, `delete_record`, `test_business_rule`, `delete_business_rule`, `get_rule_logs`, `delete_static_site`, `generate_deploy_token`, `set_custom_domain`, `set_secret`, `delete_secret`, `create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`, `create_webhook`, `list_webhooks`, `delete_webhook`, `delete_document`, `tenant_login`, `manage_custom_fields`, `list_entity_changes`.

**~76 herramientas**

### `all`

Todo lo de `advanced` más herramientas de gestión de canales y bots.

**~91 herramientas**

## Orden de resolución del perfil

El perfil activo de herramientas para un usuario se resuelve en este orden (mayor prioridad primero):

1. **Nivel de usuario** — la columna `tool_profile` en `admin_users`. Cuando tiene un valor, toma prioridad sobre todo lo demás. Los administradores pueden asignar un perfil específico a usuarios individuales.
2. **Variable de entorno del servidor** — `FYSO_TOOLS=core|advanced|all`. Se aplica a todos los usuarios del servidor a menos que se haya definido un perfil a nivel de usuario.
3. **Por defecto** — `core`. Se usa cuando no hay una asignación a nivel de usuario ni una variable de entorno configurada.

Esto permite que un administrador ejecute el servidor con `FYSO_TOOLS=core` pero otorgue `advanced` o `all` a usuarios específicos mediante la columna `admin_users.tool_profile`.

## Herramientas de super administrador

Existe un conjunto separado de herramientas de super administrador fuera del sistema de 3 niveles. Estas herramientas están protegidas por la variable de entorno `FYSO_SA_KEY` y no se incluyen en ninguno de los perfiles anteriores. Están destinadas exclusivamente a operadores de la plataforma y no se exponen a usuarios regulares sin importar su perfil.

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
