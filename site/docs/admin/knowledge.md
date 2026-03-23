---
sidebar_position: 4
---

# Knowledge Base

The Knowledge Base lets you upload documents and query them via semantic search using RAG (Retrieval-Augmented Generation). Documents are chunked, embedded, and indexed for fast similarity search.

## Uploading Documents

**MCP Tool: `upload_document`** (Profile: core)

```
upload_document({
  filePath: "/path/to/document.pdf",
  title: "Product Manual 2026",
  description: "Optional description"
})
```

Supported formats: **PDF**, **HTML** (.html, .htm), **plain text** (.txt), **Markdown** (.md).

- PDF: text is extracted automatically before chunking.
- HTML: tags are stripped, preserving text structure. Navigation elements (`<nav>`, `<header>`, `<footer>`, `<aside>`, `<svg>`, `<form>`, `<button>`) and script/style blocks are removed.
- Text/Markdown: chunked and indexed directly.

After upload, the document is automatically chunked and indexed in the background. Status transitions from `processing` → `ready`.

### URL Ingestion

You can ingest content from a URL. Fyso will download the page, extract clean text (stripping HTML navigation/chrome), and index it:

```
upload_document({
  title: "Company Policy",
  content: "https://example.com/policy",
  source_type: "url"
})
```

**REST API:**

```bash
curl -X POST https://api.fyso.dev/api/knowledge/documents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Company Policy",
    "content": "https://example.com/policy",
    "source_type": "url"
  }'
```

- Only text-based resources are supported (HTML, plain text, JSON, XML)
- 15-second timeout on URL fetch
- SSRF protection: private/internal IPs are blocked

### Binary PDF Upload (REST API)

To upload a PDF file directly from your backend or CI pipeline, use the multipart endpoint:

```bash
POST /api/knowledge/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

curl -X POST https://api.fyso.dev/api/knowledge/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/manual.pdf" \
  -F "title=Product Manual 2026"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | PDF file (`application/pdf` only, max 20 MB) |
| `title` | string | No | Document title. Defaults to the filename. |

Returns `201` on success with the document metadata.

**Errors:**

| Code | Description |
|------|-------------|
| `400` | Missing `file` field or unsupported MIME type (only PDF accepted) |
| `403` | Plan document or storage limit reached |

### Bulk URL Indexing

Index multiple URLs in one request (max 50):

```bash
curl -X POST https://api.fyso.dev/api/knowledge/documents/bulk \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      { "title": "FAQ", "content": "https://example.com/faq", "source_type": "url" },
      { "title": "Pricing", "content": "https://example.com/pricing", "source_type": "url" }
    ]
  }'
```

### Bulk File Upload

Upload multiple files in one request (max 50):

```bash
curl -X POST https://api.fyso.dev/api/knowledge/documents/upload/bulk \
  -H "Authorization: Bearer <token>" \
  -F "files=@manual1.pdf" \
  -F "files=@manual2.pdf"
```

Both bulk endpoints return a `207` response with per-item success/failure:

```json
{
  "results": [
    { "title": "FAQ", "status": "success", "document_id": "uuid" },
    { "title": "Pricing", "status": "error", "error": "URL fetch timeout" }
  ]
}
```

Plan limits are checked before processing. If the batch would exceed your plan quota, the entire request is rejected.

### Plan limits

| Plan | Documents | Storage |
|------|-----------|---------|
| Free | 10 | 5 MB |
| Pro | 1,000 | 1 GB |

## Searching Documents

**MCP Tool: `search_knowledge`** (Profile: core)

```
search_knowledge({
  query: "How do I reset the device?",
  limit: 5,
  threshold: 0.3,
  one_per_document: true
})
```

Returns matching chunks with source document, relevance score, and content excerpt. Every search is tracked for analytics (see [Stats](#stats)).

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | Natural language search query |
| `limit` | number | 10 | Maximum results (max 50) |
| `threshold` | number | 0.3 | Minimum similarity score 0-1. Lower = more results |
| `one_per_document` | boolean | false | Return only the best chunk per document |
| `document_ids` | string[] | all | Restrict search to specific documents |

:::tip Search Tips
Search works by meaning, not exact keywords. Instead of a single word like "price", try "what is the product price" or "information about pricing". The more you describe what you're looking for, the better the results.
:::

**REST API:**

```bash
curl -X POST https://api.fyso.dev/api/knowledge/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I reset the device?",
    "limit": 5,
    "threshold": 0.3,
    "one_per_document": true
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "content": "To reset, hold the power button for 10 seconds...",
        "score": 0.92,
        "document": { "id": "...", "title": "Product Manual 2026", "source_type": "file" },
        "chunk_index": 3,
        "token_count": 145
      }
    ],
    "query_time_ms": 45
  }
}
```

## Listing Documents

**MCP Tool: `list_documents`** (Profile: core)

Lists all documents in the tenant with metadata (title, upload date, chunk count, indexing status).

Filter by status: `GET /api/knowledge/documents?status=ready`

## Getting a Document

**MCP Tool: `get_document`** (Profile: core)

```
get_document({ documentId: "uuid" })
```

Returns document metadata, content, and a preview of the first 5 chunks.

## Deleting Documents

**MCP Tool: `delete_document`** (Profile: advanced)

```
delete_document({ documentId: "uuid" })
```

Removes the document and all its indexed chunks. A `knowledge_delete` event is tracked for analytics.

## Stats

**MCP Tool: `get_knowledge_stats`** (Profile: core)

Returns indexing statistics, search analytics, and embedding usage:

```bash
GET /api/knowledge/stats
```

```json
{
  "documents": {
    "total": 42,
    "ready": 40,
    "processing": 1,
    "error": 1
  },
  "chunks": {
    "total": 1820,
    "avg_per_document": 43
  },
  "tokens": {
    "total": 218400,
    "avg_per_chunk": 120
  },
  "storage_bytes": 4718592,
  "by_type": {
    "application/pdf": 30,
    "text/html": 10,
    "text/plain": 2
  },
  "search": {
    "total_queries_30d": 156,
    "avg_latency_ms": 52,
    "avg_score": 0.84,
    "zero_result_rate": 0.06,
    "coverage_score": 0.94
  },
  "embedding_usage_30d": {
    "search_tokens": 3200,
    "ingest_tokens": 45000,
    "total_tokens": 48200,
    "total_ingests": 42,
    "avg_ingest_ms": 1250
  },
  "top_documents": [
    { "id": "...", "title": "Product Manual 2026", "hit_count": 48 }
  ]
}
```

### Stats fields

| Field | Description |
|-------|-------------|
| `search.total_queries_30d` | Number of searches in the last 30 days |
| `search.avg_score` | Average top relevance score |
| `search.zero_result_rate` | Fraction of queries that returned no results |
| `search.coverage_score` | Fraction of queries that returned at least one result |
| `embedding_usage_30d.search_tokens` | OpenAI embedding tokens used for search queries |
| `embedding_usage_30d.ingest_tokens` | OpenAI embedding tokens used for document ingestion |
| `embedding_usage_30d.total_tokens` | Total embedding tokens (search + ingest) |
| `embedding_usage_30d.avg_ingest_ms` | Average document processing time |

## Event Tracking

All knowledge base operations are tracked via events for analytics and billing:

| Event | Tracked Data |
|-------|-------------|
| `knowledge_ingest` | document_id, title, source_type, mime_type, original_size_bytes, chunk_count, total_tokens, embedding_tokens_used, processing_ms |
| `knowledge_search` | query, result_count, top_score, latency_ms, document_ids_hit, embedding_tokens_used |
| `knowledge_delete` | document_id, title, source_type, chunk_count, total_tokens, original_size_bytes |

## Storage Usage

To get a breakdown of knowledge base storage for monitoring or billing purposes:

```bash
GET /api/usage/storage
Authorization: Bearer <token>
```

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
    "total_bytes": 8388608
  }
}
```

- `db.bytes` — total PostgreSQL storage for all tenant tables (exact)
- `db.estimated_rows` — estimated row count from PostgreSQL statistics (approximate)
- `knowledge_base.bytes` — sum of original file sizes for all documents
- `bucket` — file storage used (stub; returns 0 in the current release)
- `total_bytes` — db + bucket (knowledge_base not included in total)

## Dashboard

From the admin panel, go to **Knowledge** in the sidebar to manage your knowledge base visually:

- **Stats bar** — document count, storage used, total chunks
- **Document list** — PDF badge for PDF files, status badge (ready/processing/error), file size, content preview, delete button
- **Add document panel** — text tab (title + content), URL tab (fetches and indexes the page), or file upload tab (PDF)
- **Search panel** — enter a query, adjust precision slider, toggle fragments/one-per-doc, see results with certainty bar
- **Help modal** — explains search options and how to search effectively
- **Usage page** — storage breakdown by file type (PDF, Text, Markdown, HTML)

## Use Cases

- **Support chatbots**: Index FAQ documents, answer user questions with `search_knowledge`
- **Internal wikis**: Upload policies and procedures, let agents surface relevant content
- **Product documentation**: Augment business rules with external knowledge
- **Web content**: Ingest pages via URL, automatically cleaned of navigation/chrome
