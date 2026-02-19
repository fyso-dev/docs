# Conceptos clave

## Tenant

Un tenant es un espacio de trabajo aislado. Cada tenant tiene su propio esquema de base de datos, sus entidades, reglas, usuarios y configuraciones. Los datos entre tenants estan completamente separados.

- Cada tenant tiene un **slug** unico (ej: `mi-empresa`)
- Un admin puede tener acceso a multiples tenants
- Se selecciona el tenant activo al inicio de cada sesion MCP

## Entidad (Entity)

Una entidad define la estructura de datos -- equivale a una tabla. Tiene un nombre, campos y configuracion.

**Ciclo de vida:**
1. Se crea como **draft** (borrador)
2. Se **publica** con un mensaje de version
3. Cada cambio crea un nuevo draft que debe publicarse

Cada entidad tiene campos del sistema (`id`, `created_at`, `updated_at`) y campos definidos por el usuario.

## Campo (Field)

Los campos definen las columnas de una entidad.

| Propiedad | Descripcion |
|-----------|-------------|
| `name` | Nombre visible (ej: "Nombre del cliente") |
| `fieldKey` | Clave tecnica (ej: `nombre_cliente`) |
| `fieldType` | Tipo de dato (ver [Tipos de campo](../entities/field-types.md)) |
| `isRequired` | Si es obligatorio |
| `isUnique` | Si el valor debe ser unico |
| `config` | Configuracion especifica del tipo |

**Tipos de campos disponibles:** `text`, `textarea`, `number`, `email`, `phone`, `date`, `boolean`, `select`, `relation`, `file`, `location`.

## Registro (Record)

Un registro es una fila dentro de una entidad. La estructura en la base de datos es:

```json
{
  "id": "uuid",
  "entityId": "uuid",
  "data": {
    "nombre": "Juan Perez",
    "email": "juan@example.com"
  },
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-01-15T10:00:00Z"
}
```

**Importante:** Los campos de la entidad estan dentro de `record.data`, no en la raiz del registro. Acceso correcto: `record.data.email`.

## Regla de negocio (Business Rule)

Las reglas automatizan logica sobre los datos. Se definen usando un DSL (Domain Specific Language).

**Tipos:**
- **compute** -- Calcula campos automaticamente (ej: `total = cantidad * precio`)
- **validate** -- Valida datos antes de guardar (ej: "el precio debe ser positivo")
- **action** -- Ejecuta efectos secundarios despues de guardar (ej: actualizar un registro padre)

Las reglas tambien tienen ciclo de vida draft/published.

## Perfiles de herramientas (Tool Profiles)

Fyso expone herramientas MCP en tres niveles:

| Perfil | Cantidad | Uso |
|--------|----------|-----|
| `core` | ~26 tools | Para uso diario -- crear entidades, CRUD, reglas, deploy |
| `advanced` | ~38 tools | Agrega delete, test, flows, secrets, logs |
| `all` | ~49 tools | Todo, incluyendo channels y bots |

Se configura via la variable de entorno `FYSO_TOOLS` (valores: `core`, `advanced`, `all`). Default: `core`.
