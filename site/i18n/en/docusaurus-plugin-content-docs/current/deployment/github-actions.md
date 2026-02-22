# CI/CD with GitHub Actions

Fyso has two methods for automated deployments from GitHub Actions.

## Recommended method: persistent token (via MCP)

Persistent tokens (`fyso_dt_...`) do not expire and are reusable. The `generate_deploy_token` MCP tool generates the token and a ready-to-use GitHub Actions workflow.

### Step 1: Generate the token

```
generate_deploy_token({ subdomain: "my-site" })
```

The tool automatically detects the framework from `package.json` (Astro, Vite, Next.js, Nuxt, Gatsby, Hugo) and returns:

```json
{
  "token": "fyso_dt_abc123...",
  "workflow": "# GitHub Actions workflow\nname: Deploy to Fyso..."
}
```

### Step 2: Add the secret in GitHub

In your repository: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

| Secret | Value |
|--------|-------|
| `FYSO_DEPLOY_TOKEN` | The `fyso_dt_...` token returned |

### Step 3: Copy the workflow

Copy the returned YAML to `.github/workflows/deploy-fyso.yml`. The workflow already has the detected framework, subdomain, and build commands configured.

### Manage tokens

Tokens can be listed and revoked from the web panel at **Settings** > **Deploy tokens**, or via the API:

```bash
# List tokens
curl -H "Authorization: Bearer $FYSO_API_KEY" \
  "https://api.fyso.dev/api/sites/deploy-tokens"

# Revoke
curl -X DELETE -H "Authorization: Bearer $FYSO_API_KEY" \
  "https://api.fyso.dev/api/sites/deploy-tokens/{tokenId}"
```

---

## Alternative method: direct API key

If MCP is not used, you can deploy using the API key directly.

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
          curl -X POST "$FYSO_API_URL/sites/my-portfolio/deploy" \
            -H "Authorization: Bearer $FYSO_API_KEY" \
            -F "file=@/tmp/site.zip"
```

### Required Secrets

| Secret | Value |
|--------|-------|
| `FYSO_API_KEY` | Your Fyso API key |
| `FYSO_API_URL` | API URL (e.g., `https://api.fyso.dev/api`) |

## Notes

- The build directory depends on the framework (`dist/`, `build/`, `out/`, `public/`)
- The subdomain must exist beforehand (create with `deploy_static_site` the first time)
- Successive deployments replace the previous content
- Persistent tokens do not expire; API keys must have deploy permissions
