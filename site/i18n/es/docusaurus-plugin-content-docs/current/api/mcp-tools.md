---
sidebar_position: 2
---

# Referencia de herramientas MCP

Referencia completa de todas las herramientas MCP disponibles, agrupadas por categoría.

Configurá qué herramientas se exponen con la variable de entorno `FYSO_TOOLS`. Ver [Perfiles de herramientas](tool-profiles.md).

---

## Tenant

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `list_tenants` | core | Lista los tenants accesibles |
| `select_tenant` | core | Selecciona el tenant activo para operaciones subsiguientes |

---

## Entidades

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `generate_entity` | core | Crea entidad con campos desde definición JSON |
| `list_entities` | core | Lista entidades (opcionalmente incluye borradores) |
| `get_entity_schema` | core | Obtiene definición completa y lista de campos |
| `publish_entity` | core | Publica versión de entidad con mensaje |
| `delete_entity` | advanced | Elimina entidad y todos sus registros (irreversible) |
| `list_entity_changes` | advanced | Ver historial de versiones |
| `manage_custom_fields` | advanced | Agregar, actualizar o eliminar campos personalizados |

---

## Registros

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `query_records` | core | Consultar registros con filtros, paginación, orden y búsqueda semántica |
| `create_record` | core | Crear un nuevo registro |
| `update_record` | core | Actualizar parcialmente un registro |
| `delete_record` | core | Eliminar un registro |

---

## Reglas de negocio

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `generate_business_rule` | core | Generar y crear una regla desde lenguaje natural o JSON DSL |
| `create_business_rule` | core | Crear regla desde definición DSL explícita |
| `list_business_rules` | core | Listar reglas de una entidad |
| `get_business_rule` | core | Obtener definición completa de una regla |
| `publish_business_rule` | core | Publicar regla (solo las publicadas se ejecutan) |
| `test_business_rule` | advanced | Testear regla con datos de prueba sin guardar |
| `delete_business_rule` | advanced | Eliminar una regla |
| `get_rule_logs` | advanced | Ver logs de ejecución de una regla |

---

## Vistas

| Herramienta | Perfil | Descripcion |
|-------------|--------|-------------|
| `create_view` | core | Crear una vista filtrada de entidad con permisos RBAC independientes |
| `list_views` | core | Listar todas las vistas de entidades en el tenant |
| `update_view` | core | Actualizar nombre, descripcion, filtro o estado activo de una vista |
| `delete_view` | core | Eliminar una vista de entidad |

---

## RBAC (Roles y permisos)

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `list_roles` | core | Listar roles definidos en el tenant |
| `create_role` | core | Crear un nuevo rol con permisos |
| `assign_role` | core | Asignar un rol a un usuario |
| `revoke_role` | core | Revocar un rol de un usuario |

---

## Usuarios

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `create_user` | core | Crear usuario de tenant con rol y permisos |
| `list_users` | core | Listar usuarios del tenant |
| `tenant_login` | advanced | Autenticarse como usuario de tenant, retorna JWT |

---

## API Keys anónimas

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `create_anonymous_key` | advanced | Crear una anonymous API key para acceso público (TTL obligatorio) |
| `list_anonymous_keys` | advanced | Listar anonymous keys — solo metadatos, sin valores de key |
| `revoke_anonymous_key` | advanced | Revocar inmediatamente una anonymous API key |

---

## Archivos

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `upload_file` | core | Subir un archivo, retorna metadata del archivo almacenado |

---

## PDF

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `generate_pdf` | core | Generar PDF desde template y datos de registro |
| `create_pdf_template` | core | Crear un template de PDF |

---

## Sitios estáticos

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `deploy_static_site` | core | Publicar sitio estático en `*.sites.fyso.dev` |
| `list_static_sites` | core | Listar sitios publicados |
| `delete_static_site` | advanced | Eliminar un sitio |
| `generate_deploy_token` | advanced | Generar token de deploy de un solo uso para CI/CD |

---

## API

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `get_rest_api_spec` | core | Obtener spec OpenAPI de las entidades del tenant |
| `generate_api_client` | core | Generar código de cliente API en un lenguaje dado |

---

## Metadata

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `export_metadata` | core | Exportar estructura del tenant (entidades, campos, reglas) como JSON |
| `import_metadata` | core | Importar JSON de metadata en el tenant |

---

## Apps

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `publish_app` | core | Publicar tenant como app instalable |
| `unpublish_app` | core | Despublicar app |
| `update_app` | core | Actualizar nombre, descripción o refrescar metadata de la app |

---

## Scheduling

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `get_available_slots` | core | Obtener slots disponibles de un profesional |
| `create_booking` | core | Crear un turno en un slot disponible |

---

## Secretos

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `set_secret` | advanced | Almacenar un secreto encriptado para usar en flows |
| `delete_secret` | advanced | Eliminar un secreto almacenado |

---

## Flows

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `create_flow` | advanced | Crear un flow de automatización con triggers y pasos |
| `list_flows` | advanced | Listar flows del tenant |
| `update_flow` | advanced | Actualizar definición de un flow |
| `delete_flow` | advanced | Eliminar un flow |
| `toggle_flow` | advanced | Habilitar o deshabilitar un flow |

---

## Webhooks

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `create_webhook` | advanced | Suscribirse a eventos de registros de una entidad (created/updated/deleted) |
| `list_webhooks` | advanced | Listar suscripciones de webhooks, opcionalmente filtradas por entidad |
| `delete_webhook` | advanced | Eliminar una suscripción de webhook |

---

## Base de conocimiento

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `upload_document` | core | Subir documento para indexación RAG (PDF, HTML, texto, markdown, URL) |
| `search_knowledge` | core | Búsqueda semántica en documentos indexados. Soporta `one_per_document`, `threshold`, `document_ids` |
| `list_documents` | core | Listar documentos subidos con filtro por estado |
| `get_document` | core | Obtener metadata, contenido y vista previa de fragmentos |
| `delete_document` | advanced | Eliminar documento y sus fragmentos (registra evento `knowledge_delete`) |
| `get_knowledge_stats` | core | Estadísticas de indexación, analytics de búsqueda y uso de tokens de embedding (30 días) |

---

## Canales y bots

Estas herramientas solo están disponibles con el perfil `all`.

| Herramienta | Perfil | Descripción |
|-------------|--------|-------------|
| `search_channels` | all | Buscar canales |
| `get_channel_info` | all | Obtener metadata de un canal |
| `execute_channel_tool` | all | Ejecutar una herramienta en un canal |
| `get_my_channel` | all | Obtener el canal propio del bot actual |
| `list_channel_tools` | all | Listar herramientas disponibles en un canal |
