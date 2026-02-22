# Changelog

Historial de cambios de la plataforma Fyso.

---

## Sin publicar

### Nuevas funcionalidades

#### Sitio de documentación en docs.fyso.dev
- **`docs.fyso.dev`** es ahora la URL oficial de la documentación. (#532)
- **`fyso.dev`** y **`www.fyso.dev`** sirven la landing page. El Navbar y Footer incluyen un link visible a `docs.fyso.dev`. (#532)

#### Instancia dedicada: información de aislamiento en `/health/detailed`
- El endpoint `/health/detailed` ahora devuelve campos extendidos de aislamiento: `instance.id`, `instance.uptime_seconds`, `instance.region`, `database.type`, `security.network_isolation`, `security.public_db_access`. Permite verificar el estado de aislamiento de instancias Enterprise desde cualquier cliente HTTP. (#524)
- Script `rollback.sh` para revertir una instancia dedicada a un tag de imagen anterior con verificación de salud. (#524)
- Imágenes Docker (`fyso-api`, `fyso-mcp`, `fyso-migrate`) publicadas automáticamente en GHCR en cada push a `main` y en tags semver. (#524)

### Correcciones

#### Entidades y registros
- **Entidades draft nunca publicadas visibles vía API** — `getEntityByName` ahora retorna `null` para drafts sin `publishedVersion` cuando `includeDrafts=false`. Antes, una entidad recién creada (nunca publicada) pasaba el guard y era accesible por la API de registros. (#533)

---

## v0.4.0 — 2026-02-21

### Nuevas funcionalidades

#### Base de conocimiento / RAG
- **`upload_document`, `search_knowledge`, `list_documents`, `get_document`, `delete_document`, `get_knowledge_stats`** — 6 nuevas MCP tools para operar una base de conocimiento vectorial por tenant. Los agentes pueden ingestar texto, URLs, PDFs y HTML, buscar por similitud semántica y consultar estadísticas. (#378 #379 #508)
- **Página de administración `/knowledge`** en el panel web: estadísticas, listado de documentos con estado, panel de búsqueda semántica y formulario de carga. (#497)
- **Ingesta de PDF y HTML** — la fase 2 del motor RAG agrega soporte para `application/pdf` (via `pdf-parse`) y `text/html` (via `htmlparser2`). (#508)
- **Analíticas de búsqueda** — cada llamada a `searchKnowledge()` registra un evento de analytics para identificar consultas frecuentes y medir cobertura. (#508)

#### Webhooks
- **Webhooks para eventos de entidades** — suscribirse a `created`, `updated`, `deleted` en cualquier entidad. Entrega via HTTP POST con firma HMAC-SHA256, reintentos automáticos (hasta 5 con backoff exponencial) y log de entregas. (#331)
- **MCP tools**: `create_webhook`, `list_webhooks`, `delete_webhook` (perfil `advanced`). (#331)
- **Página de administración `/settings/webhooks`** — crear subscripciones, ver historial de entregas, activar/desactivar. (#499)

#### RBAC — Roles y permisos
- **Sistema de roles por tenant** — cada tenant tiene 3 roles del sistema (`admin`, `editor`, `viewer`) y puede crear roles personalizados con permisos granulares. (#377)
- **MCP tools**: `list_roles`, `create_role`, `assign_role`, `revoke_role` (perfil `advanced`). (#402)
- **Control de acceso en rutas de management** — todas las rutas de management aplican el rol mínimo requerido. (#471)

#### Filtros compuestos en `query_records`
- **AND/OR en el parámetro `filter`** — `"status = active AND category = food"`, `"status = active OR status = pending"`. AND tiene precedencia sobre OR. Retrocompatible con filtros simples. (#318)
- **Comparaciones de fecha** — `"fecha >= 2026-02-01 AND fecha <= 2026-02-28"`. (#318)

#### Nueva MCP tool: `add_field`
- **`add_field`** (perfil `core`) — agrega un campo a una entidad publicada en un solo paso (obtener → agregar → republicar). Más simple que `manage_custom_fields` para el caso común. (#320)

#### `resolve_depth` en `query_records`
- **Parámetro `resolve_depth`** (default: 1, máx: 3) — con `depth=2` o mayor, las relaciones anidadas se resuelven recursivamente. (#320)

#### Dominios personalizados para sites estáticos (Pro)
- Los usuarios Pro pueden mapear un dominio propio (`app.miempresa.com`) a su subdominio `*.sites.fyso.dev` via CNAME o TXT. Verificación DNS automática. (#329)

#### Deploy tokens persistentes para CI/CD
- **`generate_deploy_token`** (MCP tool, perfil `advanced`) — genera un token persistente reutilizable (`fyso_dt_...`) y devuelve un workflow de GitHub Actions listo para copiar, con detección automática del framework (Astro, Vite, Next.js, Nuxt, Gatsby, Hugo). (#334)

#### `create_pdf_template`
- **`create_pdf_template`** (perfil `core`) — genera automáticamente una plantilla pdfme a partir de los nombres de campo. Crea la entidad `_fyso_pdf_templates` si no existe. Retorna un `templateId` para usar con `generate_pdf`. (#327)

#### Perfiles de herramientas por usuario
- **`tool_profile` por usuario** (`core`/`advanced`/`all`, default `core`) — cada `adminUser` puede tener su propio perfil. Jerarquía: perfil del usuario > `FYSO_TOOLS` env > default. (#317)

#### Especificación OpenAPI 3.1 auto-generada
- **`GET /api/openapi.json`** — spec OpenAPI 3.1 generada dinámicamente desde el metadata del tenant. Incluye endpoints CRUD por entidad, esquemas de campos y métodos de autenticación. (#376)

#### Rate limiting por API key
- Límites por plan: Free 60 req/min, Pro 300 req/min, Beta 600 req/min.
- Headers estándar: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Policy`. (#376)
- Rate limiting por tenant en rutas de entidades/metadata/reglas: 200 req/min. (#375)
- Cuota mensual de API requests según plan con respuesta `402 Payment Required` al superarla. (#375)

#### Billing vinculado al builder (Shopify Partners model)
- El plan pertenece al `adminUser`, no al tenant. Un builder puede tener múltiples tenants bajo un mismo plan. (#492)
- Nuevos tiers: Free, Pro, Enterprise. Cuotas de entidades, registros, storage, API requests y sitios estáticos por plan. (#492)

#### Despliegue dedicado para Enterprise
- Los tenants Enterprise pueden tener una instancia API dedicada (`dedicated_api_url`). El panel web detecta el tipo de deployment y enruta las llamadas API correctamente. (#381 #382)

#### Verificación de email
- Los usuarios registrados con contraseña reciben un email de verificación. Google login se verifica automáticamente. Endpoints: `GET /auth/verify-email`, `POST /auth/resend-verification`. (#327 #395)

#### Estadísticas de pgvector en dashboard
- Nuevo endpoint `GET /api/metadata/embeddings/stats` con estado de la extensión pgvector, versión, conteo de embeddings por estado. Visible en el dashboard. (#333)

#### Metering de uso
- Contadores atómicos de `api_requests`, `mcp_tool_calls`, storage y geocode por tenant por período de facturación. Log inmutable para auditoría. (#332)
- `GET /api/billing/usage` y `GET /api/usage` devuelven porcentajes de uso. (#375)

#### Descripción en MCP tools para Anthropic Connectors
- Todas las MCP tools tienen `annotations` de seguridad per MCP spec 2025-03-26 para el Connectors Directory de Anthropic. (#386)
- `manifest.json` y archivos de marketplace agregados para sumisión a directorios MCP. (#390)

#### Hints de renderización en `get_entity_schema`
- Cada campo en la respuesta de `get_entity_schema` incluye `renderingHint` con HTML template, dependencias CSS/JS y notas para generación de sites estáticos. Cubre: location (mapa Leaflet), file (enlace de descarga/imagen), select, boolean, date, email, phone, textarea, number, relation. (#324)

---

### Correcciones

#### Seguridad
- **SSRF hardening** — `validateExternalUrl()` ahora bloquea representaciones de IP no estándar: decimal (`2130706433`), octal (`0177.0.0.1`), IPv6-mapped (`::ffff:127.0.0.1`), IPv6 privadas (fc00::/7, fe80::/10). Aplicado en webhooks, knowledge URL ingestion, flujos `http_callback` y `http_request`. (#465 #468 #485 #486 #498)
- **Exposición de contraseñas** — `validateSession()` y `getAdminById()` usan selección explícita de columnas. `/api/auth/me` filtra campos internos del tenant. (#469)
- **Aislamiento de tenant en el motor de reglas** — nombres de schema validados con regex `^[a-z][a-z0-9_]*$` para prevenir SQL injection via `lookup`/`aggregate`. (#487)
- **Inyección SQL en `manage_custom_fields`** — `fieldKey` validado contra patrón SQL identifier. (#470)
- **Secreto de webhook devuelto en texto plano** — los endpoints de webhooks ahora retornan el secreto enmascarado (`wh_secret_****`). Solo visible en el momento de creación. (#426)
- **Namespace `_fyso_` protegido** — los tenants no pueden crear entidades con prefijo `_fyso_`. (#420)

#### MCP y reglas de negocio
- **Preferencias MCP persisten entre reinicios** — `bot_name` y `tenant_slug` se guardan en la tabla `mcp_user_preferences` en lugar de en memoria. (#372)
- **`list_business_rules` no retornaba para entidades sin reglas** — route `/:entityName/logs` estaba siendo capturada por `/:entityName/:ruleId`. (#404)
- **Timeout de regla ya no bypassea validación** — retorna `__timeout__` como error en lugar de un array vacío. (#470)
- **División por cero en fórmulas** — `Infinity`, `-Infinity` y `NaN` se convierten en error en lugar de propagarse silenciosamente. (#489)
- **`update_related` en reglas propaga errores** — antes los fallos se ignoraban silenciosamente. (#477)
- **`generatedBy` en tools de reglas** — `create_business_rule` y `generate_business_rule` ahora envían `generatedBy: 'ai'` (el API solo acepta `'user'`|`'ai'`). (#521)

#### Sites estáticos y deploy
- **Error 500 en redeploy** — el chequeo de billing estaba fuera del bloque try/catch. (#352)
- **Error 413 en deploy** — middleware unificado aplica 75 MB para rutas de deploy, 10 MB para files, 1 MB para el resto. (#355)
- **`deploy_static_site` modo remoto** — ya no sugiere `curl`; guía al agente a usar `bundle_base64`. (#321)

#### Entidades y registros
- **Eliminación de entidad con registros falla con FK constraint** — `DROP TABLE` incluye `CASCADE`. (#490)
- **Eliminación bloqueada si hay registros** — `deleteEntity()` verifica que la entidad esté vacía antes de eliminar. (#476)
- **Publicación concurrente crea snapshots duplicados** — `publish()` usa `SELECT FOR UPDATE` en transacción. (#475)
- **Unicidad de tenant slug** — se agrega sufijo hex de 5 caracteres para evitar colisiones. (#490)
- **Validación de nombre de entidad** — rechaza nombres no alfanuméricos, con guión bajo inicial, o palabras reservadas de SQL. (#473)

#### PDF
- **`create_pdf_template` falla después del rename de entidades `_fyso_`** — el tool ahora usa el nombre correcto `_fyso_pdf_templates`. (#421)
- **`template_json` enviado como objeto** — serializado a string antes de enviarlo al endpoint de records. (#512)

#### Base de conocimiento
- **Chunks huérfanos en fallo de ingesta** — inserciones envueltas en transacción. (#478)
- **Sin reintento sin re-upload** — el contenido raw se guarda antes de iniciar la ingesta. (#478)

#### Otros
- **Reintentos en fallos de serialización PostgreSQL** — las transacciones con error 40001 o 40P01 se reintentan automáticamente (hasta 3 veces). (#505)
- **Trabajos duplicados por `after_save`** — `after_save` jobs deduplicados para evitar emails y webhooks dobles en saves concurrentes. (#480)
- **`apiRequest()` retornaba `undefined`** en DELETE y otros endpoints que responden `{success: true}` sin `.data`. (#491)
- **Rate de tokens MCP** — TTL de tokens de acceso aumentado de 1h a 24h para sesiones MCP largas. (#315)
- **Variable de entorno `APP_URL`** — `FRONTEND_URL` y `APP_BASE_URL` se unifican en `APP_URL`. Los valores anteriores aún funcionan como fallback. (#319)
- **Plan limits en generación de entidades y CSV import** — `POST /api/generate/entity` y el endpoint de CSV import ahora verifican cuotas. (#322)

---

## v0.3.0 — 2026-01-17

### Nuevas funcionalidades

- **`get_rule_logs`** MCP tool — consulta logs de ejecución de reglas de negocio con filtros por status, regla, registro y rango de fechas. Perfil `advanced`. (#323)
- **Hints de estructura en `get_entity_schema`** — `structureHint` para campos `location`, `file` y `select`: documenta el objeto esperado y las opciones de configuración. (#316)
- **Validación de opciones en campo `select`** — valores fuera de `config.options` son rechazados en el backend. (#316)
- **Campo auto-display al generar entidades** — el primer campo de texto se establece automáticamente como `displayField`. (#325)
- **Panel admin de super admin** — endpoints en `/api/admin/platform/*` con autenticación `fyso_sa_*`. Estadísticas, gestión de tenants y usuarios. (#341)
- **MCP tools de super admin** — `list_all_tenants`, `get_tenant_details`, `suspend_tenant`. (#342)

---

## v0.2.0 — 2025-12-20

Ver [changelog v0.2.0](https://github.com/fyso-dev/fyso_backend/releases/tag/v0.2.0).
