## v1.38.0 — 2026-03-23

### Features — Agent Messaging
- **`_agent_messages` system entity** — Tenant-scoped inbox table for agent-to-agent communication. Created automatically in every tenant schema.
- **Messaging actions in `fyso_agents`** — Five new MCP actions: `send_message`, `inbox`, `read_message`, `archive_message`, `count_unread`. See [Agent Messaging](./agents/messaging.md).
- **Agent name fuzzy resolution** — `send_message` resolves partial names: `"cero"` auto-resolves to `"cero-a3f2c1"` if unique. Returns candidates list when ambiguous.
- **Auto-run on message** — Setting `auto_run: true` on a message triggers the recipient Fyso agent immediately in the background. Fire-and-forget; HTTP response returns before the run completes.
- **Chain depth limit** — Auto-run chains halt at 5 hops. The 6th message is left as `pending` and a `message.chain_limit` SSE event is emitted.

### Features — External Agent Identity
- **`.fyso-agent` file + registration handshake** — External agents (e.g. Claude Code) can register a persistent identity with `POST /api/v1/tenants/:slug/agents/register`. The `agent_id` is stored in `.fyso-agent` and used to subscribe to incoming messages via SSE. See [External Agent Identity](./agents/external-identity.md).
- **Reconnect validation** — `POST /agents/reconnect` validates a stored `agent_id` and updates `last_seen_at`. Returns `AGENT_NOT_FOUND` if the file is stale.

### Features — SSE and Event Bus
- **`TriggeredBy` field** — All `record.*` events now include `data.triggered_by`: `mcp`, `api`, `flow`, `webhook`, `ui`, `rule`, or `system`.
- **Rule events** — `rule.executed` and `rule.failed` events stream via SSE after every `after_save` rule execution.
- **`?events=` filter** — SSE connections can filter by event type: `?events=record.created,rule.executed`. Omit for all types.
- **`?agent_id=` filter** — SSE connections can subscribe to incoming agent messages by passing `agent_id` from `.fyso-agent`.
- **Event bus coverage** — All CRUD paths (including the agent runner) now emit events.

### Features — Developer Experience
- **`forceDebug` in agent test UI** — Debug info is always visible in the agent test panel, regardless of the `ai.debug` tenant setting.
- **`create_api_key` in `fyso_auth`** — Create a tenant API key from an MCP session. The full key is returned once only.

### Fixes
- **DB connection pool** — `max_lifetime` set to 240 s, `keep_alive` enabled at 10 s. Prevents `CONNECTION_CLOSED` errors under high load.
- **SSE stability** — Accepts both `fyso_pkey_*` and legacy `fyso_ak_*` keys. Sends immediate `connected` event on open to prevent proxy timeout. `idleTimeout` set to 255 s via `Bun.serve`. `X-Accel-Buffering: no` header disables Nginx proxy buffering.
- **UUID guard** — `findById`/`findByIds` now reject non-UUID strings before hitting the database, preventing `PostgresError` from LLM tool calls.

---

## v1.37.0 — 2026-03-20

### Features — Channels Fase 1
- **In-process event bus** — Tenant-scoped EventEmitter for CRUD events. Emits `record.created`, `record.updated`, `record.deleted` from all write paths.
- **SSE endpoint** — `GET /api/v1/tenants/:slug/events/stream` — persistent Server-Sent Events stream for tenant events. See [SSE Event Stream](./api/sse-events.md).
- **`/fyso:listen` skill** — Claude Code skill that bridges the SSE stream to a Claude Code channel.

### Features
- **Unified login** — The tenant workspace field on the login page expands inline; `/login/tenant` removed.
- **`create_api_key` in `fyso_auth`** — Backported to v1.37; creates a tenant API key from MCP.

### Fixes
- **Org invitation email** — Invitation email is now sent when inviting a user to an org.
- **Stale chunk auto-reload** — `ChunkLoadError` after a deploy now triggers an automatic page reload.
- **UUID guard on record lookups** — Non-UUID ids from LLM tool calls no longer reach the database.
- **i18n dynamic keys** — `bulk_tab_files` and `bulk_tab_urls` translation keys now expand correctly.
- **SSE proxy hardening** — `fyso_pkey_*` keys accepted; immediate `connected` event; 255 s idle timeout; `X-Accel-Buffering: no`.

### Cleanup
- **Dead invitation code removed** — `invitation_codes` table and `platform_invitations` table deleted (−1,094 lines). Beta access is now controlled via the admin panel directly.

---

## v1.36.3 — 2026-03-19

### Fixes
- **Server startup guard** — Missing `SECRETS_ENCRYPTION_KEY` now causes an immediate fatal error with a clear message and the generation command, instead of silently hanging.
- **Org UX** — Fixed org switcher navigation, plan expiry display, role badge rendering, and personal org name disambiguation.

---

## v1.36.2 — 2026-03-19

### Fixes
- **Org invitation acceptance** — Inviting an existing user now creates a pending invitation instead of auto-adding them. Membership is granted only after the user accepts.
- **Org UI scroll** — Content below the fold on org pages is now reachable.

---

## v1.36.1 — 2026-03-19

### Features
- **`POST /api/orgs/invitations/:token/accept`** — New authenticated endpoint for accepting org invitations.

### Fixes
- **Org invitation acceptance** — Inviting an existing user creates a pending invitation instead of auto-adding them.
- **Personal org names** — Personal orgs show the owner name for disambiguation (`"Personal (slug)"` for other admins' orgs).
- **Owner/member badges** — Crown and Users icons in the org and tenant switcher.
- **Dashboard scroll** — Content below the fold is reachable.

---

## v1.36.0 — 2026-03-19

### Features — Organizations
- **Organization layer** — Orgs sit between admin users and tenants (similar to Supabase projects/teams). Every admin gets a personal org on signup; existing users were migrated automatically.
- **Billing on org** — Plans (`Free`, `Pro`, `Beta`, `Enterprise`) moved from admin user to org. Quota enforcement reads from org plan.
- **Multi-org support** — Admins can create multiple orgs and switch between them via the top-left switcher.
- **Org invitations** — Invite collaborators to an org by email. Invited admins get access to all tenants in that org. Free plan: no invitations. Pro+: unlimited.
- **New MCP tools** — `list_orgs`, `create_org`, `invite_to_org`, `list_org_members` actions added to `fyso_auth`. See [Organizations](./admin/organizations.md).
- **New REST endpoints** — Full CRUD under `/api/orgs` plus members and invitations. See [Organizations](./admin/organizations.md).

### Frontend
- **Org+Tenant switcher** — Hierarchical dropdown in TopNav: org list with collapsible tenant groups.
- **Organization sidebar group** — Members, Billing, and Org Settings pages under a new sidebar section.
- **Members page** (`/org/members`) — Invite by email, manage roles, revoke pending invitations.
- **Billing page moved** — `/billing` redirects to `/org/billing`.
- **Org Settings** (`/org/settings`) — Name, slug, delete org (owner only).
- **Invitation accept page** (`/signup/org-invite`) — Register or log in to join an org.

### Breaking changes
- `POST /api/auth/tenants` accepts `org_id` in the body. If omitted, defaults to the personal org.
- `/billing` redirects to `/org/billing`.
- `admin_users.plan` is deprecated — read from `organizations.plan` via org membership. Billing webhooks dual-write during the transition period.

---

## v1.34.0 — 2026-03-17

### Features
- **Multi-user tenant admin** — Tenant owners can invite users with specific roles. Invitation flow carries the assigned role. Includes role assignment audit log, admin action attribution, and tenant-user login via `/login/tenant`.
- **resolve_depth on single record** — `GET /entities/:name/records/:id?resolve_depth=1` now resolves relations without needing `?resolve=true`. Max depth aligned to 2 across all endpoints.
- **Agent retry on rate limit** — Agent runner retries with exponential backoff when the AI provider returns 429 (rate limited).

### Fixes
- **Consistent 429 error shape** — Rate limit middleware now returns a standard `{ error: "RATE_LIMITED", ... }` response across all endpoints.
- **Stable record ordering** — Records query adds a secondary sort key (`id`) to prevent non-deterministic ordering when multiple records share the same sort field value.
- **Agent run authentication** — Agent run endpoint now accepts both session tokens and API keys, not just admin tokens.
- **Agent creation warning** — Creating an agent when no AI provider is configured returns a warning in the response instead of failing silently at run time.
- **MCP `select_tenant` fuzzy match** — `select_tenant` now tries prefix matching when no exact slug match is found. Auto-selects if exactly one match; lists candidates if multiple.
- **`generate_business_rule` removed** — The unreliable NL-to-DSL tool has been removed. Use `create_business_rule` with agent-generated DSL instead.

---

## v1.33.2 — 2026-03-15

### Security
- **AI debug payload gated** — `debug_payload` in AI responses is now hidden behind the `ai.debug` tenant setting. Disabled by default in production.

### Fixes
- **REST API filters** — `?filters=field = value` now correctly filters records on list endpoints. AND compound filters also work.
- **REST API resolve_depth** — `?resolve_depth=1` correctly resolves relations on list endpoints.
- **Business rule field validation** — Field references in rule DSL are validated against the entity schema at publish time, preventing silent failures.

---

## v1.33.1 — 2026-03-15

### Features
- **Agent editor** — Agents editor now manages channels 1:N, prompt history with rollback, and multiple AI providers per agent.
- **AI cost dashboard** — New admin page showing AI spending by provider, model, and agent over time.
- **Prompt templates CRUD** — Create, edit, and delete reusable prompt templates from the admin panel.
- **Bulk document upload** — Drag-and-drop multiple files to upload to the knowledge base in one operation.
- **Integrations management page** — New admin page to manage registered integration instances (credentials, status, re-auth).
- **Visual business rules editor** — Drag-and-drop rule builder with support for AI call actions.

---

## v1.33.0 — 2026-03-15

### Breaking changes
- **Pure RBAC — legacy roles dropped** — Built-in role names are removed. Roles are now fully editable templates. One role per tenant can be flagged as `is_owner`. Existing role assignments are migrated automatically; custom role configurations are preserved.

### Features
- **Agent channels 1:N** — Each agent can be connected to multiple channels simultaneously (web widget, Telegram, etc.).
- **AI rate limiting and budget enforcement** — Tenant-level and agent-level token budgets with hard limits and soft alerts.
- **Prompt versioning with rollback** — Every prompt change is saved as a version. Roll back to any previous version from the agent editor.
- **SSE streaming for channels** — Agent replies stream token-by-token via Server-Sent Events. Telegram shows typing indicators.
- **Multiple AI providers per tenant** — Add multiple provider configurations (OpenAI, Anthropic, or any OpenAI-compatible endpoint). The first active provider is used; configure priority/fallback chains.
- **Reusable prompt templates** — Define shared prompt templates across agents. Templates support field substitution via `{{field}}` syntax.
- **Industry presets** — One-click starter configurations for common business types: workshop (`taller`), clinic (`clínica`), store (`tienda`).
- **AI cost dashboard** — Real-time spend tracking by provider, model, and agent.
- **Telegram integration** — Telegram bot as a first-class integration plugin. Configure via the integrations page.
- **Bulk knowledge indexing** — Upload multiple documents at once; indexing runs in parallel with progress reporting.

---

## v1.32.0 — 2026-03-14

### Features
- **Integration SDK** — Third-party integrations can be built with `defineAction` / `validateManifest`. Integrations register with a credential store, a manifest registry, and a runtime executor.
- **Discord webhook integration** — Built-in integration to send messages to Discord channels. Configure once, use in business rules.
- **Agent MCP tools** — `fyso_agents` tool group: `list`, `create`, `update`, `delete`, `run`, `test`, `list_runs`, `list_versions`, `rollback`, `list_templates`, `from_template`.
- **Agent Runner** — Run agents programmatically with session tracking, run history, and version snapshots.
- **Knowledge base in Agent Runner** — Agents automatically use the tenant knowledge base for RAG retrieval during runs.
- **`create_tenant` MCP action** — Provision new tenants from an MCP session (superadmin).
- **`report_feedback` MCP tool** — Submit structured feedback from within an agent session.

---

## v1.31.0 — 2026-03-14

### Features
- **AI engine** — Fyso now includes a built-in AI engine. Configure AI provider adapters (OpenAI-compatible endpoints, Anthropic) from the admin panel. All AI calls are logged with model, tokens, latency, and cost.
- **AI budget and rate limiting** — Set monthly token budgets and per-minute rate limits per tenant. Budget estimator shows projected spend before enabling.
- **Execution context (`$ctx`)** — Business rules and AI actions share an inter-action variable context (`$ctx`). Pass data between rule steps without external storage.
- **Template engine** — Field substitution in prompts and rule actions using `{{field}}` syntax.
- **`ai_call` action type** — Business rules can now invoke an AI model as a rule action, with the response available in `$ctx`.
- **`webhook_send` action type** — Business rules can send HTTP webhooks as a rule action.
- **`test_ai_call` MCP tool** — Prompt playground: test any prompt against any configured provider and see full token/cost breakdown.
- **Agent runner infrastructure** — Internal agent sessions, runs, and tool-call tables. Foundation for v1.32 Agent Runner.
- **Semantic tool generator** — Agents auto-generate semantic descriptions of available tools from their `tools_scope` definition.
- **Agent test panel** — Live chat interface to test agents at `/agents/:id/test`, with run inspector (Summary, Flow, Steps, Raw tabs).
- **Agent memory** — Enable `memory_enabled: true` on an agent to extract and persist facts across conversations. Facts are injected into the system prompt on subsequent sessions.
- **GDPR compliance** — DPA acceptance, per-session AI consent, data suppression, and consent audit log. Endpoints: `POST /api/auth/tenants/:id/dpa-accept`, `POST /api/rgpd/sessions/:sessionId/consent`, `DELETE /api/rgpd/users/:externalRef/ai-data`.
- **Web widget** — Embed an agent as a floating chat bubble with a single `<script>` tag. Configurable title, color, and position.
- **Visual rules editor** — Drag-and-drop business rules editor at `/agents/:slug/rules` with template variable chips.
- **AI logs viewer** — `/agents/:slug/logs` shows run history with stats bar, filter panel, and per-run detail dialog.

---

## v1.30.0 — 2026-03-12

### Features
- **Bot identity — JWT with entity permissions** — `POST /api/auth/bots/identify` now returns a JWT carrying scoped entity permissions. The JWT is accepted by entity record endpoints (`requireTenantContext` middleware), with permissions enforced on every request — no admin bypass. Bots are revocation-checked on each request against `bot_identities`. (#953, #957)
- **Bot identity — extended schema** — `bot_identities` table gains `permissions`, `createdByUserId`, `createdByType` columns to support user-created bots with scoped permissions. (#954)
- **Bot self-registration by tenant users** — Tenant users can register bots scoped to their own tenant without admin involvement. Bot permissions must be a strict subset of the registering user's own permissions. Per-user limit: 5 active bots. (#959)

### Fixes
- **Paddle checkout returns transactionId** — Checkout response now includes `transactionId` for Paddle.js overlay flow. (#958)
- **Paddle CSP headers** — Added Paddle domains to Content-Security-Policy `connect-src` and `frame-src`. (#964)
- **Paddle.js overlay** — Checkout now uses the Paddle.js overlay instead of redirect, keeping users on the billing page. (#956)

---

## v1.29.0 — 2026-03-09

### Features
- **`fyso_welcome` MCP onboarding tool** — New MCP tool that proposes entity structures based on business type. Called by the Claude Code plugin on first connect to guide new users through setup. (#942)
- **Onboarding-first dashboard** — Dashboard now shows an MCP connection banner for new accounts that haven't connected an MCP client yet. (#941)
- **Single-tenant shortcut** — Users with access to only one tenant skip the tenant selector and are taken directly to their workspace. (#939)
- **Google login auto-provisioning** — First Google login now automatically creates an account and tenant, removing the need for a separate sign-up step. (#935)

### Fixes
- **Open registration** — Removed closed beta requirement; removed deprecated MCP tools. (#938)
- **`add_field` tool validation** — MCP tool now validates `fieldKey` and `fieldType` before sending to the API. (#927)

---

## v1.28.1 — 2026-03-08

### Fixes
- **PgListener crash loop** — `postgres.js .listen()` does not accept a third callback; the spurious argument triggered `handleConnectionLost()` immediately on connect, causing an infinite reconnect loop that crashed the container. Fixed using the `onclose` connection option. (#911)
- **Platform invitation links** — `window.location.origin` produced `fyso.dev` links when admin was on that domain. Now uses `VITE_APP_URL`, defaulting to `https://app.fyso.dev`. (#911)
- **Invitation accept pages** — Relative `/api/...` fetch paths don't resolve on Cloudflare Pages. Changed to `getApiUrl()`. (#911)
- **CSP blocking API calls** — Added `https://*.amazonlightsail.com`, `wss://*.amazonlightsail.com`, `wss://*.fyso.dev`, and `https://cloudflareinsights.com` to `connect-src`. (#911)
- **WebSocket platform key auth** — Platform API keys (`fyso_pkey_*`) now work for WebSocket connections with full RBAC enforcement (field and row filtering on broadcast). (#911)

---

## v1.28.0 — 2026-03-07

### Features
- **Real-time records via WebSocket** — Live table updates in the browser. PostgreSQL `pg_notify` triggers fire on INSERT/UPDATE/DELETE for all entity tables. A PgListener service subscribes on a dedicated connection; a SubscriptionManager routes events to WebSocket clients with RBAC field/row filtering. The `useRealtimeRecords` React hook handles reconnection with exponential backoff and React Query cache invalidation. Admins can enable/disable real-time per entity from settings. WebSocket endpoint: `wss://api.fyso.dev/ws`. See [WebSocket reference](/api/websocket). (#891–#909)

---

## v1.27.0 — 2026-03-07

### Features
- **Paddle payment provider** — Alternative to Stripe, switchable via `PAYMENT_PROVIDER=paddle`. Full implementation with HMAC-SHA256 webhook verification at `POST /api/webhooks/paddle`. (#883, #884)

### Refactoring
- **MCP tools consolidated** — 48 individual MCP tools replaced by 8 grouped tools (`fyso_data`, `fyso_schema`, `fyso_rules`, `fyso_auth`, `fyso_views`, `fyso_knowledge`, `fyso_deploy`, `fyso_meta`). Backward-compatible handlers retained. (#867, #868)
- **Channel/bot MCP tools removed** — Obsolete tools pruned; invitations grouped into `fyso_auth`. (#874)

### Security
- **API key TTL validation** — Reject NaN, Infinity, negative, and zero TTL values with 400 errors. (#889)
- **HTTP security headers** — CSP, X-Frame-Options, HSTS for Cloudflare Pages. (#870)

---

## v1.26.0 — 2026-03-04

### Breaking changes
- **REST API response format simplified** — Record data is now flat: `response.data.items[n].campo` instead of `response.data.data[n].data.campo`. `PaginatedResult.data` renamed to `PaginatedResult.items`. System fields (`id`, `entityId`, `createdAt`, etc.) are always present at the top level. Reserved field names (`id`, `entityId`, `name`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`) are rejected when creating entity fields.

### Fixes
- **`get_rest_api_spec` base URL** — MCP tool now uses `new URL().origin` instead of string replace; all curl examples include `X-Tenant-ID`. (#862)

---

## v1.25.0 — 2026-03-03

### Features
- **`$currentUser.email` and `$currentUser.name` in filterDsl** — Row-level filter conditions can now reference the authenticated user's email and name. Audit fields `created_by` and `updated_by` are set on record create/update. (#856)
- **`fyso_knowledge` search_docs action** — MCP agents can search Fyso platform documentation directly via the knowledge tool. (#859)

### Fixes
- **Record timestamps** — `created_at`/`updated_at` set explicitly on insert; no longer return null. (#855)
- **View slug reuse** — Deleted view slugs can now be reused. (#857)
- **Views routes error handling** — Routes wrapped in try-catch with DB connection safeguards. (#858)

---

## v1.24.0 — 2026-03-03

### Security
A hardening wave addressing 56 bugs found during an internal security review. Key fixes:

- **SQL row filter** — `== null` now generates `IS NULL`; rejects trailing tokens, unknown characters (semicolons, backticks), and undefined `$currentTenant`. (#811, #814, #816, #818)
- **RBAC** — Wildcard action `*` expands to all actions; multiple row filters from multiple roles are OR'd; `excludeFields` union follows correct union semantics. (#819, #821, #822)
- **Authorization** — Unknown required access level fails closed. (#823)
- **File storage** — Path traversal protection (rejects `..` and null bytes); cross-tenant access prevention. (#833, #834)
- **Session** — Deactivated users blocked at `validateSession`. (#826)
- **Audit logger** — Passwords, tokens, and secrets redacted from logs. (#836)
- **Billing** — SQL injection guard on tenant schema interpolation. (#825)

---

## v1.23.0 — 2026-03-02

### Security
- **SQL injection** — Parameterized queries in `metadata.service.ts`. (#720)
- **Secrets** — Removed hardcoded encryption key fallback. (#721)

### Features
- **Knowledge indexing observability** — Stats dashboard, reindex trigger, and worker status. (#679)

---

## v1.22.0 — 2026-03-01

### Features
- **Entity views UI** — Admin panel CRUD for views, plus a view records page with DynamicTable. (#740)
- **Configurable title field** — Entities can define which field appears as the record display name, with smart fallback. (#749)

### Fixes
- **MCP URL** — Fixed hardcoded URL; now uses `mcp.fyso.dev/mcp`. (#747)
- **MCP cleanup** — Removed dead public-keys MCP tools. (#746)

---

## v1.21.0 — 2026-03-01

### Features
- **Entity views — filtered projections with RBAC permissions** — Create named views on entities with filter DSL conditions (e.g., `reporter == $currentUser`). Each view has independent RBAC permissions using `view:<slug>` as the entity key. REST API: full CRUD at `/api/views` plus record access at `/api/views/:slug/records`. MCP tools: `create_view`, `list_views`, `update_view`, `delete_view`. View filters compose with query-string filters. Admin access bypasses user-scoped filters. 32 tests (10 integration + 22 E2E cross-validation). (#735, closes #746)

### Infrastructure
- **Static sites: Cloudflare R2 + Worker** — Static site hosting migrated from filesystem-based storage to Cloudflare R2 object storage served by a Cloudflare Worker. The `validate-domain` endpoint has been removed. (#731, closes #730)

### Chores
- **Remove PM2 and Caddy references** — Deleted legacy PM2 deploy workflow, `ecosystem.config.js`, health monitoring endpoints, and Caddy-related Makefile targets. Deployment docs updated for current Lightsail + Cloudflare architecture. (#736)

---

## v1.20.0 — 2026-03-01

### Features
- **Migrate Next.js to Vite + React Router PWA** — Replaced Next.js 16 with Vite 6 + React Router v7 + `vite-plugin-pwa`. 90% of pages were `'use client'` making SSR unnecessary. Build time reduced from ~45s to ~15s. 56 lazy-loaded routes. `next-intl` replaced by `react-i18next` (compat wrapper, zero call-site changes). `@sentry/nextjs` replaced by `@sentry/react`. All 11 Next.js API routes removed (frontend calls Hono backend directly). PWA with service worker for offline support and app install. (#719, closes #716)
- **Migrate static sites to Cloudflare R2 + Worker** — Static site hosting now uses Cloudflare R2 object storage + a Cloudflare Worker for serving, replacing the previous filesystem-based approach. Site assets are uploaded to R2 buckets; the Worker handles request routing. The `validate-domain` endpoint has been removed (CF Worker handles domain validation). Caddy sites block removed. (#731, closes #730)
- **MCP agent E2E improvements** — Extended E2E test suite for MCP agent interactions with improved reliability. (#724)

### Fixes
- **Docker cleanup in CI** — Added Docker image and layer pruning to CI pipelines to prevent runner disk exhaustion. (#726)
- **CI test improvements** — Improved test reliability and reduced flaky test failures in CI. (#728, #729)

---

## v1.19.0 — 2026-02-28

### Features
- **Knowledge base search enhancements, URL ingestion & tracking** — Search UI gains a precision slider, certainty progress bar (color-coded), fragments toggle, one-per-document filter, and a help modal. URL ingestion now fetches page content instead of storing the URL string, with HTML cleaning (strips nav, header, footer, aside, scripts). New events: `knowledge_ingest` (tokens, processing time), `knowledge_delete`, improved `knowledge_search` (embedding tokens). New `embedding_usage_30d` stats block. `one_per_document` filtering moved from client-side to SQL `DISTINCT ON`. MCP `search_knowledge` now supports `one_per_document` param with threshold default fixed to 0.3. (#701, closes #702)
- **Roles permission visibility** — Roles UI now displays the effective permissions for each role, including entity-level CRUD access, field visibility (whitelist/blocklist), and row-level filters. Admins can see at a glance what each role can access without inspecting raw JSON. (#705)
- **MCP agent E2E tests** — End-to-end test suite for MCP agent interactions, validating tool invocations against the live API. (#707)

### Fixes
- **XSS test update** — Updated XSS security tests to match current sanitization behavior. (#696)
- **CI migrated to `ubuntu-latest`** — GitHub Actions runners updated from pinned Ubuntu versions to `ubuntu-latest`. (#697)
- **Professional UI upgrade** — Visual polish and consistency improvements across the admin panel. (#700)

---

## v1.18.0 — 2026-02-28

### Features
- **User CRUD — edit modal, role assignment, password reset** — Admin panel now includes a user management interface with inline editing, role assignment dropdown, and password reset button. (#683)
- **User profile self-service** — Users can edit their own name, change their password, and view their assigned roles from a profile page. (#684)
- **Invitation email sending** — Invitations now include an email field and a send button that dispatches the invitation link via Resend. (#685)
- **Knowledge observability — indexing dashboard & unified search** — New dashboard showing document indexing status, chunk counts, and embedding progress. Unified search across all knowledge base documents. (#686)
- **RBAC audit log** — Role assignment and revocation events are now logged with timestamp, actor, and target user. Viewable in the admin panel. (#687)
- **Authenticated API keys — expanded scopes, rotate & auth callout** — API keys gain new scopes, key rotation support, and an authentication callout mechanism for external validation. (#688, closes #662)
- **Row-level filtering via `on_query` business rules** — New `on_query` trigger type for business rules compiles DSL conditions into SQL `WHERE` clauses at query time. Assign a `rowFilter` in a role's `EntityPermissionConfig` to link it to an `on_query` rule. Union semantics: if any of the user's roles grants unrestricted read access, no filter is applied. Custom expression parser (tokenizer + recursive-descent) generates type-safe Drizzle SQL. `!=` uses `IS DISTINCT FROM` for correct NULL handling. (#692, closes #676)
- **`has_many` relations with permission-aware cascading resolution** — New `has_many` field type for reverse one-to-many lookups (e.g., `factura` → `lineas` via `foreignKey`). `findById` now supports `?resolve=true&resolve_depth=N` query params for nested resolution. Cascading resolution respects per-entity RBAC: `rowFilter` (row-level), `fields` (whitelist), `excludeFields` (blocklist). If a user lacks `read` permission on a related entity, the field is omitted entirely. (#694, closes #677)

### Fixes
- **Missing Next.js API proxy routes** — Fixed auth flows and reset password routes that were not proxied correctly. (#682)
- **Role assignment via MCP validation** — Role assignment through MCP tools now goes through the same service-level validation as the REST API. (#690, closes #675)
- **Rate limit on invitation sends** — Invitations send endpoint is now rate-limited to prevent abuse. (#693)
- **n8n custom node integration fixes** — Resolved compatibility issues with the n8n community node. (#691, closes #638)

---

## v1.17.0 — 2026-02-24

### Features
- **Entity & field-level permissions for anonymous keys** — Anonymous API keys now support fine-grained access control via `entityPermissions`. Restrict a key to specific entities (unlisted entities return `403`) and exclude sensitive fields from all responses via `excludeFields`. Existing keys without `entityPermissions` retain unrestricted access (backwards compatible). (#651, closes #643)
- **Platform API Management with RBAC** — Named API definitions with configurable roles and a permission matrix (`entity × role → [read, create, update, delete]`). Issue `fyso_pkey_*` keys per role. `requirePlatformApiKey` middleware enforces the matrix on every request. Wildcard entity (`*`) grants access to all entities for a role. Full CRUD for API definitions plus key issuance and revocation. Completely independent from existing `fyso_ak_*` keys. (#656, closes #642)
- **Platform invitations — 5-invite quota for free accounts** — `platform_admin` users can invite up to 5 people to create free-tier accounts. Invitations use unique hex-64 tokens, expire in 7 days, and support full lifecycle management (create, list, revoke, validate, accept). Quota tracks active invitations; revocation frees a slot. Invitation email sent via Resend. 5 endpoints under `/api/platform/invitations`. (#637, closes #630)
- **GET /api/usage/storage — storage breakdown per tenant** — New endpoint returns a per-category storage breakdown: database (`pg_total_relation_size`, table count, estimated rows), knowledge base (bytes + document count), and bucket (bytes + file count). `total_bytes` is the sum across all categories. Bucket returns 0 in the current version; full S3 accounting is planned. (#655, closes #650)
- **i18n for PageHelp popup texts** — The `PageHelp` component now uses `next-intl` translations instead of a hardcoded `COPY` map. Added missing page keys (`roles`, `mcpConfig`, `webhooks`, `sites`) to both locale files. All 14 page keys render correctly in EN and ES. (#634, closes #632)
- **Cloudflare wildcard DNS for tenant subdomains** — Replaced Caddy with Cloudflare wildcard DNS (`*.fyso.dev`) + nginx for tenant subdomain routing. New `resolveHostTenant` middleware extracts tenant slug from the `Host` / `x-forwarded-host` header, skipping reserved subdomains and static-site paths. `requireTenantContext` uses `hostTenantSlug` as a fallback. nginx replaces Caddyfile; Cloudflare handles SSL termination. (#635, closes #633)

### Refactoring
- **Unified token and role system** — New `resolveToken` middleware classifies all incoming token types into a normalised `{tokenType, tokenRole}` descriptor. `ROLE_HIERARCHY` extended with `anonymous` (level 0). `requireRole()` reads `tokenRole` first, enabling consistent role enforcement across all token types. Token-to-role mapping: admin session/JWT and `fyso_ak_*` → `owner`; `anon_*` → `anonymous`; tenant user session → user's assigned role. All existing middleware remains unchanged. (#652, closes #644)

### Fixes
- **PDF generation: entity fallback from template** — `buildInputData` now uses `template.entidad_origen` as fallback when `entityName` is not passed in the API call. Fixes blank PDFs when `recordId` is provided without `entityName` (as the designer dialog does). (#653, closes #639)
- **PDF table plugin** — Added the `table` plugin from `@pdfme/schemas` to both the designer (frontend) and generator (backend). Table fields receive `array[][]` input instead of being stringified. (#653, closes #640, #641)
- **PDF binary upload to knowledge base** — New `POST /api/knowledge/documents/upload` endpoint accepts multipart/form-data with a `file` field (`application/pdf`, max 20 MB) and an optional `title`. Converts the buffer to base64 and delegates to `documentService.ingestDocument` for chunking and embedding. Also adds `api.knowledge.upload(file, title?)` client method. (#654, closes #648)

---

## v1.16.0 — 2026-02-23

### Features
- **Public keys replace anonymous keys** — Anonymous API keys (`anon_*`) are replaced by role-based public keys (`fyso_pk_*`). Each public key now requires a `roleId` and inherits the role's entity-level permissions. Scopes (`records:read`, `channels:read`), TTL, rate limits, and CORS allowlist work as before. New MCP tools: `create_public_key`, `list_public_keys`, `revoke_public_key`. New REST endpoints: `GET/POST/DELETE /api/auth/public-keys`. Authentication via `X-Public-Key`, `X-Anon-Key` (legacy), or `Authorization: Bearer fyso_pk_*`. Legacy `/auth/anonymous-keys` routes preserved for backward compatibility. (#670)
- **API Management with RBAC** — Define named API definitions with configurable roles and a per-entity permission matrix (`read`, `create`, `update`, `delete`). Issue platform keys (`fyso_pkey_*`) per role — each key enforces the matrix on incoming requests to `/api/entities/*`. Wildcard entity `*` grants access to all entities for a role. Manage via REST (`GET/POST/PUT/DELETE /api/apis`, `GET/POST/DELETE /api/apis/:id/keys`) or the **Settings → API Management** admin panel. (#656, #659)
- **Platform invitations** — Tenant admins can invite new platform users by email. Each admin has a quota of 5 active invitations (7-day expiry). Invited users register at `POST /api/platform/invitations/:token/accept` with name + password. Manage invitations via `POST/GET/DELETE /api/platform/invitations` or the **Platform → Invitations** admin panel. (#637, #668)
- **PDF table fields** — The PDF Designer now includes a table plugin: drag a table element onto the canvas to define column headers and row layout. The PDF Generator accepts `array[][]` input for table fields (array of rows, each row an array of cell values). (#653)
- **Knowledge base: binary PDF upload** — Upload PDF files directly via `POST /api/knowledge/documents/upload` (multipart/form-data). Accepts `file` (PDF only, max 20 MB) and optional `title`. Text is extracted automatically; the document is chunked and indexed in the background. (#654)
- **Storage usage endpoint** — `GET /api/usage/storage` returns a storage breakdown per tenant: database size (exact bytes + table count + estimated row count), knowledge base size (bytes + document count), and bucket storage. (#655)
- **n8n community node** — Official `n8n-nodes-fyso` package for n8n workflow automation. The **Fyso** node supports 7 operations: listTenants, listEntities, createRecord, getRecord, listRecords, updateRecord, deleteRecord. The **Fyso Trigger** node listens for `record.created`, `record.updated`, and `record.deleted` events via webhooks. Install from the n8n community nodes registry. (#664)
- **Schema health check system** — New `schema-health.service` detects migration gaps across all tenant schemas on startup. Checks for missing tables, columns, extensions, indexes, and triggers. Two superadmin endpoints: `GET /health/schema` returns a full health report with per-tenant issues and suggested fix SQL; `POST /health/schema/fix` re-runs DDL on all degraded tenants (idempotent). Logs `[schema-health]` warnings at boot if any tenant is degraded. (#612)
- **Tenant invitation management** — Full invitation lifecycle for tenant member onboarding. Admins create invitations via `POST /api/invitations` (with tenant context) with optional email lock, list them via `GET /api/invitations`, and revoke via `DELETE /api/invitations/:token`. Superadmins see all invitations cross-tenant via `GET /api/admin/platform/invitations` with status/tenantId filters and pagination. Public endpoints `GET /auth/invite/:token` (preview) and `POST /auth/invite/accept` (register via invitation) let invited users self-onboard. Platform registration codes (`POST /api/invitations` without tenant context) remain backwards-compatible. (#616)
- **Zero-downtime deploys** — The API and MCP server now use PM2 cluster mode with graceful shutdown. Rolling restarts bring up a new worker before retiring the old one, eliminating request gaps during deployments. (#615)
- **Invitation management: invalidate and share links** — `DELETE /api/invitations/:token` deactivates an invitation code immediately. `POST /api/invitations` now returns `{ token, inviteUrl }` in the response so you can share a ready-made invite link without constructing the URL yourself. (#613)
- **`update_user_password` MCP tool** — Tenant admins and owners can reset any user's password without requiring the current password. Call `update_user_password({ userId, newPassword })`. Useful for account recovery when a user is locked out. Added to the `core` tool profile. (#574)
- **Cloudflare for SaaS: automated SSL for custom domains** — When `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are set, custom domain setup now uses Cloudflare for SaaS. CF provisions SSL automatically; tenants add a single CNAME pointing to the configured fallback origin. A new webhook endpoint (`POST /api/sites/cloudflare-webhook`) receives SSL status updates from CF. When not configured, the existing manual DNS verification flow is preserved unchanged. (#569)
- **Anonymous API keys** — Anonymous API keys (`anon_*`) for public access to tenant resources without user authentication. Configurable scopes (`records:read`, `channels:read`), mandatory TTL (1–365 days, default 90), per-key rate limits, CORS allowlist, and full audit log. Maximum 20 active keys per tenant. Manage via MCP (`create_anonymous_key`, `list_anonymous_keys`, `revoke_anonymous_key`) or REST (`GET/POST/DELETE /api/auth/anonymous-keys`, `GET /api/auth/anonymous-keys/:id/audit`). (#547)
- **Tenant user self-service** — Feature-flagged self-service flows for tenant users. Self-registration (`POST /auth/tenant/register`) creates a `viewer` user without admin invitation. Forgot-password flow sends a one-time reset link via email, always returning 200 to prevent email enumeration, rate-limited to 3 requests/15 min per IP. Reset-password and change-password endpoints complete the flow. Admins can reset any user's password via `PATCH /auth/tenant/users/:id/reset-password`. Enable with `selfRegistrationEnabled` and `passwordResetEnabled` flags in tenant settings. (#553)
- **Anonymous API key request authentication** — Anonymous keys are now enforced on incoming requests. Include the key via `X-Anon-Key` header or `Authorization: Bearer anon_...` to access entity and channel endpoints without user authentication. `GET /api/entities/*` requires `records:read` scope; `GET /api/channels/*` requires `channels:read`. Write operations are always rejected with `401`. All auth failures return a generic `401` to prevent information leakage. (#561)
- **Admin API keys** — Platform-level API keys (`fyso_adm_*`) with granular scope control (`platform:read`, `platform:write`, `tenants:manage`). Create, list, revoke, and audit keys via `GET/POST/DELETE /api/admin/platform/keys`. Full audit log with every creation, use, and revocation. Keys are bcrypt-hashed and shown only once at creation. (#543, #555)
- **docs.fyso.dev** is now the official documentation URL. **fyso.dev** and **www.fyso.dev** serve the landing page, with a visible link to docs in Navbar and Footer. (#532)
- **Dedicated instance `/health/detailed`** — returns extended isolation fields: `instance.id`, `instance.uptime_seconds`, `instance.region`, `database.type`, `security.network_isolation`, `security.public_db_access`. Allows verifying isolation status of Enterprise instances. (#524)
- **Dedicated instance rollback** — `rollback.sh` script to revert to a previous image tag with health verification. (#524)
- **Docker images on GHCR** — `fyso-api`, `fyso-mcp`, `fyso-migrate` automatically built and pushed to GHCR on pushes to `main` and semver tags. (#524)

### Fixes
- **Static site URLs changed to `-sites.fyso.dev`** — Static sites are now served at `{subdomain}-sites.fyso.dev` instead of `{subdomain}.sites.fyso.dev`. This is required for Cloudflare wildcard SSL coverage (`*.fyso.dev`). Update any hardcoded URLs or CNAME records pointing to the old pattern. Custom domains are unaffected. (#665)
- **PDF blank output when using `recordId` without `entityName`** — `generate_pdf` called with only `recordId` (no `entityName`) now resolves the entity from the template's `entidad_origen` field. Previously these calls produced a blank PDF. (#653)
- **Dedicated instance: PostgreSQL checkpoint pressure** — Under write load, checkpoint I/O was saturating disk on dedicated instances (observed: 3.5-minute checkpoint writes). Tuned `checkpoint_completion_target`, `wal_buffers`, and `max_wal_size` in the dedicated `docker-compose.yml`. `PG_SHARED_BUFFERS` is configurable per server size via `.env`. (#611)
- **Update response reflects after-save computed fields** — When an after-save business rule writes back to the record being updated, the update response now returns the final state. Previously, only the create response had this behavior; update returned the pre-rule snapshot. A subsequent GET was always correct; now update is consistent with it. (#568)
- **Security hardening: auth flows** — Self-registration (`POST /auth/tenant/register`) is now rate-limited to 5 requests per hour per IP+tenant. Password changes, resets, and admin resets now invalidate all active sessions for the affected user. A new password reset token invalidates any prior outstanding token for that user. (#573)
- **DB worker SSL reconnections** — Background workers (job queue, embedding service) were failing to reconnect to RDS after idle timeouts due to an SSL negotiation incompatibility in postgres.js. Replaced `ssl: 'require'` string mode with `ssl: { rejectUnauthorized: false }` object form and increased `idle_timeout` from 20 s to 60 s to reduce unnecessary reconnections. (#565)
- **Anonymous API key management auth** — `GET /api/auth/anonymous-keys` and `POST /api/auth/anonymous-keys` now correctly return `401 Unauthorized` for unauthenticated requests (previously returned `400`). (#562)
- **Create record response now reflects after-save computed fields** — When an after-save business rule updates fields on the newly created record, the create response now returns the final state instead of the pre-rule snapshot. A subsequent GET would have shown the correct values; now the create response is consistent with it. (#544)
- **Business rule evaluator concurrency limit** — Under heavy concurrent writes, rule evaluation could exhaust the database connection pool. A semaphore now caps concurrent rule evaluations (default: 8, configurable via `RULE_EVAL_MAX_CONCURRENCY` env var). Excess evaluations queue rather than spawning unbounded DB queries. (#545)
- **Never-published draft entities visible via API** — `getEntityByName` now returns `null` for drafts without a `publishedVersion` when `includeDrafts=false`. Brand-new drafts (never published) no longer pass through the records API guard. (#533)
- **Business rule stability under concurrent load** — DB connection pool default increased from 20 to 40 (`DB_MAX_CONNECTIONS`). A new semaphore in the record service caps simultaneous rule evaluation passes at 8 (`MAX_CONCURRENT_RULES`). After-save `update_related` actions targeting the same parent record are batched into a single DB write per unique record, reducing WAL entries under write-heavy workloads. (#577)
- **System entities hidden; knowledge `content_text` backfilled** — `_fyso_*` system entities no longer appear in `list_entities` results or the admin entity list. Existing tenants missing the `documents.content_text` column receive it automatically on next DDL run, restoring full-text indexing for knowledge documents. (#606)

---

## v1.14.0 — 2026-02-21

### Features
- **Knowledge/RAG admin page** — Browse and manage knowledge base documents from the admin UI (#496, #497)
- **Webhook subscriptions admin UI** — Manage webhook subscriptions for entity events from the admin panel (#499)
- **RAG phase 2: PDF/HTML ingestion + search analytics** — Ingest PDF and HTML documents into knowledge base; track search queries with latency/score metrics (#371, #508)
- **Landing page: pricing section** — 3-tier pricing (Free/Pro/Enterprise) with monthly/annual toggle (#503)
- **Landing page: integrations section** — Showcase automation platform integrations (n8n, Make, Zapier) (#504)
- **Astro Starlight docs site** — New documentation site with ES/EN i18n (#506)

### Fixes
- Superadmin health page: align field names with API and show PM2 processes (#495)
- SSRF validation on http_callback rules + rollup/action unit tests (#498)
- Retry transactions on serialization failure to reduce deadlock errors (#502, #505)
- MCP: serialize `template_json` to string in `create_pdf_template` tool (#511)
- MCP: use `'ai'` instead of `'agent'` for `generatedBy` in rule tools (#510)

### Tests
- State machine lifecycle tests for entity/rule/flow transitions (#500)
- Concurrency race condition tests for webhooks, rules, entity publish, flows (#501)


---
sidebar_position: 100
---

# Changelog

All notable changes to Fyso are documented here.

---

## v1.12.0 — Security Hardening & Billing (2026-02-20)

### Security
- **SSRF protection**: Block private IPv4/IPv6 ranges, DNS rebinding, and hex-form bypass `::ffff:7f00:1` (#437, #438, #427)
- **Tenant isolation in rules engine**: Cross-tenant data no longer accessible via lookup/aggregate (#432)
- **SQL injection prevention**: `validateSchemaName()` guards against injection in entity/field names
- **Auth boundary**: Comprehensive auth tests covering 403 handling for invalid tenant context (#434)
- **Rules hardening**: Infinity/NaN guard, conditional-without-default warning, fuzz tests (#418, #419, #423, #428)
- **Cross-tenant lookup blocked**: Business rule lookups are now scoped to the requesting tenant (#426)

### Billing
- **Plan enforcement**: free tier (1 tenant / 3 entities), pro/beta (5 tenants / unlimited entities), enterprise (unlimited) (#405, #406)
- **HTTP 402** returned when quota is exceeded
- **`GET /api/auth/usage`** endpoint to query current plan usage
- **`PlanBadge` + `useUsage` hook** in web UI (#413)
- Tenants page: removed auto-redirect that blocked creating a 2nd tenant

### Fixes
- `DELETE entity` now uses CASCADE to handle FK constraints from `record_embeddings` (#398)
- Tenant slug uniqueness: 5-char hex suffix prevents collisions on similar names (#425)
- MCP response shapes: fallback when API returns `{success:true}` without `.data` (#429)
- Input validation: `.trim()` + `min(1)` enforced on Zod schemas (#431)
- Test isolation: demo-company tenant selected explicitly in 22 test files

### Internal
- Migration 0042: `plan` + Stripe fields on `admin_users`, `owned_by` on tenants
- 2343 lines of new test coverage across 16 test files



## v1.11.0 — Security Hardening Wave (2026-02-20)

Major security hardening release: input validation, SSRF protection, SQL injection prevention, and API hardening across the platform.

### Security
- **SQL injection prevention**: Zod validation on entity names, webhooks, rules, scheduling UUIDs, sites domains, knowledge document IDs
- **SSRF protection**: Block redirect following in flow URL interpolation; sanitize flow email HTML
- **RBAC on management plane**: Enforce role-based access control on management endpoints
- **Password hash passthrough prevention**: Filter auth/me response; fix tenant isolation in update-record
- **Webhook secret masking**: Prevent duplicate subscriptions
- **Rule timeout bypass fix**: Prevent rule execution timeout bypass
- **Namespace protection**: Block `_fyso_` namespace from user modification
- **fieldKey SQL injection fix**: Guard against field key injection

### Features
- **MCP RBAC tools**: `list_roles`, `create_role`, `assign_role`, `revoke_role`
- **Regression test suite**: 19 E2E test files, ~170 tests covering security, SSRF, RBAC, auth boundary, input validation

### Fixes
- Job deduplication: prevent duplicate emails/webhooks from after_save jobs
- Knowledge ingestion: wrap document chunk ingestion in transaction; store content for retry
- Formula integer overflow guard
- Entity/flow guards: lock entity publish transaction; guard flow delete against active runs
- Jobs API: tenant-scope; guard entity deletion; validate flow entity
- DB error surfacing from getFieldValue/aggregate
- Error response sanitization; fix DELETE data wrapper; fix subdomain case
- Zod schema crash fix for flow steps; delete_flow response shape fix
- Rules routes reordering; MCP tool missing entity handling

---

## v1.10.1 — Email Verification + Event Emails (2026-02-20)

### Features
- **Email verification flow** — verify-email page, dashboard banner for unverified users, resend button
- **Soft-block** tenant creation and API key creation for unverified emails
- **Event-driven emails** — `plan_limit_reached`, `new_user_joined` templates with 15-minute rate limiting
- **Email rate limits** — per event type per tenant (`email_rate_limits` table)

### Fixes
- `APP_BASE_URL` added to production env for Auth0 SDK v4 compatibility
- `RESEND_API_KEY` added to production deploy workflow
- Safety-net migration for `email_verified` column

---

## v1.10.0 — Open Core + Superadmin + MCP Marketplace (2026-02-20)

### Architecture
- **Open Core**: Build-time plugin detection via `@fyso/pro`. OSS build works standalone, PRO build loads the full module at compile time
- **Enterprise: Dedicated Deployment**: Multi-stage Dockerfiles (~50MB), complete `docker-compose.yml`, provision/update/backup scripts, GitHub Actions workflow
- **MCP Session Persistence**: Session preferences (tenant, bot) persist to DB via `mcp_user_preferences`

### Superadmin
- **Superadmin UI**: Platform section in sidebar — manage all tenants (view, change plan, suspend), view all admin users, server health dashboard

### MCP & API
- **MCP Safety Annotations**: All 85 MCP tools annotated with `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
- **MCP Marketplace Manifests**: `manifest.json` (Anthropic Connectors Directory), `smithery.yaml` (Smithery.ai)
- **Advanced API Management**: `GET /api/openapi.json` (OpenAPI 3.1), per-API-key rate limits, `GET /api/usage/dashboard`
- **Usage Metering & Quotas**: Per-tenant rate limiting (200 req/min), 402 status codes for quota exceeded
- **Embedding Provider Abstraction**: `EmbeddingProvider` interface, configurable via `EMBEDDING_PROVIDER` env var

### Features
- **RAG Knowledge Base**: Document ingestion with automatic chunking, OpenAI embeddings, cosine similarity search. MCP tools: `upload_document`, `search_knowledge`, `list_documents`, `get_document`, `delete_document`, `get_knowledge_stats`
- **RBAC**: Roles and permissions per tenant. 3 system roles (admin, member, viewer), `requirePermission` middleware

---

## v1.9.0 — Platform Sprint (2026-02-19)

### Features
- **Webhook subscriptions** for entity events
- **Usage metering & audit** system for billing
- **pgvector** status and metrics in dashboard
- **GitHub deploy tokens** with workflow generation
- **S3 backups** — pg_dump to S3
- **Payment provider plugin** system with Stripe
- **AWS SSM** Parameter Store for production secrets
- **Anthropic marketplace** plugin metadata
- **Super admin panel** REST API for platform management
- **Super admin MCP tools** with security controls
- **Next.js landing page**
- **Storybook** for `@fyso/ui` component library
- **Docusaurus docs site** with ES/EN i18n

---

## v1.8.0 — Billing, PDFs, Location & CI/CD (2026-02-19)

### Features
- **Stripe billing** — checkout, customer portal, webhooks, usage limits per plan
- **PDF engine** with pdfme — templates, visual editor, `generate_pdf` MCP tool
- **Location field** — Leaflet/OSM picker, geocoding proxy, lat/lng/address storage
- **Flow engine** — triggers + steps as metadata, CRUD + toggle
- **File storage** with FlyDrive abstraction + `upload_file` MCP tool
- **JSONB referential integrity** — validate relations + onDelete actions
- **Business rules execution log** for debugging
- **Field plugin registry** — extensible system replacing hardcoded switch/case
- **Login with invitation** — non-existent account prompts for code
- **i18n landing page** — locale switcher + translations

### Infrastructure
- **GitHub Actions CI/CD** — test → build → deploy pipeline with smoke tests
- **`.env` from GitHub Secrets** on each deploy
- **PM2 + Bun** compatibility fix

### MCP Tool Profiles
- **core** (28 tools): added `generate_pdf`, `upload_file`
- **advanced** (38 tools): added `create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`

---

## v1.7.2 — Scheduling, CSV Import & Hotfixes (2026-02-17)

### Features
- **Scheduling with rrule.js** — availability, slots, and date range aggregates
- **CSV import** with preview and type coercion
- **Job queue** with SKIP LOCKED and async business rule actions
- **Tenant branding** — appName, logoUrl, primaryColor
- **App publishing** — install link, dashboard UI
- **Redesigned empty states** with i18n

### Fixes
- Allow `*.sites.fyso.dev` subdomains in CORS
- Cards consistency — users page table→cards
- Tenant archive (soft delete) with confirmation dialog
- Responsive mobile audit — 11 views fixed for 375px+
- Unify UI language — i18n reset password pages

---

## v1.7.1 — UI Polish (2026-02-17)

- Fix 5 visual bugs in UI polish batch

---

## v1.7.0 — Security Hardening + Developer Skills (2026-02-17)

### Security
- **Role-based authorization** for tenant user management
- **Security hardening** — CORS, cookies, body limit, schema validation, JWT audience, tenant ownership, rate limit
- **SQL injection prevention** — parameterize embedding SQL
- **Cross-tenant access guard** via `X-Tenant-Slug` header
- **PostgreSQL connection pool** configuration

### Features
- **fyso-architect agent** + `/fyso-publish` skill
- **Core skills** — `/fyso-new-app`, `/fyso-add-entity`, `/fyso-deploy`
- **`@fyso/ui` package** extracted
- **Dynamic prebuilds** — `app_catalog` DB table
- `generate_business_rule` accepts DSL JSON as primary input

---

## v1.6.0 — Auth, i18n & Developer Experience (2026-02-17)

### Features
- **Email+password login** — bypass Google OAuth dependency
- **DB-backed invitation codes** for closed beta
- **Password reset flow** with email token
- **Transactional emails** — welcome + invitation via Resend
- **i18n setup** with next-intl for frontend localization
- **MCP tool profiles** — reduce tool surface for new builders
- **Claude Code plugin** for Fyso MCP server

### Improvements
- MCP tool descriptions translated to English
- API error messages in English

---

## v1.5.0 — Builder Landing (2026-02-17)

- Builder-focused landing page
- Roadmaps, design brief, and ADR for beta planning

---

## v1.4.0 — Builder Panel (2026-02-16)

- Builder panel wave 1 — layout shell, command palette, dashboard redesign
- Builder panel wave 2 — pages
- Builder panel developer tools (wave 3)

---

## v1.3.0 — Prebuilds & Search (2026-02-15)

### Features
- Prebuild apps: freelancer/consultora, Taller/Servicio técnico, Tienda retail
- **CSV export** for any entity
- **Text search** in entity tables
- **Hybrid search** + similarity threshold for semantic search
- Onboarding web — guided form + auto-provisioning
- **after_save actions** for cross-entity updates in business rules
- `list_users` MCP tool
- **Sentry** error tracking for API and frontend
- Automated PostgreSQL backups with retention and alerting
- Rate limiting middleware
- Date picker with shadcn Calendar
- Tenant theming — business name + primary color
- Internal event tracking for beta analytics

### Fixes
- Functional sort in DynamicTable
- Deploy token expiry info + default channel permissions
- MCP JWT audience mismatch fix

---

## v1.2.0 — Rules Engine (2026-02-14)

### Features
- **Cross-entity lookup & aggregate in rules engine** — lookup fields read values from related entities, aggregate fields compute `count()` and `sum()`
- **Auto-create admin on first Google login** with invitation code system
- Landing page added

---

## v1.1.0 — Google Login (2026-02-14)

- Auto-create admin account on first Google login with invitation code
- New `POST /google-register` endpoint

---

## v1.0.0 — First Release (2026-02-14)

**First public release of Fyso.**

### Features
- **OAuth 2.1 authentication** — Authorization code flow with PKCE S256, RS256 JWT tokens, refresh token rotation
- **Static site hosting** — `*.sites.fyso.dev` with automatic HTTPS via Caddy
- **Multipart upload** for static sites
- **Channel tools** system
- **Docker-based QA infrastructure**
- **GitHub Actions CI**

Pipeline: Centinela → Cero → Crisol → Lupa → Pulso
