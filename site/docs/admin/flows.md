---
sidebar_position: 8
---

# Flows

Flows are automation workflows that run when something happens to a record — or when you trigger them manually. Think of them as lightweight pipelines: an event fires, steps execute in order, data flows through.

## Trigger types

| Trigger | When it fires |
|---------|--------------|
| `record.created` | A new record is created in the target entity |
| `record.updated` | A record is updated |
| `record.deleted` | A record is deleted |
| `manual` | You trigger it explicitly |

Each flow watches one entity. Set the entity in `triggerConfig`.

## Step types

Steps run in sequence. Each step receives the record data and can pass transformed data to the next.

| Step type | What it does |
|-----------|-------------|
| `http_request` | Send an HTTP request (method, url, headers, body) |
| `send_email` | Send an email (to, subject, body) |
| `create_record` | Create a record in any entity |
| `update_record` | Update a record |
| `condition` | Branch logic — if the condition fails, remaining steps are skipped |
| `transform` | Modify data between steps |

## Interpolation

Use `{{field}}` to reference record data in any step config. The field name matches the record's field key.

```json
{
  "type": "send_email",
  "config": {
    "to": "{{customer_email}}",
    "subject": "Order {{order_number}} confirmed",
    "body": "Hi {{customer_name}}, your order is confirmed."
  }
}
```

For sensitive values, use `{{secret:name}}` to reference encrypted secrets. See [Secrets](./secrets.md).

## Creating a flow

**MCP Tool: `create_flow`** (Profile: advanced)

```
create_flow({
  name: "notify-critical-tickets",
  description: "Slack alert when a critical ticket comes in",
  triggerType: "record.created",
  triggerConfig: { entity: "tickets" },
  steps: [
    {
      type: "condition",
      config: { field: "priority", operator: "=", value: "critical" }
    },
    {
      type: "http_request",
      config: {
        method: "POST",
        url: "https://hooks.slack.com/services/...",
        headers: { "Content-Type": "application/json" },
        body: { "text": "Critical ticket: {{title}} from {{customer_email}}" }
      }
    }
  ],
  isActive: true
})
```

This flow watches the `tickets` entity. When a record is created with `priority` = `critical`, it sends a POST to Slack with the ticket title and customer email.

## Listing flows

**MCP Tool: `list_flows`** (Profile: advanced)

```
list_flows()
```

Returns all flows for the tenant with their status, trigger config, and step count.

## Updating a flow

**MCP Tool: `update_flow`** (Profile: advanced)

```
update_flow({
  flowId: "flow_01HXYZ...",
  name: "notify-critical-tickets-v2",
  steps: [...]
})
```

Pass only the fields you want to change.

## Deleting a flow

**MCP Tool: `delete_flow`** (Profile: advanced)

```
delete_flow({ flowId: "flow_01HXYZ..." })
```

Deletion is immediate and irreversible.

## Toggling a flow

**MCP Tool: `toggle_flow`** (Profile: advanced)

```
toggle_flow({ flowId: "flow_01HXYZ...", isActive: false })
```

Disable a flow without deleting it. Disabled flows don't fire on events.

## Secrets in flows

Reference encrypted secrets with `{{secret:name}}` anywhere in step configs. Useful for API keys, tokens, and credentials you don't want hardcoded.

```json
{
  "type": "http_request",
  "config": {
    "method": "POST",
    "url": "https://api.example.com/notify",
    "headers": {
      "Authorization": "Bearer {{secret:external_api_key}}"
    },
    "body": { "message": "New record: {{title}}" }
  }
}
```

Set secrets using the `set_secret` MCP tool. Secrets are encrypted at rest and never returned in API responses. See [Secrets](./secrets.md) for details.

## Example: email on new signup

A flow that sends a welcome email when a user signs up:

```
create_flow({
  name: "welcome-email",
  triggerType: "record.created",
  triggerConfig: { entity: "users" },
  steps: [
    {
      type: "send_email",
      config: {
        to: "{{email}}",
        subject: "Welcome to the platform",
        body: "Hi {{name}}, thanks for signing up."
      }
    }
  ],
  isActive: true
})
```
