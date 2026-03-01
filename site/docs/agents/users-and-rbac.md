---
sidebar_position: 5
---

# Users & RBAC

Every tenant has its own user table, completely isolated from other tenants. Users authenticate with email + password and get a JWT. Roles control what they can do.

## System Roles

Four built-in roles ship with every tenant. You cannot modify or delete them.

| Role | What it can do |
|------|---------------|
| `owner` | Everything. Manage entities, users, roles, settings, records. Full control. |
| `admin` | Manage entities, users, and settings. CRUD all records across all entities. |
| `member` | CRUD records on entities they have permission for. |
| `viewer` | Read-only on entities they have permission for. |

When you create a user without specifying a role, they get `member` by default.

## Custom Roles

System roles are coarse. Custom roles let you define exactly what a user can do, down to per-entity CRUD operations.

### Creating a Role

**MCP:**

```
create_role({
  name: "support-agent",
  permissions: {
    entities: {
      "tickets": ["create", "read", "update"],
      "customers": ["read"],
      "internal-notes": ["create", "read", "update", "delete"]
    },
    canManageUsers: false,
    canManageRoles: false,
    canManageSettings: false
  }
})
```

**REST:**

```bash
curl -X POST https://api.fyso.dev/api/roles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "support-agent",
    "permissions": {
      "entities": {
        "tickets": ["create", "read", "update"],
        "customers": ["read"]
      },
      "canManageUsers": false,
      "canManageRoles": false,
      "canManageSettings": false
    }
  }'
```

### Permission Structure

```json
{
  "entities": {
    "<entity-name>": ["create", "read", "update", "delete"]
  },
  "canManageUsers": false,
  "canManageRoles": false,
  "canManageSettings": false
}
```

Valid actions per entity: `create`, `read`, `update`, `delete`. That's it -- no wildcards in custom roles. You must list each entity explicitly.

The management flags:

| Flag | What it grants |
|------|---------------|
| `canManageUsers` | Create, list, update users in the tenant |
| `canManageRoles` | Create, update, delete custom roles; assign/revoke roles |
| `canManageSettings` | Update tenant settings |

### Multiple Roles per User

Users can have multiple roles. Permissions merge with **union semantics** -- if any role grants an action, the user has it.

Example: a user with roles `support-agent` (read tickets) and `billing-viewer` (read invoices) can read both tickets and invoices.

### Assigning a Role

```bash
curl -X POST https://api.fyso.dev/api/roles/users/<user-id>/roles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleId": "<role-id>"}'
```

Assigning the same role twice is idempotent -- no error, no duplicate.

**MCP:**

```
assign_role({
  userId: "uuid-of-user",
  roleId: "uuid-of-role"
})
```

### Revoking a Role

```bash
curl -X DELETE https://api.fyso.dev/api/roles/users/<user-id>/roles/<role-id> \
  -H "Authorization: Bearer <admin-token>"
```

**MCP:**

```
revoke_role({
  userId: "uuid-of-user",
  roleId: "uuid-of-role"
})
```

### Checking Effective Permissions

To see the merged result of all roles assigned to a user:

```bash
curl https://api.fyso.dev/api/roles/users/<user-id>/permissions \
  -H "Authorization: Bearer <admin-token>"
```

Response:

```json
{
  "success": true,
  "data": {
    "entities": {
      "tickets": ["create", "read", "update"],
      "customers": ["read"]
    },
    "canManageUsers": false,
    "canManageRoles": false,
    "canManageSettings": false
  }
}
```

### Managing Roles

| Operation | REST | Requires |
|-----------|------|----------|
| List all roles | `GET /api/roles` | Auth |
| Get role by ID | `GET /api/roles/:roleId` | Auth |
| Create role | `POST /api/roles` | `canManageRoles` |
| Update role | `PUT /api/roles/:roleId` | `canManageRoles` |
| Delete role | `DELETE /api/roles/:roleId` | `canManageRoles` |

System roles (`isSystem: true`) cannot be modified or deleted.

## Entity-Level Permissions

Each entity in a role's permission object maps to an array of allowed actions:

```json
{
  "entities": {
    "products": ["create", "read", "update", "delete"],
    "invoices": ["read", "create"],
    "reports": ["read"]
  }
}
```

No wildcard entity (`"*"`) support in custom roles. You list each entity by name.

You can also set per-entity permissions directly on a user (legacy approach, still works):

```
create_user({
  tenantSlug: "my-app",
  email: "warehouse@example.com",
  password: "securepass123",
  name: "Warehouse Operator",
  role: "member",
  permissions: {
    entities: {
      inventory: ["create", "read", "update"],
      shipments: ["read"]
    }
  }
})
```

Legacy user-level permissions merge with role-based permissions using the same union semantics.

### Advanced: Field-Level Control

Custom roles support field-level restrictions on reads:

```json
{
  "entities": {
    "employees": {
      "actions": ["read"],
      "fields": ["name", "department", "title"],
      "excludeFields": ["salary", "ssn"]
    }
  }
}
```

| Property | Type | Description |
|----------|------|-------------|
| `actions` | string[] | CRUD actions allowed |
| `fields` | string[] | Whitelist -- only these fields are returned. Omit for all fields. |
| `excludeFields` | string[] | Blacklist -- these fields are stripped from responses. |
| `rowFilter` | string or object | Filter records (see next section). |

If one role has a field whitelist and another doesn't, the user sees all fields (union semantics).

## Row-Level Filtering

Restrict which records a user can see by attaching a `rowFilter` to their role's entity permission.

### Via Entity Views

The cleanest approach: create a view with a filter, then grant role access to the view.

**Step 1: Create the view**

```
create_view({
  entitySlug: "tickets",
  slug: "my-tickets",
  name: "My Tickets",
  filterDsl: {
    validate: [
      { condition: "reporter == $currentUser" }
    ]
  }
})
```

**Step 2: Grant the role access to the view**

```json
{
  "entities": {
    "view:my-tickets": ["read"]
  }
}
```

Now users with that role can only query `GET /api/views/my-tickets/records` and they only see tickets where `reporter` matches their user ID.

### Filter Variables

| Variable | Resolves to |
|----------|------------|
| `$currentUser` | The authenticated user's ID |
| `$currentTenant` | The current tenant's ID |

Admin API key access bypasses view filters entirely -- admins see all records.

### Filter Syntax

Same syntax as business rule conditions:

```
status == 'open' and priority > 3
(department == 'sales' or department == 'support') and region == $currentTenant
owner_id == $currentUser
```

Operators: `==`, `!=`, `>`, `>=`, `<`, `<=`. Logical: `and`, `or`, `not`. Grouping with parentheses.

## Creating Users

**MCP:**

```
create_user({
  tenantSlug: "my-app",
  email: "agent@example.com",
  password: "securepass123",
  name: "Support Agent",
  role: "member",
  permissions: {
    entities: {
      tickets: ["create", "read", "update"],
      customers: ["read"]
    }
  },
  metadata: {
    department: "Support",
    phone: "+1-555-0123"
  }
})
```

**REST:**

```bash
curl -X POST https://api.fyso.dev/api/auth/tenant/users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@example.com",
    "password": "securepass123",
    "name": "Support Agent",
    "role": "member",
    "permissions": {
      "entities": {
        "tickets": ["create", "read", "update"]
      }
    }
  }'
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Unique within the tenant |
| `password` | string | Yes | Minimum 8 characters, stored hashed |
| `name` | string | Yes | Full name |
| `role` | string | No | `owner`, `admin`, `member`, `viewer`. Default: `member` |
| `permissions` | object | No | Per-entity permissions (legacy, works alongside roles) |
| `metadata` | object | No | Arbitrary data: phone, department, avatar, etc. |

After creation, assign custom roles separately via `POST /api/roles/users/:userId/roles`.

## User Login & Sessions

**MCP:**

```
tenant_login({
  tenantSlug: "my-app",
  email: "agent@example.com",
  password: "securepass123"
})
```

**REST:**

```bash
curl -X POST https://api.fyso.dev/api/auth/tenant/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: my-app" \
  -d '{"email":"agent@example.com","password":"securepass123"}'
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "agent@example.com",
    "name": "Support Agent",
    "role": "member"
  },
  "usage": {
    "header": "Authorization",
    "value": "Bearer eyJhbGci...",
    "note": "Use this token in the Authorization header for REST API calls"
  }
}
```

The JWT goes in the `Authorization: Bearer <token>` header for all subsequent REST calls.

### Self-Service Flows

These are **disabled by default**. Enable per tenant:

```bash
curl -X PUT https://api.fyso.dev/api/auth/tenants/<tenant-id>/settings \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"selfRegistrationEnabled": true, "passwordResetEnabled": true}'
```

| Feature | Endpoint | Notes |
|---------|----------|-------|
| Self-registration | `POST /api/auth/tenant/register` | Creates user with `viewer` role. Rate-limited: 5/hour per IP. |
| Forgot password | `POST /api/auth/tenant/forgot-password` | Sends reset email. Never reveals if email exists. 3 per 15min. |
| Reset password | `POST /api/auth/tenant/reset-password` | One-time token, expires 1 hour. Invalidates all sessions. |
| Change password | `POST /api/auth/tenant/change-password` | Authenticated. Validates current password first. |

Admin can also force-reset any user's password:

```bash
curl -X PATCH https://api.fyso.dev/api/auth/tenant/users/<user-id>/reset-password \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"new_password": "newpassword123"}'
```

## Invitation Flows

Two systems: **invitation codes** (gate registration) and **tenant member invitations** (invite specific people).

### Invitation Codes

Codes control who can register when self-registration is disabled. Can be single-use or multi-use.

**Create a code:**

```bash
curl -X POST https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"note": "for contractor team", "maxUses": 5, "expiresAt": "2026-06-30T00:00:00Z"}'
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "FYSO-A3B4-C5D6",
    "inviteUrl": "https://app.example.com/invite/FYSO-A3B4-C5D6"
  }
}
```

**Validate a code (public, no auth):**

```bash
curl -X POST https://api.fyso.dev/api/invitations/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "FYSO-A3B4-C5D6"}'
```

**Invalidate a code:**

```bash
curl -X DELETE https://api.fyso.dev/api/invitations/FYSO-A3B4-C5D6 \
  -H "Authorization: Bearer <admin-token>"
```

### Tenant Member Invitations

Invite specific people by email. Each invitation is single-use with a configurable TTL.

**Create an invitation:**

```bash
curl -X POST https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Tenant-Slug: my-app" \
  -H "Content-Type: application/json" \
  -d '{"email": "colleague@example.com", "expiresInDays": 7}'
```

**Accept an invitation (public, no auth required):**

```bash
curl -X POST https://api.fyso.dev/auth/invite/accept \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<invite-token>",
    "email": "colleague@example.com",
    "name": "Jane Doe",
    "password": "securepassword"
  }'
```

The email must match the invitation if one was set. Creates the user as `member`. The claim is atomic -- no double-use possible.

**Invitation statuses:** `pending`, `accepted`, `expired`, `revoked`.

**Revoke:**

```bash
curl -X DELETE https://api.fyso.dev/api/invitations/<token> \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Tenant-Slug: my-app"
```

## View-Based Access Control

Views are the recommended way to implement row-level security. The pattern:

1. Create an entity view with a filter
2. Create a custom role with `view:<slug>` permission
3. Assign the role to users

### Full Example

**Create a view** that shows only records owned by the current user:

```bash
curl -X POST https://api.fyso.dev/api/views \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "entitySlug": "orders",
    "slug": "my-orders",
    "name": "My Orders",
    "filterDsl": {
      "validate": [{"condition": "owner_id == $currentUser"}]
    }
  }'
```

**Create a role** that can only access records through this view:

```bash
curl -X POST https://api.fyso.dev/api/roles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "order-viewer",
    "permissions": {
      "entities": {
        "view:my-orders": ["read"]
      }
    }
  }'
```

**Assign the role** to a user:

```bash
curl -X POST https://api.fyso.dev/api/roles/users/<user-id>/roles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"roleId": "<order-viewer-role-id>"}'
```

Now the user queries records through the view:

```bash
curl https://api.fyso.dev/api/views/my-orders/records \
  -H "Authorization: Bearer <user-token>"
```

They only see their own orders. Users without the `view:my-orders` permission get `403`.

### View Query Parameters

Views support the same query parameters as entity records:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sort` | string | - | Sort field |
| `order` | string | `asc` | `asc` or `desc` |
| `search` | string | - | Full-text search |
| `filter.{field}` | string | - | Additional filter (AND with view filter) |

Additional query filters compose with the view's base filter using AND logic.
