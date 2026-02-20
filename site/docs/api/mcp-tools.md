# Complete MCP Tools Reference

List of all MCP tools available in Fyso, grouped by category.

## Tenant

| Tool | Profile | Description |
|------|---------|-------------|
| `list_tenants` | core | List accessible tenants |
| `select_tenant` | core | Select active tenant for the session |

## Entities

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_entity` | core | Create entity with fields from JSON |
| `list_entities` | core | List entities (published or with drafts) |
| `get_entity_schema` | core | Get full schema with structure hints |
| `publish_entity` | core | Publish draft entity |
| `delete_entity` | advanced | Delete entity and records |
| `list_entity_changes` | advanced | Version history |
| `manage_custom_fields` | advanced | Custom fields CRUD |

## Records

| Tool | Profile | Description |
|------|---------|-------------|
| `query_records` | core | Query with filters, pagination, semantic search |
| `create_record` | core | Create record |
| `update_record` | core | Update record (partial) |
| `delete_record` | core | Delete record |

## Business Rules

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_business_rule` | core | Create rule (DSL or prompt) |
| `list_business_rules` | core | List rules for an entity |
| `publish_business_rule` | core | Publish draft rule |
| `create_business_rule` | advanced | Create rule with direct DSL |
| `get_business_rule` | advanced | View rule details |
| `test_business_rule` | advanced | Test rule with test data |
| `delete_business_rule` | advanced | Delete rule |
| `get_rule_logs` | advanced | Execution logs |

## Users and Authentication

| Tool | Profile | Description |
|------|---------|-------------|
| `create_user` | core | Create user in the tenant |
| `list_users` | core | List tenant users |
| `tenant_login` | advanced | Login as user (returns JWT) |

## Files

| Tool | Profile | Description |
|------|---------|-------------|
| `upload_file` | core | Upload file to a file field (via URL or base64) |

## PDF

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_pdf` | core | Generate PDF from template + data |

## Static Sites

| Tool | Profile | Description |
|------|---------|-------------|
| `deploy_static_site` | core | Deploy site on sites.fyso.dev |
| `list_static_sites` | core | List active deployments |
| `delete_static_site` | advanced | Delete site |

## API and Client

| Tool | Profile | Description |
|------|---------|-------------|
| `get_rest_api_spec` | core | REST specification with example curl commands |
| `generate_api_client` | core | Generate TypeScript client with types |

## Metadata

| Tool | Profile | Description |
|------|---------|-------------|
| `export_metadata` | core | Export entities, fields, rules to JSON |
| `import_metadata` | core | Import metadata from JSON |

## Apps

| Tool | Profile | Description |
|------|---------|-------------|
| `publish_app` | core | Publish tenant as an installable app |
| `unpublish_app` | core | Unpublish app |
| `update_app` | core | Update app metadata |

## Scheduling

| Tool | Profile | Description |
|------|---------|-------------|
| `get_available_slots` | core | Query availability |
| `create_booking` | core | Create booking with validation |

## Secrets

| Tool | Profile | Description |
|------|---------|-------------|
| `set_secret` | advanced | Store a secret |
| `delete_secret` | advanced | Delete a secret |

## Flows (automations)

| Tool | Profile | Description |
|------|---------|-------------|
| `create_flow` | advanced | Create automation |
| `list_flows` | advanced | List flows |
| `update_flow` | advanced | Update flow |
| `delete_flow` | advanced | Delete flow |
| `toggle_flow` | advanced | Enable/disable flow |

## Knowledge Base (RAG)

| Tool | Profile | Description |
|------|---------|-------------|
| `upload_document` | advanced | Upload and process document (PDF, TXT, MD) |
| `search_knowledge` | core | Semantic search in ingested documents |
| `list_documents` | core | List documents in the knowledge base |
| `get_document` | advanced | Get document details and metadata |
| `delete_document` | advanced | Delete document and its chunks |
| `get_knowledge_stats` | core | Statistics: documents, chunks, storage |

## Roles and Permissions (RBAC)

| Tool | Profile | Description |
|------|---------|-------------|
| `list_roles` | core | List tenant roles |
| `create_role` | advanced | Create custom role with permissions |
| `assign_role` | advanced | Assign role to a user |
| `remove_role` | advanced | Remove role from a user |

## Metrics and Usage

| Tool | Profile | Description |
|------|---------|-------------|
| `get_usage` | core | Current tenant usage (entities, records, limits) |
| `get_usage_dashboard` | advanced | Usage dashboard with latency and daily breakdown |

## Superadmin (superadmins only)

| Tool | Profile | Description |
|------|---------|-------------|
| `list_all_tenants` | superadmin | List all platform tenants |
| `get_tenant_details` | superadmin | Tenant details (plan, usage, status) |
| `change_tenant_plan` | superadmin | Change tenant plan |
| `suspend_tenant` | superadmin | Suspend tenant |
| `list_all_admins` | superadmin | List all administrators |
| `get_server_health` | superadmin | Server and database status |

## Channels and Bots (profile: all)

| Tool | Description |
|------|-------------|
| `search_channels` | Search public channels |
| `get_channel_info` | Channel info |
| `get_my_channel` | My channel |
| `get_channel_tools` | Channel tools |
| `publish_channel` | Publish channel |
| `update_channel` | Update channel |
| `unpublish_channel` | Unpublish channel |
| `set_channel_permissions` | Configure permissions |
| `define_channel_tool` | Define channel tool |
| `update_channel_tool` | Update tool |
| `remove_channel_tool` | Remove tool |
| `execute_channel_tool` | Execute another channel's tool |
| `register_bot` | Register bot |
| `identify_bot` | Identify bot |
| `list_bots` | List bots |
| `whoami_bot` | Current bot identity |
| `revoke_bot` | Revoke bot |
| `generate_invitation_code` | Generate invitation code |
| `list_invitation_codes` | List codes |

## Safety Annotations

All tools include safety annotations according to MCP spec 2025-03-26:

| Annotation | Meaning | Example |
|---|---|---|
| `readOnlyHint: true` | Only reads data | list, get, search, export, query |
| `destructiveHint: false` | Creates or modifies data | create, update, publish |
| `destructiveHint: true` | Permanently deletes data | delete, drop, revoke |
| `idempotentHint: true` | Can be executed multiple times without additional effects | get, list, select |

These annotations enable agents to make informed decisions and are required for MCP marketplace listings.
