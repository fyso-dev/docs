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
- HTML: tags are stripped, preserving text structure; `<script>`, `<style>`, and `<noscript>` blocks are skipped.
- Text/Markdown: chunked and indexed directly.

After upload, the document is automatically chunked and indexed in the background. Status transitions from `processing` → `ready`.

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
  minSimilarity: 0.7
})
```

Returns matching chunks with source document, relevance score, and content excerpt. Every search is tracked for analytics (see [Stats](#stats)).

**REST API:**

```bash
curl -X POST https://api.fyso.dev/api/knowledge/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "How do I reset the device?", "limit": 5, "threshold": 0.7 }'
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
        "chunk_index": 3
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

Removes the document and all its indexed chunks.

## Stats

**MCP Tool: `get_knowledge_stats`** (Profile: core)

Returns indexing statistics and search analytics:

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
  "top_documents": [
    { "id": "...", "title": "Product Manual 2026", "hit_count": 48 }
  ]
}
```

`search` and `top_documents` are present when the events table is available. `zero_result_rate` is the fraction of queries that returned no results. `coverage_score` is the fraction that returned at least one result.

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
- **Document list** — PDF badge for PDF files, status badge (ready/processing/error), file size, delete button
- **Add document panel** — text tab (title + content), URL tab, or file upload tab (PDF)
- **Search panel** — enter a query, see results with relevance scores
- **Usage page** — storage breakdown by file type (PDF, Text, Markdown, HTML)

## Use Cases

- **Support chatbots**: Index FAQ documents, answer user questions with `search_knowledge`
- **Internal wikis**: Upload policies and procedures, let agents surface relevant content
- **Product documentation**: Augment business rules with external knowledge
