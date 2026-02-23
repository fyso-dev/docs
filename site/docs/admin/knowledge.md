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

## Dashboard

From the admin panel, go to **Knowledge** in the sidebar to manage your knowledge base visually:

- **Stats bar** — document count, storage used, total chunks
- **Document list** — source type badge, status badge (ready/processing/error), created date, delete button
- **Add document panel** — text tab (title + content) or URL tab (title + URL)
- **Search panel** — enter a query, see results with relevance scores

## Use Cases

- **Support chatbots**: Index FAQ documents, answer user questions with `search_knowledge`
- **Internal wikis**: Upload policies and procedures, let agents surface relevant content
- **Product documentation**: Augment business rules with external knowledge
