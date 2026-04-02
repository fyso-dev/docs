---
sidebar_position: 4
---

# Local development against the production API

When building frontend features, you often want to run the web app locally while hitting the real production API instead of a local backend instance. The Vite dev server supports this through its built-in proxy configuration.

## How it works

The Fyso web app (`packages/web/vite.config.ts`) already configures a proxy that forwards API requests to `localhost:3001` in normal development. To point those requests at the production API instead, change the `target` to `https://api.fyso.dev` and enable `secure: true`.

## Configuration

Open `packages/web/vite.config.ts` and update the proxy block:

```ts
// packages/web/vite.config.ts

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        // Default: 'http://localhost:3001'
        target: 'https://api.fyso.dev',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  // ... rest of config
})
```

Start the dev server normally:

```bash
npm run dev
```

All `/api/*` requests from the browser will be forwarded to `https://api.fyso.dev` by Vite. CORS and cookie issues are avoided because the browser sees requests going to `localhost`.

## Before committing

**Revert this change before committing.** The production target must not be checked in — it would redirect all CI and other developers' local builds to production.

A quick way to check what you're about to commit:

```bash
git diff packages/web/vite.config.ts
```

If `api.fyso.dev` appears in the diff, revert it:

```bash
git checkout packages/web/vite.config.ts
```

## Authentication

You still need a valid session to call the API. Log in through the local UI (it proxies to production, so a real login works) or pass a production API key in your requests.

## When to use this

- Debugging a frontend issue that only reproduces with real data
- Building a new UI feature against a stable backend before the local backend is wired up
- Validating that a UI change works end-to-end without running the full local stack
