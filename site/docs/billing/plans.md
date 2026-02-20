# Plans and Limits

Fyso offers plans with different usage limits.

## Plan Comparison

| Resource | Free | Pro (14.99 EUR/month) | Enterprise |
|----------|------|-----------------------|------------|
| Tenants | 1 | 5 | By contract |
| Entities | 3 | Unlimited | Unlimited |
| Records | 500 | 50,000 | By contract |
| Static sites | 1 | Unlimited | Unlimited |
| Users | 2 | Unlimited | Unlimited |
| API rate limit | 60 req/min | 300 req/min | Custom |
| Knowledge Base | No | Yes | Yes |
| Custom RBAC | No | Yes | Yes |
| Support | Community | Email | Dedicated + SLA |

## Free Plan

Included at no cost. Ideal for testing the platform or small projects.

**Limits:**
- Up to 3 entities
- Up to 500 total records (across all entities)
- 1 static site
- 2 tenant users

When a limit is reached, the operation is rejected with a descriptive message.

## Pro Plan

Full plan with no usage restrictions.

**Includes:**
- Unlimited entities
- Unlimited records
- Unlimited static sites
- Unlimited users

## Beta Plan

Full access during the Fyso beta phase. Same limits as Pro.

## Enterprise Plan

For companies that need total isolation, dedicated SLA, or deployment on their own infrastructure.

**Includes:**
- Dedicated instance on client's Azure/AWS
- Custom SLA
- Dedicated support
- Custom rate limits
- Managed backup and recovery

Contact: enterprise@fyso.dev

## Usage and Quotas (v1.10.0)

Usage can be checked via API (`GET /api/usage`) or MCP (`get_usage`).

When a limit is exceeded:
- The operation is rejected with HTTP 402 (Payment Required)
- The message indicates the limit reached and suggests upgrade
- MCP agents receive the same message and can inform the user

## Check Current Usage

Usage can be checked from the admin panel. It shows:
- Current plan
- Entities: used / limit
- Records: used / limit
- Sites: used / limit
- Users: used / limit
