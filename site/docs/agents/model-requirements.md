---
sidebar_position: 9
---

# Model Requirements for Tool Calling

Fyso agents use a tool-calling loop: the model receives a list of tools (`query_records`, `create_record`, `update_record`), calls them to retrieve or modify data, then returns a final text response. This loop depends entirely on the model's ability to emit structured `tool_calls` responses.

## What the agent runner expects from a model

The runner sends the OpenAI function-calling format — `tools` in the request body and expects `finish_reason: "tool_calls"` with a `tool_calls` array in the response. If a model does not support this format, the following failure modes occur:

- **Hallucinated data:** the model invents records instead of querying them.
- **Ignored tools:** the model answers from training data, bypassing your entities entirely.
- **Silent failure:** the runner interprets the text response as a final answer, returns it, and reports zero tool calls used.

None of these failure modes produce an error — the agent appears to work but returns incorrect data.

## Minimum capability requirements

For reliable tool calling, the model must:

1. Support the OpenAI function-calling API (`tools` parameter, `tool_calls` in response).
2. Correctly emit `finish_reason: "tool_calls"` when a tool call is needed.
3. Return valid JSON in `tool_calls[].function.arguments`.

Models that meet these requirements consistently include the **GPT-4o**, **GPT-4.1**, **Claude 3.5+**, and **Llama 3.1 70B+** families. Small models (under ~30B parameters) often claim function-calling support but produce unreliable results in practice.

## Known problematic models

| Model | Issue |
|-------|-------|
| `llama-3.1-8b-instant` | Frequently ignores tools; hallucinates records |
| Other sub-30B instruct models | Variable support — test before deploying |

This list is not exhaustive. Model behavior depends on the provider's fine-tuning and the version deployed.

## How to test a model

Run the agent with a query that requires a tool call and check the response metadata:

```json
{
  "response": "...",
  "steps_used": 1,
  "tool_calls_count": 1
}
```

If `tool_calls_count` is `0` but the agent produced a data-related answer, the model did not use tools. Try a larger model.

## Configuring the model

The `default_model` is set in the AI provider configuration for your tenant (admin panel → AI settings). Fyso does not validate the model name — any string is accepted and passed to the provider. If the provider returns an error for an unsupported model, the agent returns a `not_configured` error.

```json
{
  "providers": {
    "default": {
      "type": "openai",
      "base_url": "https://api.groq.com/openai/v1",
      "default_model": "llama-3.1-70b-versatile"
    }
  }
}
```

When using a Groq, Together AI, or other OpenAI-compatible endpoint, select a model from their documentation that explicitly lists function-calling / tool-use support.
