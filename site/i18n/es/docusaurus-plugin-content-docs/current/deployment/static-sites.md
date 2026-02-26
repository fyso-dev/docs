# Sites estaticos

Fyso permite desplegar sitios estaticos (Astro, Vite, Next.js export, etc.) en subdominios de `fyso.dev`.

## MCP Tool: `deploy_static_site`

**Perfil:** core

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `subdomain` | string | Si | Subdominio (ej: `"mi-portfolio"` -> `mi-portfolio-sites.fyso.dev`) |
| `path` | string | Condicional | Ruta absoluta al directorio de build (ej: `/home/user/my-site/dist`) |
| `bundle_base64` | string | Condicional | ZIP en base64 (solo para sites < 5KB) |

Se debe proporcionar `path` o `bundle_base64`.

### Restricciones del subdomain

- Solo letras minusculas, numeros y guiones
- Sin espacios ni caracteres especiales

### Modo local (MCP tiene acceso al filesystem)

El MCP server comprime el directorio y lo sube automaticamente:

```
deploy_static_site({
  subdomain: "mi-portfolio",
  path: "/home/user/my-site/dist"
})
```

### Modo remoto (MCP no tiene acceso al filesystem)

Si el MCP server no puede acceder a la ruta, retorna un comando `curl` para ejecutar manualmente:

```json
{
  "success": false,
  "action_required": "run_command",
  "message": "The MCP server cannot access your local filesystem...",
  "command": "cd \"/home/user/my-site/dist\" && zip -qr /tmp/_fyso_deploy.zip . && curl ...",
  "token_expires_in": 300,
  "token_note": "The deploy token in this command expires in 5 minutes."
}
```

El agente debe ejecutar el comando retornado con el tool Bash.

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Site deployed successfully",
  "data": {
    "url": "https://mi-portfolio.sites.fyso.dev",
    "subdomain": "mi-portfolio"
  }
}
```

## MCP Tool: `list_static_sites`

**Perfil:** core

Lista todos los deployments activos.

```
list_static_sites()
```

Retorna subdominio, URL, tamano y fecha de deploy.

## MCP Tool: `delete_static_site`

**Perfil:** advanced

Elimina un site desplegado.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `subdomain` | string | Si | Subdominio del site a eliminar |

## Limites

| Plan | Sites |
|------|-------|
| Free | 1 |
| Pro | Ilimitado |

## Frameworks soportados

Cualquier framework que genere output estatico:

- **Astro** -- `npm run build` -> `dist/`
- **Vite** -- `npm run build` -> `dist/`
- **Next.js** (export) -- `next export` -> `out/`
- **Create React App** -- `npm run build` -> `build/`
- **HTML/CSS/JS puro** -- directorio con `index.html`
