---
title: Paddle Webhook Observability
sidebar_position: 4
---

# Paddle Webhook Observability

Fyso records inbound Paddle webhook deliveries so superadmins and support operators can
diagnose payment, subscription, and app-entitlement incidents without reading raw server logs.

This observability layer is separate from `paddle_webhook_events`, which remains the
idempotency ledger for processed app-entitlement events. The ingress log records every
request that reaches `POST /api/webhooks/paddle`, including missing signatures, invalid
signatures, valid billing events, and valid app-entitlement events.

## What Is Logged

The public Paddle webhook endpoint records metadata in `paddle_webhook_ingress_logs`.
Migration `0088_create_paddle_webhook_ingress_logs.sql` creates the table and indexes the
fields used by the support views.

| Field | Description |
|-------|-------------|
| `route` | Webhook route, currently `/api/webhooks/paddle` |
| `event_id`, `event_type`, `notification_id` | Paddle event identifiers when available |
| `scope` | `data.custom_data.scope`, for example `app_entitlement` |
| `signature_status` | `missing`, `invalid`, or `valid` |
| `handler` | `none`, `app_entitlement`, `billing`, or `ignored` |
| `http_status` | Response status returned to Paddle |
| `error` | Ingress or handler error captured during processing |
| `org_id`, `source_tenant_id`, `app_key` | App-entitlement context from `custom_data` |
| `customer_id`, `subscription_id`, `transaction_id` | Paddle object identifiers |
| `payload` | Persisted for valid billing and app-entitlement events |
| `received_at` | Ingress timestamp |

The record step is non-blocking for the webhook delivery: if the ingress log insert fails,
the webhook handler logs the persistence error and continues processing the delivery.

## Delivery Outcomes

| Delivery | `signature_status` | `handler` | Response | Notes |
|----------|--------------------|-----------|----------|-------|
| Missing `paddle-signature` header | `missing` | `none` | `400` | No event payload is trusted. |
| Body read failure | `invalid` | `none` | `400` | Logged before Paddle signature verification. |
| HMAC verification failure | `invalid` | `none` | `400` | Parsed JSON context is logged if the body can be parsed. |
| Valid signature, invalid JSON | `valid` | `none` | `400` | Signature passed, but the raw body is not usable JSON. |
| `custom_data.scope = "app_entitlement"` | `valid` | `app_entitlement` | `200` | Handler errors are captured in `error`; Paddle still receives `200`. |
| Other normalized Paddle event | `valid` | `billing` | `200` | Uses the existing billing handler. |
| Valid request with no normalized event | `valid` | `ignored` | `200` | Logged for diagnostics. |

After HMAC verification succeeds, Fyso returns `200` even when business processing fails.
Those failures should be investigated from the ingress log and `paddle_webhook_events.processing_error`,
not by waiting for Paddle retries.

## Superadmin Console

Open the superadmin console and go to **Paddle Webhooks**:

```text
/superadmin/paddle-webhooks
```

The page is only available to superadmins. It displays:

- Total deliveries.
- Valid signed deliveries.
- Rejected deliveries split by invalid and missing signatures.
- Deliveries with ingress or processing errors.
- Latest delivery cards with event type, event ID, timestamp, signature status, handler,
  HTTP status, app context, Paddle IDs, and error text.

### Console Filters

| Filter | Values | Notes |
|--------|--------|-------|
| Search | Free text | Searches event ID, notification ID, customer ID, subscription ID, transaction ID, org ID, and source tenant ID. |
| Signature status | `valid`, `invalid`, `missing` | Empty value shows all signatures. |
| Handler | `app_entitlement`, `billing`, `ignored`, `none` | Empty value shows all handlers. |

Use the search box with the Paddle `event_id`, `subscription_id`, `transaction_id`, or
customer ID from a support ticket. Combine it with `handler = app_entitlement` when the
incident is about Fyso Teams access.

## Superadmin API

The console calls the superadmin API:

```http
GET /api/admin/platform/paddle-webhooks
Authorization: Bearer <superadmin-session-token-or-fyso_sa_key>
```

`X-Admin-Secret: <ADMIN_SECRET>` is still accepted as a legacy fallback where configured.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Page number. Values below `1` fall back to `1`. |
| `limit` | number | `50` | Page size. Maximum `100`. |
| `signatureStatus` | string | none | One of `valid`, `invalid`, `missing`. Invalid values are ignored. |
| `handler` | string | none | One of `app_entitlement`, `billing`, `ignored`, `none`. Invalid values are ignored. |
| `eventType` | string | none | Exact event type filter, for example `subscription.created`. |
| `q` | string | none | Free-text search across Paddle and Fyso context IDs. |

Example:

```bash
curl "https://api.fyso.dev/api/admin/platform/paddle-webhooks?limit=50&signatureStatus=valid&handler=app_entitlement&q=sub_01h" \
  -H "Authorization: Bearer fyso_sa_..."
```

Response shape:

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-uuid",
        "route": "/api/webhooks/paddle",
        "event_id": "evt_01h...",
        "event_type": "subscription.created",
        "notification_id": "ntf_01h...",
        "scope": "app_entitlement",
        "signature_status": "valid",
        "handler": "app_entitlement",
        "http_status": 200,
        "error": null,
        "processing_error": null,
        "org_id": "org-uuid",
        "source_tenant_id": "65422493-73d8-4e74-a879-defa3a9771f1",
        "app_key": "fyso_teams",
        "customer_id": "ctm_01h...",
        "subscription_id": "sub_01h...",
        "transaction_id": null,
        "received_at": "2026-05-02T16:07:49.002Z"
      }
    ],
    "summary": {
      "totalLogs": 1,
      "validCount": 1,
      "invalidSignatureCount": 0,
      "missingSignatureCount": 0,
      "appEntitlementCount": 1,
      "billingCount": 0,
      "errorCount": 0
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1
    }
  }
}
```

## Support Replay For App Entitlements

Use the support replay script only when support has confirmed that a Paddle subscription
exists but Fyso did not activate the app entitlement. The script builds and signs an
`app_entitlement` Paddle event, resolves the target org from an admin email, and posts to
the same public webhook route.

By default it is a dry run. It prints the resolved org, source tenant, event ID, and payload
context without sending the webhook.

```bash
PADDLE_WEBHOOK_SECRET="..." \
SUPPORT_ACCOUNT_EMAIL="customer@example.com" \
SUPPORT_PADDLE_SUBSCRIPTION_ID="sub_01h..." \
SUPPORT_PADDLE_CUSTOMER_ID="ctm_01h..." \
SUPPORT_PERIOD_END="2026-06-01T00:00:00.000Z" \
bun run --cwd packages/api support:replay-app-entitlement
```

Send the replay only after reviewing the dry-run output:

```bash
PADDLE_WEBHOOK_SECRET="..." \
SUPPORT_ACCOUNT_EMAIL="customer@example.com" \
SUPPORT_PADDLE_SUBSCRIPTION_ID="sub_01h..." \
SUPPORT_PADDLE_CUSTOMER_ID="ctm_01h..." \
SUPPORT_PERIOD_END="2026-06-01T00:00:00.000Z" \
bun run --cwd packages/api support:replay-app-entitlement --send
```

Optional variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PADDLE_WEBHOOK_URL` | `https://api.fyso.dev/api/webhooks/paddle` | Target webhook URL. |
| `PADDLE_REPLAY_SEND` | unset | Set to `1` as an alternative to `--send`. |
| `SUPPORT_ORG_ID` | unset | Required when the admin email belongs to multiple orgs. |
| `SUPPORT_APP_KEY` | `fyso_teams` | App key used to resolve `source_tenant_id`. |
| `SUPPORT_SOURCE_TENANT_ID` | app catalog lookup | Explicit source tenant ID override. |
| `SUPPORT_EVENT_TYPE` | `subscription.created` | Must be `subscription.created` or `subscription.trialing`. |
| `SUPPORT_SUBSCRIPTION_STATUS` | `trialing` | Subscription status written into the replay payload. |
| `SUPPORT_PERIOD_START` | current timestamp | Current billing period start. |
| `SUPPORT_EVENT_ID` | generated | Explicit event ID for traceability. |

After sending, confirm the replay in **Paddle Webhooks** by searching the generated
`event_id`, subscription ID, or customer ID. The delivery should show:

- `signature_status = valid`
- `handler = app_entitlement`
- `http_status = 200`
- no ingress `error`
- no `processing_error`

## Manual Fyso Teams Payment Smoke

The manual smoke test is opt-in and skipped unless `FYSO_TEAMS_PAYMENT_SMOKE=1`.
Use it during staging or production diagnosis to verify public routes, app catalog config,
webhook tables, authenticated entitlement reads, and optionally real Paddle checkout creation.

Minimal route/config smoke:

```bash
FYSO_TEAMS_PAYMENT_SMOKE=1 \
bun run --cwd packages/api smoke:fyso-teams-payment
```

Read-only database diagnostics:

```bash
FYSO_TEAMS_PAYMENT_SMOKE=1 \
FYSO_TEAMS_SMOKE_DATABASE_URL="postgresql://readonly:...@localhost:5460/fyso?sslmode=prefer" \
FYSO_TEAMS_SMOKE_TARGET_EMAIL="customer@example.com" \
bun run --cwd packages/api smoke:fyso-teams-payment
```

Authenticated entitlement diagnostics:

```bash
FYSO_TEAMS_PAYMENT_SMOKE=1 \
FYSO_TEAMS_SMOKE_EMAIL="smoke@example.com" \
FYSO_TEAMS_SMOKE_PASSWORD="..." \
bun run --cwd packages/api smoke:fyso-teams-payment
```

Creating a real Paddle transaction is intentionally separate:

```bash
FYSO_TEAMS_PAYMENT_SMOKE=1 \
FYSO_TEAMS_SMOKE_CREATE_CHECKOUT=1 \
FYSO_TEAMS_SMOKE_EMAIL="smoke@example.com" \
FYSO_TEAMS_SMOKE_PASSWORD="..." \
bun run --cwd packages/api smoke:fyso-teams-payment
```

Additional variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `FYSO_TEAMS_SOURCE_ID` | Fyso Teams source tenant UUID | Source app under test. |
| `FYSO_TEAMS_SMOKE_API_URL` | `https://api.fyso.dev/api` | Direct API base. |
| `FYSO_TEAMS_SMOKE_WORLD_URL` | `https://fyso.world` | Proxy host smoke target. |
| `FYSO_TEAMS_SMOKE_AUTH_API_URL` | `${FYSO_TEAMS_SMOKE_WORLD_URL}/api` | Authenticated API base. |
| `FYSO_TEAMS_SMOKE_EXPECT_ACTIVE_ENTITLEMENT` | unset | Set to `1` to assert the target has an active entitlement. |
| `FYSO_TEAMS_SMOKE_EXPECT_WEBHOOK_EVENTS` | unset | Set to `1` to assert Fyso Teams webhook events exist. |

Do not enable `FYSO_TEAMS_SMOKE_CREATE_CHECKOUT=1` unless the account and Paddle
environment are intended to create a real checkout transaction.
