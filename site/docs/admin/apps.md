# Apps (catalogo)

Fyso permite publicar un tenant como una app instalable. Otros usuarios pueden instalar una copia de la app en su propio tenant.

## Flujo

1. Disenar la app (entidades, campos, reglas) en un tenant
2. Publicar con `publish_app` -- exporta la metadata y la registra en el catalogo
3. Compartir el link de instalacion
4. Otros usuarios instalan la app -- se importa la metadata en su tenant

## MCP Tool: `publish_app`

**Perfil:** core

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `name` | string | Si | Nombre visible (ej: "CRM Taller Pro") |
| `slug` | string | Si | Identificador URL (ej: `"crm-taller-pro"`). Solo minusculas, numeros y guiones |
| `description` | string | No | Descripcion corta |
| `icon` | string | No | Emoji o identificador de icono |

### Ejemplo

```
publish_app({
  name: "Sistema de Turnos",
  slug: "sistema-turnos",
  description: "Gestion de turnos para profesionales de salud",
  icon: "calendar"
})
```

## MCP Tool: `update_app`

**Perfil:** core

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `slug` | string | Si | Slug de la app |
| `name` | string | No | Nuevo nombre |
| `description` | string | No | Nueva descripcion |
| `icon` | string | No | Nuevo icono |
| `refreshMetadata` | boolean | No | Re-exportar metadata del tenant actual a la app |

Usar `refreshMetadata: true` despues de modificar entidades o reglas para actualizar la app publicada.

```
update_app({
  slug: "sistema-turnos",
  refreshMetadata: true
})
```

## MCP Tool: `unpublish_app`

**Perfil:** core

Desactiva la app del catalogo. Es un soft delete -- se puede volver a publicar despues.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `slug` | string | Si | Slug de la app |

```
unpublish_app({ slug: "sistema-turnos" })
```
