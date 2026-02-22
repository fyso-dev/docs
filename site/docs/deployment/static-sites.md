# Sites estaticos

Fyso permite desplegar sitios estaticos (Astro, Vite, Next.js export, etc.) en subdominios de `sites.fyso.dev`.

## MCP Tool: `deploy_static_site`

**Perfil:** core

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `subdomain` | string | Si | Subdominio (ej: `"mi-portfolio"` -> `mi-portfolio.sites.fyso.dev`) |
| `path` | string | Condicional | Ruta absoluta al directorio de build (ej: `/home/user/my-site/dist`) |
| `bundle_base64` | string | Condicional | ZIP en base64 del sitio a desplegar |

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

Si el MCP server no puede acceder al filesystem, usar `bundle_base64`. El agente debe comprimir el directorio a un ZIP en base64 y pasarlo directamente:

```
deploy_static_site({
  subdomain: "mi-portfolio",
  bundle_base64: "<ZIP en base64>"
})
```

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

## Dominio personalizado (Plan Pro)

Los usuarios del plan Pro pueden apuntar un dominio propio (ej: `app.miempresa.com`) a su subdominio de Fyso.

### Configuracion

1. En el panel web, ir a **Sites** > seleccionar el site > **Dominio personalizado**
2. Ingresar el dominio deseado
3. Agregar un registro CNAME en tu DNS: `app.miempresa.com` -> `sites.fyso.dev`
4. Fyso verifica la propagacion DNS (puede tomar hasta 24h)
5. Una vez verificado, el site responde en el dominio personalizado

### Alternativa TXT

Si no se puede agregar un CNAME (por conflictos con la raiz del dominio), agregar un registro TXT de verificacion que Fyso proporciona.

### Notas

- Solo disponible en plan Pro
- El subdominio `*.sites.fyso.dev` sigue funcionando en paralelo
- HTTPS se provisiona automaticamente

## CI/CD con `generate_deploy_token`

Para deployments desde pipelines de CI/CD sin acceso a MCP, usar tokens persistentes. Ver [GitHub Actions](./github-actions.md).

## Limites

| Plan | Sites |
|------|-------|
| Free | 1 |
| Pro | Ilimitado |
| Enterprise | Ilimitado |

## Frameworks soportados

Cualquier framework que genere output estatico:

- **Astro** -- `npm run build` -> `dist/`
- **Vite** -- `npm run build` -> `dist/`
- **Next.js** (export) -- `next export` -> `out/`
- **Create React App** -- `npm run build` -> `build/`
- **Nuxt** (static) -- `nuxt generate` -> `dist/`
- **Gatsby** -- `gatsby build` -> `public/`
- **Hugo** -- `hugo` -> `public/`
- **HTML/CSS/JS puro** -- directorio con `index.html`
