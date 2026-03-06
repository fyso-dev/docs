---
sidebar_position: 3
---

# Perfiles de herramientas

Los perfiles de herramientas controlan que herramientas MCP se exponen al agente. Fyso usa un sistema de 3 niveles (`core`, `advanced`, `all`) con la posibilidad de asignar un perfil especifico por usuario.

## Perfiles disponibles

### `core` — Por defecto

El perfil estandar para uso diario. Incluye todas las herramientas necesarias para construir y operar aplicaciones.

Incluye: `fyso_data` (CRUD de registros, scheduling), `fyso_schema` (gestion de entidades), `fyso_rules` (reglas de negocio), `fyso_auth` (usuarios, roles, tenants), `fyso_views` (vistas de entidades), `fyso_knowledge` (busqueda), `fyso_deploy` (sitios estaticos), `fyso_meta` (spec de API, metadata, secretos, uso).

**8 herramientas agrupadas** (cada una con multiples acciones)

### `advanced`

Todo lo de `core` mas todas las acciones dentro de las herramientas agrupadas. La distincion `core`/`advanced` ahora aplica a que _acciones_ dentro de las herramientas agrupadas estan disponibles, en vez de herramientas separadas. Las acciones destructivas (eliminar entidad, eliminar registro) y las de testing/debugging (testear regla, logs de reglas, gestionar campos personalizados, historial de cambios) estan protegidas detras de `advanced`.

**8 herramientas agrupadas** (set completo de acciones)

### `all`

Todo lo de `advanced` mas herramientas individuales de gestion de canales, identidad de bots e invitaciones.

**8 agrupadas + ~24 herramientas individuales**

## Orden de resolucion del perfil

El perfil activo de herramientas para un usuario se resuelve en este orden (mayor prioridad primero):

1. **Nivel de usuario** — la columna `tool_profile` en `admin_users`. Cuando tiene un valor, toma prioridad sobre todo lo demas. Los administradores pueden asignar un perfil especifico a usuarios individuales.
2. **Variable de entorno del servidor** — `FYSO_TOOLS=core|advanced|all`. Se aplica a todos los usuarios del servidor a menos que se haya definido un perfil a nivel de usuario.
3. **Por defecto** — `core`. Se usa cuando no hay una asignacion a nivel de usuario ni una variable de entorno configurada.

Esto permite que un administrador ejecute el servidor con `FYSO_TOOLS=core` pero otorgue `advanced` o `all` a usuarios especificos mediante la columna `admin_users.tool_profile`.

## Herramientas de super administrador

Existe un conjunto separado de herramientas de super administrador fuera del sistema de 3 niveles. Estas herramientas estan protegidas por la variable de entorno `FYSO_SA_KEY` y no se incluyen en ninguno de los perfiles anteriores. Estan destinadas exclusivamente a operadores de la plataforma y no se exponen a usuarios regulares sin importar su perfil.

## Configuracion

En `claude_desktop_config.json` o el cliente MCP equivalente:

```json
{
  "mcpServers": {
    "fyso": {
      "command": "npx",
      "args": ["-y", "@fyso/mcp-server"],
      "env": {
        "FYSO_API_KEY": "tu-api-key",
        "FYSO_API_URL": "https://api.fyso.dev/api",
        "FYSO_TOOLS": "core"
      }
    }
  }
}
```

## Elegir un perfil

| Caso de uso | Perfil recomendado |
|-------------|-------------------|
| Construir apps, gestionar datos | `core` |
| CI/CD, debugging avanzado, ops destructivas | `advanced` |
| Gestion de bots/canales | `all` |
