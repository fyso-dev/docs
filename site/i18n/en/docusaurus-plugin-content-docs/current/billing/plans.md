# Plans and Limits

Fyso offers plans with different usage limits. The plan belongs to the builder (adminUser), not the tenant: a builder can create multiple tenants under one plan.

## Plan Comparison

| Resource | Free | Pro | Enterprise |
|----------|------|-----|------------|
| Entities | 3 | Unlimited | Unlimited |
| Records | 500 | Unlimited | Unlimited |
| Static sites | 1 | Unlimited | Unlimited |
| Users | 2 | Unlimited | Unlimited |
| Storage | 100 MB | 10 GB | Custom |
| API requests/month | 10,000 | 1,000,000 | Custom |
| API rate limit | 60 req/min | 300 req/min | 600 req/min |
| Custom domain | No | Yes | Yes |
| Dedicated deployment | No | No | Yes |

## Free Plan

Included at no cost. Ideal for testing the platform or small projects.

**Limits:**
- Up to 3 entities
- Up to 500 total records (across all entities)
- 1 static site
- 2 tenant users
- 10,000 API requests per month
- Rate limit: 60 req/min per API key

When a limit is reached, the operation is rejected with `HTTP 402 Payment Required` and a descriptive message.

## Pro Plan

Full plan for production projects.

**Includes:**
- Unlimited entities
- Unlimited records
- Unlimited static sites
- Unlimited users
- 1,000,000 API requests per month
- Rate limit: 300 req/min per API key
- Custom domain for static sites

## Enterprise Plan

For organizations that require isolation and dedicated resources.

**Includes everything in Pro, plus:**
- Dedicated API instance (no shared resources)
- Custom rate limits
- Custom storage
- SLA and priority support

## Response when a limit is reached

```json
{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "You have reached the limit of 3 entities on the Free plan. Upgrade to Pro."
  }
}
```

HTTP status: `402 Payment Required`

## Rate limiting

Rate limits are applied per API key (or per tenant for JWT authentication):

- **Response headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Policy`
- When exceeded: `HTTP 429 Too Many Requests`

In addition to per-API-key rate limits, there is a 200 req/min per-tenant rate limit on entity, metadata, generation, and rules routes.

## Check current usage

```bash
curl -H "Authorization: Bearer $FYSO_API_KEY" \
  "https://api.fyso.dev/api/usage"
```

Response:

```json
{
  "success": true,
  "data": {
    "plan": "free",
    "period": "2026-02",
    "entities": { "used": 2, "limit": 3, "pct": 67 },
    "records": { "used": 120, "limit": 500, "pct": 24 },
    "api_requests": { "used": 3500, "limit": 10000, "pct": 35 },
    "storage_bytes": { "used": 5242880, "limit": 104857600, "pct": 5 }
  }
}
```

## Upgrade

From the web panel: **Billing** > **Upgrade to Pro**.
