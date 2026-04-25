---
title: App Entitlements (Paddle)
sidebar_position: 5
---

# App Entitlements — Fyso Teams

Fyso supports paid distributed apps via a per-org entitlement system backed by Paddle.
**Fyso Teams** (`sourceTenantId = 65422493-73d8-4e74-a879-defa3a9771f1`) is the first
app to use this system: creating an instance requires an active monthly subscription
(USD 15/mo) purchased through a Paddle overlay before the instance can be created.

The system is generic — any app in `app_catalog` can adopt `required_plan = 'paid'`.

---

## Quick reference

| | |
|--|--|
| Source tenant ID | `65422493-73d8-4e74-a879-defa3a9771f1` |
| App key | `fyso_teams` |
| Provider | Paddle |
| Price | USD 15 / month |
| Auth | `Authorization: Bearer <admin-session-token>` |
| Base URL | `https://api.fyso.dev` |

---

## Schema

### `app_catalog` — new columns

Eight columns added to the existing table (migration 0085). Apps already in the catalog
default to `required_plan = 'free'` with no behavior change.

| Column | Type | Description |
|--------|------|-------------|
| `source_tenant_id` | `UUID UNIQUE` | Canonical app identity. FK for `app_entitlements`. |
| `required_plan` | `TEXT` | `'paid' \| 'trial' \| 'free' \| 'freemium'` (default `'free'`) |
| `trial_config` | `JSONB` | `{ days, requireCardOnFile }` |
| `provider` | `TEXT` | `'paddle'` or null |
| `paddle_price_id` | `TEXT` | Paddle price ID (`pri_...`). Required when `provider = 'paddle'`. |
| `allow_free_instances` | `BOOLEAN` | If `false`, blocks instance creation without active entitlement. Default `true`. |
| `max_instances_per_entitlement` | `INTEGER` | Instance quota per entitlement. `null` = unlimited. |
| `display_price` | `JSONB` | `{ "amountUsd": 15, "billingInterval": "monthly" }` — local cache for fast `402` responses. |

`display_price` is **not** the billing source of truth. Paddle is. Edit `display_price` manually when pricing changes.

### `app_entitlements` — new table

Subscription state per `(org_id, source_tenant_id)` pair (migration 0086).

One entitlement per org per app — enforced by `UNIQUE (org_id, source_tenant_id)`.

#### Status enum

| Status | Access | Description |
|--------|--------|-------------|
| `active` | Full | Subscription current |
| `active_until_period_end` | Full | User cancelled; access until `current_period_end` |
| `past_due` | Blocked | Period expired without renewal; instances set to `is_active = false` |
| `suspended` | Blocked | 30 days in `past_due`; data preserved 90 days |
| `refunded` | Blocked | Chargeback or Paddle refund; blocked immediately |

### `paddle_webhook_events` — new table

Idempotency and audit log for inbound Paddle events (migration 0087).

Keyed by `event_id` (Paddle's own ID). Pattern:

```sql
INSERT INTO paddle_webhook_events (...) ON CONFLICT (event_id) DO NOTHING;
-- 1 row inserted → process event
-- 0 rows inserted → already processed, return 200 without reprocessing
```

Paddle retries up to 5 times. This table ensures each event is processed exactly once.

### Why `__extra_migrations`?

Migrations 0085–0087 are tracked via the `__extra_migrations` system, not the Drizzle journal.
They extend tables already known to Drizzle; `__extra_migrations` applies raw SQL files
that are not in the Drizzle journal, complementing it without conflict.

---

## Seed

`seed-fyso-teams-app-catalog.ts` inserts (or updates) the Fyso Teams row in `app_catalog`.
Idempotent: uses `ON CONFLICT (source_tenant_id) DO UPDATE`.

| Constant | Value |
|----------|-------|
| `FYSO_TEAMS_SOURCE_ID` | `65422493-73d8-4e74-a879-defa3a9771f1` |
| `required_plan` | `'paid'` |
| `allow_free_instances` | `false` |
| `max_instances_per_entitlement` | `1` |
| `display_price` | `{ "amountUsd": 15, "billingInterval": "monthly" }` |
| `paddle_price_id` | From `PADDLE_FYSO_TEAMS_PRICE_ID` env var |

```bash
# Run manually (or via seed-app-catalog.ts runner on bootstrap):
npx tsx packages/db/migrations/seed-fyso-teams-app-catalog.ts
```

---

## Environment variables

```dotenv
# Paddle price ID for Fyso Teams (Products → Prices in the Paddle dashboard).
# Staging and production use separate Paddle environments but share the same UUID.
# MUST be set before the first production checkout.
PADDLE_FYSO_TEAMS_PRICE_ID=pri_TBD_REPLACE_BEFORE_PROD

# Canonical source tenant UUID for Fyso Teams in app_catalog.
FYSO_TEAMS_SOURCE_TENANT_ID=65422493-73d8-4e74-a879-defa3a9771f1
```

If `PADDLE_FYSO_TEAMS_PRICE_ID` holds the placeholder value at startup, the process emits
a warning but does not fail. Checkouts will fail at runtime until the real ID is configured.

---

## Auth and org resolution

All `/api/auth/app-entitlements/*` endpoints require `Authorization: Bearer <admin-session-token>`.

Org resolution for admins with multiple orgs:

1. Pass `?orgId=<uuid>` (GET) or `body.orgId` (POST).
2. If the admin has only one org, it is used automatically.
3. Multiple orgs + no `orgId` → `400 ORG_REQUIRED`.

---

## Endpoints

### `GET /api/auth/app-entitlements/:sourceTenantId`

Returns the entitlement state for the calling admin's org.

**Key rule:** always read `canCreateInstance`, not `active`. It consolidates status,
quota, and all access logic. Never branch on `active` alone.

**200 — active subscription:**

```json
{
  "success": true,
  "data": {
    "sourceTenantId": "65422493-73d8-4e74-a879-defa3a9771f1",
    "appKey": "fyso_teams",
    "active": true,
    "canCreateInstance": true,
    "provider": "paddle",
    "status": "active",
    "currentPeriodEnd": "2026-05-25T00:00:00.000Z",
    "cancelAtPeriodEnd": false,
    "instancesUsed": 0,
    "instancesAllowed": 1
  }
}
```

**200 — cancelled but still valid (`active_until_period_end`):**

Same shape with `status: "active_until_period_end"`, `cancelAtPeriodEnd: true`,
`active: true`, `canCreateInstance: true`.

**200 — past due:**

`status: "past_due"`, `active: false`, `canCreateInstance: false`.
Includes `pastDueSince` field. Frontend deadline = `pastDueSince + 30 days`.

**200 — no entitlement:**

`status: "none"`, `active: false`, `canCreateInstance: false`.

---

### `POST /api/auth/app-entitlements/:sourceTenantId/checkout`

Creates a Paddle checkout session for a new subscription or reactivation.

**Body:** `{ "orgId": "<uuid>" }` (optional if single org)

**200 — checkout created:**

```json
{
  "success": true,
  "data": {
    "transactionId": "txn_01h...",
    "provider": "paddle",
    "amountUsd": 15,
    "billingInterval": "monthly",
    "isReactivation": false
  }
}
```

`isReactivation: true` when existing entitlement is in `suspended` or `refunded` state.
Use it to show "Reactivate Fyso Teams" vs "Activate Fyso Teams".

Pass `transactionId` to `Paddle.Checkout.open` — do not open a new Paddle price session.

---

### `POST /api/auth/tenants` — enforcement

When `mode = 'instance'` and the source app has `required_plan = 'paid'`,
the backend validates the entitlement before creating the instance.

**402 — subscription required:**

```json
{
  "success": false,
  "code": "APP_SUBSCRIPTION_REQUIRED",
  "appKey": "fyso_teams",
  "sourceTenantId": "65422493-73d8-4e74-a879-defa3a9771f1",
  "provider": "paddle",
  "amountUsd": 15,
  "billingInterval": "monthly",
  "checkoutUrl": "/api/auth/app-entitlements/65422493-73d8-4e74-a879-defa3a9771f1/checkout"
}
```

**409 — quota reached:**

```json
{
  "success": false,
  "code": "APP_INSTANCE_QUOTA_REACHED",
  "instancesUsed": 1,
  "instancesAllowed": 1
}
```

**Rule:** always attempt `POST /tenants`; never skip it based on a prior `canCreateInstance` check.
The server is the single source of truth and avoids race conditions.

---

## Error codes

Parse `code`, not `error` (text may change between releases; codes are the contract).

| Code | HTTP | Endpoint | Meaning |
|------|------|----------|---------|
| `UNAUTHORIZED` | 401 | all | Missing or invalid token |
| `ORG_REQUIRED` | 400 | GET, POST checkout | Admin has multiple orgs but did not specify `orgId` |
| `APP_NOT_FOUND` | 404 | GET, POST checkout | `sourceTenantId` not in `app_catalog` |
| `APP_NOT_PAID` | 400 | POST checkout | App does not require payment |
| `APP_NOT_CONFIGURED` | 500 | POST checkout | App exists in catalog but `paddle_price_id` is missing — ops gap, not a user error. Check `PADDLE_FYSO_TEAMS_PRICE_ID`. |
| `ENTITLEMENT_ALREADY_ACTIVE` | 409 | POST checkout | Org already has an active subscription; redirect to `/apps/fyso-teams` |
| `APP_SUBSCRIPTION_REQUIRED` | 402 | POST tenants | Instance creation blocked; redirect to checkout |
| `APP_INSTANCE_QUOTA_REACHED` | 409 | POST tenants | Has active entitlement but already at instance limit |

---

## Paddle webhook routing

`POST /api/webhooks/paddle` (the existing endpoint) was extended in Wave 2.
No new endpoint was created.

After HMAC-SHA256 verification:

1. Read `data.custom_data.scope` from the raw JSON body.
2. If `scope === 'app_entitlement'` → delegate to `appEntitlementsService.handlePaddleEvent()`.
3. All other events → existing billing handler, unchanged.

After HMAC validates, the endpoint **always returns `200 OK`** — never 5xx on business errors.
Errors are logged; Paddle retries do not resolve backend bugs.

### Events handled

| Paddle event | Transition / action |
|---|---|
| `subscription.created` | Upsert entitlement → `status = 'active'`, set `current_period_end` |
| `subscription.updated` | Update `current_period_end`, `cancel_at_period_end` if changed |
| `subscription.canceled` | `cancel_at_period_end = true` → `status = 'active_until_period_end'`; `cancel_at_period_end = false` → `status = 'suspended'` + block instances immediately |
| `transaction.completed` | Bump `current_period_end`; if from `past_due` → `status = 'active'` |
| `adjustment.created` | `status = 'refunded'` + block instances immediately |

---

## State machine

```
        ┌────────────────────────────────────────────────┐
        ▼                                                │ transaction.completed
     ┌──────┐                                            │ (reactivation)
     │active│                                            │
     └──┬───┘                                            │
        │ subscription.canceled                          │
        │ (cancel_at_period_end=true)                    │
        ▼                                                │
  ┌───────────────────────┐                              │
  │ active_until_period_end│                             │
  └──────────┬────────────┘                              │
             │ cron T1: current_period_end < NOW()       │
             ▼                                           │
         ┌─────────┐                                     │
         │past_due │─────────────────────────────────────┘
         └────┬────┘
              │ cron T2: past_due_since + 30d < NOW()
              ▼
         ┌─────────┐
         │suspended│─────── new checkout ──────► active
         └─────────┘

  adjustment.created (any state) ──────► refunded
  subscription.canceled (cancel_at_period_end=false) ──► suspended (direct)
```

`past_due` and `suspended` both set `tenants.is_active = false`, using the existing
instance-blocking mechanism. Phase 2 (future) will introduce granular read-only mode for `past_due`.

---

## Cron — in-process state transitions

`startEntitlementTransitionsCron()` runs in `index.ts` at a **1-hour interval**.

**T1 — `active_until_period_end` → `past_due`:**
condition: `cancel_at_period_end = true AND current_period_end < NOW()`

**T2 — `past_due` → `suspended`:**
condition: `past_due_since < NOW() - INTERVAL '30 days'`

Both transitions are idempotent with per-row error isolation.

---

## Frontend integration

### Route `/apps/fyso-teams`

Five exclusive page states:

| State | When |
|-------|------|
| `paywall` | `canCreateInstance = false`, no active subscription |
| `polling` | Post-checkout, waiting for webhook |
| `create` | `canCreateInstance = true` |
| `quota_reached` | `canCreateInstance = false` with active subscription (quota exhausted) |
| `error` | Failed to load entitlement |

### Status banners

| Condition | Banner |
|-----------|--------|
| `status = 'active_until_period_end'` | "Your subscription ends on {currentPeriodEnd}" |
| `status = 'past_due'` | "Payment pending. Reactivate before {pastDueSince + 30d}" |
| `status = 'suspended'` | "Your subscription is suspended" + "Reactivate subscription" CTA |

### Paddle.js checkout overlay

Initialize once on mount (no `eventCallback` in `Initialize`).
Pass `eventCallback` per-checkout via `Checkout.open`:

```ts
Paddle.Checkout.open({
  transactionId: response.data.transactionId,
  eventCallback: (event) => {
    if (event.name === 'checkout.completed') {
      startPolling();
    }
  }
});
```

Passing `eventCallback` in `Initialize` instead of `Checkout.open` is a known bug
that prevents `checkout.completed` from firing.

### Post-checkout polling

```
interval: 2 s
timeout:  60 s
on timeout: show SlowConfirmModal
  → "We are confirming your payment. You will receive an email when your subscription is active."
```

### i18n

Namespace `fysoteams` in `packages/web/messages/en.json` and `es.json`.
Cross-namespace key `common.retry` added in both files.

---

## Full purchase flow

```
1. Admin opens /apps/fyso-teams
   GET /api/auth/app-entitlements/:id → active=false → pageState='paywall'

2. Click "Activate Fyso Teams"
   POST /api/auth/app-entitlements/:id/checkout → { transactionId }

3. Paddle.Checkout.open({ transactionId, eventCallback })
   User completes payment in Paddle overlay

4. eventCallback({ name: 'checkout.completed' }) fires
   → pageState='polling'
   → poll GET /api/auth/app-entitlements/:id every 2s

5. Paddle sends subscription.created webhook
   → entitlement created with status='active'

6. Polling detects active=true → pageState='create'

7. Admin creates instance
   POST /api/auth/tenants { mode:'instance', source_tenant_id:'65422493-...', name:'...' }
   → 201 → redirect to /dashboard
```
