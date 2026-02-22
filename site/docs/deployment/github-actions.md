# CI/CD con GitHub Actions

Fyso tiene dos metodos para deployments automaticos desde GitHub Actions.

## Metodo recomendado: token persistente (via MCP)

Los tokens persistentes (`fyso_dt_...`) no expiran y son reutilizables. El MCP tool `generate_deploy_token` genera el token y el workflow de GitHub Actions listo para usar.

### Paso 1: Generar el token

```
generate_deploy_token({ subdomain: "mi-site" })
```

El tool detecta automaticamente el framework desde `package.json` (Astro, Vite, Next.js, Nuxt, Gatsby, Hugo) y retorna:

```json
{
  "token": "fyso_dt_abc123...",
  "workflow": "# GitHub Actions workflow\nname: Deploy to Fyso..."
}
```

### Paso 2: Agregar el secret en GitHub

En el repositorio: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

| Secret | Valor |
|--------|-------|
| `FYSO_DEPLOY_TOKEN` | El token `fyso_dt_...` retornado |

### Paso 3: Copiar el workflow

Copiar el YAML retornado por el tool a `.github/workflows/deploy-fyso.yml`. El workflow ya tiene configurado el framework detectado, el subdominio y los comandos de build.

### Administrar tokens

Los tokens pueden listarse y revocarse desde el panel web en **Settings** > **Deploy tokens**, o via la API:

```bash
# Listar tokens
curl -H "Authorization: Bearer $FYSO_API_KEY" \
  "https://api.fyso.dev/api/sites/deploy-tokens"

# Revocar
curl -X DELETE -H "Authorization: Bearer $FYSO_API_KEY" \
  "https://api.fyso.dev/api/sites/deploy-tokens/{tokenId}"
```

---

## Metodo alternativo: API key directa

Si no se usa MCP, se puede deployar usando la API key directamente.

```yaml
name: Deploy to Fyso Sites

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npm run build

      - name: Deploy to Fyso
        env:
          FYSO_API_KEY: ${{ secrets.FYSO_API_KEY }}
          FYSO_API_URL: ${{ secrets.FYSO_API_URL }}
        run: |
          cd dist
          zip -qr /tmp/site.zip .
          curl -X POST "$FYSO_API_URL/sites/mi-portfolio/deploy" \
            -H "Authorization: Bearer $FYSO_API_KEY" \
            -F "file=@/tmp/site.zip"
```

### Secrets requeridos

| Secret | Valor |
|--------|-------|
| `FYSO_API_KEY` | Tu API key de Fyso |
| `FYSO_API_URL` | URL de la API (ej: `https://api.fyso.dev/api`) |

## Notas

- El directorio de build depende del framework (`dist/`, `build/`, `out/`, `public/`)
- El subdominio debe existir previamente (crear con `deploy_static_site` la primera vez)
- Los deployments sucesivos reemplazan el contenido anterior
- Los tokens persistentes no expiran; las API keys deben tener permisos de deploy
