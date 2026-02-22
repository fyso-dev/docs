# Static Sites

Fyso allows deploying static sites (Astro, Vite, Next.js export, etc.) on subdomains of `sites.fyso.dev`.

## MCP Tool: `deploy_static_site`

**Profile:** core

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subdomain` | string | Yes | Subdomain (e.g., `"mi-portfolio"` -> `mi-portfolio.sites.fyso.dev`) |
| `path` | string | Conditional | Absolute path to the build directory (e.g., `/home/user/my-site/dist`) |
| `bundle_base64` | string | Conditional | ZIP in base64 (only for sites < 5KB) |

Either `path` or `bundle_base64` must be provided.

### Subdomain Restrictions

- Only lowercase letters, numbers, and hyphens
- No spaces or special characters

### Local Mode (MCP has filesystem access)

The MCP server compresses the directory and uploads it automatically:

```
deploy_static_site({
  subdomain: "mi-portfolio",
  path: "/home/user/my-site/dist"
})
```

### Remote Mode (MCP does not have filesystem access)

If the MCP server cannot access the path, it returns a `curl` command to execute manually:

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

The agent must execute the returned command using the Bash tool.

### Successful Response

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

## Custom Domains (Pro)

Point any domain you own to your site. Requires a Pro plan.

### MCP Tool: `set_custom_domain`

**Profile:** advanced

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subdomain` | string | Yes | Subdomain of the deployed site |
| `action` | string | Yes | `add`, `verify`, `status`, or `remove` |
| `domain` | string | Conditional | Custom domain to add (e.g., `app.mycompany.com`). Required for `add`. |

### Setup

**Step 1 — Add the domain:**

```
set_custom_domain({
  subdomain: "mi-portfolio",
  action: "add",
  domain: "app.mycompany.com"
})
```

The response includes DNS instructions. Add a `CNAME` record pointing your domain to the provided target.

**Step 2 — Verify:**

```
set_custom_domain({
  subdomain: "mi-portfolio",
  action: "verify"
})
```

Returns `status: "active"` once DNS propagates and SSL is provisioned.

**Step 3 — Done.** Your site is now accessible at both `mi-portfolio.sites.fyso.dev` and `app.mycompany.com`.

### Remove a custom domain

```
set_custom_domain({
  subdomain: "mi-portfolio",
  action: "remove"
})
```

---

## Limits

| Plan | Sites |
|------|-------|
| Free | 1 |
| Pro | Unlimited |

## Supported Frameworks

Any framework that generates static output:

- **Astro** -- `npm run build` -> `dist/`
- **Vite** -- `npm run build` -> `dist/`
- **Next.js** (export) -- `next export` -> `out/`
- **Create React App** -- `npm run build` -> `build/`
- **Plain HTML/CSS/JS** -- directory with `index.html`
