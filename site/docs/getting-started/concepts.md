---
sidebar_position: 2
---

# Key Concepts

## Tenant

An isolated workspace. Each tenant has a unique slug, its own database schema, entities, rules, users, and configurations.

## Entity

Defines the data structure of your application (equivalent to a table):
- Created as a draft, then **published** with a version message
- Has system fields: `id`, `created_at`, `updated_at`
- Plus user-defined fields

## Field

Defines columns within an entity:
- Properties: `name`, `fieldKey`, `fieldType`, `isRequired`, `isUnique`, `config`
- Available types: `text`, `textarea`, `number`, `email`, `phone`, `date`, `boolean`, `select`, `relation`, `file`, `location`

## Record

A row within an entity:
```json
{ "id": "uuid", "entityId": "uuid", "data": {...}, "createdAt": "...", "updatedAt": "..." }
```
**Important:** Entity fields are inside `record.data`, not at the root level.

## Business Rule

Automates logic using a declarative DSL:
- **compute** — Calculates fields automatically
- **validate** — Validates data before saving (rejects if it fails)
- **action** — Executes side effects after saving

## RBAC

Role-based access control. Define roles with permissions per entity, assign them to users. System roles: `owner`, `admin`, `member`, `viewer`. MCP tools: `list_roles`, `create_role`, `assign_role`, `revoke_role`.

## Knowledge Base

Upload documents (PDF, text, markdown) and query them via semantic search. Documents are chunked and indexed with embeddings for RAG workflows. See [Knowledge Base](../admin/knowledge.md).

## Tool Profiles

Controls which MCP tools are exposed to the agent:
- `core` (~55 tools): daily use — entities, records, rules, RBAC, knowledge, PDF, sites
- `advanced` (~73 tools): core + delete, test, flows, secrets, deploy tokens, logs
- `all` (~85 tools): advanced + channels and bots

Configure with `FYSO_TOOLS` env var. See [Tool Profiles](../api/tool-profiles.md).
