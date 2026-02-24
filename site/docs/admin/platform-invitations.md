# Platform Invitations

Platform admins (`platform_admin`) can invite up to **5 users** to create a free-tier account on Fyso. This feature is available to platform administrators and does not require the invitee to have an existing account.

## Quota

| Plan | Invitation quota |
|------|-----------------|
| Free (platform_admin) | 5 invitations per admin |

Each admin has an independent quota. Quota tracks **active** invitations (pending + accepted). Revoked invitations free up a slot.

## Invitation lifecycle

```
created (pending) → accepted
                  → revoked (by admin)
                  → expired (after 7 days)
```

Invitations expire automatically after **7 days** if not accepted.

## Endpoints

### Create an invitation

```bash
POST /api/platform/invitations
Authorization: Bearer <platform-admin-token>
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address of the person to invite |

**Validations:**
- Cannot invite yourself (self-invite guard)
- Cannot invite an email that already has an account (duplicate guard)
- Quota must not be exhausted (max 5 active invitations per admin)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "status": "pending",
    "expiresAt": "2026-03-03T00:00:00Z",
    "createdAt": "2026-02-24T00:00:00Z"
  }
}
```

An invitation email is sent to the provided address automatically.

**Error responses:**

| Status | Cause |
|--------|-------|
| `409` | Email already has an account or a pending invitation |
| `422` | Quota exhausted (5 active invitations reached) |
| `400` | Self-invite attempt or invalid email |
| `401` | Not authenticated as platform_admin |

### List invitations

```bash
GET /api/platform/invitations
Authorization: Bearer <platform-admin-token>
```

Returns all invitations created by the authenticated admin, with their current status.

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "newuser@example.com",
      "status": "pending",
      "expiresAt": "2026-03-03T00:00:00Z",
      "createdAt": "2026-02-24T00:00:00Z"
    }
  ]
}
```

### Revoke an invitation

```bash
DELETE /api/platform/invitations/:id
Authorization: Bearer <platform-admin-token>
```

Immediately invalidates the invitation token. The invitee can no longer use the link. Revoking frees up one quota slot.

Returns `404` if the invitation does not exist or belongs to a different admin.

---

## Public endpoints (no authentication required)

### Validate an invitation token

```bash
GET /api/platform/invitations/validate/:token
```

Checks whether a token is valid and not yet used or expired. Used by the frontend to display the invitation preview page before the user accepts.

```json
{
  "success": true,
  "data": {
    "email": "newuser@example.com",
    "expiresAt": "2026-03-03T00:00:00Z"
  }
}
```

Returns `410 Gone` for expired or already-used tokens, `404` for invalid tokens.

### Accept an invitation

```bash
POST /api/platform/invitations/accept/:token
Content-Type: application/json

{
  "name": "Jane Doe",
  "password": "secure-password"
}
```

Atomically claims the invitation (TOCTOU-safe) and creates the user account. The token is marked as `accepted` and cannot be reused.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name for the new account |
| `password` | string | Yes | Password for the new account |

**Error responses:**

| Status | Cause |
|--------|-------|
| `410` | Token expired or already used |
| `400` | Missing required fields |

---

## Email notification

When an invitation is created, Fyso automatically sends an email to the invited address containing:
- A personalized greeting
- The invitation link (valid for 7 days)
- Instructions to create their account

Emails are sent via Resend.
