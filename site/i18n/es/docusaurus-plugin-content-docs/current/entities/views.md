---
sidebar_position: 5
---

# Vistas de entidades

Una **vista** es una proyeccion filtrada con nombre de una entidad, con permisos RBAC propios. Las vistas permiten exponer un subconjunto de los registros de una entidad a roles especificos sin otorgar acceso a la entidad completa.

## Caso de uso

Una entidad `tickets` contiene todos los tickets de soporte. Quieres que los agentes de soporte solo vean sus propios tickets:

1. Crea una vista `my-tickets` sobre la entidad `tickets` con filtro `reporter == $currentUser`
2. Otorga al rol `agent` acceso de lectura a `view:my-tickets`
3. Los agentes consultan `/api/views/my-tickets/records` y solo ven sus propios tickets

Los administradores (acceso por API key) omiten el filtro y ven todos los registros a traves de la vista.

## Crear una vista

### Via MCP

```
create_view({
  entitySlug: "tickets",
  slug: "my-tickets",
  name: "My Tickets",
  description: "Tickets reportados por el usuario actual",
  filterDsl: {
    validate: [
      { condition: "reporter == $currentUser" }
    ]
  }
})
```

### Via REST API

```bash
curl -X POST "https://api.fyso.dev/api/views" \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "entitySlug": "tickets",
    "slug": "my-tickets",
    "name": "My Tickets",
    "filterDsl": {
      "validate": [{ "condition": "reporter == $currentUser" }]
    }
  }'
```

## Filter DSL

Los filtros de vista usan la misma sintaxis que las reglas de negocio `on_query`:

| Elemento | Ejemplos |
|----------|----------|
| Referencias a campos | `status`, `reporter`, `priority` |
| Operadores | `==`, `!=`, `>`, `>=`, `<`, `<=` |
| Variables | `$currentUser`, `$currentTenant` |
| Operadores logicos | `and`, `or`, `not` |
| Literales | `'active'`, `42` |
| Agrupacion | `(status == 'open' or status == 'pending') and priority > 3` |

El filtro se compila a una clausula SQL `WHERE` y se aplica del lado del servidor. Se compone con cualquier filtro adicional que el cliente pase en el query string.

### Referencia de variables

| Variable | Se resuelve a |
|----------|--------------|
| `$currentUser` | El ID del usuario autenticado del tenant |
| `$currentTenant` | El ID del tenant actual |

Cuando se accede via API key de admin (sin contexto de usuario), los filtros de vista que referencian `$currentUser` se omiten -- el admin ve todos los registros.

## Permisos

Las vistas usan el sistema RBAC con el formato de clave de entidad `view:<slug>`.

Para otorgar acceso a un rol a una vista, incluye `view:<slug>` en los permisos de entidad del rol:

```json
{
  "entities": {
    "view:my-tickets": ["read"]
  }
}
```

- El acceso via API key de admin omite RBAC -- todas las vistas y registros son accesibles.
- Los usuarios de tenant sin `read` en `view:<slug>` reciben `403 Forbidden`.
- El permiso wildcard `*` de entidad tambien otorga acceso a todas las vistas.

## Consultar registros a traves de una vista

### Listar registros

```
GET /api/views/{viewSlug}/records
```

Soporta los mismos parametros de query que el listado de registros de entidad:

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `page` | number | 1 | Numero de pagina |
| `limit` | number | 20 | Items por pagina |
| `sort` | string | - | Campo para ordenar |
| `order` | string | `asc` | `asc` o `desc` |
| `search` | string | - | Busqueda full-text |
| `resolve` | boolean | false | Expandir relaciones |
| `resolve_depth` | number | 1 | Profundidad de anidacion (max 3) |
| `filter.{field}` | string | - | Filtro adicional por campo |

Los filtros adicionales se componen con el filtro base de la vista (logica AND).

### Obtener un registro

```
GET /api/views/{viewSlug}/records/{id}
```

Retorna un registro individual si coincide con el filtro de la vista. Retorna `404` si el registro existe pero no coincide con el filtro.

## Administrar vistas

Todas las operaciones de administracion requieren acceso admin (API key o rol admin).

| Operacion | Herramienta MCP | Endpoint REST |
|-----------|----------------|---------------|
| Crear | `create_view` | `POST /api/views` |
| Listar todas | `list_views` | `GET /api/views` |
| Actualizar | `update_view` | `PUT /api/views/{slug}` |
| Eliminar | `delete_view` | `DELETE /api/views/{slug}` |

### Reglas de slug

- Solo alfanumerico en minusculas con guiones: `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$`
- Maximo 100 caracteres
- Debe ser unico entre todas las vistas del tenant

### Campos actualizables

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `name` | string | Nombre para mostrar |
| `description` | string | Descripcion |
| `filterDsl` | object | Nueva definicion de filtro |
| `isActive` | boolean | Habilitar/deshabilitar la vista |

Las vistas desactivadas (`isActive: false`) se excluyen de los resultados de listado y retornan `404` en consultas de registros.
