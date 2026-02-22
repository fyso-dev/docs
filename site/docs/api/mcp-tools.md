# Referencia completa de MCP Tools

Lista de todas las herramientas MCP disponibles en Fyso, agrupadas por categoria.

## Tenant

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `list_tenants` | core | Listar tenants accesibles |
| `select_tenant` | core | Seleccionar tenant activo para la sesion |

## Entidades

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `generate_entity` | core | Crear entidad con campos desde JSON |
| `list_entities` | core | Listar entidades (publicadas o con drafts) |
| `get_entity_schema` | core | Obtener schema completo con structure hints y rendering hints |
| `publish_entity` | core | Publicar entidad draft |
| `add_field` | core | Agregar un campo a una entidad publicada en un paso |
| `delete_entity` | advanced | Eliminar entidad y registros |
| `list_entity_changes` | advanced | Historial de versiones |
| `manage_custom_fields` | advanced | CRUD completo de campos custom |

## Registros

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `query_records` | core | Consultar con filtros (incluyendo AND/OR), paginacion, busqueda semantica, `resolve_depth` |
| `create_record` | core | Crear registro |
| `update_record` | core | Actualizar registro (parcial) |
| `delete_record` | core | Eliminar registro |

## Reglas de negocio

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `generate_business_rule` | core | Crear regla (DSL o prompt) |
| `list_business_rules` | core | Listar reglas de una entidad |
| `publish_business_rule` | core | Publicar regla draft |
| `create_business_rule` | advanced | Crear regla con DSL directo |
| `get_business_rule` | advanced | Ver detalle de una regla |
| `test_business_rule` | advanced | Probar regla con datos de prueba |
| `delete_business_rule` | advanced | Eliminar regla |
| `get_rule_logs` | advanced | Logs de ejecucion con filtros por status, regla, registro y fecha |

## Usuarios y autenticacion

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `create_user` | core | Crear usuario en el tenant |
| `list_users` | core | Listar usuarios del tenant |
| `tenant_login` | advanced | Login como usuario (retorna JWT) |

## Roles y permisos (RBAC)

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `list_roles` | advanced | Listar roles del tenant |
| `create_role` | advanced | Crear rol con permisos custom |
| `assign_role` | advanced | Asignar rol a un usuario |
| `revoke_role` | advanced | Revocar rol de un usuario |

## Webhooks

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `create_webhook` | advanced | Crear subscripcion a eventos de una entidad |
| `list_webhooks` | advanced | Listar subscripciones activas |
| `delete_webhook` | advanced | Eliminar subscripcion |

## Base de conocimiento (RAG)

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `upload_document` | core | Ingestar documento (texto, URL, PDF, HTML) |
| `search_knowledge` | core | Busqueda semantica en la base de conocimiento |
| `list_documents` | core | Listar documentos ingresados |
| `get_document` | core | Ver detalle de un documento |
| `delete_document` | core | Eliminar documento |
| `get_knowledge_stats` | core | Estadisticas (total docs, chunks, storage) |

## Archivos

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `upload_file` | core | Subir archivo a un campo file (via URL o base64) |

## PDF

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `create_pdf_template` | core | Generar plantilla PDF automaticamente desde nombres de campo |
| `generate_pdf` | core | Generar PDF desde plantilla + datos |

## Sites estaticos

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `deploy_static_site` | core | Desplegar site en sites.fyso.dev |
| `list_static_sites` | core | Listar deployments activos |
| `generate_deploy_token` | advanced | Generar token persistente + workflow de GitHub Actions |
| `delete_static_site` | advanced | Eliminar site |

## API y cliente

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `get_rest_api_spec` | core | Especificacion REST con curl de ejemplo |
| `generate_api_client` | core | Generar cliente TypeScript con tipos |

## Metadata

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `export_metadata` | core | Exportar entidades, campos, reglas a JSON |
| `import_metadata` | core | Importar metadata desde JSON |

## Apps

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `publish_app` | core | Publicar tenant como app instalable |
| `unpublish_app` | core | Despublicar app |
| `update_app` | core | Actualizar metadata de la app |

## Turnos

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `get_available_slots` | core | Consultar disponibilidad |
| `create_booking` | core | Crear reserva con validacion |

## Secrets

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `set_secret` | advanced | Guardar un secreto |
| `delete_secret` | advanced | Eliminar un secreto |

## Flows (automatizaciones)

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `create_flow` | advanced | Crear automatizacion |
| `list_flows` | advanced | Listar flows |
| `update_flow` | advanced | Actualizar flow |
| `delete_flow` | advanced | Eliminar flow |
| `toggle_flow` | advanced | Activar/desactivar flow |

## Channels y Bots (perfil: all)

| Tool | Descripcion |
|------|-------------|
| `search_channels` | Buscar canales publicos |
| `get_channel_info` | Info de un canal |
| `get_my_channel` | Mi canal |
| `get_channel_tools` | Tools de un canal |
| `publish_channel` | Publicar canal |
| `update_channel` | Actualizar canal |
| `unpublish_channel` | Despublicar canal |
| `set_channel_permissions` | Configurar permisos |
| `define_channel_tool` | Definir tool de canal |
| `update_channel_tool` | Actualizar tool |
| `remove_channel_tool` | Eliminar tool |
| `execute_channel_tool` | Ejecutar tool de otro canal |
| `register_bot` | Registrar bot |
| `identify_bot` | Identificar bot |
| `list_bots` | Listar bots |
| `whoami_bot` | Identidad del bot actual |
| `revoke_bot` | Revocar bot |
| `generate_invitation_code` | Generar codigo de invitacion |
| `list_invitation_codes` | Listar codigos |
