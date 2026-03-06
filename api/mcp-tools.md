# MCP Tools Reference

Complete reference of all MCP tools available in Fyso.

The MCP server exposes **8 grouped tools** (each with an `action` enum parameter) plus **7 super admin tools**. No individual tools are exposed. Configure which tools are available with the `FYSO_TOOLS` environment variable. See [Tool Profiles](tool-profiles.md).

## How grouped tools work

Each grouped tool accepts an `action` parameter that selects the operation. Additional parameters depend on the chosen action. Example:

```
fyso_data({ action: "create", entity: "tasks", data: { title: "Fix bug" } })
fyso_data({ action: "query", entity: "tasks", filters: "status = open" })
fyso_auth({ action: "list_tenants" })
```

---

## `fyso_data` — Records and scheduling

CRUD operations on records and scheduling.

| Action | Description | Required parameters |
|--------|-------------|---------------------|
| `create` | Create a new record | `entity`, `data` |
| `query` | Search/filter records | `entity` |
| `update` | Modify a record | `entity`, `id`, `data` |
| `delete` | Delete a record | `entity`, `id` |
| `create_booking` | Book an appointment | `professional_id`, `date`, `time` |
| `get_slots` | Available scheduling slots | `professional_id`, `date` |

### Parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entity` | string | create, query, update, delete | Entity name |
| `data` | object | create, update | Record data |
| `id` | string | update, delete | Record ID |
| `filters` | string | query | Filter expression. Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`. Combine with `AND`/`OR` |
| `sort` | string | query | Sort field |
| `order_dir` | `asc` \| `desc` | query | Sort direction |
| `limit` | number | query | Max records (default: 50, max: 200) |
| `offset` | number | query | Pagination offset |
| `semantic` | string | query | Natural language semantic search |
| `min_similarity` | number | query | Similarity threshold 0-1 for semantic search |
| `resolve_depth` | number | query | Relation resolution depth 1-3 (default: 1) |
| `professional_id` | string | create_booking, get_slots | Professional UUID |
| `patient_id` | string | create_booking | Patient/client UUID |
| `date` | string | create_booking, get_slots | Date YYYY-MM-DD |
| `time` | string | create_booking | Time HH:MM |
| `duration` | number | create_booking | Duration in minutes |
| `notes` | string | create_booking | Appointment notes |
| `from` | string | get_slots | Range start YYYY-MM-DD |
| `to` | string | get_slots | Range end YYYY-MM-DD |

---

## `fyso_schema` — Entities and fields

Manage entities, fields and schema versioning.

| Action | Description | Required parameters |
|--------|-------------|---------------------|
| `list` | List entities | — |
| `get` | Get entity schema | `entityName` |
| `add_field` | Add field to published entity | `entityName`, `field` or inline params |
| `manage_fields` | Custom fields CRUD | `entityName` |
| `generate` | Create entity from definition | `definition` |
| `publish` | Publish entity draft | `entityName` |
| `discard` | Discard draft | `entityName` |
| `delete` | Delete entity (irreversible) | `entityName`, `confirm: true` |
| `list_changes` | Pending schema changes | — |

### Parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entityName` | string | get, add_field, manage_fields, publish, discard, delete | Entity name |
| `include_drafts` | boolean | list | Include draft entities |
| `include_published` | boolean | list_changes | Include published without pending changes |
| `version` | string | get | Version to get: number, `draft` or `published` |
| `field` | object | add_field, manage_fields | Field definition: `{ name, fieldKey, fieldType, isRequired?, isUnique?, description?, config? }` |
| `field_action` | `list` \| `add` \| `update` \| `delete` | manage_fields | Sub-action for custom fields |
| `field_type` | `custom` \| `system` \| `all` | manage_fields | Field type filter |
| `fieldId` | string | manage_fields | Field ID for update/delete |
| `definition` | object | generate | Entity definition: `{ entity: { name, displayName?, description? }, fields: [{ name, fieldKey, fieldType, ... }] }` |
| `auto_publish` | boolean | generate | Auto-publish after generating (requires `version_message`) |
| `version_message` | string | publish, generate | Version message |
| `confirm` | boolean | delete | Must be `true` to confirm deletion |
| `fieldType` | string | add_field | Field type: `text`, `textarea`, `number`, `email`, `phone`, `date`, `boolean`, `select`, `relation`, `file`, `location` |

---

## `fyso_rules` — Business rules

Create, test, publish and manage business rules.

**Required:** `action` and `entityName` for all actions.

| Action | Description | Additional required parameters |
|--------|-------------|-------------------------------|
| `create` | Create rule from DSL | `name`, `triggerType`, `rule` |
| `get` | Rule details | `ruleId` |
| `list` | List rules | — |
| `generate` | Generate from prompt/DSL | `description` or `rule` |
| `publish` | Activate draft rule | `ruleId` |
| `delete` | Delete rule | `ruleId` |
| `test` | Dry-run with test data | `ruleId`, `testData` |
| `logs` | Execution history | `ruleId` |

### Parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entityName` | string | all | Entity the rule belongs to |
| `ruleId` | string | get, publish, delete, test, logs | Rule ID |
| `name` | string | create | Rule name |
| `description` | string | create, generate | Description or natural language prompt |
| `triggerType` | `field_change` \| `before_save` \| `after_save` \| `on_load` | create | When the rule fires |
| `triggerFields` | string[] | create | Fields that trigger the rule |
| `rule` | object | create, generate | Rule DSL with compute/validate/transform/actions |
| `priority` | number | create | Execution priority, lower = first (default: 100) |
| `auto_publish` | boolean | create, generate | Auto-publish after create/generate |
| `include_drafts` | boolean | list | Include draft rules |
| `testData` | object | test | Test data for dry-run |
| `limit` | number | logs | Max log entries |

---

## `fyso_auth` — Users, roles and tenants

User management, RBAC and tenant operations.

| Action | Description | Required parameters |
|--------|-------------|---------------------|
| `create_user` | Create tenant user | `email`, `password`, `name` |
| `list_users` | List tenant users | — |
| `update_password` | Reset password | `userId`, `password` |
| `create_role` | Create role with permissions | `name`, `permissions` |
| `list_roles` | List roles | — |
| `assign_role` | Assign role to user | `userId`, `roleId` |
| `revoke_role` | Revoke role from user | `userId`, `roleId` |
| `login` | Authenticate as tenant user | `tenantSlug`, `email`, `password` |
| `list_tenants` | List accessible tenants | — |
| `select_tenant` | Select active tenant | `tenantSlug` |
| `generate_invitation` | Generate beta invitation code | `note` |
| `list_invitations` | List invitation codes with usage stats | — |

### Parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `email` | string | create_user, login | User email |
| `name` | string | create_user, create_role | User or role name |
| `password` | string | create_user, update_password, login | Password |
| `userId` | string | update_password, assign_role, revoke_role | User ID |
| `roleId` | string | assign_role, revoke_role | Role ID |
| `permissions` | object | create_role | Role permissions object |
| `description` | string | create_role | Role description |
| `tenantSlug` | string | create_user, login, select_tenant, update_password | Tenant slug |
| `note` | string | generate_invitation | Note for the invitation code |
| `maxUses` | number | generate_invitation | Maximum number of uses |
| `expiresAt` | string | generate_invitation | Expiration date ISO 8601 |

---

## `fyso_views` — Entity views

Manage filtered entity views with independent RBAC permissions.

| Action | Description | Required parameters |
|--------|-------------|---------------------|
| `create` | Create a new view | `entitySlug`, `slug`, `name` |
| `list` | List all views | — |
| `update` | Modify a view | `slug` |
| `delete` | Delete a view | `slug` |

### Parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entitySlug` | string | create | Base entity for the view |
| `slug` | string | create, update, delete | View slug identifier |
| `name` | string | create, update | View name |
| `description` | string | create, update | View description |
| `filterDsl` | object | create, update | Filter definition: `{ validate: [{ condition: 'field == value' }] }` |
| `isActive` | boolean | update | Enable/disable the view |

---

## `fyso_knowledge` — Knowledge base

Search the tenant knowledge base and Fyso platform documentation.

| Action | Description | Required parameters |
|--------|-------------|---------------------|
| `search` | Semantic search in tenant knowledge | `query` |
| `stats` | Knowledge base metrics | — |
| `search_docs` | Search Fyso platform docs | `query` |

### Parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `query` | string | search, search_docs | Natural language query |
| `limit` | number | search, search_docs | Max results (search: default 5, max 20; search_docs: default 5, max 10) |
| `threshold` | number | search | Minimum similarity 0-1 (default: 0.3) |
| `document_ids` | string[] | search | Filter by document IDs |
| `one_per_document` | boolean | search | Only the best fragment per document |
| `metadata_filter` | object | search | Metadata filter (e.g. `{ tag: 'policy' }`) |
| `topic` | string | search_docs | Filter by topic: `api`, `entities`, `business-rules`, `deployment`, `billing`, `knowledge`, `mcp`, `rbac`, `views`, `flows`, `webhooks`, `scheduling` |

---

## `fyso_deploy` — Static sites

Publish static sites, manage custom domains and generate CI/CD tokens.

| Action | Description | Required parameters |
|--------|-------------|---------------------|
| `deploy` | Upload and publish site | `subdomain` |
| `list` | List active sites | — |
| `delete` | Delete a site | `subdomain` |
| `set_domain` | Manage custom domain | `subdomain` |
| `generate_token` | Deploy token for CI/CD | `subdomain` |

### Parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `subdomain` | string | deploy, delete, set_domain, generate_token | Site subdomain (e.g. `my-app` -> `my-app-sites.fyso.dev`) |
| `path` | string | deploy | Absolute path to build directory |
| `bundle_base64` | string | deploy | Base64-encoded ZIP of site files (for remote MCP) |
| `domain` | string | set_domain | Custom domain (e.g. `app.mycompany.com`) |
| `domain_action` | `add` \| `verify` \| `status` \| `remove` | set_domain | Domain sub-action (default: `add`) |
| `name` | string | generate_token | Token name (e.g. `GitHub Actions`) |
| `expires_in_days` | number | generate_token | Token expiration in days (omit for no expiration) |
| `package_json` | object | generate_token | package.json for framework auto-detection |
| `framework` | string | generate_token | Framework override: `astro`, `vite`, `next`, `nuxt`, `gatsby`, `hugo`, `default` |

---

## `fyso_meta` — API, metadata and secrets

API spec, client generation, metadata import/export, secrets and usage metrics.

| Action | Description | Required parameters |
|--------|-------------|---------------------|
| `api_spec` | OpenAPI spec of the REST API | — |
| `api_client` | Generate typed client code | — |
| `export` | Export tenant metadata | — |
| `import` | Import metadata | `data` |
| `usage` | Billing metrics | — |
| `set_secret` | Store encrypted secret | `key`, `value` |
| `delete_secret` | Delete a secret | `key` |

### Parameters

| Parameter | Type | Used by | Description |
|-----------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entities` | string[] | api_spec, api_client | Entity names (omit for all) |
| `includeExamples` | boolean | api_spec | Include curl examples (default: true) |
| `language` | string | api_client | Target language (e.g. `typescript`, `python`) |
| `framework` | string | api_client | Target framework (e.g. `react`, `next`) |
| `format` | string | api_client | Output format |
| `data` | string | import | JSON string of metadata to import |
| `tenantId` | string | export, import | Tenant ID/slug override |
| `key` | string | set_secret, delete_secret | Secret name |
| `value` | string | set_secret | Secret value (encrypted at rest) |

---

## REST-only functions

The following features are available via the [REST API](/api/rest-api) but are not exposed as MCP tools:

- **Channels** — `search_channels`, `get_channel_info`, `get_channel_tools`, `execute_channel_tool`, `get_my_channel`, `publish_channel`, `update_channel`, `unpublish_channel`, `set_channel_permissions`, `define_channel_tool`, `update_channel_tool`, `remove_channel_tool`
- **Bots** — `register_bot`, `identify_bot`, `list_bots`, `whoami_bot`, `revoke_bot`
- **Flows** — `create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`
- **Webhooks** — `create_webhook`, `list_webhooks`, `delete_webhook`
- **Documents** — `upload_document`, `list_documents`, `get_document`, `delete_document`
- **PDF** — `generate_pdf`, `create_pdf_template`
- **Apps** — `publish_app`, `unpublish_app`, `update_app`
