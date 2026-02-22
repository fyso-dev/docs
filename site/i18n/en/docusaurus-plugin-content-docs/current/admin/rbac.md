# Roles and Permissions (RBAC)

Fyso implements role-based access control (RBAC) for tenant users.

## System roles

Each tenant has 3 predefined roles that cannot be deleted:

| Role | Description |
|------|-------------|
| `admin` | Full access. Can manage entities, rules, users, and settings |
| `editor` | Can create and edit records. No access to tenant settings |
| `viewer` | Read-only. Cannot create, edit, or delete records |

## Permissions

Permissions are defined as a JSON object with actions on resources:

```json
{
  "records:create": true,
  "records:read": true,
  "records:update": true,
  "records:delete": false,
  "entities:manage": false,
  "rules:manage": false,
  "users:manage": false
}
```

When a user has multiple roles, permissions are merged with union semantics (a `true` in any role grants the permission).

## Manage roles via MCP

### List roles

```
list_roles()
```

Returns tenant roles with their permissions.

### Create a custom role

```
create_role({
  name: "support",
  description: "Read and edit records, no deletion",
  permissions: {
    "records:create": true,
    "records:read": true,
    "records:update": true,
    "records:delete": false
  }
})
```

### Assign a role to a user

```
assign_role({
  userId: "user-uuid",
  roleId: "role-uuid"
})
```

### Revoke a role

```
revoke_role({
  userId: "user-uuid",
  roleId: "role-uuid"
})
```

## Manage roles from the web panel

Go to **Settings** > **Roles** to view, create, and edit roles.

Go to **Users** > select user > **Roles** to assign/revoke.

## Role hierarchy

System roles have an implicit hierarchy:

```
owner > admin > editor > viewer
```

The `owner` is the adminUser who created the tenant and has irrevocable full access.

Management routes enforce the minimum required role per operation:

- Manage entities and rules: `admin`
- Create/edit records: `editor`
- Read records: `viewer`

## REST API with RBAC

REST API endpoints respect the permissions of the JWT token used. A token for a user with the `viewer` role can only do `GET`; attempting a `POST` returns `403 Forbidden`.

```bash
# Login as tenant user
curl -X POST "https://api.fyso.dev/api/auth/tenant/login" \
  -H "X-Tenant-ID: my-company" \
  -d '{"email":"editor@company.com","password":"..."}'

# Use the resulting JWT
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://api.fyso.dev/api/entities/clients/records"
```

## Example: team setup with different roles

```
# Create support role
create_role({
  name: "support",
  permissions: {
    "records:read": true,
    "records:update": true
  }
})

# Create user
create_user({ email: "support@company.com", password: "..." })

# Assign role
assign_role({ userId: "...", roleId: "..." })
```
