---
sidebar_position: 8
---

# Platform Invitations

Platform invitations let tenant admins invite new users to register on the platform. Each invited user creates their own admin account upon accepting.

This is separate from [tenant user invitations](./users.md) — platform invitations create new admin accounts, while tenant invitations add users to an existing tenant.

## Quota

Each admin can send up to **5 active invitations** at a time. Invitations expire after **7 days**.

## Invitation lifecycle

```
created (pending) → accepted
                  → revoked (by admin)
                  → expired (after 7 days)
```

## REST Endpoints

### Send an invitation

```bash
POST /api/platform/invitations
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newuser@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "inviteUrl": "https://app.fyso.dev/signup/invited?token=..."
  }
}
```

An invitation email is sent automatically. The `inviteUrl` can also be shared manually.

**Errors:**

| Code | Error | Description |
|------|-------|-------------|
| `400` | `EMAIL_REQUIRED` | Missing or invalid email |
| `409` | — | Email already has an active invitation |
| `422` | — | Quota exceeded (5 active invitations) or other validation error |

### List my invitations

```bash
GET /api/platform/invitations
Authorization: Bearer <admin-token>
```

Returns all active invitations sent by the authenticated admin, along with quota usage.

### Revoke an invitation

```bash
DELETE /api/platform/invitations/:id
Authorization: Bearer <admin-token>
```

Immediately invalidates the invitation token. Revoking frees up one quota slot. Returns `404` if the invitation doesn't exist or belongs to another admin.

---

## Accepting an Invitation (Public)

### Validate a token

```bash
GET /api/platform/invitations/:token
```

Returns a preview of the invitation before the user registers. Returns `410 Gone` if the token has expired.

```json
{
  "success": true,
  "data": {
    "email": "newuser@example.com",
    "invitedByName": "Alice"
  }
}
```

### Accept and register

```bash
POST /api/platform/invitations/:token/accept
Content-Type: application/json

{
  "name": "New User",
  "password": "securepassword"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name (minimum 2 characters) |
| `password` | string | Yes | Password (minimum 8 characters) |

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "<session-token>"
  }
}
```

The user is logged in immediately after accepting. The invitation token is marked as `accepted` and cannot be reused.

**Error responses:**

| Status | Cause |
|--------|-------|
| `410` | Token expired or already accepted |
| `400` | Missing or invalid fields |

---

## Email notification

When an invitation is created, Fyso automatically sends an email to the invited address containing:
- A personalized greeting from the inviting admin
- The invitation link (valid for 7 days)
- Instructions to create their account

---

## Admin Panel

Go to **Platform → Invitations** in the admin panel to manage invitations:

- Send new invitations by email
- View status of all active invitations (pending / accepted / expired)
- Revoke pending invitations
- Invite acceptance page at `/signup/invited?token=...`
