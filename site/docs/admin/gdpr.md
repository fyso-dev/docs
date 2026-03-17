---
sidebar_position: 14
---

# GDPR Compliance

Fyso provides built-in GDPR (RGPD) compliance tools for tenants that use AI features.

## Data Processing Agreement (DPA)

Before using AI features, the tenant owner must accept the DPA:

```bash
curl -X POST "https://api.fyso.dev/api/auth/tenants/:id/dpa-accept" \
  -H "Authorization: Bearer OWNER_TOKEN"
```

DPA acceptance is recorded with timestamp and IP address. AI features are blocked until the DPA is accepted.

## Session Consent

Each agent session can track whether the user has given explicit consent for AI data processing:

```bash
curl -X POST "https://api.fyso.dev/api/rgpd/sessions/:sessionId/consent" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"ai_consent": true}'
```

The `ai_consent` flag is stored on `_fyso_agent_sessions`. When consent is not given, the agent can still respond but AI-specific data (debug payloads, memory extraction) is suppressed.

## Data Suppression

Users can request deletion of all AI-related data for a specific external reference (e.g., a phone number or email):

```bash
curl -X DELETE "https://api.fyso.dev/api/rgpd/users/:externalRef/ai-data" \
  -H "Authorization: Bearer TOKEN"
```

This removes:
- Agent sessions and their message history
- Agent memory facts associated with the external reference
- AI call logs linked to those sessions

The operation is logged in the consent audit log.

## Consent Audit Log

All consent-related events are recorded in `_fyso_consent_audit_log`:
- DPA acceptance
- Session consent changes
- Data suppression requests

The audit log is immutable and retained for compliance purposes.
