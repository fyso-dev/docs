---
sidebar_position: 9
---

# n8n Integration

Fyso provides an official n8n community node package (`n8n-nodes-fyso`) with full CRUD support and webhook-based triggers.

## Installation

In your n8n instance, go to **Settings → Community Nodes** and install:

```
n8n-nodes-fyso
```

Or install manually in your n8n directory:

```bash
npm install n8n-nodes-fyso
```

## Credentials

Create **Fyso API** credentials in n8n:

| Field | Description |
|-------|-------------|
| **API Key** | Your Fyso admin API key (`fyso_adm_*`) or tenant token |
| **API URL** | Your Fyso API base URL (e.g., `https://api.fyso.dev`) |

## Fyso Node

The **Fyso** node supports 7 operations:

| Operation | Description |
|-----------|-------------|
| `List Tenants` | List all tenants accessible with the API key |
| `List Entities` | List metadata entities for a tenant |
| `Create Record` | Create a new record in an entity |
| `Get Record` | Fetch a single record by ID |
| `List Records` | List records for an entity (with filters) |
| `Update Record` | Update a record by ID |
| `Delete Record` | Delete a record by ID |

### Example: Create a record

1. Add a **Fyso** node to your workflow
2. Select **Create Record** operation
3. Set **Entity** to `contacts`
4. Set **Record Data** to `{{ { "name": $json.name, "email": $json.email } }}`

## Fyso Trigger Node

The **Fyso Trigger** node listens for entity events via Fyso webhooks.

| Event | Description |
|-------|-------------|
| `record.created` | Fires when a record is created in the entity |
| `record.updated` | Fires when a record is updated |
| `record.deleted` | Fires when a record is deleted |

### Setup

1. Add a **Fyso Trigger** node to start your workflow
2. Select the **Event** (e.g., `Record Created`)
3. Set the **Entity** to watch (e.g., `orders`)
4. Activate the workflow — n8n automatically registers a webhook subscription in Fyso

When activated, n8n calls `POST /api/webhooks/subscriptions` to register the webhook. On deactivation, the subscription is removed automatically.

### Example workflow: sync new contacts to a CRM

```
[Fyso Trigger: record.created on contacts]
  → [Transform: map Fyso fields to CRM format]
  → [HTTP Request: POST to CRM API]
```

## Notes

- The Fyso Trigger node requires your Fyso tenant to support webhooks (available on all plans)
- Use an admin API key (`fyso_adm_*`) for management operations, or a tenant user token for tenant-scoped operations
- For public read-only access, use a [public key](./anonymous-keys.md) with `records:read` scope
