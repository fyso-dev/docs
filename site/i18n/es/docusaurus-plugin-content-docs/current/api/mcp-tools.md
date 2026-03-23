---
sidebar_position: 2
---

# Referencia de herramientas MCP

Referencia completa de todas las herramientas MCP disponibles.

El servidor MCP expone **10 herramientas agrupadas** (cada una con un parametro `action` tipo enum), mas `fyso_welcome` para onboarding. Configura que herramientas se exponen con la variable de entorno `FYSO_TOOLS`. Ver [Perfiles de herramientas](tool-profiles.md).

## Como funcionan las herramientas agrupadas

Cada herramienta agrupada acepta un parametro `action` que selecciona la operacion. Los parametros adicionales dependen de la accion elegida. Ejemplo:

```
fyso_data({ action: "create", entity: "tasks", data: { title: "Fix bug" } })
fyso_data({ action: "query", entity: "tasks", filters: "status = open" })
fyso_auth({ action: "list_tenants" })
```

---

## `fyso_data` — Registros y turnos

Operaciones CRUD sobre registros y scheduling.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `create` | Crear un nuevo registro | `entity`, `data` |
| `query` | Buscar/filtrar registros | `entity` |
| `update` | Modificar un registro | `entity`, `id`, `data` |
| `delete` | Eliminar un registro | `entity`, `id` |
| `create_booking` | Reservar un turno | `professional_id`, `date`, `time` |
| `get_slots` | Slots de scheduling disponibles | `professional_id`, `date` |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `entity` | string | create, query, update, delete | Nombre de la entidad |
| `data` | object | create, update | Datos del registro |
| `id` | string | update, delete | ID del registro |
| `filters` | string | query | Expresion de filtro. Operadores: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`. Combinar con `AND` (OR no soportado en servidor). Ejemplo: `estado = activo AND nombre contains juan` |
| `sort` | string | query | Campo para ordenar |
| `order_dir` | `asc` \| `desc` | query | Direccion de orden |
| `limit` | number | query | Max registros (default: 50, max: 200) |
| `offset` | number | query | Offset de paginacion |
| `semantic` | string | query | Busqueda semantica en lenguaje natural |
| `min_similarity` | number | query | Umbral de similitud 0-1 para busqueda semantica |
| `resolve_depth` | number | query | Profundidad de resolucion de relaciones 1-3 (default: 1) |
| `professional_id` | string | create_booking, get_slots | UUID del profesional |
| `patient_id` | string | create_booking | UUID del paciente/cliente |
| `date` | string | create_booking, get_slots | Fecha YYYY-MM-DD |
| `time` | string | create_booking | Hora HH:MM |
| `duration` | number | create_booking | Duracion en minutos |
| `notes` | string | create_booking | Notas del turno |
| `from` | string | get_slots | Inicio del rango YYYY-MM-DD |
| `to` | string | get_slots | Fin del rango YYYY-MM-DD |

---

## `fyso_schema` — Entidades y campos

Gestionar entidades, campos y versionado de schema.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `list` | Listar entidades | — |
| `get` | Obtener schema de entidad | `entityName` |
| `add_field` | Agregar campo a entidad publicada | `entityName`, `field` o parametros inline |
| `manage_fields` | CRUD campos personalizados | `entityName` |
| `generate` | Crear entidad desde definicion | `definition` |
| `publish` | Publicar borrador de entidad | `entityName` |
| `discard` | Descartar borrador | `entityName` |
| `delete` | Eliminar entidad (irreversible) | `entityName`, `confirm: true` |
| `list_changes` | Cambios de schema pendientes | — |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `entityName` | string | get, add_field, manage_fields, publish, discard, delete | Nombre de la entidad |
| `include_drafts` | boolean | list | Incluir entidades en borrador |
| `include_published` | boolean | list_changes | Incluir publicadas sin cambios pendientes |
| `version` | string | get | Version a obtener: numero, `draft` o `published` |
| `field` | object | add_field, manage_fields | Definicion del campo: `{ name, fieldKey, fieldType, isRequired?, isUnique?, description?, config? }` |
| `field_action` | `list` \| `add` \| `update` \| `delete` | manage_fields | Sub-accion para campos personalizados |
| `field_type` | `custom` \| `system` \| `all` | manage_fields | Filtro de tipo de campo |
| `fieldId` | string | manage_fields | ID del campo para update/delete |
| `definition` | object | generate | Definicion de entidad: `{ entity: { name, displayName?, description? }, fields: [{ name, fieldKey, fieldType, ... }] }` |
| `auto_publish` | boolean | generate | Auto-publicar despues de generar (requiere `version_message`) |
| `version_message` | string | publish, generate | Mensaje de version |
| `confirm` | boolean | delete | Debe ser `true` para confirmar eliminacion |
| `fieldType` | string | add_field | Tipo de campo: `text`, `textarea`, `number`, `email`, `phone`, `date`, `boolean`, `select`, `relation`, `file`, `location` |

---

## `fyso_rules` — Reglas de negocio

Crear, testear, publicar y gestionar reglas de negocio.

**Requerido:** `action` y `entityName` para todas las acciones.

| Accion | Descripcion | Parametros adicionales requeridos |
|--------|-------------|----------------------------------|
| `create` | Crear regla desde DSL | `name`, `triggerType`, `rule` |
| `get` | Detalles de la regla | `ruleId` |
| `list` | Listar reglas | — |
| `publish` | Activar regla en borrador | `ruleId` |
| `delete` | Eliminar regla | `ruleId` |
| `test` | Dry-run con datos de prueba | `ruleId`, `testData` |
| `logs` | Historial de ejecucion | `ruleId` |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `entityName` | string | todos | Entidad a la que pertenece la regla |
| `ruleId` | string | get, publish, delete, test, logs | ID de la regla |
| `name` | string | create | Nombre de la regla |
| `description` | string | create | Descripcion de la regla |
| `triggerType` | `field_change` \| `before_save` \| `after_save` \| `on_load` | create | Cuando se dispara la regla |
| `triggerFields` | string[] | create | Campos que disparan la regla |
| `rule` | object | create | DSL de la regla con compute/validate/transform/actions |
| `ruleDsl` | object | create | Alias de `rule` |
| `priority` | number | create | Prioridad de ejecucion, menor = primero (default: 100) |
| `auto_publish` | boolean | create | Auto-publicar despues de crear |
| `include_drafts` | boolean | list | Incluir reglas en borrador |
| `testData` | object | test | Datos de prueba para dry-run |
| `limit` | number | logs | Max entradas de log |

---

## `fyso_auth` — Usuarios, roles y tenants

Gestion de usuarios, RBAC y operaciones de tenant.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `create_user` | Crear usuario de tenant | `email`, `password`, `name` |
| `list_users` | Listar usuarios del tenant | — |
| `update_password` | Resetear contrasena | `userId`, `password` |
| `create_role` | Crear rol con permisos | `name`, `permissions` |
| `list_roles` | Listar roles | — |
| `assign_role` | Asignar rol a usuario | `userId`, `roleId` |
| `revoke_role` | Revocar rol de usuario | `userId`, `roleId` |
| `login` | Autenticarse como usuario de tenant | `tenantSlug`, `email`, `password` |
| `list_tenants` | Listar tenants accesibles | — |
| `select_tenant` | Seleccionar tenant activo | `tenantSlug` |
| `create_tenant` | Crear un nuevo tenant (cuota por plan: free=1, pro=5) | `name` |
| `generate_invitation` | Generar codigo de invitacion beta (FYSO-XXXX-XXXX) | — |
| `list_invitations` | Listar codigos de invitacion con estadisticas de uso | — |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `email` | string | create_user, login | Email del usuario |
| `name` | string | create_user, create_role | Nombre del usuario o rol |
| `password` | string | create_user, update_password, login | Contrasena |
| `userId` | string | update_password, assign_role, revoke_role | ID del usuario |
| `roleId` | string | assign_role, revoke_role | ID del rol |
| `permissions` | object | create_role | Objeto de permisos del rol |
| `description` | string | create_role | Descripcion del rol |
| `tenantSlug` | string | create_user, login, select_tenant, update_password | Slug del tenant. `select_tenant` soporta coincidencia por prefijo — si no hay coincidencia exacta, auto-selecciona cuando hay una sola coincidencia por prefijo. |
| `note` | string | generate_invitation | Nota para el codigo de invitacion |
| `maxUses` | number | generate_invitation | Numero maximo de usos |
| `expiresAt` | string | generate_invitation | Fecha de expiracion ISO 8601 |

---

## `fyso_views` — Vistas de entidades

Gestionar vistas filtradas de entidades con permisos RBAC independientes.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `create` | Crear una nueva vista | `entitySlug`, `slug`, `name` |
| `list` | Listar todas las vistas | — |
| `update` | Modificar una vista | `slug` |
| `delete` | Eliminar una vista | `slug` |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `entitySlug` | string | create | Entidad base de la vista |
| `slug` | string | create, update, delete | Identificador slug de la vista |
| `name` | string | create, update | Nombre de la vista |
| `description` | string | create, update | Descripcion de la vista |
| `filterDsl` | object | create, update | Definicion de filtro: `{ validate: [{ condition: 'field == value' }] }` |
| `isActive` | boolean | update | Habilitar/deshabilitar la vista |

---

## `fyso_knowledge` — Base de conocimiento

Busqueda en la base de conocimiento del tenant y documentacion de la plataforma Fyso.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `search` | Busqueda semantica en conocimiento del tenant | `query` |
| `stats` | Metricas de la base de conocimiento | — |
| `search_docs` | Buscar en docs de la plataforma Fyso | `query` |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `query` | string | search, search_docs | Consulta en lenguaje natural |
| `limit` | number | search, search_docs | Max resultados (search: default 5, max 20; search_docs: default 5, max 10) |
| `threshold` | number | search | Similitud minima 0-1 (default: 0.3) |
| `document_ids` | string[] | search | Filtrar por IDs de documentos |
| `one_per_document` | boolean | search | Solo el mejor fragmento por documento |
| `metadata_filter` | object | search | Filtro de metadata (ej. `{ tag: 'policy' }`) |
| `topic` | string | search_docs | Filtro por tema: `api`, `entities`, `business-rules`, `deployment`, `billing`, `knowledge`, `mcp`, `rbac`, `views`, `flows`, `webhooks`, `scheduling` |

---

## `fyso_deploy` — Sitios estaticos

Publicar sitios estaticos, gestionar dominios personalizados y generar tokens de CI/CD.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `deploy` | Subir y publicar sitio | `subdomain` |
| `list` | Listar sitios activos | — |
| `delete` | Eliminar un sitio | `subdomain` |
| `set_domain` | Gestionar dominio personalizado | `subdomain` |
| `generate_token` | Token de deploy para CI/CD | `subdomain` |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `subdomain` | string | deploy, delete, set_domain, generate_token | Subdominio del sitio (ej. `my-app` -> `my-app-sites.fyso.dev`) |
| `path` | string | deploy | Ruta absoluta al directorio de build |
| `bundle_base64` | string | deploy | ZIP codificado en base64 de archivos del sitio (para MCP remoto) |
| `domain` | string | set_domain | Dominio personalizado (ej. `app.mycompany.com`) |
| `domain_action` | `add` \| `verify` \| `status` \| `remove` | set_domain | Sub-accion de dominio (default: `add`) |
| `name` | string | generate_token | Nombre del token (ej. `GitHub Actions`) |
| `expires_in_days` | number | generate_token | Expiracion del token en dias (omitir para sin vencimiento) |
| `package_json` | object | generate_token | package.json para auto-deteccion de framework |
| `framework` | string | generate_token | Override de framework: `astro`, `vite`, `next`, `nuxt`, `gatsby`, `hugo`, `default` |

---

## `fyso_meta` — API, metadata y secretos

Spec de API, generacion de clientes, import/export de metadata, secretos y metricas de uso.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `api_spec` | Spec OpenAPI de la REST API | — |
| `api_client` | Generar codigo de cliente tipado | — |
| `export` | Exportar metadata del tenant | — |
| `import` | Importar metadata | `data` |
| `usage` | Metricas de facturacion | — |
| `set_secret` | Almacenar secreto encriptado | `key`, `value` |
| `delete_secret` | Eliminar un secreto | `key` |
| `feedback` | Reportar feedback o bug | `feedback_type`, `title` |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `entities` | string[] | api_spec, api_client | Nombres de entidades (omitir para todas) |
| `includeExamples` | boolean | api_spec | Incluir ejemplos curl (default: true) |
| `language` | string | api_client | Lenguaje destino (ej. `typescript`, `python`) |
| `framework` | string | api_client | Framework destino (ej. `react`, `next`) |
| `format` | string | api_client | Formato de salida |
| `data` | string | import | JSON string de metadata a importar |
| `tenantId` | string | export, import | Override de ID/slug de tenant |
| `key` | string | set_secret, delete_secret | Nombre del secreto |
| `value` | string | set_secret | Valor del secreto (encriptado en reposo) |
| `feedback_type` | `bug` \| `suggestion` \| `question` | feedback | Categoria del feedback |
| `title` | string | feedback | Resumen corto |
| `description` | string | feedback | Descripcion detallada |
| `context` | string | feedback | Contexto adicional opcional |

---

## `fyso_agents` — Gestion de agentes

Crear, configurar y ejecutar agentes de IA. Gestionar versiones, ejecuciones y plantillas.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `list` | Listar todos los agentes | — |
| `create` | Crear un nuevo agente | `name` |
| `update` | Modificar un agente | `agentId` |
| `delete` | Eliminar un agente | `agentId` |
| `run` | Ejecutar un agente con input | `agentId`, `input` |
| `test` | Ejecutar agente en modo sandbox | `agentId`, `input` |
| `list_runs` | Listar historial de ejecuciones | `agentId` |
| `list_versions` | Listar versiones de prompt | `agentId` |
| `rollback` | Revertir a una version anterior | `agentId`, `versionId` |
| `list_templates` | Listar plantillas preset de industria | — |
| `from_template` | Crear agente desde plantilla | `templateId`, `name` |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `agentId` | string | update, delete, run, test, list_runs, list_versions, rollback | ID del agente |
| `name` | string | create, from_template | Nombre del agente |
| `input` | string | run, test | Mensaje del usuario o prompt |
| `versionId` | string | rollback | ID de la version a restaurar |
| `templateId` | string | from_template | ID de la plantilla |
| `session_id` | string | run | Continuar una sesion existente (omitir para crear nueva) |
| `memory_enabled` | boolean | create, update | Habilitar extraccion de memoria entre sesiones |
| `knowledge_enabled` | boolean | create, update | Habilitar recuperacion RAG de la base de conocimiento del tenant |
| `schedules_enabled` | boolean | create, update | Habilitar herramientas de scheduling (slots, reservas) |
| `tools_scope` | object | create, update | Herramientas por entidad: `{ "entity": ["query", "create", "update"] }` |
| `system_prompt` | string | create, update | Prompt de sistema del agente |
| `fallback_mode` | `llm` \| `message` \| `silent` | create, update | Comportamiento cuando ninguna regla deterministica coincide |
| `channels` | object[] | create, update | Configuraciones de canal (web, telegram, etc.) |

---

## `fyso_ai` — Proveedores de IA y llamadas

Configurar proveedores de IA, gestionar prompts, probar llamadas y ver logs.

| Accion | Descripcion | Parametros requeridos |
|--------|-------------|----------------------|
| `configure_provider` | Configurar proveedor de IA por defecto | `provider`, `apiKey` |
| `list_providers` | Listar proveedores configurados | — |
| `add_provider` | Agregar un proveedor adicional | `provider`, `apiKey` |
| `remove_provider` | Eliminar un proveedor | `providerId` |
| `test_call` | Probar un prompt contra un proveedor | `prompt` |
| `call_logs` | Ver historial de llamadas de IA | — |
| `debug_log` | Obtener payload de debug de una llamada | `callId` |
| `create_template` | Crear plantilla de prompt reutilizable | `name`, `prompt` |
| `list_templates` | Listar plantillas de prompt | — |
| `update_template` | Modificar una plantilla de prompt | `templateId` |
| `list_presets` | Listar presets de industria (taller, clinica, tienda) | — |
| `install_preset` | Instalar un preset de industria con entidades y agente | `preset` |
| `rate_limit_status` | Estado actual de rate limit de IA | — |
| `cost_dashboard` | Resumen de gasto en IA (semanal, mensual, proyecciones) | — |

### Parametros

| Parametro | Tipo | Usado por | Descripcion |
|-----------|------|-----------|-------------|
| `action` | string (enum) | todos | Operacion a realizar |
| `provider` | string | configure_provider, add_provider | Tipo de proveedor: `openai`, `anthropic`, o cualquier URL base compatible con OpenAI |
| `apiKey` | string | configure_provider, add_provider | API key del proveedor |
| `providerId` | string | remove_provider | ID de configuracion del proveedor |
| `model` | string | configure_provider, add_provider, test_call | Nombre del modelo (ej. `gpt-4o`, `claude-3-5-sonnet-20241022`) |
| `prompt` | string | test_call, create_template | Texto del prompt |
| `name` | string | create_template | Nombre de la plantilla |
| `templateId` | string | update_template | ID de la plantilla |
| `callId` | string | debug_log | ID de la llamada de IA (requiere configuracion `ai.debug` del tenant) |
| `limit` | number | call_logs | Max entradas de log |
| `preset` | string | install_preset | Nombre del preset: `taller`, `clinica`, `tienda` |
| `system_prompt` | string | test_call | Prompt de sistema para la llamada de prueba |
| `temperature` | number | test_call | Temperatura 0-2 |
| `max_tokens` | number | test_call | Max tokens 1-32000 |

---

## `fyso_welcome` — Onboarding

Una herramienta de conversacion de onboarding. Dado un `businessType`, propone un conjunto inicial de entidades y campos adecuados para ese negocio, y retorna pasos siguientes sugeridos. Usada por el plugin de Claude Code en la primera conexion.

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `businessType` | string | Si | Categoria del negocio (ej. `freelancer`, `clinic`, `ecommerce`, `saas`, `nonprofit`, `other`) |

Esta herramienta no acepta un parametro `action` — es una herramienta de proposito unico, no un router agrupado.

---

## Herramientas de gestion de integraciones

Estas herramientas independientes gestionan el ciclo de vida de integraciones (no agrupadas):

| Herramienta | Descripcion | Parametros requeridos |
|-------------|-------------|----------------------|
| `list_integrations` | Listar integraciones disponibles y estado | — |
| `install_integration` | Instalar una integracion | `slug` |
| `configure_integration` | Actualizar configuracion de integracion | `slug`, `config` |
| `activate_integration` | Habilitar herramientas de integracion | `slug` |
| `test_integration` | Probar conectividad | `slug` |
| `uninstall_integration` | Eliminar integracion | `slug` |
| `list_integration_logs` | Ver logs de salud | `slug` |

Las integraciones activas inyectan herramientas en los runners de agentes como `integration:<slug>:<tool-slug>`.

---

## Funciones solo via REST

Las siguientes funcionalidades estan disponibles via la [REST API](/api/rest-api) pero no se exponen como herramientas MCP:

- **Canales** — Gestion de canales de agentes (Telegram, widget web). Ver [Canales](/admin/channels).
- **Bots** — `register_bot`, `identify_bot`, `list_bots`, `whoami_bot`, `revoke_bot` (ver [Identidad de Bot](/agents/bot-identity))
- **Flows** — `create_flow`, `list_flows`, `update_flow`, `delete_flow`, `toggle_flow`
- **Webhooks** — `create_webhook`, `list_webhooks`, `delete_webhook`
- **Documentos** — `upload_document`, `list_documents`, `get_document`, `delete_document`
- **PDF** — `generate_pdf`, `create_pdf_template`
- **Apps** — `publish_app`, `unpublish_app`, `update_app`
