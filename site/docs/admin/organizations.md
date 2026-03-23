---
sidebar_position: 2
---

# Organizations

Organizations are the layer between admin users and tenants. An org groups tenants under a shared billing plan and lets multiple admins collaborate on the same workspace.

## Conceptual model

```
Admin user
  └── Organization (plan lives here)
        ├── Tenant A
        ├── Tenant B
        └── Tenant C
```

Every admin gets a **personal org** automatically on signup. You can create additional orgs — for example, one per client — and invite collaborators to each.

## Plan limits

| Plan | Tenants per org | Org members |
|------|----------------|-------------|
| Free | 1 | Owner only |
| Pro | 5 | Unlimited |
| Enterprise | Custom | Unlimited |

## Creating an org

**Admin panel:** Dashboard → top-left switcher → "New Organization"

**MCP:**

```
fyso_auth({ action: "create_org", orgName: "Acme Corp" })
```

**REST:**

```bash
curl -X POST https://api.fyso.dev/api/orgs \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Acme Corp" }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "plan": "free",
    "owner_id": "uuid",
    "created_at": "2026-03-01T00:00:00Z"
  }
}
```

## Inviting members

Inviting an admin by email sends them a pending invitation. They must accept before getting access.

**MCP:**

```
fyso_auth({ action: "invite_to_org", orgId: "<org-id>", email: "partner@example.com", orgRole: "member" })
```

**REST:**

```bash
curl -X POST https://api.fyso.dev/api/orgs/<org-id>/members \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{ "email": "partner@example.com", "role": "member" }'
```

| Role | Permissions |
|------|-------------|
| `owner` | Full access, can delete org, manage billing |
| `member` | Access to all tenants, cannot delete org or modify billing |

### Accepting an invitation

Invited admins receive an email with a link to `/signup/org-invite?token=<token>`. If they already have an account, they log in and are added immediately. New users can register from the same page.

## Listing orgs

```
fyso_auth({ action: "list_orgs" })
```

Returns all orgs the authenticated admin belongs to (as owner or member).

## Listing org members

```
fyso_auth({ action: "list_org_members", orgId: "<org-id>" })
```

## Switching orgs

The top-left switcher in the admin panel shows all orgs and their tenants in a hierarchical list. Click an org to expand it, then click a tenant to switch to it.

## MCP tool reference

These actions are part of `fyso_auth`:

| Action | Required params | Description |
|--------|----------------|-------------|
| `list_orgs` | — | List all orgs for the current admin |
| `create_org` | `orgName` | Create a new org |
| `invite_to_org` | `orgId`, `email` | Invite an admin to an org |
| `list_org_members` | `orgId` | List members of an org |

## REST API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/orgs` | List orgs for current admin |
| `POST` | `/api/orgs` | Create org |
| `GET` | `/api/orgs/:id` | Get org details |
| `PATCH` | `/api/orgs/:id` | Update org name/slug |
| `DELETE` | `/api/orgs/:id` | Delete org (owner only) |
| `GET` | `/api/orgs/:id/members` | List members |
| `POST` | `/api/orgs/:id/members` | Invite member by email |
| `DELETE` | `/api/orgs/:id/members/:memberId` | Remove member |
| `GET` | `/api/orgs/invitations/:token` | Get invitation details |
| `POST` | `/api/orgs/invitations/:token/accept` | Accept an org invitation |

## Billing

Plans are attached to orgs, not individual admin users. The Billing page is at `/org/billing`. See [Plans](../billing/plans.md) for available plans and limits.

> **Migration note:** Accounts created before v1.36.0 were automatically migrated to a personal org. Their existing plan was preserved.
