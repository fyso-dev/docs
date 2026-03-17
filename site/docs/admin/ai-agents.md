---
sidebar_position: 12
---

# AI Agents

Fyso includes a built-in AI agent system. Agents are conversational AI assistants that operate on your tenant data using the same tools available to MCP clients. They can answer questions, create records, book appointments, and search your knowledge base — all through natural language.

## Creating an Agent

**MCP Tool: `fyso_agents`**

```
fyso_agents({
  action: "create",
  name: "Support Bot",
  system_prompt: "You are a helpful support agent for a dental clinic."
})
```

**REST API:**

```bash
curl -X POST "https://api.fyso.dev/api/tenants/:slug/agents-config" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "system_prompt": "You are a helpful support agent for a dental clinic."
  }'
```

The agent slug is auto-generated from the name (e.g., `Support Bot` → `support-bot`).

### Agent Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | required | Agent display name. Slug auto-generated from name. |
| `system_prompt` | string | `""` | Custom system prompt appended to the base prompt. |
| `fallback_mode` | `llm` \| `message` \| `silent` | `llm` | What to do when no deterministic rule matches. |
| `fallback_messages` | object | `{}` | Custom fallback text messages by language. |
| `tools_scope` | object | `{}` | Entity tools available: `{ "entity_name": ["query", "create", "update"] }` |
| `max_steps` | number | `10` | Max tool-call iterations per run. |
| `memory_enabled` | boolean | `false` | Extract and remember facts across conversations. |
| `knowledge_enabled` | boolean | `false` | Inject `search_knowledge` tool for RAG retrieval. |
| `schedules_enabled` | boolean | `false` | Inject scheduling tools (slots, bookings). |
| `status` | `active` \| `paused` \| `archived` | `active` | Agent lifecycle status. |

## Running an Agent

**MCP Tool:**

```
fyso_agents({
  action: "run",
  agentId: "support-bot",
  input: "When is my next appointment?"
})
```

**REST API:**

```bash
curl -X POST "https://api.fyso.dev/api/tenants/:slug/agents/support-bot/run" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "When is my next appointment?"}'
```

**Response:**

```json
{
  "response": "Your next appointment is on March 20 at 10:00 AM with Dr. López.",
  "session_id": "a1b2c3d4-...",
  "run_id": "e5f6g7h8-...",
  "path": "llm",
  "steps_used": 3,
  "tokens": { "input": 450, "output": 120 }
}
```

The `path` field tells you how the response was resolved:

| Path | Meaning |
|------|---------|
| `rule` | Matched a deterministic rule — no LLM call, zero tokens |
| `llm` | Processed by the AI model |
| `fallback` | No rule matched and LLM was not used (fallback mode) |

## Deterministic Rules (Fast Path)

Agents can have deterministic rules that match user messages without calling the LLM. Rules are evaluated in order — first match wins.

### Match Types

| Type | Description | Example |
|------|-------------|---------|
| `exact` | Exact string match (case-insensitive) | `"hola"` |
| `contains` | All terms must be present | `["precio", "producto"]` |
| `starts_with` | Message starts with string | `"ayuda"` |
| `regex` | Regular expression | `"^(hola\|buenos días)"` |

When a deterministic rule matches, the response is instant: `steps_used: 0`, `total_tokens: 0`, `path: "rule"`. This is the cheapest and fastest path — use it for greetings, FAQs, and common questions.

## Sessions

Each agent run belongs to a session. Sessions track conversation history across multiple turns, so the agent remembers what was said earlier in the same conversation.

- Sessions are identified by the tuple `(agent_id, external_ref, external_type)`
- `external_type` values: `telegram`, `whatsapp`, `web`, `api`
- The last 20 messages are loaded as context for each run
- Sessions auto-expire after inactivity (configurable TTL)
- Concurrent messages to the same session are serialized with a FIFO lock (60s timeout) — no race conditions

## Agent Memory

When `memory_enabled: true`, the agent extracts key facts from conversations and remembers them across sessions. After 3+ user turns in a conversation, the agent runs an extra AI call to extract facts like names, preferences, and context.

Facts are stored per agent + client pair and injected into the system prompt on subsequent sessions. This means the agent can say "Welcome back, María" or remember that a patient prefers morning appointments.

Cost: ~1 additional AI call per conversation (runs after the conversation, not during).

## Tools Scope

The `tools_scope` field defines which entity operations the agent can perform:

```json
{
  "tools_scope": {
    "citas": ["query", "create", "update"],
    "pacientes": ["query"]
  }
}
```

This generates semantic tool definitions the agent can call:

- `query_citas` — search with filters, pagination
- `create_citas` — required fields inferred from entity schema
- `update_citas` — requires `id`, all other fields optional
- `query_pacientes` — read-only access

### Additional Tools

Extra tools are injected based on agent configuration:

| Config Flag | Tools Injected |
|-------------|---------------|
| `knowledge_enabled: true` | `search_knowledge` — RAG retrieval, returns top 5 results |
| `schedules_enabled: true` | `query_available_slots`, `create_booking`, `cancel_booking`, `query_bookings` |

## Agent Templates

Pre-built templates for common use cases. Each template comes with deterministic rules pre-configured:

| Template | Description | Rules |
|----------|-------------|-------|
| `soporte` | FAQ answers + human escalation | 9 deterministic rules |
| `citas` | Appointment booking flow | 10 deterministic rules |
| `ventas` | Product catalog + lead capture | 13 deterministic rules |

**MCP:**

```
fyso_agents({
  action: "from_template",
  templateId: "soporte",
  name: "Mi Soporte"
})
```

Templates give you a working agent out of the box. Customize the rules and system prompt after creation.

## Industry Presets

One-click starter configurations that create entities and a pre-configured agent together. Use these when starting from scratch:

| Preset | Entities Created | Agent |
|--------|-----------------|-------|
| `taller` | vehicles, repairs, parts | Workshop assistant |
| `clinica` | patients, doctors, appointments, treatments | Reception agent |
| `tienda` | products, orders, customers | Sales assistant |

**MCP:**

```
fyso_ai({
  action: "install_preset",
  preset: "clinica"
})
```

This creates all the entities with sensible fields, plus an agent configured with the right `tools_scope` and deterministic rules for that industry.

## Prompt Versioning

Every change to `system_prompt` or `rules` is automatically versioned. Fyso keeps up to 50 versions per agent, rotating out the oldest.

**List versions:**

```
fyso_agents({ action: "list_versions", agentId: "support-bot" })
```

```bash
curl "https://api.fyso.dev/api/agents-config/:id/versions" \
  -H "Authorization: Bearer TOKEN"
```

**Rollback to a previous version:**

```
fyso_agents({ action: "rollback", agentId: "support-bot", versionId: "3" })
```

```bash
curl -X POST "https://api.fyso.dev/api/agents-config/:id/rollback/3" \
  -H "Authorization: Bearer TOKEN"
```

## Prompt Templates

Reusable prompt templates that can be shared across agents and referenced in business rule `ai_call` actions:

```
fyso_ai({
  action: "create_template",
  name: "classifier",
  prompt: "Classify the following message: {{descripcion}}"
})
```

Templates use `{{field_name}}` placeholders that are replaced at execution time. Reference them in business rules via the `prompt_template` slug.

## Agent Runs and Observability

Every agent execution is recorded in `_fyso_agent_runs`. Use this for debugging, monitoring, and usage tracking.

**MCP:**

```
fyso_agents({ action: "list_runs", agentId: "support-bot" })
```

**Run fields:**

| Field | Description |
|-------|-------------|
| `id` | Unique run identifier |
| `agent_id` | Which agent handled this |
| `session_id` | Conversation session |
| `path` | Resolution path: `rule`, `llm`, or `fallback` |
| `steps_used` | Number of tool-call iterations |
| `tokens` | `{ input, output }` token counts |
| `status` | `success`, `error`, `timeout`, or `max_steps` |
| `input_message` | What the user sent |
| `output_message` | What the agent replied |
| `created_at` | Timestamp |

## Testing Agents

Dry-run mode evaluates deterministic rules without calling the LLM. Use this to verify your rules before going live:

```
fyso_agents({
  action: "test",
  agentId: "support-bot",
  input: "hola"
})
```

The response includes diagnostics showing which rules matched, which didn't, and why. No tokens are consumed during dry-run.
