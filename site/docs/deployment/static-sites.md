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
