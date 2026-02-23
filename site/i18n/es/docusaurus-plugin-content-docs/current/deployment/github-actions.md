---
sidebar_position: 2
---

# Deployment con GitHub Actions

Automatiza los deployments a Fyso Static Sites en cada push.

## Recomendado: Usando tokens de deploy

Genera un token de deploy de un solo uso desde MCP y guárdalo como secreto de GitHub. Los tokens expiran en 5 minutos y son de uso único.

**Generar un token (MCP):**
```
generate_deploy_token({ subdomain: "mi-portfolio" })
```

**Workflow CI/CD:**

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
      - name: Generar token de deploy
        id: token
        env:
          FYSO_API_KEY: ${{ secrets.FYSO_API_KEY }}
          FYSO_API_URL: ${{ secrets.FYSO_API_URL }}
        run: |
          TOKEN=$(curl -s -X POST "$FYSO_API_URL/sites/mi-portfolio/deploy-token" \
            -H "Authorization: Bearer $FYSO_API_KEY" | jq -r '.token')
          echo "token=$TOKEN" >> $GITHUB_OUTPUT
      - name: Deploy a Fyso
        env:
          FYSO_API_URL: ${{ secrets.FYSO_API_URL }}
        run: |
          cd dist
          zip -qr /tmp/site.zip .
          curl -X POST "$FYSO_API_URL/sites/mi-portfolio/deploy" \
            -H "Authorization: Bearer ${{ steps.token.outputs.token }}" \
            -F "file=@/tmp/site.zip"
```

## Alternativa: API Key

Usa tu API key directamente como credencial de deploy:

```yaml
- name: Deploy a Fyso
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

## Secretos requeridos

| Secreto | Descripción |
|---------|-------------|
| `FYSO_API_KEY` | Tu API key de Fyso |
| `FYSO_API_URL` | `https://api.fyso.dev/api` |

## Notas

- El directorio de build depende del framework: `dist/`, `out/`, `build/`
- El subdominio debe existir previamente (el deploy crea una nueva versión, no el sitio)
- Los deployments sucesivos reemplazan el contenido anterior
- Frameworks soportados: Astro, Vite, Next.js (export estático), Create React App, HTML/CSS/JS puro
