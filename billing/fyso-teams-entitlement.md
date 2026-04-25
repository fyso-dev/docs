# Fyso Teams — App entitlements y suscripción Paddle

Esta página documenta el sistema de entitlements de pago introducido en v1.43.0.
Cubre el modelo de datos, los endpoints de auth, el routing de webhooks Paddle,
la máquina de estados D4 y la integración frontend (paywall + checkout overlay).

El scope de este documento es **Fyso Teams** (`sourceTenantId = 65422493-73d8-4e74-a879-defa3a9771f1`),
pero el sistema es genérico: cualquier app en `app_catalog` puede adoptar
`required_plan = 'paid'` siguiendo el mismo patrón.

---

## Modelo de datos

### `app_catalog` — columnas nuevas (migración 0085)

La tabla existente se extendió con 8 columnas para soportar configuración comercial por app.
Las filas anteriores (`freelancer`, `taller`, `tienda`) no cambian de comportamiento:
tienen `required_plan = 'free'` y `allow_free_instances = true` por defecto.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `source_tenant_id` | `UUID UNIQUE` | `NULL` | Identidad canónica del app como tenant publicador. Clave FK en `app_entitlements`. |
| `required_plan` | `TEXT` | `'free'` | Enum: `'paid' \| 'trial' \| 'free' \| 'freemium'` |
| `trial_config` | `JSONB` | `NULL` | Configuración de trial: `{ days, requireCardOnFile }` |
| `provider` | `TEXT` | `NULL` | Proveedor de pagos: `'paddle'` |
| `paddle_price_id` | `TEXT` | `NULL` | ID de precio Paddle (`pri_...`). Requerido si `provider = 'paddle'`. |
| `allow_free_instances` | `BOOLEAN` | `true` | Si `false`, bloquea creación de instancias sin entitlement activo. |
| `max_instances_per_entitlement` | `INTEGER` | `NULL` | Cuota de instancias por entitlement. `NULL` = ilimitado. |
| `display_price` | `JSONB` | `NULL` | Precio local para respuestas rápidas: `{ "amountUsd": 15, "billingInterval": "monthly" }` |

**Nota sobre `display_price`:** Paddle es la fuente de verdad del cobro real.
`display_price` es solo el dato local que los endpoints `402` devuelven en <50 ms
sin consultar Paddle en cada request. Editarlo manualmente si cambia el precio.

#### Índice

```sql
CREATE INDEX idx_app_catalog_source_tenant_id ON app_catalog(source_tenant_id);
```

---

### `app_entitlements` — tabla nueva (migración 0086)

Estado de suscripción por par `(org_id, source_tenant_id)`.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `org_id` | `UUID NOT NULL` | FK → `organizations(id) ON DELETE CASCADE` |
| `source_tenant_id` | `UUID NOT NULL` | FK → `app_catalog(source_tenant_id)` |
| `status` | `TEXT NOT NULL` | Enum (ver abajo) — default `'active'` |
| `provider` | `TEXT NOT NULL` | Default `'paddle'` |
| `paddle_subscription_id` | `TEXT UNIQUE` | UNIQUE garantiza idempotencia en webhooks |
| `paddle_customer_id` | `TEXT` | — |
| `current_period_end` | `TIMESTAMPTZ` | Vencimiento del período actual |
| `cancel_at_period_end` | `BOOLEAN NOT NULL` | Default `false` |
| `past_due_since` | `TIMESTAMPTZ` | Fecha de entrada a `past_due`; cron usa `past_due_since + 30d` para suspensión |
| `suspended_at` | `TIMESTAMPTZ` | — |
| `created_at` / `updated_at` | `TIMESTAMPTZ NOT NULL` | — |

**Clave de negocio:** `UNIQUE (org_id, source_tenant_id)` — una org tiene como máximo un entitlement por app.

#### Status enum

| Valor | Descripción |
|-------|-------------|
| `active` | Suscripción vigente |
| `active_until_period_end` | Usuario canceló; acceso hasta `current_period_end` |
| `past_due` | Período venció sin renovación; instancias bloqueadas (`is_active = false`) |
| `suspended` | 30 días en `past_due`; datos preservados 90 días |
| `refunded` | Chargeback o refund Paddle; bloqueo inmediato |

#### Índices

```sql
CREATE INDEX idx_app_entitlements_status ON app_entitlements(status);

-- Índice parcial: solo rows en estados activos → eficiente para el cron
CREATE INDEX idx_app_entitlements_period_end
  ON app_entitlements(current_period_end)
  WHERE status IN ('active', 'active_until_period_end', 'past_due');
```

---

### `paddle_webhook_events` — tabla nueva (migración 0087)

Idempotencia y auditoría de webhooks Paddle. Genérica — no exclusiva de Fyso Teams.

| Columna | Tipo | Notas |
|---------|------|-------|
| `event_id` | `TEXT PRIMARY KEY` | ID nativo de Paddle; PRIMARY KEY es la garantía de idempotencia |
| `event_type` | `TEXT NOT NULL` | Ej: `subscription.created` |
| `payload` | `JSONB NOT NULL` | Payload Paddle completo |
| `org_id` | `UUID` | Resuelto de `custom_data`; nullable |
| `source_tenant_id` | `UUID` | Resuelto de `custom_data`; nullable |
| `processed_at` | `TIMESTAMPTZ NOT NULL` | Fecha de primera recepción |
| `processing_error` | `TEXT` | No-null si el procesamiento de negocio falló post-recepción |

**Patrón de idempotencia:**

```sql
INSERT INTO paddle_webhook_events (event_id, event_type, payload, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (event_id) DO NOTHING;

-- rowCount = 1 → procesar evento
-- rowCount = 0 → ya procesado, responder 200 sin hacer nada
```

Paddle reintenta hasta 5 veces. Este patrón garantiza que cada evento se procesa exactamente una vez.

---

### Migraciones y `__extra_migrations`

Las migraciones 0085, 0086 y 0087 se rastrean via `__extra_migrations` (no en el journal Drizzle).
Razón: son migraciones SQL crudas que extienden tablas ya existentes; el workflow de Drizzle
`migrate()` solo aplica migraciones que no están en su journal. El sistema `__extra_migrations`
de fyso_backend aplica cualquier `.sql` en `/db/migrations/` que aún no haya sido ejecutado,
complementando a Drizzle sin conflicto.

---

## Seed — `seed-fyso-teams-app-catalog.ts`

El script inserta (o actualiza) la fila de Fyso Teams en `app_catalog` con configuración de pago.
Es idempotente: usa `ON CONFLICT (source_tenant_id) DO UPDATE`, por lo que re-ejecutarlo
actualiza `paddle_price_id` y `display_price` pero nunca duplica filas.

**Constantes:**

| Nombre | Valor |
|--------|-------|
| `FYSO_TEAMS_SOURCE_ID` | `65422493-73d8-4e74-a879-defa3a9771f1` |
| `required_plan` | `'paid'` |
| `allow_free_instances` | `false` |
| `max_instances_per_entitlement` | `1` |
| `display_price` | `{ "amountUsd": 15, "billingInterval": "monthly" }` |
| `paddle_price_id` | Valor de `PADDLE_FYSO_TEAMS_PRICE_ID` env var; default `pri_TBD_REPLACE_BEFORE_PROD` |

**Cómo ejecutar manualmente:**

```bash
npx tsx packages/db/migrations/seed-fyso-teams-app-catalog.ts
# o via runner:
bun run packages/db/migrations/seed-app-catalog.ts
```

El runner `seed-app-catalog.ts` ya incluye este seed; se ejecuta automáticamente en bootstrap.

---

## Variables de entorno

Nuevas claves en `.env.example` desde Wave 1:

```dotenv
# ID del precio Paddle para Fyso Teams (Products → Prices en el dashboard).
# Staging y producción usan entornos Paddle separados (Sandbox vs Production)
# pero comparten el mismo source_tenant_id UUID.
# DEBE reemplazarse antes del primer deploy a producción.
PADDLE_FYSO_TEAMS_PRICE_ID=pri_TBD_REPLACE_BEFORE_PROD

# UUID canónico del source tenant de Fyso Teams en app_catalog.
# Estable entre staging y producción.
FYSO_TEAMS_SOURCE_TENANT_ID=65422493-73d8-4e74-a879-defa3a9771f1
```

Si `PADDLE_FYSO_TEAMS_PRICE_ID` tiene el valor placeholder al arrancar, el proceso
emite una advertencia en consola pero no falla. Los checkouts fallarán en runtime
hasta que se configure el ID real.

---

## Endpoints

### Auth y resolución de org

Todos los endpoints de `/api/auth/app-entitlements/*` requieren `Authorization: Bearer <admin-session-token>`.

Si el admin pertenece a múltiples orgs, debe especificar la org objetivo:
- Via query param `?orgId=<uuid>` (GET)
- Via `body.orgId` (POST)
- Si tiene una sola org, se usa automáticamente
- Si tiene varias y no especifica: `400 ORG_REQUIRED`

---

### `GET /api/auth/app-entitlements/:sourceTenantId`

Consulta el estado del entitlement de la org del admin para una app distribuida.

**Path param:** `sourceTenantId` — UUID del source tenant

**Query param opcional:** `orgId` — UUID de la org (requerido si el admin tiene varias)

#### Respuesta — entitlement activo (`200`)

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

#### Respuesta — cancelado pero vigente (`200`)

```json
{
  "success": true,
  "data": {
    "status": "active_until_period_end",
    "active": true,
    "canCreateInstance": true,
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2026-05-25T00:00:00.000Z"
  }
}
```

#### Respuesta — past due (`200`)

```json
{
  "success": true,
  "data": {
    "status": "past_due",
    "active": false,
    "canCreateInstance": false,
    "pastDueSince": "2026-04-15T00:00:00.000Z"
  }
}
```

El campo `pastDueSince` está presente cuando `status = 'past_due'`.
Frontend calcula la fecha límite de reactivación como `pastDueSince + 30 días`.

#### Respuesta — sin entitlement (`200`)

```json
{
  "success": true,
  "data": {
    "status": "none",
    "active": false,
    "canCreateInstance": false,
    "currentPeriodEnd": null,
    "instancesUsed": 0,
    "instancesAllowed": 0
  }
}
```

#### Respuesta — app gratuita (`200`)

Si la app tiene `required_plan = 'free'` o `'freemium'`, el endpoint responde igual pero con:
- `status: "free"`
- `active: true`
- `canCreateInstance: true`
- `provider: null`

**Regla clave para el integrador:** leer siempre `canCreateInstance`, no `active`.
`canCreateInstance` ya consolida estado + cuota + toda la lógica de acceso.

---

### `POST /api/auth/app-entitlements/:sourceTenantId/checkout`

Crea una sesión de checkout Paddle para nueva suscripción o reactivación.

**Body:**

```json
{ "orgId": "<uuid>" }
```

`orgId` es opcional si el admin tiene una sola org.

#### Respuesta — checkout creado (`200`)

```json
{
  "success": true,
  "data": {
    "sourceTenantId": "65422493-73d8-4e74-a879-defa3a9771f1",
    "appKey": "fyso_teams",
    "provider": "paddle",
    "transactionId": "txn_01h...",
    "amountUsd": 15,
    "billingInterval": "monthly",
    "isReactivation": false
  }
}
```

`isReactivation = true` cuando ya existe entitlement en estado `suspended` o `refunded`.
Úsalo para diferenciar el copy del CTA ("Reactivar Fyso Teams" vs "Activar Fyso Teams").

**Metadata Paddle enviada en el checkout:**

```json
{
  "scope": "app_entitlement",
  "admin_id": "...",
  "org_id": "...",
  "source_tenant_id": "65422493-73d8-4e74-a879-defa3a9771f1",
  "app_key": "fyso_teams"
}
```

El campo `scope = 'app_entitlement'` es lo que el webhook handler usa para enrutar
el evento al servicio correcto.

---

### `POST /api/auth/tenants` — enforcement (modificado)

Cuando el body incluye `mode: 'instance'` y un `source_tenant_id` de app paid,
el endpoint valida el entitlement antes de crear la instancia.

**Body:**

```json
{
  "mode": "instance",
  "source_tenant_id": "65422493-73d8-4e74-a879-defa3a9771f1",
  "name": "Mi workspace"
}
```

#### `402` — suscripción requerida

```json
{
  "success": false,
  "error": "This app requires an active subscription.",
  "code": "APP_SUBSCRIPTION_REQUIRED",
  "appKey": "fyso_teams",
  "sourceTenantId": "65422493-73d8-4e74-a879-defa3a9771f1",
  "provider": "paddle",
  "amountUsd": 15,
  "billingInterval": "monthly",
  "checkoutUrl": "/api/auth/app-entitlements/65422493-73d8-4e74-a879-defa3a9771f1/checkout"
}
```

#### `409` — cuota agotada

```json
{
  "success": false,
  "error": "Instance quota reached for this app.",
  "code": "APP_INSTANCE_QUOTA_REACHED",
  "appKey": "fyso_teams",
  "sourceTenantId": "65422493-73d8-4e74-a879-defa3a9771f1",
  "instancesUsed": 1,
  "instancesAllowed": 1
}
```

**Regla:** nunca omitir el POST basándose en `canCreateInstance`. Siempre intentar la creación;
si llega `402`, redirigir al checkout. El servidor es la única fuente de verdad y evita
race conditions.

---

## Catálogo de error codes

| Code | HTTP | Endpoint(s) | Significado |
|------|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | todos | Token faltante o inválido |
| `ORG_REQUIRED` | 400 | GET, POST checkout | Admin con múltiples orgs sin especificar `orgId` |
| `APP_NOT_FOUND` | 404 | GET, POST checkout | `sourceTenantId` no existe en `app_catalog` |
| `APP_NOT_PAID` | 400 | POST checkout | App no requiere pago (no tiene `required_plan = 'paid'`) |
| `APP_NOT_CONFIGURED` | 500 | POST checkout | App existe en catálogo pero le falta `paddle_price_id` — gap operativo, no error del usuario |
| `ENTITLEMENT_ALREADY_ACTIVE` | 409 | POST checkout | La org ya tiene suscripción activa; redirigir a `/apps/fyso-teams` |
| `APP_SUBSCRIPTION_REQUIRED` | 402 | POST tenants | Bloqueo de creación de instancia; redirigir al checkout |
| `APP_INSTANCE_QUOTA_REACHED` | 409 | POST tenants | Tiene entitlement activo pero ya usó las instancias permitidas |

Frontend debe parsear `code`, no `error`. El texto de `error` puede cambiar; el code es contrato.

---

## Webhook Paddle — routing y eventos

### Enrutamiento en `routes/billing.ts`

`POST /api/webhooks/paddle` es el endpoint existente de webhooks Paddle.
Wave 2 lo extendió sin crear un nuevo endpoint:

1. Verifica firma HMAC-SHA256 (reusa `billingService.constructWebhookEvent`).
2. Parsea el body y lee `data.custom_data.scope`.
3. Si `scope === 'app_entitlement'` → delega a `appEntitlementsService.handlePaddleEvent(rawEvent)`.
4. Cualquier otro evento → handler de billing existente sin cambios.

Post-verificación HMAC, el endpoint **siempre responde `200 OK`** — nunca 5xx por errores de negocio.
Los errores se loguean; los reintentos de Paddle no solucionan bugs del backend.

### Eventos manejados

| Evento Paddle | Transición / acción |
|---------------|---------------------|
| `subscription.created` | Upsert entitlement → `status = 'active'`, setea `current_period_end` |
| `subscription.updated` | Actualiza `current_period_end`, `cancel_at_period_end` si cambió |
| `subscription.canceled` | Si `cancel_at_period_end = true` → `status = 'active_until_period_end'` (el cron T1 lo completará). Si `cancel_at_period_end = false` → `status = 'suspended'` + `setInstancesActive(false)` inmediato |
| `transaction.completed` | Bumpa `current_period_end`; si venía de `past_due` → `status = 'active'` |
| `adjustment.created` | `status = 'refunded'` + `setInstancesActive(false)` inmediato |

### Idempotencia

```
INSERT INTO paddle_webhook_events (...) ON CONFLICT (event_id) DO NOTHING
→ 1 fila insertada: procesar
→ 0 filas insertadas: ya procesado, responder 200
```

---

## Máquina de estados D4 (Fase 1)

```
          none
           │
           ▼ subscription.created / transaction.completed
        ┌──────┐
        │active│◄────────────────────────────────────────────┐
        └──┬───┘                                             │
           │ subscription.canceled (cancel_at_period_end=true)│ transaction.completed
           ▼                                                  │  (reactivación)
  ┌──────────────────────┐                                   │
  │active_until_period_end│                                  │
  └──────────┬────────────┘                                  │
             │ cron T1: current_period_end < NOW()           │
             ▼                                               │
         ┌─────────┐                                         │
         │past_due │─────────────────────────────────────────┘
         └────┬────┘
              │ cron T2: past_due_since + 30d < NOW()
              ▼
         ┌─────────┐
         │suspended│
         └────┬────┘
              │ reactivación (nuevo checkout)
              └──────────────────────────────► active

  adjustment.created (refund/chargeback) desde cualquier estado:
         ┌─────────┐
         │refunded │
         └─────────┘
```

**Cancelación directa** (`cancel_at_period_end = false`): va directo a `suspended`, omitiendo
el período de gracia `active_until_period_end`.

**Relación con `tenants.is_active`:** `past_due` y `suspended` ambos setean `tenants.is_active = false`
(mecanismo existente de bloqueo de instancias). La diferencia visible está en el entitlement:
`past_due` permite reactivación con un click (renovar pago vía Paddle); `suspended` requiere
un nuevo checkout. Esta es la Fase 1; la Fase 2 introducirá read-only granular para `past_due`.

---

## Cron — transiciones in-process

`startEntitlementTransitionsCron()` corre en `packages/api/src/index.ts` con intervalo de **1 hora**.

**Transición T1 — `active_until_period_end` → `past_due`:**
- Condición: `status = 'active_until_period_end' AND cancel_at_period_end = true AND current_period_end < NOW()`
- Acción: `status = 'past_due'`, `past_due_since = NOW()`, `setInstancesActive(false)`

**Transición T2 — `past_due` → `suspended`:**
- Condición: `status = 'past_due' AND past_due_since < NOW() - INTERVAL '30 days'`
- Acción: `status = 'suspended'`, `suspended_at = NOW()`, `setInstancesActive(false)` (idempotente)

El cron es idempotente y tiene aislamiento de errores por fila: una fila que falla no aborta el batch.

---

## Integración frontend (Wave 3)

### Ruta `/apps/fyso-teams`

La página tiene 5 estados excluyentes (`PageState`):

| Estado | Cuándo se muestra |
|--------|------------------|
| `paywall` | `canCreateInstance = false` y sin suscripción activa |
| `polling` | Post-checkout, esperando webhook |
| `create` | `canCreateInstance = true` |
| `quota_reached` | `canCreateInstance = false` con suscripción activa (cuota agotada) |
| `error` | Error al cargar el entitlement |

### Banners de estado

| Condición | Banner |
|-----------|--------|
| `status = 'active_until_period_end'` | "Tu suscripción termina el {currentPeriodEnd}" |
| `status = 'past_due'` | "Pago pendiente. Reactivá antes de {pastDueSince + 30d}" |
| `status = 'suspended'` | "Tu suscripción está suspendida" + CTA "Reactivar suscripción" |

### Paddle.js — checkout overlay

Paddle.js se inicializa una vez en mount con `Initialize({ token })`.
El `eventCallback` se pasa **por checkout** en `Checkout.open`, no en `Initialize`:

```ts
import { openPaddleCheckoutWithCallback } from '@/lib/paddle';

openPaddleCheckoutWithCallback(transactionId, (event) => {
  if (event.name === 'checkout.completed') {
    startPolling();
  }
});
```

Este patrón evita re-inicializar Paddle en cada checkout (bug que impedía que
`checkout.completed` disparara).

### Polling post-checkout

```ts
const POLLING_INTERVAL_MS = 2_000;   // cada 2s
const POLLING_TIMEOUT_MS  = 60_000;  // máximo 60s

// Si timeout: mostrar SlowConfirmModal
// "Estamos confirmando tu pago. Recibirás un email cuando tu suscripción esté activa."
```

### Redirecciones de `402` / `409`

`POST /api/auth/tenants` que devuelve `402 APP_SUBSCRIPTION_REQUIRED` hace que la página
recargue el entitlement y vuelva al estado `paywall`.

`409 APP_INSTANCE_QUOTA_REACHED` pasa el estado a `quota_reached`.

### i18n

- Namespace: `fysoteams` en `packages/web/messages/en.json` y `es.json`
- Clave nueva transversal: `common.retry` agregada en ambos archivos

---

## Flujo completo — compra inicial

```
1. Admin entra a /apps/fyso-teams
   → GET /api/auth/app-entitlements/65422493-... → active=false
   → pageState = 'paywall'

2. Click "Activar Fyso Teams"
   → POST /api/auth/app-entitlements/65422493-.../checkout
   → recibe transactionId

3. Paddle.Checkout.open({ transactionId, eventCallback })
   → usuario paga en overlay Paddle

4. eventCallback({ name: 'checkout.completed' })
   → pageState = 'polling'
   → polling cada 2s de GET /api/auth/app-entitlements/65422493-...

5. Webhook subscription.created llega al backend
   → entitlement creado con status='active'

6. Polling detecta active=true
   → pageState = 'create'

7. Admin crea instancia
   → POST /api/auth/tenants { mode: 'instance', source_tenant_id: '65422493-...', name: '...' }
   → 201 → redirige a /dashboard
```

---

## Compatibilidad

- `POST /api/auth/register` y Google login: sin cambios.
- Apps con `required_plan != 'paid'`: no afectadas por el enforcement.
- Apps gratuitas existentes: ningún cambio en comportamiento.
