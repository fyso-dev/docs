---
sidebar_position: 4
---

# Building a Complete App

Build a customer support ticket system from zero to deployed, with users, roles, business rules, views, API access, and a knowledge base. Every tool call is real.

**What you'll build:**
- Two entities: `tickets` and `agents`
- Business rules for validation and defaults
- RBAC with two roles: support agent and manager
- Filtered views for dashboards
- REST API access via platform keys
- A deployed frontend
- A knowledge base for RAG-powered support search

## Phase 1: Data Model

Start by selecting your tenant (see [MCP Quickstart](./mcp-quickstart.md) if you haven't connected yet):

```
select_tenant({ tenantSlug: "support-app" })
```

### Create the "agents" entity

Agents handle tickets. Create this first because `tickets` will reference it.

```
generate_entity({
  name: "agents",
  fields: [
    { "name": "name", "type": "text", "required": true },
    { "name": "email", "type": "text", "required": true },
    { "name": "department", "type": "select", "options": ["billing", "technical", "general"] }
  ]
})
```

Publish it:

```
publish_entity({
  entityName: "agents",
  message: "Initial agents entity"
})
```

### Create the "tickets" entity

```
generate_entity({
  name: "tickets",
  fields: [
    { "name": "title", "type": "text", "required": true },
    { "name": "description", "type": "long_text" },
    { "name": "status", "type": "select", "options": ["open", "in_progress", "resolved"] },
    { "name": "priority", "type": "select", "options": ["low", "medium", "high", "critical"] },
    { "name": "customer_email", "type": "text", "required": true },
    { "name": "assigned_to", "type": "relation", "relatedEntity": "agents" }
  ]
})
```

Publish it:

```
publish_entity({
  entityName: "tickets",
  message: "Initial tickets entity with agent relation"
})
```

### Add some test data

```
create_record({
  entityName: "agents",
  data: {
    "name": "Alice Chen",
    "email": "alice@support.com",
    "department": "technical"
  }
})
```

Note the agent record ID from the response (e.g., `agent-uuid-1`), then create a ticket:

```
create_record({
  entityName: "tickets",
  data: {
    "title": "Cannot reset password",
    "description": "Customer clicks reset link but gets a 404 page",
    "status": "open",
    "priority": "high",
    "customer_email": "customer@example.com",
    "assigned_to": "agent-uuid-1"
  }
})
```

## Phase 2: Business Rules

### Rule 1: Title is required

This is already handled by `required: true` on the field definition. But let's add a rule for priority validation:

```
generate_business_rule({
  entityName: "tickets",
  prompt: "Validate that priority must be one of: low, medium, high, critical. Reject the record if it's not."
})
```

Response:

```json
{
  "success": true,
  "rule": {
    "id": "rule-uuid-1",
    "name": "validate-priority-values",
    "entityName": "tickets",
    "trigger": "on_create",
    "status": "draft",
    "dsl": {
      "validate": [
        {
          "condition": "priority != 'low' and priority != 'medium' and priority != 'high' and priority != 'critical'",
          "action": "reject",
          "message": "Priority must be one of: low, medium, high, critical"
        }
      ]
    }
  }
}
```

Publish it:

```
publish_business_rule({ ruleId: "rule-uuid-1" })
```

### Rule 2: Default status to "open" on create

```
generate_business_rule({
  entityName: "tickets",
  prompt: "When a ticket is created, if status is not set, default it to 'open'"
})
```

Publish:

```
publish_business_rule({ ruleId: "rule-uuid-2" })
```

Now any new ticket without a status automatically gets `status: "open"`.

## Phase 3: Users & RBAC

### Create roles

**Support agent** -- can manage tickets, read agents:

```
create_role({
  name: "support_agent",
  description: "Can create, read, update tickets. Read-only on agents.",
  permissions: {
    entities: {
      "tickets": ["create", "read", "update"],
      "agents": ["read"]
    }
  }
})
```

Response:

```json
{
  "success": true,
  "role": {
    "id": "role-uuid-1",
    "name": "support_agent",
    "description": "Can create, read, update tickets. Read-only on agents."
  }
}
```

**Support manager** -- full access to both entities plus user management:

```
create_role({
  name: "support_manager",
  description: "Full access to tickets and agents. Can manage users.",
  permissions: {
    entities: {
      "tickets": ["create", "read", "update", "delete"],
      "agents": ["create", "read", "update", "delete"]
    },
    canManageUsers: true
  }
})
```

### Create users

```
create_user({
  tenantSlug: "support-app",
  email: "agent1@support.com",
  password: "securepass123",
  name: "Agent One",
  role: "member"
})
```

Note the user ID from the response, then assign the role:

```
assign_role({
  userId: "user-uuid-1",
  roleName: "support_agent"
})
```

Create a manager:

```
create_user({
  tenantSlug: "support-app",
  email: "manager@support.com",
  password: "securepass456",
  name: "Manager User",
  role: "admin"
})
```

```
assign_role({
  userId: "user-uuid-2",
  roleName: "support_manager"
})
```

### Verify access

Log in as the agent to test permissions:

```
tenant_login({
  tenantSlug: "support-app",
  email: "agent1@support.com",
  password: "securepass123"
})
```

The returned JWT can be used with the REST API. The agent will be able to read tickets and agents, create/update tickets, but not delete anything.

## Phase 4: Views

Views are filtered projections of an entity with their own permissions. They power dashboards.

### View: "my-tickets"

Shows only tickets assigned to the current user:

```
create_view({
  entitySlug: "tickets",
  slug: "my-tickets",
  name: "My Tickets",
  description: "Tickets assigned to the current user",
  filterDsl: {
    validate: [
      { condition: "assigned_to == $currentUser" }
    ]
  }
})
```

Response:

```json
{
  "success": true,
  "view": {
    "slug": "my-tickets",
    "name": "My Tickets",
    "entitySlug": "tickets",
    "isActive": true
  }
}
```

### View: "critical-open"

Shows all critical tickets that are still open:

```
create_view({
  entitySlug: "tickets",
  slug: "critical-open",
  name: "Critical Open Tickets",
  description: "All critical tickets with open status",
  filterDsl: {
    validate: [
      { condition: "priority == 'critical' and status == 'open'" }
    ]
  }
})
```

### Grant view access to the support_agent role

Views use the permission key format `view:<slug>`. To let agents see their own tickets through the view, update the role or create a new one that includes view access:

```
create_role({
  name: "support_agent_v2",
  description: "Can manage tickets, read agents, access views",
  permissions: {
    entities: {
      "tickets": ["create", "read", "update"],
      "agents": ["read"],
      "view:my-tickets": ["read"],
      "view:critical-open": ["read"]
    }
  }
})
```

### Query through a view

Via REST API:

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://api.fyso.dev/api/views/my-tickets/records"
```

The view's base filter is applied automatically. You can add extra filters on top:

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://api.fyso.dev/api/views/my-tickets/records?filter.priority=high&sort=createdAt&order=desc"
```

Admins (API key access) bypass the user filter and see all records through the view.

## Phase 5: API Access

### Generate the OpenAPI spec

```
get_rest_api_spec()
```

Returns the full OpenAPI specification for your tenant's entities, including all endpoints and schemas. You can paste this into Swagger UI or import it into Postman.

### REST API examples

**List tickets with filters:**

```bash
curl -H "Authorization: Bearer API_KEY" \
  "https://api.fyso.dev/api/entities/tickets/records?filter.status=open&filter.priority=critical&sort=createdAt&order=desc&limit=20"
```

**Create a ticket from an external system:**

```bash
curl -X POST "https://api.fyso.dev/api/entities/tickets/records" \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Billing issue",
    "description": "Customer charged twice for subscription",
    "priority": "high",
    "customer_email": "upset@customer.com"
  }'
```

**Update a ticket:**

```bash
curl -X PUT "https://api.fyso.dev/api/entities/tickets/records/RECORD_ID" \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

### Generate an API client

```
generate_api_client({
  language: "typescript"
})
```

Returns a complete TypeScript client with types for your entities.

### Public key access

For external integrations that need limited access (e.g., a customer-facing form that creates tickets), use public keys. Public keys are scoped to specific entities and operations. See [Public Keys](/admin/anonymous-keys) for setup.

## Phase 6: Deploy

### Deploy a frontend

Build your frontend (React, Vue, Astro, plain HTML -- anything that compiles to static files), then deploy:

```
deploy_static_site({
  subdomain: "support-app",
  path: "/path/to/your/frontend/dist"
})
```

Response:

```json
{
  "success": true,
  "message": "Site deployed successfully",
  "data": {
    "url": "https://support-app-sites.fyso.dev",
    "subdomain": "support-app"
  }
}
```

Your app is live at `https://support-app-sites.fyso.dev`.

### Set up CI/CD

Generate a deploy token for automated deployments:

```
generate_deploy_token({ subdomain: "support-app" })
```

Use this token in your GitHub Actions workflow. See [GitHub Actions Deployment](/deployment/github-actions) for the full setup.

### Custom domain (Pro)

Point your own domain to the site:

```
set_custom_domain({
  subdomain: "support-app",
  action: "add",
  domain: "support.mycompany.com"
})
```

Follow the DNS instructions in the response (add a CNAME record), then verify:

```
set_custom_domain({
  subdomain: "support-app",
  action: "verify"
})
```

Once verified, your site is accessible at both `support-app-sites.fyso.dev` and `support.mycompany.com` with automatic SSL.

## Phase 7: Knowledge Base (Optional)

Add a searchable knowledge base so your support agents can find answers from documentation using semantic search.

### Upload support documents

Upload a PDF manual:

```
upload_document({
  filePath: "/path/to/support-handbook.pdf",
  title: "Support Handbook 2026"
})
```

Upload content from a URL:

```
upload_document({
  title: "FAQ Page",
  content: "https://mycompany.com/faq",
  source_type: "url"
})
```

Upload inline text:

```
upload_document({
  title: "Password Reset Procedure",
  content: "## Password Reset\n\n1. Go to Settings > Security\n2. Click 'Reset Password'\n3. Enter current password\n4. Enter and confirm new password\n5. Click Save\n\nPasswords must be at least 8 characters with one uppercase letter and one number.",
  source_type: "text"
})
```

Documents are automatically chunked and indexed. Status goes from `processing` to `ready`.

### Search the knowledge base

```
search_knowledge({
  query: "How does a customer reset their password?",
  limit: 5,
  threshold: 0.3,
  one_per_document: true
})
```

Response:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "content": "## Password Reset\n\n1. Go to Settings > Security\n2. Click 'Reset Password'...",
        "score": 0.91,
        "document": {
          "id": "doc-uuid",
          "title": "Password Reset Procedure",
          "source_type": "text"
        },
        "chunk_index": 0,
        "token_count": 82
      }
    ],
    "query_time_ms": 38
  }
}
```

Search works by meaning, not keyword matching. "How does a customer reset their password?" matches content about password resets even if the exact words differ.

### Check stats

```
get_knowledge_stats()
```

Returns document counts, search analytics, and embedding token usage. Use this to monitor search quality -- watch the `zero_result_rate` and `avg_score` fields.

---

## Recap

Here's everything you built:

| Layer | What you did |
|-------|-------------|
| **Data model** | Two entities (`tickets`, `agents`) with a relation |
| **Business rules** | Priority validation + default status on create |
| **RBAC** | Two roles with scoped permissions |
| **Views** | Filtered dashboards (`my-tickets`, `critical-open`) |
| **API** | REST endpoints + generated client |
| **Deploy** | Static site on `support-app-sites.fyso.dev` |
| **Knowledge** | Searchable docs for RAG-powered support |

All of this was done through MCP tool calls. No code deployment, no infrastructure setup. The REST API and views are ready for your frontend to consume.
