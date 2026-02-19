# CI/CD con GitHub Actions

Ejemplo de configuracion para desplegar automaticamente a Fyso Sites desde GitHub Actions.

## Workflow basico

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

## Secrets requeridos

Configurar en Settings > Secrets and variables > Actions:

| Secret | Valor |
|--------|-------|
| `FYSO_API_KEY` | Tu API key de Fyso |
| `FYSO_API_URL` | URL de la API (ej: `https://api.fyso.dev/api`) |

## Notas

- El directorio de build depende del framework (`dist/`, `build/`, `out/`)
- El subdomain debe existir previamente (crear con `deploy_static_site` la primera vez)
- Los deployments sucesivos reemplazan el contenido anterior
