---
sidebar_position: 4
---

# MCP Quickstart

A step-by-step walkthrough of the core Fyso MCP workflow. Every tool call here is real -- you can copy-paste these into your MCP client and they will work.

## 1. Connect

Add Fyso to your MCP client config (`claude_desktop_config.json` or equivalent):

```json
{
  "mcpServers": {
    "fyso": {
      "command": "npx",
      "args": ["-y", "@fyso/mcp-server"],
      "env": {
        "FYSO_API_KEY": "your-api-key",
        "FYSO_API_URL": "https://api.fyso.dev/api",
        "FYSO_TOOLS": "core"
      }
    }
  }
}
```

`FYSO_TOOLS` controls which tools are available. `core` is the default and covers everything in this guide. See [Tool Profiles](/api/tool-profiles) for the full breakdown.

## 2. Select a Tenant

Every operation in Fyso happens inside a tenant. Start by listing your tenants, then select one.

**List tenants:**

```
fyso_auth({ action: "list_tenants" })
```

Response:

```json
{
  "success": true,
  "tenants": [
    { "id": "uuid-1", "slug": "my-app", "name": "My App" },
    { "id": "uuid-2", "slug": "staging", "name": "Staging" }
  ]
}
```

**Select a tenant:**

```
fyso_auth({ action: "select_tenant", tenantSlug: "my-app" })
```

Response:

```json
{
  "success": true,
  "message": "Tenant 'my-app' selected",
  "tenant": { "id": "uuid-1", "slug": "my-app", "name": "My App" }
}
```

From this point on, all operations target `my-app`.

## 3. Create an Entity

Entities are your data tables. Use `fyso_schema` with the `generate` action to create one from a JSON definition.

```
fyso_schema({
  action: "generate",
  definition: {
    entity: { name: "tasks" },
    fields: [
      { "name": "title", "fieldKey": "title", "fieldType": "text" },
      { "name": "description", "fieldKey": "description", "fieldType": "textarea" },
      { "name": "status", "fieldKey": "status", "fieldType": "select", "config": { "options": ["open", "in_progress", "done"] } },
      { "name": "priority", "fieldKey": "priority", "fieldType": "select", "config": { "options": ["low", "medium", "high", "critical"] } },
      { "name": "assignee", "fieldKey": "assignee", "fieldType": "text" }
    ]
  }
})
```

Response:

```json
{
  "success": true,
  "message": "Entity 'tasks' created successfully",
  "entity": {
    "id": "uuid",
    "name": "tasks",
    "slug": "tasks",
    "fields": [
      { "key": "title", "type": "text", "required": true },
      { "key": "description", "type": "textarea", "required": false },
      { "key": "status", "type": "select", "options": ["open", "in_progress", "done"] },
      { "key": "priority", "type": "select", "options": ["low", "medium", "high", "critical"] },
      { "key": "assignee", "type": "text", "required": false }
    ]
  }
}
```

The entity is created as a draft. To make it live:

```
fyso_schema({
  action: "publish",
  entityName: "tasks",
  version_message: "Initial version"
})
```

## 4. Create Records

Add data to your entity with `fyso_data`.

```
fyso_data({
  action: "create",
  entity: "tasks",
  data: {
    "title": "Fix login bug",
    "description": "Users get 500 error on login with special characters in password",
    "status": "open",
    "priority": "high",
    "assignee": "alice@team.com"
  }
})
```

Response:

```json
{
  "success": true,
  "record": {
    "id": "rec-uuid-1",
    "entityId": "uuid",
    "name": "Fix login bug",
    "data": {
      "title": "Fix login bug",
      "description": "Users get 500 error on login with special characters in password",
      "status": "open",
      "priority": "high",
      "assignee": "alice@team.com"
    },
    "createdAt": "2026-03-01T10:00:00Z",
    "updatedAt": "2026-03-01T10:00:00Z"
  }
}
```

Create a few more:

```
fyso_data({
  action: "create",
  entity: "tasks",
  data: {
    "title": "Add dark mode",
    "description": "Support system-level dark mode preference",
    "status": "open",
    "priority": "medium",
    "assignee": "bob@team.com"
  }
})

fyso_data({
  action: "create",
  entity: "tasks",
  data: {
    "title": "Update dependencies",
    "description": "Run npm audit fix and update major versions",
    "status": "in_progress",
    "priority": "low",
    "assignee": "alice@team.com"
  }
})
```

## 5. Query Records

`fyso_data` with the `query` action supports filters, pagination, sorting, and semantic search.

### Simple filter

```
fyso_data({
  action: "query",
  entity: "tasks",
  filters: "status = open"
})
```

### Compound filter

```
fyso_data({
  action: "query",
  entity: "tasks",
  filters: "status = open AND priority = high"
})
```

### All filter operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals (case-insensitive) | `status = open` |
| `!=` | Not equal | `status != done` |
| `>` | Greater than (numeric) | `score > 80` |
| `<` | Less than (numeric) | `score < 50` |
| `>=` | Greater than or equal | `priority >= high` |
| `<=` | Less than or equal | `count <= 10` |
| `contains` | Contains text (case-insensitive) | `title contains login` |

String values don't need quotes, but you can use them: `assignee = "alice@team.com"`.

### Pagination

```
fyso_data({
  action: "query",
  entity: "tasks",
  limit: 10,
  offset: 0
})
```

### Sorting

```
fyso_data({
  action: "query",
  entity: "tasks",
  sort: "priority",
  order_dir: "desc"
})
```

### Semantic search

Find records by meaning, not exact text match:

```
fyso_data({
  action: "query",
  entity: "tasks",
  semantic: "authentication issues",
  min_similarity: 0.6,
  limit: 5
})
```

This would match "Fix login bug" even though the query doesn't contain the word "login".

### Combining filters

You can combine `filters` with `semantic` -- the filter is applied as a post-filter on semantic results:

```
fyso_data({
  action: "query",
  entity: "tasks",
  semantic: "UI improvements",
  filters: "status = open",
  limit: 10
})
```

### Response shape

```json
{
  "success": true,
  "records": [
    {
      "id": "rec-uuid-1",
      "name": "Fix login bug",
      "data": {
        "title": "Fix login bug",
        "status": "open",
        "priority": "high",
        "assignee": "alice@team.com"
      }
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

## 6. Add a Business Rule

Business rules run automatically when records are created, updated, or queried. Use `fyso_rules` with the `generate` action and a natural language prompt.

```
fyso_rules({
  action: "generate",
  entityName: "tasks",
  description: "When a task is created, if no priority is set, default it to 'medium'"
})
```

Response:

```json
{
  "success": true,
  "rule": {
    "id": "rule-uuid",
    "name": "default-priority-on-create",
    "entityName": "tasks",
    "trigger": "on_create",
    "status": "draft",
    "dsl": {
      "validate": [
        {
          "condition": "priority == null",
          "action": "set_field",
          "field": "priority",
          "value": "medium"
        }
      ]
    }
  }
}
```

The rule is created as a draft. Publish it to make it active:

```
fyso_rules({
  action: "publish",
  entityName: "tasks",
  ruleId: "rule-uuid"
})
```

Only published rules execute. You can test before publishing:

```
fyso_rules({
  action: "test",
  entityName: "tasks",
  ruleId: "rule-uuid",
  testData: {
    "title": "New task without priority",
    "status": "open"
  }
})
```

## 7. Create a User

Create tenant users with specific roles and per-entity permissions.

```
fyso_auth({
  action: "create_user",
  tenantSlug: "my-app",
  email: "dev@team.com",
  password: "securepass123",
  name: "Dev User",
  role: "member",
  permissions: {
    entities: {
      "tasks": ["create", "read", "update"]
    }
  }
})
```

Response:

```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "dev@team.com",
    "name": "Dev User",
    "role": "member",
    "isActive": true
  }
}
```

### Available roles

| Role | Access level |
|------|-------------|
| `owner` | Full control over everything |
| `admin` | Manage users and settings |
| `member` | Create and edit records |
| `viewer` | Read only |

### Per-entity permissions

Permissions are `create`, `read`, `update`, `delete` per entity:

```json
{
  "entities": {
    "tasks": ["create", "read", "update", "delete"],
    "reports": ["read"]
  },
  "canManageUsers": false,
  "canManageSettings": false
}
```

## 8. Deploy a Static Site

Deploy any static site (Astro, Vite, Next.js export, plain HTML) to a Fyso subdomain.

```
fyso_deploy({
  action: "deploy",
  subdomain: "my-app",
  path: "/path/to/dist"
})
```

Response:

```json
{
  "success": true,
  "message": "Site deployed successfully",
  "data": {
    "url": "https://my-app-sites.fyso.dev",
    "subdomain": "my-app"
  }
}
```

Your site is live at `https://my-app-sites.fyso.dev`.

If the MCP server can't access your filesystem directly, it returns a `curl` command to run manually -- just execute it and the deploy completes.

### List deployed sites

```
fyso_deploy({ action: "list" })
```

### Generate a deploy token for CI/CD

```
fyso_deploy({ action: "generate_token", subdomain: "my-app" })
```

Returns a one-time token (expires in 5 minutes) for use in GitHub Actions or other CI pipelines. See [GitHub Actions Deployment](/deployment/github-actions) for a full workflow.

---

## What's Next

You now know the core workflow: connect, model data, query it, add rules, create users, and deploy.

Next: See [Building a Complete App](./building-a-site.md) for a full end-to-end example that puts all of these pieces together.
