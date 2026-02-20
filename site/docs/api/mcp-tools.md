---
sidebar_position: 2
---

# MCP Tools Reference

Complete reference of all available MCP tools, grouped by category.

Configure which tools are exposed with the `FYSO_TOOLS` environment variable. See [Tool Profiles](tool-profiles.md).

---

## Tenant

| Tool | Profile | Description |
|------|---------|-------------|
| `list_tenants` | core | List accessible tenants |
| `select_tenant` | core | Select active tenant for subsequent operations |

---

## Entities

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_entity` | core | Create entity with fields from JSON definition |
| `list_entities` | core | List entities (optionally include drafts) |
| `get_entity_schema` | core | Get full entity definition and field list |
| `publish_entity` | core | Publish entity version with message |
| `delete_entity` | advanced | Delete entity and all its records (irreversible) |
| `list_entity_changes` | advanced | View version history |
| `manage_custom_fields` | advanced | Add, update, or delete custom fields |

---

## Records

| Tool | Profile | Description |
|------|---------|-------------|
| `query_records` | core | Query records with filters, pagination, sorting, and semantic search |
| `create_record` | core | Create a new record |
| `update_record` | core | Partially update a record |
| `delete_record` | core | Delete a record |

---

## Business Rules

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_business_rule` | core | Generate and create a rule from natural language or DSL JSON |
| `create_business_rule` | core | Create rule from explicit DSL definition |
| `list_business_rules` | core | List rules for an entity |
| `get_business_rule` | core | Get full rule definition |
| `publish_business_rule` | core | Publish rule (only published rules execute) |
| `test_business_rule` | advanced | Test rule with sample data without saving |
| `delete_business_rule` | advanced | Delete a rule |
| `get_rule_logs` | advanced | View execution logs for a rule |

---

## RBAC (Roles & Permissions)

| Tool | Profile | Description |
|------|---------|-------------|
| `list_roles` | core | List roles defined in the tenant |
| `create_role` | core | Create a new role with permissions |
| `assign_role` | core | Assign a role to a user |
| `revoke_role` | core | Revoke a role from a user |

---

## Users

| Tool | Profile | Description |
|------|---------|-------------|
| `create_user` | core | Create tenant user with role and permissions |
| `list_users` | core | List users in the tenant |
| `tenant_login` | advanced | Authenticate as tenant user, returns JWT |

---

## Files

| Tool | Profile | Description |
|------|---------|-------------|
| `upload_file` | core | Upload a file, returns stored file metadata |

---

## PDF

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_pdf` | core | Generate PDF from template and record data |
| `create_pdf_template` | core | Create a PDF template |

---

## Static Sites

| Tool | Profile | Description |
|------|---------|-------------|
| `deploy_static_site` | core | Deploy static site to `*.sites.fyso.dev` |
| `list_static_sites` | core | List deployed sites |
| `delete_static_site` | advanced | Delete a site |
| `generate_deploy_token` | advanced | Generate one-time deploy token for CI/CD |

---

## API

| Tool | Profile | Description |
|------|---------|-------------|
| `get_rest_api_spec` | core | Get OpenAPI spec for the tenant's entities |
| `generate_api_client` | core | Generate API client code in a given language |

---

## Metadata

| Tool | Profile | Description |
|------|---------|-------------|
| `export_metadata` | core | Export tenant structure (entities, fields, rules) as JSON |
| `import_metadata` | core | Import metadata JSON into tenant |

---

## Apps

| Tool | Profile | Description |
|------|---------|-------------|
| `publish_app` | core | Publish tenant as installable app |
| `unpublish_app` | core | Unpublish app |
| `update_app` | core | Update app name, description, or refresh metadata |

---

## Scheduling

| Tool | Profile | Description |
|------|---------|-------------|
| `get_available_slots` | core | Get available time slots for a professional |
| `create_booking` | core | Create a booking in an available slot |

---

## Secrets

| Tool | Profile | Description |
|------|---------|-------------|
| `set_secret` | advanced | Store an encrypted secret for use in flows |
| `delete_secret` | advanced | Delete a stored secret |

---

## Flows

| Tool | Profile | Description |
|------|---------|-------------|
| `create_flow` | advanced | Create an automation flow with triggers and steps |
| `list_flows` | advanced | List flows in the tenant |
| `update_flow` | advanced | Update flow definition |
| `delete_flow` | advanced | Delete a flow |
| `toggle_flow` | advanced | Enable or disable a flow |

---

## Knowledge Base

| Tool | Profile | Description |
|------|---------|-------------|
| `upload_document` | core | Upload document for RAG indexing (PDF, text, markdown) |
| `search_knowledge` | core | Semantic search across indexed documents |
| `list_documents` | core | List uploaded documents |
| `get_document` | core | Get document metadata and content |
| `delete_document` | advanced | Delete a document from the knowledge base |
| `get_knowledge_stats` | core | Get indexing stats (documents, chunks, embedding coverage) |

---

## Channels & Bots

These tools are only available with profile `all`.

| Tool | Profile | Description |
|------|---------|-------------|
| `search_channels` | all | Search for channels |
| `get_channel_info` | all | Get channel metadata |
| `execute_channel_tool` | all | Execute a tool in a channel |
| `get_my_channel` | all | Get the current bot's own channel |
| `list_channel_tools` | all | List tools available in a channel |
