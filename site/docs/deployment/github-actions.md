---
sidebar_position: 2
---

# GitHub Actions Deployment

Automate deployments to Fyso Static Sites on every push.

## Recommended: Using Deploy Tokens

Generate a one-time deploy token from MCP and store it as a GitHub Secret. Tokens expire after 5 minutes and are single-use.

**Generate a token (MCP):**
```
generate_deploy_token({ subdomain: "mi-portfolio" })
```

**CI/CD Workflow:**

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
      - name: Generate deploy token
        id: token
        env:
          FYSO_API_KEY: ${{ secrets.FYSO_API_KEY }}
          FYSO_API_URL: ${{ secrets.FYSO_API_URL }}
        run: |
          TOKEN=$(curl -s -X POST "$FYSO_API_URL/sites/mi-portfolio/deploy-token" \
            -H "Authorization: Bearer $FYSO_API_KEY" | jq -r '.token')
          echo "token=$TOKEN" >> $GITHUB_OUTPUT
      - name: Deploy to Fyso
        env:
          FYSO_API_URL: ${{ secrets.FYSO_API_URL }}
        run: |
          cd dist
          zip -qr /tmp/site.zip .
          curl -X POST "$FYSO_API_URL/sites/mi-portfolio/deploy" \
            -H "Authorization: Bearer ${{ steps.token.outputs.token }}" \
            -F "file=@/tmp/site.zip"
```

## Alternative: API Key

Use your API key directly as the deploy credential:

```yaml
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

## Required Secrets

| Secret | Description |
|--------|-------------|
| `FYSO_API_KEY` | Your Fyso API key |
| `FYSO_API_URL` | `https://api.fyso.dev/api` |

## Notes

- Build directory depends on framework: `dist/`, `out/`, `build/`
- The subdomain must already exist (deploy creates a new version, not the site)
- Successive deploys replace previous content
- Supported frameworks: Astro, Vite, Next.js (static export), Create React App, plain HTML/CSS/JS
