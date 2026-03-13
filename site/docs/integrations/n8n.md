---
sidebar_position: 1
---

# n8n Integration

The `n8n-nodes-fyso` community node lets you read and write Fyso entity records from n8n workflows, and trigger workflows in response to Fyso events.

**Package:** [`n8n-nodes-fyso`](https://www.npmjs.com/package/n8n-nodes-fyso)

---

## Installation

### Via Community Nodes panel (recommended)

1. Open your n8n instance.
2. Go to **Settings** → **Community Nodes**.
3. Click **Install**.
4. Enter `n8n-nodes-fyso` and confirm.

n8n will restart and the Fyso node will be available in the node palette.

### Via npm (self-hosted)

```bash
cd ~/.n8n
npm install n8n-nodes-fyso
```

Restart n8n after installation.

---

## Credential setup

The node authenticates using a Fyso API key. The API key is scoped to a specific tenant — you do not need to pass a tenant ID separately.

**Steps:**

1. In Fyso admin panel, go to **Settings** → **API Keys** and create a new key.
2. In n8n, go to **Credentials** → **New** → search for **Fyso API**.
3. Fill in:

| Field | Value |
|-------|-------|
| **API Key** | Your `fyso_ak_...` key |
| **API URL** | `https://api.fyso.dev` (or your self-hosted URL) |

---

## Fyso Node

The **Fyso** node performs CRUD operations on entity records. It also provides tenant and entity listing operations.

### Operations

| Operation | Description |
|-----------|-------------|
| **List Tenants** | List all tenants accessible to the API key |
| **List Entities** | List entity metadata for a specific tenant |
| **Create Record** | Create a new record in an entity |
| **Get Record** | Fetch a single record by ID |
| **List Records** | Fetch all records in an entity |
| **Update Record** | Update an existing record by ID |
| **Delete Record** | Delete a record by ID |

### Parameters by operation

**List Entities**

| Parameter | Description |
|-----------|-------------|
| `Tenant ID` | The tenant ID to list entities for |

**Create Record / Update Record**

| Parameter | Description |
|-----------|-------------|
| `Entity` | The entity name or slug (e.g., `contacts`, `invoices`) |
| `Record Data (JSON)` | Record fields as a JSON object |

**Get Record / Delete Record**

| Parameter | Description |
|-----------|-------------|
| `Entity` | Entity name or slug |
| `Record ID` | The record UUID |

**List Records**

| Parameter | Description |
|-----------|-------------|
| `Entity` | Entity name or slug |

### Example — Create a record

Configure the Fyso node with:

- **Operation:** Create Record
- **Entity:** `contacts`
- **Record Data (JSON):**

```json
{
  "name": "{{ $json.name }}",
  "email": "{{ $json.email }}",
  "source": "n8n-workflow"
}
```

The node returns the created record from the Fyso API.

### Example — List records and pass to the next node

- **Operation:** List Records
- **Entity:** `appointments`

The output items each contain a Fyso record in the `json` field, ready to map into subsequent nodes (Slack, Google Sheets, etc.).

---

## Fyso Trigger

The **Fyso Trigger** node starts a workflow when a record event occurs in Fyso. It automatically registers a webhook when the workflow is activated and removes it when the workflow is deactivated.

### Events

| Event | Fires when |
|-------|-----------|
| `Record Created` | A new record is created in the entity |
| `Record Updated` | An existing record is updated |
| `Record Deleted` | A record is deleted |

### Parameters

| Parameter | Description |
|-----------|-------------|
| `Event` | The event type to listen for |
| `Entity` | The entity slug to watch (e.g., `patients`, `orders`) |

### Requirements

The n8n instance must be publicly reachable over HTTPS. Fyso will POST the event payload to the webhook URL that n8n generates. Localhost or private network URLs will not work.

### Output

The trigger node outputs the raw event payload from Fyso:

```json
{
  "event": "record.created",
  "entity": "patients",
  "record": {
    "id": "uuid",
    "name": "Jane Smith",
    "created_at": "2026-03-12T10:00:00Z"
  }
}
```

---

## Example workflows

### New record → Slack notification

1. **Fyso Trigger** — Event: `Record Created`, Entity: `leads`
2. **Slack** — Send message: `New lead: {{ $json.record.name }}`

### Record updated → Google Sheets row

1. **Fyso Trigger** — Event: `Record Updated`, Entity: `appointments`
2. **Google Sheets** — Append row with `{{ $json.record }}`

### Scheduled sync → Fyso records

1. **Schedule Trigger** — every hour
2. **HTTP Request** — fetch data from external API
3. **Fyso** — Operation: Create Record, Entity: `inventory`, Record Data: `{{ $json }}`

---

## Troubleshooting

**"Unauthorized" error**

The API key is invalid or has been revoked. Check the key in Fyso admin panel under **Settings** → **API Keys**.

**Trigger not firing**

The webhook URL must be publicly accessible. Verify your n8n instance has a public URL configured (`N8N_WEBHOOK_URL` environment variable for self-hosted). Fyso cannot reach `localhost` or private IPs.

**Trigger fires but workflow errors**

Check the payload shape using an n8n **Code** node after the trigger to inspect `$json`. Entity fields vary by entity definition.

**"Entity not found" error**

The entity slug is case-sensitive and must match the slug shown in the Fyso admin panel (e.g., `patients`, not `Patients`).
