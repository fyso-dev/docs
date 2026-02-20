---
sidebar_position: 2
---

# Conceptos clave

## Tenant

Un espacio de trabajo aislado. Cada tenant tiene un slug único, su propio esquema de base de datos, entidades, reglas, usuarios y configuraciones.

## Entidad

Define la estructura de datos de tu aplicación (equivalente a una tabla):
- Se crea como borrador, luego se **publica** con un mensaje de versión
- Tiene campos de sistema: `id`, `created_at`, `updated_at`
- Más campos definidos por el usuario

## Campo

Define columnas dentro de una entidad:
- Propiedades: `name`, `fieldKey`, `fieldType`, `isRequired`, `isUnique`, `config`
- Tipos disponibles: `text`, `textarea`, `number`, `email`, `phone`, `date`, `boolean`, `select`, `relation`, `file`, `location`

## Registro

Una fila dentro de una entidad:
```json
{ "id": "uuid", "entityId": "uuid", "data": {...}, "createdAt": "...", "updatedAt": "..." }
```
**Importante:** Los campos de la entidad están dentro de `record.data`, no en el nivel raíz.

## Regla de negocio

Automatiza lógica usando un DSL declarativo:
- **compute** — Calcula campos automáticamente
- **validate** — Valida datos antes de guardar (rechaza si falla)
- **action** — Ejecuta efectos secundarios después de guardar

## RBAC

Control de acceso basado en roles. Definí roles con permisos por entidad, asignalos a usuarios. Roles del sistema: `owner`, `admin`, `member`, `viewer`. Herramientas MCP: `list_roles`, `create_role`, `assign_role`, `revoke_role`.

## Base de conocimiento

Subí documentos (PDF, texto, markdown) y consultálos via búsqueda semántica. Los documentos se dividen en chunks e indexan con embeddings para flujos RAG. Ver [Base de conocimiento](../admin/knowledge.md).

## Perfiles de herramientas

Controla qué herramientas MCP se exponen al agente:
- `core` (~55 herramientas): uso diario — entidades, registros, reglas, RBAC, conocimiento, PDF, sitios
- `advanced` (~73 herramientas): core + eliminar, testear, flows, secretos, tokens de deploy, logs
- `all` (~85 herramientas): advanced + canales y bots

Configurar con la variable de entorno `FYSO_TOOLS`. Ver [Perfiles de herramientas](../api/tool-profiles.md).
