---
sidebar_position: 9
---

# Secrets

Store sensitive values — API keys, tokens, passwords — encrypted. Reference them in [Flows](./flows.md) with `{{secret:name}}` and they're injected at runtime. Values are encrypted at rest and never returned by the API.

## Setting a secret

**MCP Tool: `set_secret`** (Profile: advanced)

```
set_secret({
  name: "slack_webhook_url",
  value: "https://hooks.slack.com/services/T00/B00/xxxxx"
})
```

If a secret with that name already exists, the value is overwritten.

**REST API:**

```bash
curl -X POST https://api.fyso.dev/api/secrets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "slack_webhook_url",
    "value": "https://hooks.slack.com/services/T00/B00/xxxxx"
  }'
```

Requires admin role.

## Listing secrets

**REST API:**

```bash
curl https://api.fyso.dev/api/secrets \
  -H "Authorization: Bearer <token>"
```

Returns secret names only. Values are never returned.

```json
{
  "success": true,
  "data": [
    { "name": "slack_webhook_url", "created_at": "2026-02-15T10:00:00Z" },
    { "name": "external_api_key", "created_at": "2026-02-20T08:30:00Z" }
  ]
}
```

## Deleting a secret

**MCP Tool: `delete_secret`** (Profile: advanced)

```
delete_secret({ name: "slack_webhook_url" })
```

**REST API:**

```bash
curl -X DELETE https://api.fyso.dev/api/secrets/slack_webhook_url \
  -H "Authorization: Bearer <token>"
```

Deletion is immediate and irreversible. Any flow referencing the deleted secret will fail at runtime.

## Usage in flows

Reference secrets anywhere in flow step configs with `{{secret:name}}`:

```json
{
  "type": "http_request",
  "config": {
    "url": "https://api.example.com/notify",
    "headers": {
      "Authorization": "Bearer {{secret:external_api_key}}"
    },
    "body": { "event": "record.created", "id": "{{id}}" }
  }
}
```

The secret value is resolved at execution time. If the secret doesn't exist, the step fails.

## Security

- **Encrypted at rest** — values are never stored in plaintext
- **Never returned** — the API only exposes secret names, never values
- **Admin-only** — creating, listing, and deleting secrets requires admin role
- **Immediate deletion** — no soft delete, no recovery
- **Audit-safe** — secret names appear in flow configs and logs, values do not
