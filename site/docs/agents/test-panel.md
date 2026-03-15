---
sidebar_position: 10
---

# Agent Test Panel

The test panel lets you chat with an agent directly from the admin panel and inspect every execution detail without deploying to a channel first.

## Accessing the Test Panel

From the agent list, click the flask icon on any agent card. Or navigate to `/agents/:id/test` directly. The agent edit page also has a **Test** button in its sticky footer.

The layout shows two tabs at the top of every agent page: **Edit** and **Test**. Switch between them without losing your place.

## Chat Interface

The test panel is a full chat interface connected to your live agent configuration. Messages are sent to `POST /tenants/:slug/agents/:agentSlug/run` with a persistent `session_id`, so the conversation maintains context across messages within the same test session.

Each message bubble shows its routing path: **Rule** (deterministic fast path) or **LLM** (model call). Click any message to open the inspector.

## Inspector Modal

The inspector modal has four tabs:

### Summary

High-level metrics for the selected run:

- Token counts (input / output)
- Step count
- Latency in milliseconds
- Run ID and Session ID with one-click copy buttons

### Flow

An n8n-style diagram showing the execution path:

```
User → Agent → [Tool A] → [Tool B] → Response
               [Tool C]
```

Tool names are humanized (e.g. `fyso_data` becomes "Fyso Data"). The diagram reflects the actual tools called during that run, not all available tools.

### Steps

Full message history split into two sections:

- **History** — turns from previous messages in the session
- **Current turn** — the messages exchanged for this specific run, including tool call requests, tool results, and the final assistant response

### Raw

Complete JSON payload for the run. Useful for debugging unexpected behavior or verifying exact token counts and metadata.

## Agent List Quick Actions

Each agent card in the list now shows two quick-action buttons:

| Button | Action |
|--------|--------|
| Flask icon | Open test panel for this agent |
| List icon | Open rules editor for this agent |

## Data Access Scope

The agent form (Edit tab) now includes a **Tools scope** section where you select which entities the agent can access when using data tools. Changes here take effect immediately on the next test run.
