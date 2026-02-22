# Tool Profiles

Profiles control which MCP tools are available to the agent.

## Configuration

### By environment variable

Environment variable: `FYSO_TOOLS`

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

### Per user (admin)

Each `adminUser` can have their own `tool_profile` configured from the admin panel.

**Priority order:**
1. User profile (`adminUser.toolProfile`)
2. `FYSO_TOOLS` environment variable
3. Default: `core`

This allows different users on the same tenant to have different levels of access to MCP tools.

## Available profiles

| Value | Description |
|-------|-------------|
| `core` | Default. ~37 essential tools for daily use |
| `advanced` | ~55 tools. Adds power-user features: delete, test, flows, secrets, logs, webhooks, roles |
| `all` | ~74 tools. Everything, including channels and bots |

## Profile: core

Tools for day-to-day app building:

```
list_tenants, select_tenant,
generate_entity, list_entities, get_entity_schema, publish_entity, add_field,
query_records, create_record, update_record, delete_record,
generate_business_rule, list_business_rules, publish_business_rule,
create_user, list_users,
deploy_static_site, list_static_sites,
export_metadata, import_metadata,
get_rest_api_spec, generate_api_client,
publish_app, unpublish_app, update_app,
get_available_slots, create_booking,
create_pdf_template, generate_pdf, upload_file,
upload_document, search_knowledge, list_documents,
get_document, delete_document, get_knowledge_stats
```

## Profile: advanced

Everything in `core` plus:

```
delete_entity, list_entity_changes, manage_custom_fields,
create_business_rule, get_business_rule, test_business_rule,
delete_business_rule, get_rule_logs,
tenant_login,
list_roles, create_role, assign_role, revoke_role,
create_webhook, list_webhooks, delete_webhook,
delete_static_site, generate_deploy_token,
set_secret, delete_secret,
create_flow, list_flows, update_flow, delete_flow, toggle_flow
```

## Profile: all

Everything in `advanced` plus channels, bots, and invitation codes:

```
search_channels, get_channel_info, get_my_channel, get_channel_tools,
publish_channel, update_channel, unpublish_channel, set_channel_permissions,
define_channel_tool, update_channel_tool, remove_channel_tool, execute_channel_tool,
register_bot, identify_bot, list_bots, whoami_bot, revoke_bot,
generate_invitation_code, list_invitation_codes
```
