## Sin publicar

### Funcionalidades
- **Sistema de chequeo de salud de schemas** — Nuevo `schema-health.service` que detecta gaps de migracion en todos los schemas de tenant al iniciar. Verifica tablas, columnas, extensiones, indices y triggers faltantes. Dos endpoints de superadmin: `GET /health/schema` devuelve un reporte completo con issues por tenant y SQL sugerido para corregir; `POST /health/schema/fix` re-ejecuta DDL en todos los tenants degradados (idempotente). Loguea warnings `[schema-health]` al arrancar si algun tenant esta degradado. (#612)
- **Gestion de invitaciones de tenant** — Ciclo de vida completo de invitaciones para onboarding de miembros. Los admins crean invitaciones via `POST /api/invitations` (con contexto de tenant) con email opcional, las listan via `GET /api/invitations`, y las revocan via `DELETE /api/invitations/:token`. Los superadmins ven todas las invitaciones cross-tenant via `GET /api/admin/platform/invitations` con filtros de status/tenantId y paginacion. Los endpoints publicos `GET /auth/invite/:token` (preview) y `POST /auth/invite/accept` (registro via invitacion) permiten que los usuarios invitados se registren solos. Los codigos de registro de plataforma (`POST /api/invitations` sin contexto de tenant) siguen funcionando igual. (#616)
- **Deploys sin downtime** — La API y el servidor MCP ahora usan PM2 en modo cluster con graceful shutdown. Los rolling restarts levantan un nuevo worker antes de apagar el anterior, eliminando gaps de requests durante los deploys. (#615)
- **Gestion de invitaciones: invalidar y links listos para compartir** — `DELETE /api/invitations/:token` desactiva un codigo de invitacion de forma inmediata. `POST /api/invitations` ahora devuelve `{ token, inviteUrl }` en la respuesta, para compartir el link directamente sin construir la URL manualmente. (#613)
- **Herramienta MCP `update_user_password`** — Admins y owners del tenant pueden resetear la contraseña de cualquier usuario sin necesitar la contraseña actual. Usa `update_user_password({ userId, newPassword })`. Útil para recuperar acceso cuando un usuario está bloqueado. Se agregó al perfil de herramientas `core`. (#574)
- **Cloudflare for SaaS: SSL automático para dominios personalizados** — Cuando `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ZONE_ID` están configurados, el setup de dominio personalizado ahora usa Cloudflare for SaaS. CF provisiona SSL automáticamente; los tenants agregan un único CNAME al fallback origin configurado. Un nuevo endpoint de webhook (`POST /api/sites/cloudflare-webhook`) recibe actualizaciones de estado SSL desde CF. Sin configuración, el flujo de verificación DNS manual se preserva sin cambios. (#569)
- **API keys anónimas** — Anonymous API keys (`anon_*`) para acceso público a recursos del tenant sin autenticación de usuario. Scopes configurables (`records:read`, `channels:read`), TTL obligatorio (1–365 días, default 90), rate limits por key, lista CORS y log de auditoría completo. Máximo 20 keys activas por tenant. Gestiona via MCP (`create_anonymous_key`, `list_anonymous_keys`, `revoke_anonymous_key`) o REST (`GET/POST/DELETE /api/auth/anonymous-keys`, `GET /api/auth/anonymous-keys/:id/audit`). (#547)
- **Autogestión de usuarios del tenant** — Flujos de autogestión con feature flags para usuarios de tenant. El autoregistro (`POST /auth/tenant/register`) crea un usuario con rol `viewer` sin invitación del admin. El flujo de forgot-password envía un link de recuperación por email, siempre devuelve 200 para evitar enumeración de emails, con rate limit de 3 requests/15 min por IP. Los endpoints de reset-password y change-password completan el flujo. Los admins pueden resetear la contraseña de cualquier usuario via `PATCH /auth/tenant/users/:id/reset-password`. Habilita con los flags `selfRegistrationEnabled` y `passwordResetEnabled` en la configuración del tenant. (#553)
- **Autenticación de requests con anonymous keys** — Las anonymous keys ahora se aplican en las requests entrantes. Incluye la key con el header `X-Anon-Key` o `Authorization: Bearer anon_...` para acceder a endpoints de entidades y canales sin autenticación de usuario. `GET /api/entities/*` requiere el scope `records:read`; `GET /api/channels/*` requiere `channels:read`. Las operaciones de escritura siempre devuelven `401`. Todos los errores de autenticación retornan un `401` genérico para evitar filtrar información. (#561)
- **Admin API keys** — Keys de API a nivel de plataforma (`fyso_adm_*`) con control de scopes granular (`platform:read`, `platform:write`, `tenants:manage`). Crear, listar, revocar y auditar keys vía `GET/POST/DELETE /api/admin/platform/keys`. Log de auditoría completo con cada creación, uso y revocación. Las keys se hashean con bcrypt y se muestran solo una vez al crearlas. (#543, #555)
- **docs.fyso.dev** es ahora la URL oficial de la documentación. **fyso.dev** y **www.fyso.dev** sirven la landing page, con un link visible a docs en Navbar y Footer. (#532)
- **Instancia dedicada `/health/detailed`** — devuelve campos extendidos de aislamiento: `instance.id`, `instance.uptime_seconds`, `instance.region`, `database.type`, `security.network_isolation`, `security.public_db_access`. Permite verificar el estado de aislamiento de instancias Enterprise. (#524)
- **Rollback de instancia dedicada** — script `rollback.sh` para revertir a un tag de imagen anterior con verificación de salud. (#524)
- **Imágenes Docker en GHCR** — `fyso-api`, `fyso-mcp`, `fyso-migrate` construidas y publicadas automáticamente en GHCR en cada push a `main` y en tags semver. (#524)

### Correcciones
- **Instancia dedicada: presion en checkpoints de PostgreSQL** — Bajo carga de escritura, el I/O de checkpoints saturaba el disco en instancias dedicadas (se observaron escrituras de 3.5 minutos por checkpoint). Se ajustaron `checkpoint_completion_target`, `wal_buffers` y `max_wal_size` en el `docker-compose.yml` dedicado. `PG_SHARED_BUFFERS` es configurable por tamaño de servidor via `.env`. (#611)
- **La respuesta de actualizar registro refleja campos calculados por after-save** — Cuando una regla de negocio after-save escribe campos en el registro que se está actualizando, la respuesta del update ahora devuelve el estado final. Antes, solo la respuesta de create tenía este comportamiento; el update devolvía el snapshot previo a la regla. Un GET posterior siempre fue correcto; ahora el update es consistente con él. (#568)
- **Hardening de seguridad: flujos de autenticación** — El autoregistro (`POST /auth/tenant/register`) ahora tiene rate limit de 5 requests por hora por IP+tenant. Los cambios de contraseña, resets y resets del admin ahora invalidan todas las sesiones activas del usuario afectado. Un nuevo token de reset de contraseña invalida cualquier token previo activo para ese usuario. (#573)
- **Reconexiones SSL en workers de base de datos** — Los workers en segundo plano (job queue, servicio de embeddings) fallaban al reconectarse a RDS después de timeouts de inactividad por una incompatibilidad en la negociación SSL de postgres.js. Se reemplazó el modo string `ssl: 'require'` por la forma de objeto `ssl: { rejectUnauthorized: false }` y se aumentó `idle_timeout` de 20 s a 60 s para reducir reconexiones innecesarias. (#565)
- **Autenticación en rutas de gestión de anonymous keys** — `GET /api/auth/anonymous-keys` y `POST /api/auth/anonymous-keys` ahora devuelven correctamente `401 Unauthorized` para requests no autenticadas (antes devolvían `400`). (#562)
- **La respuesta de crear registro ahora refleja campos calculados por after-save** — Cuando una regla de negocio after-save actualiza campos del registro recién creado, la respuesta de create ahora devuelve el estado final en lugar del snapshot previo a la regla. Un GET posterior mostraba los valores correctos; ahora la respuesta de create es consistente. (#544)
- **Límite de concurrencia en el evaluador de reglas de negocio** — Bajo alta concurrencia de escrituras, la evaluación de reglas podía agotar el pool de conexiones a la base de datos. Un semáforo limita ahora las evaluaciones concurrentes (por defecto: 8, configurable con la variable de entorno `RULE_EVAL_MAX_CONCURRENCY`). Las evaluaciones excedentes se encolan en lugar de generar queries ilimitadas. (#545)
- **Entidades draft nunca publicadas visibles vía API** — `getEntityByName` ahora retorna `null` para drafts sin `publishedVersion` cuando `includeDrafts=false`. Antes, una entidad recién creada (nunca publicada) pasaba el guard y era accesible por la API de registros. (#533)
- **Estabilidad de reglas de negocio bajo carga concurrente** — El pool de conexiones aumentó de 20 a 40 (`DB_MAX_CONNECTIONS`). Un nuevo semáforo en el servicio de registros limita las evaluaciones concurrentes de reglas a 8 (`MAX_CONCURRENT_RULES`). Las acciones `update_related` after-save que apuntan al mismo registro padre se agrupan en una sola escritura a la base de datos, reduciendo entradas WAL en cargas de escritura intensiva. (#577)
- **Entidades del sistema ocultas; `content_text` recuperado en documentos** — Las entidades `_fyso_*` ya no aparecen en los resultados de `list_entities` ni en la lista de entidades del panel. Los tenants existentes que no tenían la columna `documents.content_text` la reciben automáticamente en la próxima actualización DDL, restaurando la indexación de texto completo en la base de conocimiento. (#606)

---

## v1.14.0 — 2026-02-21

### Funcionalidades
- **Página de administración Knowledge/RAG** — Navega y gestiona documentos de la base de conocimiento desde el panel de administración (#496, #497)
- **UI de administración de webhooks** — Gestiona suscripciones de webhooks para eventos de entidades desde el panel de administración (#499)
- **RAG fase 2: ingesta PDF/HTML + analíticas de búsqueda** — Ingesta documentos PDF y HTML en la base de conocimiento; registra consultas de búsqueda con métricas de latencia y score (#371, #508)
- **Landing page: sección de precios** — 3 niveles de precios (Free/Pro/Enterprise) con toggle mensual/anual (#503)
- **Landing page: sección de integraciones** — Muestra integraciones con plataformas de automatización (n8n, Make, Zapier) (#504)
- **Sitio de documentación Astro Starlight** — Nuevo sitio de documentación con i18n ES/EN (#506)

### Correcciones
- Panel de salud del superadmin: alinear nombres de campos con la API y mostrar procesos PM2 (#495)
- Validación SSRF en reglas http_callback + pruebas unitarias rollup/action (#498)
- Reintentar transacciones en fallo de serialización para reducir errores de deadlock (#502, #505)
- MCP: serializar `template_json` como string en herramienta `create_pdf_template` (#511)
- MCP: usar `'ai'` en lugar de `'agent'` para `generatedBy` en herramientas de reglas (#510)

### Pruebas
- Pruebas de ciclo de vida de máquina de estados para transiciones de entidad/regla/flujo (#500)
- Pruebas de condición de carrera de concurrencia para webhooks, reglas, publicación de entidades, flujos (#501)


---
sidebar_position: 100
---

# Changelog

Todos los cambios relevantes de Fyso están documentados aquí.

---

## v1.12.0 — Seguridad y Billing (2026-02-20)

### Seguridad
- **Protección SSRF**: bloqueo de rangos IPv4/IPv6 privados, DNS rebinding y bypass en forma hex `::ffff:7f00:1` (#437, #438, #427)
- **Aislamiento de tenant en rules engine**: datos de otros tenants ya no son accesibles via lookup/aggregate (#432)
- **Prevención de SQL injection**: `validateSchemaName()` protege contra injection en nombres de entidades y campos
- **Auth boundary**: tests completos de autenticación cubriendo 403 para contexto de tenant inválido (#434)
- **Rules hardening**: guard contra Infinity/NaN, advertencia de condicional sin default, fuzz tests (#418, #419, #423, #428)
- **Lookup cross-tenant bloqueado**: lookups de reglas ahora con scope del tenant solicitante (#426)

### Billing
- **Enforcement de planes**: free (1 tenant / 3 entidades), pro/beta (5 tenants / ilimitado), enterprise (ilimitado) (#405, #406)
- **HTTP 402** cuando se supera la cuota
- **Endpoint `GET /api/auth/usage`** para consultar uso del plan actual
- **`PlanBadge` + hook `useUsage`** en la UI web (#413)
- Página de Tenants: eliminado auto-redirect que impedía crear un 2° tenant

### Fixes
- `DELETE entity` ahora usa CASCADE para manejar FK constraints de `record_embeddings` (#398)
- Unicidad del slug de tenant: sufijo hex de 5 caracteres previene colisiones en nombres similares (#425)
- Formas de respuesta MCP: fallback cuando la API retorna `{success:true}` sin `.data` (#429)
- Validación de inputs: `.trim()` + `min(1)` en schemas Zod (#431)
- Aislamiento de tests: tenant demo-company seleccionado explícitamente en 22 archivos de test

### Interno
- Migración 0042: campos `plan` + Stripe en `admin_users`, `owned_by` en tenants
- 2343 líneas de cobertura de tests nuevos en 16 archivos



## v1.11.0 — Seguridad (2026-02-20)

Release mayor de seguridad: validación de inputs, protección SSRF, prevención de SQL injection y hardening de API.

### Seguridad
- **Prevención de SQL injection**: validación Zod en nombres de entidades, webhooks, reglas, UUIDs de scheduling, dominios de sites, IDs de documentos
- **Protección SSRF**: bloquear seguimiento de redirects en interpolación de URLs en flows; sanitizar HTML de emails en flows
- **RBAC en plano de gestión**: control de acceso basado en roles en endpoints de management
- **Prevención de passthrough de hash de contraseña**: filtrar respuesta de auth/me; fix de aislamiento de tenant en update-record
- **Enmascaramiento de secretos de webhooks**: prevenir suscripciones duplicadas
- **Fix de bypass de timeout en reglas**
- **Protección de namespace**: bloquear modificación del namespace `_fyso_` por usuarios
- **Fix de SQL injection por fieldKey**

### Features
- **Herramientas MCP para RBAC**: `list_roles`, `create_role`, `assign_role`, `revoke_role`
- **Suite de tests de regresión**: 19 archivos E2E, ~170 tests cubriendo seguridad, SSRF, RBAC, auth boundary, validación de inputs

### Fixes
- Deduplicación de jobs: prevenir emails/webhooks duplicados de jobs after_save
- Ingesta de knowledge: transacción para chunks; almacenar contenido para retry
- Guard contra overflow de enteros en fórmulas
- Guards en entidades/flows: bloquear transacción de publish; guard en delete de flow con runs activos
- Jobs API: scope de tenant; guard en eliminación de entidad; validar entidad de flow
- Surfacing de errores de DB desde getFieldValue/aggregate
- Sanitización de respuestas de error; fix DELETE data wrapper; fix de case en subdominio
- Fix de crash en schema Zod para steps de flow; fix de shape de respuesta delete_flow
- Reordenamiento de rutas de reglas; manejo de entidad faltante en herramienta MCP

---

## v1.10.1 — Verificación de Email + Emails por Eventos (2026-02-20)

### Features
- **Flujo de verificación de email** — página verify-email, banner en dashboard para usuarios no verificados, botón de reenvío
- **Bloqueo suave** de creación de tenant y API key para emails no verificados
- **Emails por eventos** — templates `plan_limit_reached`, `new_user_joined` con rate limiting de 15 minutos
- **Rate limits de email** — por tipo de evento por tenant (tabla `email_rate_limits`)

### Fixes
- `APP_BASE_URL` agregado al env de producción para compatibilidad con Auth0 SDK v4
- `RESEND_API_KEY` agregado al workflow de deploy de producción
- Migración de seguridad para columna `email_verified`

---

## v1.10.0 — Open Core + Superadmin + MCP Marketplace (2026-02-20)

### Arquitectura
- **Open Core**: detección de plugins en tiempo de compilación via `@fyso/pro`. Build OSS funciona standalone, build PRO carga el módulo completo en compilación
- **Enterprise: Deployment Dedicado**: Dockerfiles multi-stage (~50MB), `docker-compose.yml` completo, scripts de provision/update/backup, workflow de GitHub Actions
- **Persistencia de sesión MCP**: preferencias de sesión (tenant, bot) persisten en DB via `mcp_user_preferences`

### Superadmin
- **UI de Superadmin**: sección Platform en sidebar — gestionar todos los tenants (ver, cambiar plan, suspender), ver todos los usuarios admin, dashboard de salud del servidor

### MCP & API
- **Anotaciones de seguridad MCP**: las 85 herramientas MCP tienen `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
- **Manifests para MCP Marketplace**: `manifest.json` (Anthropic Connectors Directory), `smithery.yaml` (Smithery.ai)
- **API Management avanzado**: `GET /api/openapi.json` (OpenAPI 3.1), rate limits por API key, `GET /api/usage/dashboard`
- **Medición de uso y quotas**: rate limiting por tenant (200 req/min), códigos 402 para quota excedida
- **Abstracción de proveedor de embeddings**: interfaz `EmbeddingProvider`, configurable via env var `EMBEDDING_PROVIDER`

### Features
- **Knowledge Base RAG**: ingesta de documentos con chunking automático, embeddings OpenAI, búsqueda por similitud coseno. Herramientas MCP: `upload_document`, `search_knowledge`, `list_documents`, `get_document`, `delete_document`, `get_knowledge_stats`
- **RBAC**: roles y permisos por tenant. 3 roles del sistema (admin, member, viewer), middleware `requirePermission`

---

## v1.9.0 — Sprint de Plataforma (2026-02-19)

### Features
- **Suscripciones a webhooks** para eventos de entidades
- **Medición de uso y auditoría** para billing
- **pgvector** estado y métricas en dashboard
- **Tokens de deploy de GitHub** con generación de workflows
- **Backups a S3** — pg_dump a S3
- **Sistema de plugins de proveedores de pago** con Stripe
- **AWS SSM** Parameter Store para secretos de producción
- **Metadatos de plugin para Anthropic marketplace**
- **API REST de panel de super admin** para gestión de plataforma
- **Herramientas MCP de super admin** con controles de seguridad
- **Landing page en Next.js**
- **Storybook** para la librería de componentes `@fyso/ui`
- **Sitio de docs Docusaurus** con i18n ES/EN

---

## v1.8.0 — Billing, PDFs, Ubicación & CI/CD (2026-02-19)

### Features
- **Billing con Stripe** — checkout, portal de clientes, webhooks, límites de uso por plan
- **Motor de PDF** con pdfme — templates, editor visual, herramienta MCP `generate_pdf`
- **Campo de ubicación** — selector Leaflet/OSM, proxy de geocoding, almacenamiento lat/lng/dirección
- **Motor de flows** — triggers + steps como metadata, CRUD + toggle
- **Almacenamiento de archivos** con abstracción FlyDrive + herramienta MCP `upload_file`
- **Integridad referencial JSONB** — validar relaciones + acciones onDelete
- **Log de ejecución de reglas** para debugging
- **Registro de plugins de campos** — sistema extensible
- **Login con invitación** — cuenta no existente solicita código
- **Landing page i18n** — selector de idioma + traducciones

### Infraestructura
- **CI/CD con GitHub Actions** — pipeline test → build → deploy con smoke tests
- **`.env` desde GitHub Secrets** en cada deploy
- Fix de compatibilidad PM2 + Bun

### Perfiles de herramientas MCP
- **core** (28 herramientas): +`generate_pdf`, +`upload_file`
- **advanced** (38 herramientas): +`create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`

---

## v1.7.2 — Scheduling, Importación CSV & Hotfixes (2026-02-17)

### Features
- **Scheduling con rrule.js** — disponibilidad, slots y agregados por rango de fechas
- **Importación CSV** con preview y coerción de tipos
- **Cola de jobs** con SKIP LOCKED y acciones de reglas async
- **Branding de tenant** — appName, logoUrl, primaryColor
- **Publicación de apps** — link de instalación, UI en dashboard
- **Estados vacíos rediseñados** con i18n

### Fixes
- Permitir subdominios `*.sites.fyso.dev` en CORS
- Consistencia de cards — página de usuarios tabla→cards
- Archivado de tenant (soft delete) con diálogo de confirmación
- Auditoría mobile responsive — 11 vistas corregidas para 375px+
- Unificación de idioma UI — i18n páginas de reset password

---

## v1.7.1 — Polish de UI (2026-02-17)

- Corrección de 5 bugs visuales en batch de polish de UI

---

## v1.7.0 — Seguridad + Developer Skills (2026-02-17)

### Seguridad
- **Autorización por roles** para gestión de usuarios de tenant
- **Hardening de seguridad** — CORS, cookies, body limit, validación de schema, JWT audience, propiedad de tenant, rate limit
- **Prevención de SQL injection** — parametrizar SQL de embeddings
- **Guard de acceso cross-tenant** via header `X-Tenant-Slug`
- **Configuración de pool de conexiones PostgreSQL**

### Features
- **Agente fyso-architect** + skill `/fyso-publish`
- **Skills base** — `/fyso-new-app`, `/fyso-add-entity`, `/fyso-deploy`
- **Paquete `@fyso/ui`** extraído
- **Prebuilds dinámicos** — tabla `app_catalog` en DB
- `generate_business_rule` acepta DSL JSON como input principal

---

## v1.6.0 — Auth, i18n & Developer Experience (2026-02-17)

### Features
- **Login con email+contraseña** — independencia de Google OAuth
- **Códigos de invitación** respaldados en DB para beta cerrada
- **Flujo de reset de contraseña** con token por email
- **Emails transaccionales** — bienvenida + invitación via Resend
- **Setup de i18n** con next-intl para localización del frontend
- **Perfiles de herramientas MCP** — reducir superficie para nuevos builders
- **Plugin de Claude Code** para el servidor MCP de Fyso

### Mejoras
- Descripciones de herramientas MCP traducidas al inglés
- Mensajes de error de API en inglés

---

## v1.5.0 — Landing para Builders (2026-02-17)

- Landing page orientada a builders
- Roadmaps, design brief y ADR para planificación de beta

---

## v1.4.0 — Panel de Builder (2026-02-16)

- Panel de builder wave 1 — layout shell, command palette, rediseño de dashboard
- Panel de builder wave 2 — páginas
- Herramientas de desarrollo en el panel de builder (wave 3)

---

## v1.3.0 — Prebuilds & Búsqueda (2026-02-15)

### Features
- Apps prebuild: freelancer/consultora, Taller/Servicio técnico, Tienda retail
- **Exportación CSV** para cualquier entidad
- **Búsqueda de texto** en tablas de entidades
- **Búsqueda híbrida** + umbral de similitud para búsqueda semántica
- Onboarding web — formulario guiado + auto-provisioning
- **Acciones after_save** para actualizaciones cross-entity en reglas
- Herramienta MCP `list_users`
- **Sentry** para tracking de errores en API y frontend
- Backups automáticos de PostgreSQL con retención y alertas
- Middleware de rate limiting
- Date picker con shadcn Calendar
- Theming de tenant — nombre del negocio + color primario
- Tracking de eventos internos para analíticas de beta

### Fixes
- Orden funcional en DynamicTable
- Info de expiración de token de deploy + permisos de canal por defecto
- Fix de JWT audience mismatch en MCP

---

## v1.2.0 — Motor de Reglas (2026-02-14)

### Features
- **Lookup & aggregate cross-entity en motor de reglas** — campos lookup leen valores de entidades relacionadas, campos aggregate calculan `count()` y `sum()`
- **Auto-creación de admin** en primer login con Google con sistema de códigos de invitación
- Landing page agregada

---

## v1.1.0 — Login con Google (2026-02-14)

- Auto-creación de cuenta admin en primer login con Google con código de invitación
- Nuevo endpoint `POST /google-register`

---

## v1.0.0 — Primera Release (2026-02-14)

**Primera release pública de Fyso.**

### Features
- **Autenticación OAuth 2.1** — flujo de código de autorización con PKCE S256, tokens JWT RS256, rotación de refresh tokens
- **Hosting de sitios estáticos** — `*.sites.fyso.dev` con HTTPS automático via Caddy
- **Upload multipart** para sitios estáticos
- **Sistema de channel tools**
- **Infraestructura QA basada en Docker**
- **CI con GitHub Actions**

Pipeline: Centinela → Cero → Crisol → Lupa → Pulso
