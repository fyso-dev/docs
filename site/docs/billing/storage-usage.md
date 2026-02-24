# Storage Usage

The storage usage endpoint provides a breakdown of how much storage your tenant is consuming across all categories.

## Endpoint

```bash
GET /api/usage/storage
Authorization: Bearer <token>
```

Requires authentication. Returns storage stats for the authenticated tenant.

## Response

```json
{
  "success": true,
  "data": {
    "db": {
      "bytes": 8388608,
      "table_count": 12,
      "estimated_rows": 347
    },
    "knowledge_base": {
      "bytes": 512000,
      "documents": 3
    },
    "bucket": {
      "bytes": 0,
      "file_count": 0
    },
    "total_bytes": 8900608
  }
}
```

## Response fields

### `db`

Database storage consumed by the tenant's schema.

| Field | Description |
|-------|-------------|
| `bytes` | Total bytes used by all tenant tables (via `pg_total_relation_size`) |
| `table_count` | Number of tables in the tenant schema |
| `estimated_rows` | Estimated total row count across all tables (PostgreSQL statistics, not exact) |

> `estimated_rows` is sourced from `pg_class.reltuples` — a PostgreSQL estimate that is accurate after an `ANALYZE` but may be slightly stale between vacuum cycles.

### `knowledge_base`

Storage used by documents ingested into the knowledge base.

| Field | Description |
|-------|-------------|
| `bytes` | Sum of `original_size_bytes` for all documents in the knowledge base |
| `documents` | Number of documents stored |

### `bucket`

File storage (uploaded binary files).

| Field | Description |
|-------|-------------|
| `bytes` | Total bytes of uploaded files |
| `file_count` | Number of files stored |

> In the current version, `bucket` returns `0` for both fields. Full S3/object-storage accounting is planned for a future release.

### `total_bytes`

Sum of `db.bytes + knowledge_base.bytes + bucket.bytes`.

## Example

```bash
curl -H "Authorization: Bearer <token>" \
  https://api.fyso.dev/api/usage/storage
```

```json
{
  "success": true,
  "data": {
    "db": {
      "bytes": 2097152,
      "table_count": 5,
      "estimated_rows": 120
    },
    "knowledge_base": {
      "bytes": 204800,
      "documents": 1
    },
    "bucket": {
      "bytes": 0,
      "file_count": 0
    },
    "total_bytes": 2301952
  }
}
```

## Error responses

| Status | Cause |
|--------|-------|
| `401` | Missing or invalid authentication token |
