---
sidebar_position: 9
---

# RGPD / GDPR Compliance

Fyso provides built-in compliance primitives for operating AI agents under GDPR (called RGPD in Spanish/French contexts). This covers three areas: Data Processing Agreement acceptance by the tenant admin, session-level AI consent from end users, and the right to erasure via data suppression.

## Data Processing Agreement (DPA)

Before using AI features in production, the tenant's administrator must accept the DPA. This acceptance is recorded with a timestamp and the acting admin's ID.

### Accept the DPA

```bash
curl -X POST https://api.fyso.dev/api/auth/tenants/<tenantId>/dpa-accept \
  -H "Authorization: Bearer <admin-token>"
```

Response:

```json
{
  "success": true,
  "data": {
    "dpaAcceptedAt": "2026-03-14T10:00:00.000Z",
    "dpaAcceptedBy": "admin-user-id"
  }
}
```

### Check DPA Status

```bash
curl https://api.fyso.dev/api/auth/tenants/<tenantId>/dpa-status \
  -H "Authorization: Bearer <admin-token>"
```

Response:

```json
{
  "success": true,
  "data": {
    "accepted": true,
    "acceptedAt": "2026-03-14T10:00:00.000Z",
    "acceptedBy": "admin-user-id"
  }
}
```

---

## Session-Level AI Consent

End users interacting with an agent via any channel can be asked whether they consent to AI data processing. The consent flag is stored on the `agent_sessions` row.

### Record Consent

```bash
curl -X POST https://api.fyso.dev/api/rgpd/sessions/<sessionId>/consent \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{ "consent": true }'
```

Set `"consent": false` to record a refusal.

### What Happens With a Refusal

When `ai_consent` is `false` on a session, the agent runner returns a refusal response **without making any LLM call**. The response text is taken from the agent's `fallbackMessages.consent_refused` config key, defaulting to:

> "I cannot process your request because AI data processing consent has been refused for this session."

`ai_consent: null` (not yet collected) allows processing — consent collection is the caller's responsibility and does not block the runner.

### Consent States

| `ai_consent` value | Runner behavior |
|-------------------|----------------|
| `null` | Allow — consent not yet collected |
| `true` | Allow — user has consented |
| `false` | Block — return refusal, no LLM call |

---

## Data Suppression (Right to Erasure)

Delete all AI data associated with an end user across sessions and call logs.

```bash
curl -X DELETE \
  "https://api.fyso.dev/api/rgpd/users/<externalRef>/ai-data" \
  -H "Authorization: Bearer <api-key>"
```

Optional query parameter `external_type` filters by channel type if the same `externalRef` value is used across multiple channels.

```bash
curl -X DELETE \
  "https://api.fyso.dev/api/rgpd/users/user-123/ai-data?external_type=web" \
  -H "Authorization: Bearer <api-key>"
```

This endpoint requires admin role. It deletes:
- All `agent_sessions` rows for the user
- All `ai_call_logs` rows for those sessions
- All `_fyso_agent_memory` facts for the user (if agent memory is enabled)

The deletion is recorded in the consent audit log.

---

## Consent Audit Log

Every consent and suppression event is recorded in `consent_audit_log`.

```bash
curl "https://api.fyso.dev/api/rgpd/audit-log?limit=50" \
  -H "Authorization: Bearer <api-key>"
```

Query parameters:

| Parameter | Description |
|-----------|-------------|
| `external_ref` | Filter by end-user identifier |
| `limit` | Maximum records to return (default 50) |

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event": "consent_given",
      "externalRef": "user-123",
      "actorId": null,
      "metadata": { "consent": true },
      "createdAt": "2026-03-14T10:05:00.000Z"
    }
  ]
}
```

Event types: `consent_given`, `consent_refused`, `data_suppressed`.

---

## Database Migrations

RGPD compliance requires two migrations:

| Migration | Changes |
|-----------|---------|
| 0067 | `dpa_accepted_at`, `dpa_accepted_by` on `tenants`; `ai_consent`, `ai_consent_at` on `agent_sessions`; `consent_audit_log` table |
| 0068 | `_fyso_agent_memory` table (agent memory — separate feature, same release) |

---

## Implementation Notes

- DPA routes (`/api/auth/tenants/:id/dpa-*`) require admin authentication via `requireAuth`.
- Consent and suppression routes (`/api/rgpd/*`) require tenant context (API key or admin session).
- Suppression and audit log routes require admin role within the tenant.
- The web widget and other public-facing channel endpoints do not enforce DPA — that check is the tenant operator's responsibility before deploying a public widget.
