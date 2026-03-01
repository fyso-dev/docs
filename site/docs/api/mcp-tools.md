---
sidebar_position: 2
---

# MCP Tools Reference

Complete reference of all available MCP tools, grouped by category.

Configure which tools are exposed with the `FYSO_TOOLS` environment variable. See [Tool Profiles](tool-profiles.md).

---

## Tenant

| Tool | Profile | Description |
|------|---------|-------------|
| `list_tenants` | core | Listar tenants accesibles |
| `select_tenant` | core | Seleccionar tenant activo para operaciones posteriores |

---

## Entities

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_entity` | core | Crear entidad con campos a partir de definicion JSON |
| `list_entities` | core | Listar entidades (opcionalmente incluir borradores) |
| `get_entity_schema` | core | Obtener definicion completa de la entidad y lista de campos |
| `publish_entity` | core | Publicar version de entidad con mensaje |
| `discard_entity_draft` | core | Descartar borrador de entidad. Si nunca fue publicada, se elimina. Si es un re-draft, revierte al ultimo snapshot publicado |
| `add_field` | core | Agregar campo a una entidad publicada. Maneja el ciclo completo: crea borrador, agrega el campo y re-publica automaticamente |
| `delete_entity` | advanced | Eliminar entidad y todos sus registros (irreversible) |
| `list_entity_changes` | advanced | Ver historial de versiones |
| `manage_custom_fields` | advanced | Agregar, actualizar o eliminar campos personalizados |

---

## Records

| Tool | Profile | Description |
|------|---------|-------------|
| `query_records` | core | Consultar registros con filtros, paginacion, ordenamiento y busqueda semantica |
| `create_record` | core | Crear un nuevo registro |
| `update_record` | core | Actualizar parcialmente un registro |
| `delete_record` | core | Eliminar un registro |

---

## Views

| Tool | Profile | Description |
|------|---------|-------------|
| `create_view` | core | Crear una vista filtrada de entidad con permisos RBAC independientes |
| `list_views` | core | Listar todas las vistas de entidades en el tenant actual |
| `update_view` | core | Actualizar nombre, descripcion, filtro o estado activo de una vista |
| `delete_view` | core | Eliminar una vista de entidad |

---

## Business Rules

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_business_rule` | core | Generar y crear una regla a partir de lenguaje natural o DSL JSON |
| `list_business_rules` | core | Listar reglas de una entidad |
| `publish_business_rule` | core | Publicar regla (solo las reglas publicadas se ejecutan) |
| `create_business_rule` | advanced | Crear regla a partir de definicion DSL explicita |
| `get_business_rule` | advanced | Obtener definicion completa de una regla |
| `test_business_rule` | advanced | Probar regla con datos de ejemplo sin guardar |
| `delete_business_rule` | advanced | Eliminar una regla |
| `get_rule_logs` | advanced | Ver logs de ejecucion de una regla |

---

## RBAC (Roles y Permisos)

| Tool | Profile | Description |
|------|---------|-------------|
| `list_roles` | core | Listar roles definidos en el tenant |
| `create_role` | core | Crear un nuevo rol con permisos |
| `assign_role` | core | Asignar un rol a un usuario |
| `revoke_role` | core | Revocar un rol de un usuario |

---

## Users

| Tool | Profile | Description |
|------|---------|-------------|
| `create_user` | core | Crear usuario de tenant con rol y permisos |
| `list_users` | core | Listar usuarios en el tenant |
| `update_user_password` | core | Restablecer contrasena de cualquier usuario (operacion admin, no requiere contrasena actual) |
| `tenant_login` | advanced | Autenticarse como usuario de tenant, retorna JWT |

---

## Files

| Tool | Profile | Description |
|------|---------|-------------|
| `upload_file` | core | Subir un archivo, retorna metadatos del archivo almacenado |

---

## PDF

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_pdf` | core | Generar PDF a partir de plantilla y datos de registro |
| `create_pdf_template` | core | Crear una plantilla PDF |

---

## Static Sites

| Tool | Profile | Description |
|------|---------|-------------|
| `deploy_static_site` | core | Desplegar sitio estatico en `*-sites.fyso.dev` |
| `list_static_sites` | core | Listar sitios desplegados |
| `delete_static_site` | advanced | Eliminar un sitio |
| `generate_deploy_token` | advanced | Generar token de deploy persistente y reutilizable para CI/CD, con workflow de GitHub Actions listo para usar |
| `set_custom_domain` | advanced | Agregar, verificar, consultar o eliminar un dominio personalizado para un sitio (Pro) |

---

## API

| Tool | Profile | Description |
|------|---------|-------------|
| `get_rest_api_spec` | core | Obtener spec OpenAPI para las entidades del tenant |
| `generate_api_client` | core | Generar codigo de cliente API en un lenguaje dado |

---

## Metadata

| Tool | Profile | Description |
|------|---------|-------------|
| `export_metadata` | core | Exportar estructura del tenant (entidades, campos, reglas) como JSON |
| `import_metadata` | core | Importar JSON de metadata en el tenant |

---

## Apps

| Tool | Profile | Description |
|------|---------|-------------|
| `publish_app` | core | Publicar tenant como app instalable |
| `unpublish_app` | core | Despublicar app |
| `update_app` | core | Actualizar nombre, descripcion o refrescar metadata de la app |

---

## Scheduling

| Tool | Profile | Description |
|------|---------|-------------|
| `get_available_slots` | core | Obtener horarios disponibles para un profesional |
| `create_booking` | core | Crear una reserva en un horario disponible |

---

## Secrets

| Tool | Profile | Description |
|------|---------|-------------|
| `set_secret` | advanced | Almacenar un secreto cifrado para uso en flows |
| `delete_secret` | advanced | Eliminar un secreto almacenado |

---

## Flows

| Tool | Profile | Description |
|------|---------|-------------|
| `create_flow` | advanced | Crear un flow de automatizacion con triggers y pasos |
| `list_flows` | advanced | Listar flows en el tenant |
| `update_flow` | advanced | Actualizar definicion de un flow |
| `delete_flow` | advanced | Eliminar un flow |
| `toggle_flow` | advanced | Activar o desactivar un flow |

---

## Webhooks

| Tool | Profile | Description |
|------|---------|-------------|
| `create_webhook` | advanced | Suscribirse a eventos de registros de entidad (created/updated/deleted) |
| `list_webhooks` | advanced | Listar suscripciones de webhooks, opcionalmente filtrados por entidad |
| `delete_webhook` | advanced | Eliminar una suscripcion de webhook |

---

## Knowledge Base

| Tool | Profile | Description |
|------|---------|-------------|
| `upload_document` | core | Subir documento para indexacion RAG (PDF, HTML, texto, markdown, URL) |
| `search_knowledge` | core | Busqueda semantica en documentos indexados. Soporta `one_per_document`, `threshold`, `document_ids` |
| `list_documents` | core | Listar documentos subidos con filtrado por estado |
| `get_document` | core | Obtener metadata, contenido y preview de chunks del documento |
| `delete_document` | core | Eliminar un documento y todos sus chunks (registrado via evento `knowledge_delete`) |
| `get_knowledge_stats` | core | Obtener estadisticas de indexacion, analytics de busqueda y uso de tokens de embedding (ventana de 30 dias) |

---

## Usage

| Tool | Profile | Description |
|------|---------|-------------|
| `get_usage` | core | Obtener metricas de uso actuales y limites del plan para el tenant seleccionado. Retorna entidades, registros, sitios, usuarios, requests API, llamadas MCP, almacenamiento y geocodificacion del periodo de facturacion actual |

---

## Channels

### Discovery (Consumer)

Estas tools permiten buscar y consumir channels publicados por otros tenants.

| Tool | Profile | Description |
|------|---------|-------------|
| `search_channels` | all | Buscar channels publicos por texto y/o tags |
| `get_channel_info` | all | Obtener informacion detallada de un channel especifico |
| `get_channel_tools` | all | Listar tools disponibles en un channel con sus input schemas |
| `execute_channel_tool` | all | Ejecutar una tool personalizada de un channel. Realiza triple autorizacion y opera sobre datos del owner del channel |

### Management (Owner)

Estas tools permiten publicar y administrar tu propio channel.

| Tool | Profile | Description |
|------|---------|-------------|
| `get_my_channel` | all | Obtener el channel del tenant actual. Retorna el channel sin importar su estado activo |
| `publish_channel` | all | Publicar tu tenant como channel publico con nombre, descripcion y tags |
| `update_channel` | all | Actualizar metadata del channel (nombre, descripcion, tags). Requiere ser owner |
| `unpublish_channel` | all | Despublicar channel del catalogo publico (soft delete, reversible) |
| `set_channel_permissions` | all | Configurar permisos del channel con nivel de acceso por defecto y reglas opcionales por entidad |

### Channel Tools (Owner)

Estas tools permiten definir tools personalizadas dentro de tu channel usando DSL declarativo.

| Tool | Profile | Description |
|------|---------|-------------|
| `define_channel_tool` | all | Definir una tool personalizada para tu channel usando DSL declarativo. Mapea parametros a operaciones CRUD de entidades |
| `update_channel_tool` | all | Actualizar configuracion de una tool existente (descripcion, input schema o DSL). El slug no se puede cambiar |
| `remove_channel_tool` | all | Eliminar una tool personalizada del channel |

---

## Bots

Identidades persistentes para agentes que operan de forma autonoma.

| Tool | Profile | Description |
|------|---------|-------------|
| `register_bot` | all | Registrar nueva identidad de bot con nombre unico vinculado a un tenant. Retorna clave secreta para identificacion futura |
| `identify_bot` | all | Identificarse como bot registrado usando nombre y secreto. Selecciona automaticamente el tenant vinculado |
| `list_bots` | all | Listar todas las identidades de bot registradas por el usuario admin actual |
| `whoami_bot` | all | Verificar la identidad de bot actual de la sesion |
| `revoke_bot` | all | Revocar (desactivar) una identidad de bot. El bot ya no podra identificarse |

---

## Invitations

| Tool | Profile | Description |
|------|---------|-------------|
| `generate_invitation_code` | all | Generar un codigo de invitacion para acceso beta. Formato FYSO-XXXX-XXXX con limite de usos configurable |
| `list_invitation_codes` | all | Listar todos los codigos de invitacion con estadisticas de uso |
