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
| `isOwner` | boolean | No | Grant owner privileges (manage all settings). Default: `false` |
| `metadata` | object | No | Additional data (phone, department, position, avatar) |

### RBAC Model

Fyso uses a **pure RBAC model**. There are no built-in fixed roles. Instead, you create custom roles with specific permissions and assign them to users.

Seed roles (admin, editor, viewer) are provided as editable templates — you can rename them, change their permissions, or delete them entirely.

The only special flag is `isOwner`, which grants full administrative access to the tenant (manage users, settings, billing). One or more users per tenant can be flagged as owner.

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
      "isOwner": true,
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

Creates a user with the default viewer role. Returns `403` if `selfRegistrationEnabled` is `false`, `409` on duplicate email.

Rate-limited to **5 requests per hour** per IP + tenant.

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "jane@example.com",
    "name": "Jane Builder"
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

Users with manage permission (or `isOwner`) can reset any user's password without knowing the current password. All active sessions for the affected user are invalidated.

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
    "isOwner": false
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

---

## Tenant Member Invitations

Tenant member invitations let you invite specific people to join your tenant via a one-time link. Unlike invitation codes (which gate platform registration), these invitations create a direct onboarding path into an existing tenant.

All invitation endpoints require an authenticated admin token in `Authorization: Bearer <admin-token>` plus the `X-Tenant-Slug: <slug>` header to identify the tenant.

### Create an invitation

```bash
curl -X POST https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Tenant-Slug: my-tenant" \
  -H "Content-Type: application/json" \
  -d '{"email": "colleague@example.com", "expiresInDays": 7}'
```

**Body parameters** (all optional):

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | Lock the invitation to this email. The invitee must register with this exact address. |
| `expiresInDays` | number | Days until the invitation expires. Default: `7` |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "token": "a3f1b2c4...hex64",
    "inviteUrl": "https://app.fyso.dev/invite/a3f1b2c4...hex64"
  }
}
```

Share the `inviteUrl` with the invitee. The link is valid until accepted or expired. Each invitation is single-use.

### List invitations

```bash
curl https://api.fyso.dev/api/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Tenant-Slug: my-tenant"
```

Returns all invitations for the tenant ordered by creation date. Expired pending invitations are automatically marked as `expired` on retrieval.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "token": "a3f1b2c4...hex64",
      "email": "colleague@example.com",
      "status": "pending",
      "accepted_at": null,
      "expires_at": "2026-03-02T12:00:00Z",
      "created_at": "2026-02-23T12:00:00Z",
      "invited_by_name": "Admin User",
      "invited_by_email": "admin@my-tenant.com"
    }
  ]
}
```

**Status values:**

| Status | Description |
|--------|-------------|
| `pending` | Invitation sent, not yet accepted |
| `accepted` | Invitee has registered successfully |
| `expired` | Past the expiry date without being accepted |
| `revoked` | Manually cancelled by an admin |

### Revoke an invitation

```bash
curl -X DELETE https://api.fyso.dev/api/invitations/<token> \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Tenant-Slug: my-tenant"
```

Sets the invitation status to `revoked`. Only `pending` invitations can be revoked. Returns `404` if the token is not found or already used/expired.

### Preview an invitation (public)

```bash
curl https://api.fyso.dev/auth/invite/<token>
```

No authentication required. Returns invitation details so the frontend can render a preview before the user registers.

**Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "email": "colleague@example.com",
    "tenantSlug": "my-tenant"
  }
}
```

Returns `400` with an error message if the invitation is invalid, expired, accepted, or revoked.

### Accept an invitation

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

No prior authentication required. The invitation token acts as the gate.

**Body parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | The invitation token from the invite link |
| `email` | string | Yes | Registrant email. Must match the invitation email if one was set |
| `name` | string | Yes | Full name (minimum 1 character after trimming) |
| `password` | string | Yes | Password (minimum 8 characters) |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "colleague@example.com",
    "name": "Jane Doe"
  }
}
```

The invitation is claimed atomically — concurrent requests cannot claim the same token twice. Returns `409` if the email already exists in the tenant, `403` if the email does not match the invitation, and `403` if the token is invalid, expired, or revoked.

---

## Tenant-User Login

Tenant users (invited via member invitations) log in through a dedicated endpoint:

```bash
POST /api/auth/tenant/login
X-Tenant-ID: <tenant-slug>
Content-Type: application/json

{ "email": "user@example.com", "password": "password123" }
```

The returned JWT includes an `isTenantUser` flag. The frontend automatically injects the `X-Tenant-ID` header on all subsequent API calls.

---

## Role Assignment Audit

All role assignments and revocations are logged in `role_assignment_log`:

```bash
GET /api/roles/:roleId/audit
Authorization: Bearer <admin-token>
```

Returns a chronological log of who assigned or revoked the role, when, and for which user. Admin actions are also attributed — every CRUD operation records which admin user performed it.

---

## Deactivating Users

Tenant owners can deactivate users from the admin panel. Deactivated users cannot log in but their data is preserved. Toggle the active status from the Users page.
