# Users and Roles

Each tenant has its own user table, isolated from other tenants.

## MCP Tool: `create_user`

**Profile:** core

Creates a user within the tenant.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantSlug` | string | Yes | Tenant slug |
| `email` | string | Yes | Email (unique within the tenant) |
| `password` | string | Yes | Password (min 8 characters, hashed) |
| `name` | string | Yes | Full name |
| `role` | string | No | Role: `owner`, `admin`, `member`, `viewer`. Default: `member` |
| `permissions` | object | No | Per-entity permissions |
| `metadata` | object | No | Additional data (phone, department, position, avatar) |

### Roles

| Role | Description |
|------|-------------|
| `owner` | Full control. Can manage everything |
| `admin` | Can manage users and settings |
| `member` | Can create and edit records |
| `viewer` | Read only |

### Per-Entity Permissions

```json
{
  "entities": {
    "productos": ["create", "read", "update", "delete"],
    "facturas": ["read", "create"],
    "reportes": ["read"]
  },
  "canManageUsers": false,
  "canManageSettings": false
}
```

### Example

```
create_user({
  tenantSlug: "mi-empresa",
  email: "vendedor@empresa.com",
  password: "password123",
  name: "Carlos Vendedor",
  role: "member",
  permissions: {
    entities: {
      clientes: ["create", "read", "update"],
      productos: ["read"]
    }
  }
})
```

### Login After Creating

The user can authenticate via REST:

```bash
curl -X POST "https://api.fyso.dev/api/auth/tenant/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: mi-empresa" \
  -d '{"email":"vendedor@empresa.com","password":"password123"}'
```

Or via MCP:

```
tenant_login({
  tenantSlug: "mi-empresa",
  email: "vendedor@empresa.com",
  password: "password123"
})
```

## MCP Tool: `list_users`

**Profile:** core

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantSlug` | string | No | Tenant slug. Default: selected tenant |

### Example

```
list_users({ tenantSlug: "mi-empresa" })
```

### Response

```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "admin@empresa.com",
      "name": "Admin Principal",
      "role": "owner",
      "isActive": true,
      "lastLogin": "2026-02-18T10:00:00Z"
    }
  ],
  "total": 2
}
```

Passwords are never returned.

---

## Self-Service Flows

Tenant users can register, reset their passwords, and change their passwords without admin involvement. These features are **disabled by default** and must be explicitly enabled per tenant.

### Feature Flags

Enable self-service features via `PUT /api/auth/tenants/:id/settings`:

```bash
curl -X PUT "https://api.fyso.dev/api/auth/tenants/<tenant-id>/settings" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "selfRegistrationEnabled": true,
    "passwordResetEnabled": true
  }'
```

| Flag | Default | Description |
|------|---------|-------------|
| `selfRegistrationEnabled` | `false` | Allow users to self-register (creates `viewer` role) |
| `passwordResetEnabled` | `false` | Allow forgot-password / reset-password flows (requires Resend email) |

All self-service endpoints are anonymous — they don't require admin auth, only the `X-Tenant-ID` header.

---

### Self-registration

```bash
POST /api/auth/tenant/register
X-Tenant-ID: <tenant-slug>
Content-Type: application/json

{
  "name": "Jane Builder",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

Creates a user with role `viewer`. Returns `403` if `selfRegistrationEnabled` is `false`, `409` on duplicate email.

Rate-limited to **5 requests per hour** per IP + tenant.

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "jane@example.com",
    "name": "Jane Builder",
    "role": "viewer"
  }
}
```

---

### Forgot password

```bash
POST /api/auth/tenant/forgot-password
X-Tenant-ID: <tenant-slug>
Content-Type: application/json

{ "email": "jane@example.com" }
```

Sends a one-time reset link via email. Always returns `200` — the response never reveals whether the email exists. Returns `403` if `passwordResetEnabled` is `false`.

Rate-limited to **3 requests per 15 minutes** per IP + tenant.

---

### Reset password

```bash
POST /api/auth/tenant/reset-password
X-Tenant-ID: <tenant-slug>
Content-Type: application/json

{
  "token": "<token-from-email>",
  "new_password": "newsecurepassword"
}
```

Applies a new password using the one-time token from the reset email. Tokens expire after **1 hour** and are invalidated on first use. Issuing a new reset token invalidates any prior outstanding token for that user. Returns `403` if `passwordResetEnabled` is `false`.

All active sessions for the user are invalidated on successful reset.

---

### Change password (authenticated)

```bash
POST /api/auth/tenant/change-password
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "current_password": "oldsecurepassword",
  "new_password": "newsecurepassword"
}
```

Authenticated users can change their own password. Validates the current password before applying the change. Returns `401` if `current_password` is incorrect. All other active sessions are invalidated after a successful change.

---

### Admin password reset

```bash
PATCH /api/auth/tenant/users/:id/reset-password
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "new_password": "newpassword123" }
```

Owner or admin can reset any user's password without knowing the current password. Requires `owner` or `admin` role. All active sessions for the affected user are invalidated.

This endpoint is also exposed as the `update_user_password` MCP tool.

---

## MCP Tool: `update_user_password`

**Profile:** core

Resets a tenant user's password. Owners and admins can set a new password for any user without knowing the current one. Useful for account recovery when the user cannot log in.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | UUID of the user |
| `newPassword` | string | Yes | New password (min 8 characters) |
| `tenantSlug` | string | No | Tenant slug. Default: selected tenant |

### Example

```
update_user_password({
  userId: "uuid-of-user",
  newPassword: "newpassword123"
})
```

All active sessions for the user are invalidated when the password is reset. The user can log in immediately with the new password.

---

## MCP Tool: `tenant_login`

**Profile:** advanced

Login as a tenant user. Returns a JWT for use with the REST API.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tenantSlug` | string | Yes | Tenant slug |
| `email` | string | Yes | User email |
| `password` | string | Yes | Password |

### Response

```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nombre",
    "role": "member"
  },
  "usage": {
    "header": "Authorization",
    "value": "Bearer eyJhbGci...",
    "note": "Use this token in the Authorization header for REST API calls"
  }
}
```

---

## Invitation Codes

Invitation codes control who can join your tenant when self-registration is disabled. Each code can be single-use or multi-use, optionally time-limited, and can carry a note for tracking.

All invitation endpoints require an authenticated admin token in the `Authorization: Bearer <token>` header.

### Generate an invitation

```bash
curl -X POST https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"note": "for contractor team", "maxUses": 5, "expiresAt": "2026-03-31T00:00:00Z"}'
```

**Body parameters** (all optional):

| Parameter | Type | Description |
|-----------|------|-------------|
| `note` | string | Internal label for tracking |
| `maxUses` | number | Max times the code can be used. Default: `1` |
| `expiresAt` | string | ISO 8601 expiry timestamp |

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "FYSO-A3B4-C5D6",
    "inviteUrl": "https://app.example.com/invite/FYSO-A3B4-C5D6"
  }
}
```

Share the `inviteUrl` directly with the invitee, or pass the `token` to a custom onboarding flow.

### List all invitations

```bash
curl https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>"
```

Returns all invitation codes for the tenant, including usage counts and status.

### Invalidate an invitation

```bash
curl -X DELETE https://api.fyso.dev/api/invitations/FYSO-A3B4-C5D6 \
  -H "Authorization: Bearer <admin-token>"
```

Soft-deletes the code (`is_active = false`). Any subsequent attempt to use the code returns an error. Returns `404` if the token is not found.

### Validate a code (public)

```bash
curl -X POST https://api.fyso.dev/api/invitations/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "FYSO-A3B4-C5D6"}'
```

No authentication required. Returns `{ "valid": true }` if the code is active, not expired, and has remaining uses.
