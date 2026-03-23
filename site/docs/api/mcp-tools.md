---
sidebar_position: 2
---

# MCP Tools Reference

Complete reference of all available MCP tools.

The MCP server exposes **10 grouped tools** (each with an `action` enum parameter), plus `fyso_welcome` for onboarding. Configure which tools are exposed with the `FYSO_TOOLS` environment variable. See [Tool Profiles](tool-profiles.md).

## How grouped tools work

Each grouped tool accepts an `action` parameter that selects the operation. Additional parameters depend on the action chosen. Example:

```
fyso_data({ action: "create", entity: "tasks", data: { title: "Fix bug" } })
fyso_data({ action: "query", entity: "tasks", filters: "status = open" })
fyso_auth({ action: "list_tenants" })
```

---

## `fyso_data` — Records and bookings

CRUD operations on records and scheduling.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `create` | Create a new record | `entity`, `data` |
| `query` | Search/filter records | `entity` |
| `update` | Modify a record | `entity`, `id`, `data` |
| `delete` | Remove a record | `entity`, `id` |
| `create_booking` | Book a scheduling slot | `professional_id`, `date`, `time` |
| `get_slots` | Available scheduling slots | `professional_id`, `date` |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entity` | string | create, query, update, delete | Entity name |
| `data` | object | create, update | Record data |
| `id` | string | update, delete | Record ID |
| `filters` | string | query | Filter expression. Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`. Combine with `AND` (OR not supported server-side). Example: `status = active AND nombre contains juan` |
| `sort` | string | query | Field to sort by |
| `order_dir` | `asc` \| `desc` | query | Sort direction |
| `limit` | number | query | Max records (default: 50, max: 200) |
| `offset` | number | query | Pagination offset |
| `semantic` | string | query | Natural language semantic search |
| `min_similarity` | number | query | Similarity threshold 0-1 for semantic search |
| `resolve_depth` | number | query | Relation resolution depth (default: 1, max: 3) |
| `professional_id` | string | create_booking, get_slots | Professional UUID |
| `patient_id` | string | create_booking | Patient/client UUID |
| `date` | string | create_booking, get_slots | Date YYYY-MM-DD |
| `time` | string | create_booking | Time HH:MM |
| `duration` | number | create_booking | Duration in minutes |
| `notes` | string | create_booking | Booking notes |
| `from` | string | get_slots | Range start YYYY-MM-DD |
| `to` | string | get_slots | Range end YYYY-MM-DD |

---

## `fyso_schema` — Entities and fields

Manage entities, fields, and schema versioning.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `list` | List entities | — |
| `get` | Get entity schema | `entityName` |
| `add_field` | Add field to published entity | `entityName`, `field` or inline params |
| `manage_fields` | CRUD custom fields | `entityName` |
| `generate` | Create entity from definition | `definition` |
| `publish` | Publish entity draft | `entityName` |
| `discard` | Discard entity draft | `entityName` |
| `delete` | Delete entity (irreversible) | `entityName`, `confirm: true` |
| `list_changes` | Pending schema changes | — |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entityName` | string | get, add_field, manage_fields, publish, discard, delete | Entity name |
| `include_drafts` | boolean | list | Include draft entities |
| `include_published` | boolean | list_changes | Include published with no pending changes |
| `version` | string | get | Version to retrieve: number, `draft`, or `published` |
| `field` | object | add_field, manage_fields | Field definition: `{ name, fieldKey, fieldType, isRequired?, isUnique?, description?, config? }` |
| `field_action` | `list` \| `add` \| `update` \| `delete` | manage_fields | Sub-action for custom fields |
| `field_type` | `custom` \| `system` \| `all` | manage_fields | Field filter for listing |
| `fieldId` | string | manage_fields | Field ID for update/delete |
| `definition` | object | generate | Entity definition: `{ entity: { name, displayName?, description? }, fields: [{ name, fieldKey, fieldType, ... }] }` |
| `auto_publish` | boolean | generate | Auto-publish after generate (requires `version_message`) |
| `version_message` | string | publish, generate | Version message |
| `confirm` | boolean | delete | Must be `true` to confirm deletion |
| `fieldType` | string | add_field | Field type: `text`, `textarea`, `number`, `email`, `phone`, `date`, `boolean`, `select`, `relation`, `file`, `location` |

---

## `fyso_rules` — Business rules

Create, test, publish, and manage business rules.

**Required:** `action` and `entityName` for all actions.

| Action | Description | Additional required params |
|--------|-------------|---------------------------|
| `create` | Create rule from DSL | `name`, `triggerType`, `rule` |
| `get` | Rule details | `ruleId` |
| `list` | List rules | — |
| `publish` | Activate draft rule | `ruleId` |
| `delete` | Delete rule | `ruleId` |
| `test` | Dry-run with test data | `ruleId`, `testData` |
| `logs` | Execution history | `ruleId` |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entityName` | string | all | Entity the rule belongs to |
| `ruleId` | string | get, publish, delete, test, logs | Rule ID |
| `name` | string | create | Rule name |
| `description` | string | create | Rule description |
| `triggerType` | `field_change` \| `before_save` \| `after_save` \| `on_load` | create | When the rule triggers |
| `triggerFields` | string[] | create | Fields that trigger the rule |
| `rule` | object | create | Rule DSL with compute/validate/transform/actions |
| `ruleDsl` | object | create | Alias for `rule` |
| `priority` | number | create | Execution priority, lower = first (default: 100) |
| `auto_publish` | boolean | create | Auto-publish after create |
| `include_drafts` | boolean | list | Include draft rules |
| `testData` | object | test | Test record data for dry-run |
| `limit` | number | logs | Max log entries |

---

## `fyso_auth` — Users, roles, tenants, and organizations

User management, RBAC, tenant operations, organization management, and API keys.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `create_user` | Create tenant user | `email`, `password`, `name` |
| `list_users` | List tenant users | — |
| `update_password` | Reset user password | `userId`, `password` |
| `create_role` | Create role with permissions | `name`, `permissions` |
| `list_roles` | List roles | — |
| `assign_role` | Assign role to user | `userId`, `roleId` |
| `revoke_role` | Revoke role from user | `userId`, `roleId` |
| `login` | Authenticate as tenant user | `tenantSlug`, `email`, `password` |
| `list_tenants` | List accessible tenants | — |
| `select_tenant` | Select active tenant | `tenantSlug` |
| `create_tenant` | Create a new tenant (plan quota enforced: free=1, pro=5) | `name` |
| `generate_invitation` | Generate beta invitation code (FYSO-XXXX-XXXX) | — |
| `list_invitations` | List invitation codes with usage stats | — |
| `list_orgs` | List organizations for current admin | — |
| `create_org` | Create a new organization | `orgName` |
| `invite_to_org` | Invite an admin to an org | `orgId`, `email` |
| `list_org_members` | List members of an org | `orgId` |
| `create_api_key` | Create a tenant API key | — |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `email` | string | create_user, login, invite_to_org | User or invitee email |
| `name` | string | create_user, create_role | User or role name |
| `password` | string | create_user, update_password, login | Password |
| `userId` | string | update_password, assign_role, revoke_role | User ID |
| `roleId` | string | assign_role, revoke_role | Role ID |
| `permissions` | object | create_role | Role permissions object |
| `description` | string | create_role | Role description |
| `tenantSlug` | string | create_user, login, select_tenant, update_password | Tenant slug. `select_tenant` supports prefix matching — if no exact match, auto-selects when one prefix match is found. |
| `note` | string | generate_invitation | Optional note for the invitation |
| `maxUses` | number | generate_invitation | Max uses for the code |
| `expiresAt` | string | generate_invitation | Expiration date (ISO 8601) |
| `orgName` | string | create_org | Organization display name |
| `orgId` | string | invite_to_org, list_org_members | Organization ID |
| `orgRole` | `owner` \| `member` | invite_to_org | Role to assign the invitee (default: `member`) |
| `apiKeyName` | string | create_api_key | Optional name for the new API key |

> **`create_api_key` note:** The full key is returned only once in the response — store it immediately. Subsequent calls return only the key prefix for identification.

---

## `fyso_views` — Entity views

Manage filtered entity views with independent RBAC permissions.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `create` | Create a new view | `entitySlug`, `slug`, `name` |
| `list` | List all views | — |
| `update` | Modify a view | `slug` |
| `delete` | Remove a view | `slug` |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `entitySlug` | string | create | Entity this view is based on |
| `slug` | string | create, update, delete | View slug identifier |
| `name` | string | create, update | Display name |
| `description` | string | create, update | View description |
| `filterDsl` | object | create, update | Filter definition: `{ validate: [{ condition: 'field == value' }] }` |
| `isActive` | boolean | update | Enable/disable the view |

---

## `fyso_knowledge` — Knowledge base

Search tenant knowledge base and Fyso platform documentation.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `search` | Semantic search tenant knowledge | `query` |
| `stats` | Knowledge base metrics | — |
| `search_docs` | Search Fyso platform docs | `query` |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `query` | string | search, search_docs | Natural language search query |
| `limit` | number | search, search_docs | Max results (search: default 5, max 20; search_docs: default 5, max 10) |
| `threshold` | number | search | Minimum similarity 0-1 (default: 0.3) |
| `document_ids` | string[] | search | Filter to specific document IDs |
| `one_per_document` | boolean | search | Best chunk per document only |
| `metadata_filter` | object | search | Metadata filter (e.g. `{ tag: 'policy' }`) |
| `topic` | string | search_docs | Topic filter: `api`, `entities`, `business-rules`, `deployment`, `billing`, `knowledge`, `mcp`, `rbac`, `views`, `flows`, `webhooks`, `scheduling` |

---

## `fyso_deploy` — Static sites

Deploy static sites, manage custom domains, and generate CI/CD tokens.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `deploy` | Upload and deploy site | `subdomain` |
| `list` | List active sites | — |
| `delete` | Remove a site | `subdomain` |
| `set_domain` | Manage custom domain | `subdomain` |
| `generate_token` | CI/CD deploy token | `subdomain` |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `subdomain` | string | deploy, delete, set_domain, generate_token | Site subdomain (e.g. `my-app` -> `my-app-sites.fyso.dev`) |
| `path` | string | deploy | Absolute path to build output directory |
| `bundle_base64` | string | deploy | Base64-encoded ZIP of site files (for remote MCP) |
| `domain` | string | set_domain | Custom domain (e.g. `app.mycompany.com`) |
| `domain_action` | `add` \| `verify` \| `status` \| `remove` | set_domain | Domain sub-action (default: `add`) |
| `name` | string | generate_token | Token name (e.g. `GitHub Actions`) |
| `expires_in_days` | number | generate_token | Token expiry in days (omit for no expiry) |
| `package_json` | object | generate_token | package.json for framework auto-detection |
| `framework` | string | generate_token | Override framework: `astro`, `vite`, `next`, `nuxt`, `gatsby`, `hugo`, `default` |

---

## `fyso_meta` — API, metadata, and secrets

API spec, client generation, metadata import/export, secrets, and usage metrics.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `api_spec` | REST API OpenAPI spec | — |
| `api_client` | Generate typed client code | — |
| `export` | Export tenant metadata | — |
| `import` | Import metadata | `data` |
| `usage` | Billing metrics | — |
| `set_secret` | Store encrypted secret | `key`, `value` |
| `delete_secret` | Delete a secret | `key` |
| `feedback` | Report feedback or bug | `feedback_type`, `title` |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
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
| `feedback_type` | `bug` \| `suggestion` \| `question` | feedback | Feedback category |
| `title` | string | feedback | Short summary |
| `description` | string | feedback | Detailed description |
| `context` | string | feedback | Optional additional context |

---

## `fyso_agents` — Agent management

Create, configure, run AI agents, and send messages between agents. Manage versions, runs, and templates.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `list` | List all agents | — |
| `create` | Create a new agent | `name` |
| `update` | Modify an agent | `id` or `slug` |
| `delete` | Delete an agent | `slug` |
| `run` | Execute an agent with input | `agent_slug`, `message` |
| `test` | Run agent in sandbox mode | `agent_slug`, `message` |
| `list_runs` | List agent run history | `agent_id` |
| `list_versions` | List prompt versions | `agent_id` |
| `rollback` | Revert to a previous version | `agent_id`, `version` |
| `list_templates` | List industry preset templates | — |
| `from_template` | Create agent from template | `template_id`, `name` |
| `send_message` | Send a message to another agent | `to_agent` |
| `inbox` | View an agent's inbox | `agent_name` |
| `read_message` | Fetch a message and mark it read | `message_id` |
| `archive_message` | Archive a message | `message_id` |
| `count_unread` | Count pending messages for an agent | `agent_name` |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `id` | string | update | Agent UUID (preferred over slug for update) |
| `slug` | string | update, delete | Agent slug identifier |
| `agent_slug` | string | run, test | Agent slug |
| `agent_id` | string | list_runs, list_versions, rollback | Agent UUID |
| `name` | string | create, from_template | Agent display name |
| `message` | string | run, test | User message input |
| `version` | number | rollback | Version number to restore |
| `template_id` | string | from_template | Template identifier |
| `session_id` | string | run, list_runs | Session ID to continue or filter by |
| `memory_enabled` | boolean | create, update | Enable cross-session memory extraction |
| `knowledge_enabled` | boolean | create, update | Enable RAG retrieval from tenant knowledge base |
| `schedules_enabled` | boolean | create, update | Enable scheduling tools (slots, bookings) |
| `tools_scope` | object | create, update | Entity tools: `{ "entity": ["query", "create", "update"] }` |
| `system_prompt` | string | create, update | Agent system prompt |
| `fallback_mode` | `llm` \| `message` \| `silent` | create, update | Behavior when no deterministic rule matches |
| `channels` | object[] | create, update | Channel configurations (web, telegram, etc.) |
| **Messaging params** | | | |
| `to_agent` | string | send_message | Recipient agent name or slug. Supports fuzzy matching: `"cero"` resolves to `"cero-a3f2c1"` if unique. |
| `from_agent` | string | send_message | Sender name. Defaults to `mcp-caller`. |
| `subject` | string | send_message | Optional subject line |
| `payload` | object | send_message | Arbitrary JSON data (max 64 KB) |
| `priority` | `normal` \| `high` \| `urgent` | send_message | Default: `normal` |
| `in_reply_to` | string | send_message | UUID of parent message (for threading) |
| `auto_run` | boolean | send_message | Run recipient agent automatically on delivery |
| `agent_name` | string | inbox, count_unread | Agent whose inbox to access |
| `message_id` | string | read_message, archive_message | Message UUID |
| `inbox_status` | `pending` \| `read` \| `all` | inbox | Filter messages by status (default: `pending`) |
| `inbox_limit` | number | inbox | Max messages (default 50, max 200) |
| `inbox_offset` | number | inbox | Pagination offset |

See [Agent Messaging](../agents/messaging.md) for the full guide.

---

## `fyso_ai` — AI providers and calls

Configure AI providers, manage prompts, test calls, and view logs.

| Action | Description | Required params |
|--------|-------------|-----------------|
| `configure_provider` | Set default AI provider config | `provider`, `apiKey` |
| `list_providers` | List configured providers | — |
| `add_provider` | Add an additional provider | `provider`, `apiKey` |
| `remove_provider` | Remove a provider | `providerId` |
| `test_call` | Test a prompt against a provider | `prompt` |
| `call_logs` | View AI call history | — |
| `debug_log` | Get debug payload for a call | `callId` |
| `create_template` | Create a reusable prompt template | `name`, `prompt` |
| `list_templates` | List prompt templates | — |
| `update_template` | Modify a prompt template | `templateId` |
| `list_presets` | List industry presets (taller, clinica, tienda) | — |
| `install_preset` | Install an industry preset with entities and agent | `preset` |
| `rate_limit_status` | Current AI rate limit status | — |
| `cost_dashboard` | AI spend summary (weekly, monthly, projections) | — |

### Parameters

| Param | Type | Used by | Description |
|-------|------|---------|-------------|
| `action` | string (enum) | all | Operation to perform |
| `provider` | string | configure_provider, add_provider | Provider type: `openai`, `anthropic`, or any OpenAI-compatible base URL |
| `apiKey` | string | configure_provider, add_provider | API key for the provider |
| `providerId` | string | remove_provider | Provider configuration ID |
| `model` | string | configure_provider, add_provider, test_call | Model name (e.g. `gpt-4o`, `claude-3-5-sonnet-20241022`) |
| `prompt` | string | test_call, create_template | Prompt text |
| `name` | string | create_template | Template name |
| `templateId` | string | update_template | Template ID |
| `callId` | string | debug_log | AI call ID (requires `ai.debug` tenant setting) |
| `limit` | number | call_logs | Max log entries |
| `preset` | string | install_preset | Preset name: `taller`, `clinica`, `tienda` |
| `system_prompt` | string | test_call | System prompt for test call |
| `temperature` | number | test_call | Temperature 0–2 |
| `max_tokens` | number | test_call | Max tokens 1–32000 |

---

## `fyso_welcome` — Onboarding

An onboarding conversation tool. Given a `businessType`, it proposes a starter set of entities and fields suited to that business, and returns suggested next steps. Used by the Claude Code plugin on first connect.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `businessType` | string | Yes | Business category (e.g., `freelancer`, `clinic`, `ecommerce`, `saas`, `nonprofit`, `other`) |

This tool does not accept an `action` parameter — it is a single-purpose tool, not a grouped router.

---

## Integration management tools

These standalone tools manage the integration lifecycle (not grouped):

| Tool | Description | Required params |
|------|-------------|-----------------|
| `list_integrations` | List available integrations and status | — |
| `install_integration` | Install an integration | `slug` |
| `configure_integration` | Update integration config | `slug`, `config` |
| `activate_integration` | Enable integration tools | `slug` |
| `test_integration` | Test connectivity | `slug` |
| `uninstall_integration` | Remove integration | `slug` |
| `list_integration_logs` | View health logs | `slug` |

Active integrations inject tools into agent runners as `integration:<slug>:<tool-slug>`.

---

## REST-only features

The following features are available via the [REST API](/api/rest-api) but are not exposed as MCP tools:

- **SSE Event Stream** — `GET /api/v1/tenants/:slug/events/stream` — real-time CRUD, rule, and agent message events. See [SSE Event Stream](/api/sse-events).
- **External Agent Identity** — `POST /api/v1/tenants/:slug/agents/register`, `POST /reconnect`. See [External Agent Identity](/agents/external-identity).
- **Agent Messages (REST)** — Send, inbox, read, archive, count. Also available via `fyso_agents` MCP actions. See [Agent Messaging](/agents/messaging).
- **Organizations** — `/api/orgs` CRUD + members + invitations. Also available via `fyso_auth` MCP actions. See [Organizations](/admin/organizations).
- **Channels** — Agent channel management (Telegram, web widget). See [Channels](/admin/channels).
- **Bots** — `register_bot`, `identify_bot`, `list_bots`, `whoami_bot`, `revoke_bot`. See [Bot Identity](/agents/bot-identity).
- **Flows** — `create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`
- **Webhooks** — `create_webhook`, `list_webhooks`, `delete_webhook`
- **Documents** — `upload_document`, `list_documents`, `get_document`, `delete_document`
- **PDF** — `generate_pdf`, `create_pdf_template`
- **Apps** — `publish_app`, `unpublish_app`, `update_app`
