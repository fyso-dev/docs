---
sidebar_position: 8
---

# Agent Memory

Agent memory lets an agent retain facts about an end user across separate conversations. When enabled, facts are extracted from the conversation after it ends and injected back into the system prompt on subsequent turns with the same user.

## How It Works

1. A conversation runs normally. Memory has no effect during the first session.
2. After a session accumulates **3 or more user turns**, a background extraction pass runs using the LLM. It reads the conversation and produces a list of deduplicated facts about the user (name, preferences, stated context, etc.).
3. Facts are stored in the `_fyso_agent_memory` table, keyed by `(tenantId, agentId, externalRef)` — where `externalRef` is the identifier your channel uses to distinguish end users (e.g. a session token or user ID).
4. On the next conversation with the same user, the 10 most recent facts are retrieved and appended to the agent's system prompt before the first LLM call.

Memory extraction is asynchronous and adds roughly one extra LLM call per qualifying conversation.

## Enabling Memory

Memory is disabled by default. Enable it on the agent config:

```bash
curl -X PUT https://api.fyso.dev/api/agents-config/<agentId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "memory_enabled": true }'
```

Or toggle it from the agent edit page in the admin panel.

## Database

Memory requires migration **0068**. The migration creates the `_fyso_agent_memory` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tenant_id` | text | Tenant scope |
| `agent_id` | text | Agent scope |
| `external_ref` | text | End-user identifier (from the channel) |
| `fact` | text | Extracted fact string |
| `created_at` | timestamp | When the fact was stored |

## Behavior Details

| Condition | Result |
|-----------|--------|
| `memory_enabled: false` (default) | No retrieval, no extraction. Existing agents unaffected. |
| Session has fewer than 3 user turns | Extraction does not run. |
| Session has 3+ user turns | Extraction runs after the session; facts are deduplicated before insert. |
| Memory retrieval at conversation start | Up to 10 most recent facts injected into system prompt. |

## Privacy and RGPD

Facts stored in `_fyso_agent_memory` contain information about end users. If you operate under GDPR / RGPD, ensure that:

- Your DPA with Fyso covers memory storage (see [RGPD Compliance](./rgpd-compliance.md)).
- Data suppression via `DELETE /api/rgpd/users/:externalRef/ai-data` also deletes memory facts for that user.
- Users who have refused AI consent (`ai_consent: false`) will not trigger memory extraction because the LLM is never called.

## Limitations

- The in-process memory store runs on a single API container. In multi-process deployments, facts are still durable (stored in Postgres) but extraction is fire-and-forget per process.
- Fact extraction quality depends on the configured LLM and its context window. Very long conversations may result in partial extraction.
- Memory is scoped per agent. Facts from agent A are not visible to agent B even for the same user.
