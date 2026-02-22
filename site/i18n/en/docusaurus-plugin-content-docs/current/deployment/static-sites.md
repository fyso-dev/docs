# Static Sites

Fyso allows deploying static sites (Astro, Vite, Next.js export, etc.) on subdomains of `sites.fyso.dev`.

## MCP Tool: `deploy_static_site`

**Profile:** core

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subdomain` | string | Yes | Subdomain (e.g., `"my-portfolio"` -> `my-portfolio.sites.fyso.dev`) |
| `path` | string | Conditional | Absolute path to the build directory (e.g., `/home/user/my-site/dist`) |
| `bundle_base64` | string | Conditional | ZIP in base64 of the site to deploy |

Either `path` or `bundle_base64` must be provided.

### Subdomain Restrictions

- Only lowercase letters, numbers, and hyphens
- No spaces or special characters

### Local Mode (MCP has filesystem access)

The MCP server compresses the directory and uploads it automatically:

```
deploy_static_site({
  subdomain: "my-portfolio",
  path: "/home/user/my-site/dist"
})
```

### Remote Mode (MCP does not have filesystem access)

If the MCP server cannot access the filesystem, use `bundle_base64`. The agent should compress the directory to a base64 ZIP and pass it directly:

```
deploy_static_site({
  subdomain: "my-portfolio",
  bundle_base64: "<ZIP in base64>"
})
```

### Successful Response

```json
{
  "success": true,
  "message": "Site deployed successfully",
  "data": {
    "url": "https://my-portfolio.sites.fyso.dev",
    "subdomain": "my-portfolio"
  }
}
```

## MCP Tool: `list_static_sites`

**Profile:** core

Lists all active deployments.

```
list_static_sites()
```

Returns subdomain, URL, size, and deployment date.

## MCP Tool: `delete_static_site`

**Profile:** advanced

Deletes a deployed site.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subdomain` | string | Yes | Subdomain of the site to delete |

## Custom Domain (Pro Plan)

Pro plan users can point a custom domain (e.g., `app.mycompany.com`) to their Fyso subdomain.

### Setup

1. In the web panel, go to **Sites** > select the site > **Custom domain**
2. Enter the desired domain
3. Add a CNAME record in your DNS: `app.mycompany.com` -> `sites.fyso.dev`
4. Fyso verifies DNS propagation (can take up to 24h)
5. Once verified, the site responds on the custom domain

### TXT alternative

If a CNAME cannot be added (conflicts at root domain), add the TXT verification record Fyso provides.

### Notes

- Only available on Pro plan
- The `*.sites.fyso.dev` subdomain continues to work in parallel
- HTTPS is provisioned automatically

## CI/CD with `generate_deploy_token`

For deployments from CI/CD pipelines without MCP access, use persistent tokens. See [GitHub Actions](./github-actions.md).

## Limits

| Plan | Sites |
|------|-------|
| Free | 1 |
| Pro | Unlimited |
| Enterprise | Unlimited |

## Supported Frameworks

Any framework that generates static output:

- **Astro** -- `npm run build` -> `dist/`
- **Vite** -- `npm run build` -> `dist/`
- **Next.js** (export) -- `next export` -> `out/`
- **Create React App** -- `npm run build` -> `build/`
- **Nuxt** (static) -- `nuxt generate` -> `dist/`
- **Gatsby** -- `gatsby build` -> `public/`
- **Hugo** -- `hugo` -> `public/`
- **Plain HTML/CSS/JS** -- directory with `index.html`
