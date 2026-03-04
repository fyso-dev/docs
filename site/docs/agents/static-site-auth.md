# Auth for Static Sites

This guide covers authentication strategies for static sites deployed on Fyso. Choose the method that fits your use case.

## Public Keys (`fyso_pk_*`)

Best for **public-facing read-only** content like dashboards, directories, or catalogs.

Public keys are created via the MCP `create_record` tool on the `_fyso_api_keys` entity or through the admin UI. They support:

- Configurable TTL (up to 365 days)
- RBAC scoping per entity and operation
- Rate limiting
- CORS origin restrictions
- Field-level read/write permissions

```bash
curl -H "Authorization: Bearer fyso_pk_abc123..." \
  -H "X-Tenant-ID: my-company-abc123" \
  "https://api.fyso.dev/api/entities/products/records"
```

Public keys do **not** require user login. They are ideal for pages that display data without user interaction.

## Dynamic Login

Best for **authenticated experiences** where each user sees personalized data.

The flow:
1. User enters credentials in your static site
2. Your JS calls `POST /api/auth/tenant/login` to get a JWT
3. Use the JWT for subsequent API calls

### Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Fyso App</title>
</head>
<body>
  <div id="login-form">
    <h2>Login</h2>
    <input type="email" id="email" placeholder="Email" />
    <input type="password" id="password" placeholder="Password" />
    <button onclick="login()">Login</button>
  </div>

  <div id="app" style="display:none">
    <h2>Records</h2>
    <ul id="record-list"></ul>
  </div>

  <script>
    const TENANT_ID = 'my-company-abc123';
    const BASE_URL = 'https://api.fyso.dev/api';
    let token = null;

    async function login() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const res = await fetch(`${BASE_URL}/auth/tenant/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': TENANT_ID,
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (json.success) {
        token = json.data.token;
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadRecords();
      } else {
        alert('Login failed: ' + (json.error?.message || 'Unknown error'));
      }
    }

    async function loadRecords() {
      const res = await fetch(`${BASE_URL}/entities/products/records`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': TENANT_ID,
        },
      });

      const json = await res.json();
      const list = document.getElementById('record-list');
      list.innerHTML = '';

      for (const record of json.data.items) {
        const li = document.createElement('li');
        li.textContent = record.name || record.id;
        list.appendChild(li);
      }
    }
  </script>
</body>
</html>
```

## Temporary Tokens

For **demos and quick tests only**. You can manually generate a JWT via the MCP `tenant_login` tool and hardcode it in your static site.

```javascript
// WARNING: Token will expire. Do NOT use in production.
const TEMP_TOKEN = 'eyJhbGciOiJIUzI1NiIs...';

fetch('https://api.fyso.dev/api/entities/products/records', {
  headers: {
    'Authorization': `Bearer ${TEMP_TOKEN}`,
    'X-Tenant-ID': 'my-company-abc123',
  },
});
```

> **Warning:** JWTs expire (default 24h). Hardcoded tokens will stop working after expiration. Use public keys or dynamic login for anything beyond a quick test.

## Choosing the Right Method

| Method | Auth required | TTL | Best for |
|--------|--------------|-----|----------|
| Public Key (`fyso_pk_*`) | No | Up to 365 days | Public dashboards, catalogs, read-only pages |
| Dynamic Login | Yes (per user) | JWT expiry (~24h) | User-specific data, interactive apps |
| Temporary Token | No | JWT expiry (~24h) | Quick demos and development tests |
