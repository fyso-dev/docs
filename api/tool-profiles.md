# Tool Profiles

Los perfiles controlan que herramientas MCP estan disponibles para el agente.

## Configuracion

Variable de entorno: `FYSO_TOOLS`

| Valor | Descripcion |
|-------|-------------|
| `core` | Default. ~26 tools esenciales para uso diario |
| `advanced` | ~38 tools. Agrega poder-usuario: delete, test, flows, secrets, logs |
| `all` | ~49 tools. Todo, incluyendo channels y bots |

## Perfil: core

Tools para el dia a dia de construccion de apps:

```
list_tenants, select_tenant,
generate_entity, list_entities, get_entity_schema, publish_entity,
query_records, create_record, update_record, delete_record,
generate_business_rule, list_business_rules, publish_business_rule,
create_user, list_users,
deploy_static_site, list_static_sites,
export_metadata, import_metadata,
get_rest_api_spec, generate_api_client,
publish_app, unpublish_app, update_app,
get_available_slots, create_booking,
generate_pdf, upload_file
```

## Perfil: advanced

Todo lo de `core` mas:

```
delete_entity, list_entity_changes, manage_custom_fields,
create_business_rule, get_business_rule, test_business_rule,
delete_business_rule,
tenant_login,
delete_static_site,
set_secret, delete_secret,
create_flow, list_flows, update_flow, delete_flow, toggle_flow,
get_rule_logs
```

## Perfil: all

Todo lo de `advanced` mas channels, bots y codigos de invitacion:

```
search_channels, get_channel_info, get_my_channel, get_channel_tools,
publish_channel, update_channel, unpublish_channel, set_channel_permissions,
define_channel_tool, update_channel_tool, remove_channel_tool, execute_channel_tool,
register_bot, identify_bot, list_bots, whoami_bot, revoke_bot,
generate_invitation_code, list_invitation_codes
```

## Ejemplo de configuracion

```json
{
  "mcpServers": {
    "fyso": {
      "command": "npx",
      "args": ["-y", "@fyso/mcp-server"],
      "env": {
        "FYSO_API_KEY": "...",
        "FYSO_API_URL": "https://api.fyso.dev/api",
        "FYSO_TOOLS": "advanced"
      }
    }
  }
}
```
