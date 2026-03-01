# Plans and Limits

Fyso offers four plans with different usage limits. When a limit is reached, the operation is rejected with a descriptive error message.

## Plan Comparison

| Resource | Free | Pro | Beta | Enterprise |
|----------|------|-----|------|------------|
| Tenants | 1 | 5 | Unlimited | Unlimited |
| Entities | 3 | Unlimited | Unlimited | Unlimited |
| Records | 500 | 50,000 | Unlimited | Unlimited |
| Static sites | 1 | Unlimited | Unlimited | Unlimited |
| Users | 2 | Unlimited | Unlimited | Unlimited |
| Storage | 100 MB | 5 GB | Unlimited | Unlimited |
| Emails / month | 100 | 5,000 | Unlimited | Unlimited |
| PDFs / month | 50 | Unlimited | Unlimited | Unlimited |
| Geocode calls / month | 100 | 5,000 | Unlimited | Unlimited |

## Rate Limits

| Limit | Free | Pro | Beta | Enterprise |
|-------|------|-----|------|------------|
| API requests / minute | 60 | 300 | 300 | Unlimited |
| API requests / month | 10,000 | 500,000 | Unlimited | Unlimited |
| MCP calls / month | 1,000 | 50,000 | Unlimited | Unlimited |

Rate-limited requests return HTTP `429 Too Many Requests`.

## Free Plan

Included at no cost. Good for testing the platform or small projects.

## Pro Plan

Higher limits across all resources. Suitable for production workloads.

## Beta Plan

Full access during the Fyso beta phase. Unlimited metered resources with the same per-minute rate limit as Pro (300 req/min).

## Enterprise Plan

No usage limits and no rate limits. Contact the Fyso team for details.

## Check Current Usage

### MCP Tool

Use the `get_usage` tool to retrieve current usage and limits for your tenant.

### REST API

```
GET /api/billing/usage
```

**Headers:**

```
Authorization: Bearer <admin-api-key>
```

**Response:**

Returns current usage counts and plan limits for all metered resources (entities, records, sites, users, storage, emails, PDFs, API requests, MCP calls, geocode calls).
