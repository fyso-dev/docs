# Changelog

Platform change history for Fyso.

---

## Unreleased

### New features

#### Documentation site at docs.fyso.dev
- **`docs.fyso.dev`** is now the official documentation URL. (#532)
- **`fyso.dev`** and **`www.fyso.dev`** serve the landing page. Navbar and Footer include a visible link to `docs.fyso.dev`. (#532)

#### Dedicated instance: isolation info in `/health/detailed`
- `/health/detailed` now returns extended isolation fields: `instance.id`, `instance.uptime_seconds`, `instance.region`, `database.type`, `security.network_isolation`, `security.public_db_access`. Allows verifying isolation status of Enterprise instances from any HTTP client. (#524)
- `rollback.sh` script to revert a dedicated instance to a previous image tag with health verification. (#524)
- Docker images (`fyso-api`, `fyso-mcp`, `fyso-migrate`) automatically published to GHCR on pushes to `main` and semver tags. (#524)

### Bug fixes

#### Entities and records
- **Never-published draft entities visible via API** — `getEntityByName` now returns `null` for drafts without a `publishedVersion` when `includeDrafts=false`. Previously, a brand-new draft (never published) bypassed the guard and was accessible via the records API. (#533)

---

## v0.4.0 — 2026-02-21

### New features

#### Knowledge base / RAG
- **`upload_document`, `search_knowledge`, `list_documents`, `get_document`, `delete_document`, `get_knowledge_stats`** — 6 new MCP tools to operate a vector knowledge base per tenant. Agents can ingest text, URLs, PDFs and HTML, search by semantic similarity, and query statistics. (#378 #379 #508)
- **Admin page `/knowledge`** in the web panel: stats, document list with status, semantic search panel, and upload form. (#497)
- **PDF and HTML ingestion** — RAG phase 2 adds support for `application/pdf` (via `pdf-parse`) and `text/html` (via `htmlparser2`). (#508)
- **Search analytics** — every `searchKnowledge()` call records an analytics event to identify frequent queries and measure coverage. (#508)

#### Webhooks
- **Webhooks for entity events** — subscribe to `created`, `updated`, `deleted` on any entity. Delivered via HTTP POST with HMAC-SHA256 signature, automatic retries (up to 5 with exponential backoff), and delivery log. (#331)
- **MCP tools**: `create_webhook`, `list_webhooks`, `delete_webhook` (`advanced` profile). (#331)
- **Admin page `/settings/webhooks`** — create subscriptions, view delivery history, enable/disable. (#499)

#### RBAC — Roles and permissions
- **Role system per tenant** — each tenant has 3 system roles (`admin`, `editor`, `viewer`) and can create custom roles with granular permissions. (#377)
- **MCP tools**: `list_roles`, `create_role`, `assign_role`, `revoke_role` (`advanced` profile). (#402)
- **Access control on management routes** — all management routes enforce the required minimum role. (#471)

#### Compound filters in `query_records`
- **AND/OR in the `filter` parameter** — `"status = active AND category = food"`, `"status = active OR status = pending"`. AND has precedence over OR. Backward compatible with simple filters. (#318)
- **Date comparisons** — `"fecha >= 2026-02-01 AND fecha <= 2026-02-28"`. (#318)

#### New MCP tool: `add_field`
- **`add_field`** (`core` profile) — adds a field to a published entity in one step (get → add → republish). Simpler than `manage_custom_fields` for the common case. (#320)

#### `resolve_depth` in `query_records`
- **`resolve_depth` parameter** (default: 1, max: 3) — with `depth=2` or higher, nested relations are resolved recursively. (#320)

#### Custom domains for static sites (Pro)
- Pro users can map a custom domain (`app.mycompany.com`) to their `*.sites.fyso.dev` subdomain via CNAME or TXT. Automatic DNS verification. (#329)

#### Persistent deploy tokens for CI/CD
- **`generate_deploy_token`** (MCP tool, `advanced` profile) — generates a persistent reusable token (`fyso_dt_...`) and returns a ready-to-copy GitHub Actions workflow, with automatic framework detection (Astro, Vite, Next.js, Nuxt, Gatsby, Hugo). (#334)

#### `create_pdf_template`
- **`create_pdf_template`** (`core` profile) — automatically generates a pdfme template from field names. Creates the `_fyso_pdf_templates` entity if it doesn't exist. Returns a `templateId` for use with `generate_pdf`. (#327)

#### Per-user tool profiles
- **`tool_profile` per user** (`core`/`advanced`/`all`, default `core`) — each `adminUser` can have their own profile. Priority: user profile > `FYSO_TOOLS` env > default. (#317)

#### Auto-generated OpenAPI 3.1 spec
- **`GET /api/openapi.json`** — OpenAPI 3.1 spec dynamically generated from tenant metadata. Includes CRUD endpoints per entity, field schemas, and authentication methods. (#376)

#### Per-API-key rate limiting
- Plan-based limits: Free 60 req/min, Pro 300 req/min, Beta 600 req/min.
- Standard headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Policy`. (#376)
- Per-tenant rate limiting on entity/metadata/rules routes: 200 req/min. (#375)
- Monthly API request quota per plan with `402 Payment Required` when exceeded. (#375)

#### Billing tied to the builder (Shopify Partners model)
- The plan belongs to the `adminUser`, not the tenant. A builder can have multiple tenants under one plan. (#492)
- New tiers: Free, Pro, Enterprise. Quotas for entities, records, storage, API requests, and static sites per plan. (#492)

#### Enterprise dedicated deployment
- Enterprise tenants can have a dedicated API instance (`dedicated_api_url`). The web panel detects the deployment type and routes API calls accordingly. (#381 #382)

#### Email verification
- Users registered with a password receive a verification email. Google login is auto-verified. Endpoints: `GET /auth/verify-email`, `POST /auth/resend-verification`. (#327 #395)

#### pgvector stats in dashboard
- New endpoint `GET /api/metadata/embeddings/stats` with pgvector extension status, version, and embedding counts by status. Visible in the dashboard. (#333)

#### Usage metering
- Atomic counters for `api_requests`, `mcp_tool_calls`, storage, and geocode per tenant per billing period. Immutable audit log. (#332)
- `GET /api/billing/usage` and `GET /api/usage` return usage percentages. (#375)

#### MCP tool safety annotations
- All MCP tools have security `annotations` per MCP spec 2025-03-26 for Anthropic Connectors Directory submission. (#386)
- `manifest.json` and marketplace files added for MCP server submissions. (#390)

#### Rendering hints in `get_entity_schema`
- Each field in `get_entity_schema` response includes `renderingHint` with HTML template, CSS/JS dependencies, and notes for static site generation. Covers: location (Leaflet map), file (download/image link), select, boolean, date, email, phone, textarea, number, relation. (#324)

---

### Bug fixes

#### Security
- **SSRF hardening** — `validateExternalUrl()` now blocks non-standard IP representations: decimal (`2130706433`), octal (`0177.0.0.1`), IPv6-mapped (`::ffff:127.0.0.1`), private IPv6 (fc00::/7, fe80::/10). Applied to webhooks, knowledge URL ingestion, `http_callback` and `http_request` flows. (#465 #468 #485 #486 #498)
- **Password exposure** — `validateSession()` and `getAdminById()` use explicit column selection. `/api/auth/me` filters internal tenant fields. (#469)
- **Tenant isolation in rules engine** — schema names validated with regex `^[a-z][a-z0-9_]*$` to prevent SQL injection via `lookup`/`aggregate`. (#487)
- **SQL injection in `manage_custom_fields`** — `fieldKey` validated against SQL identifier pattern. (#470)
- **Webhook secret returned in plain text** — webhook endpoints now return masked secret (`wh_secret_****`). Only visible on creation. (#426)
- **`_fyso_` namespace protected** — tenants can no longer create entities with the `_fyso_` prefix. (#420)

#### MCP and business rules
- **MCP preferences persist across restarts** — `bot_name` and `tenant_slug` are now stored in the `mcp_user_preferences` table instead of in memory. (#372)
- **`list_business_rules` returned empty for entities without rules** — `/:entityName/logs` route was being captured by `/:entityName/:ruleId`. (#404)
- **Rule timeout no longer bypasses validation** — returns `__timeout__` as an error instead of an empty array. (#470)
- **Division by zero in formulas** — `Infinity`, `-Infinity`, and `NaN` are converted to errors instead of propagating silently. (#489)
- **`update_related` in rules propagates errors** — previously failures were silently ignored. (#477)
- **`generatedBy` in rule tools** — `create_business_rule` and `generate_business_rule` now send `generatedBy: 'ai'` (API only accepts `'user'`|`'ai'`). (#521)

#### Static sites and deploy
- **500 error on redeploy** — billing check was outside the try/catch block. (#352)
- **413 error on deploy** — unified middleware applies 75 MB for deploy routes, 10 MB for file uploads, 1 MB for everything else. (#355)
- **`deploy_static_site` remote mode** — no longer suggests `curl`; guides the agent to use `bundle_base64`. (#321)

#### Entities and records
- **Entity deletion with records fails with FK constraint** — `DROP TABLE` now includes `CASCADE`. (#490)
- **Deletion blocked if records exist** — `deleteEntity()` verifies the entity is empty before deleting. (#476)
- **Concurrent publish creates duplicate snapshots** — `publish()` uses `SELECT FOR UPDATE` inside a transaction. (#475)
- **Tenant slug uniqueness** — 5-character hex suffix added to avoid collisions. (#490)
- **Entity name validation** — rejects non-alphanumeric names, names with leading underscore, or SQL reserved words. (#473)

#### PDF
- **`create_pdf_template` fails after `_fyso_` entity rename** — tool now uses correct name `_fyso_pdf_templates`. (#421)
- **`template_json` sent as object** — serialized to string before sending to the records endpoint. (#512)

#### Knowledge base
- **Orphaned chunks on ingestion failure** — insertions wrapped in transaction. (#478)
- **No retry without re-upload** — raw content saved before ingestion begins. (#478)

#### Other
- **Retries on PostgreSQL serialization failures** — transactions with error 40001 or 40P01 are retried automatically (up to 3 times). (#505)
- **Duplicate after_save jobs** — deduplicated to prevent double emails and webhooks on concurrent saves. (#480)
- **`apiRequest()` returned `undefined`** on DELETE and other endpoints that respond with `{success: true}` without `.data`. (#491)
- **MCP token TTL** — access token TTL increased from 1h to 24h for long MCP sessions. (#315)
- **`APP_URL` environment variable** — `FRONTEND_URL` and `APP_BASE_URL` unified into `APP_URL`. Old values still work as fallback. (#319)
- **Plan limits on entity generation and CSV import** — `POST /api/generate/entity` and the CSV import endpoint now enforce quotas. (#322)

---

## v0.3.0 — 2026-01-17

### New features

- **`get_rule_logs`** MCP tool — query business rule execution logs with filters by status, rule, record, and date range. `advanced` profile. (#323)
- **Structure hints in `get_entity_schema`** — `structureHint` for `location`, `file`, and `select` fields: documents the expected object and config options. (#316)
- **Select field option validation** — values outside `config.options` are rejected in the backend. (#316)
- **Auto display field on entity generation** — the first text field is automatically set as `displayField`. (#325)
- **Super admin panel** — endpoints at `/api/admin/platform/*` with `fyso_sa_*` auth. Stats, tenant and user management. (#341)
- **Super admin MCP tools** — `list_all_tenants`, `get_tenant_details`, `suspend_tenant`. (#342)

---

## v0.2.0 — 2025-12-20

See [v0.2.0 changelog](https://github.com/fyso-dev/fyso_backend/releases/tag/v0.2.0).
