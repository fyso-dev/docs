# CI/CD with GitHub Actions

Example configuration for automatically deploying to Fyso Sites from GitHub Actions.

## Basic Workflow

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

## Required Secrets

Configure in Settings > Secrets and variables > Actions:

| Secret | Value |
|--------|-------|
| `FYSO_API_KEY` | Your Fyso API key |
| `FYSO_API_URL` | API URL (e.g., `https://api.fyso.dev/api`) |

## Notes

- The build directory depends on the framework (`dist/`, `build/`, `out/`)
- The subdomain must exist beforehand (create with `deploy_static_site` the first time)
- Successive deployments replace the previous content
