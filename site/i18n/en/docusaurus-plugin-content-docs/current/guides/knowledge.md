# Knowledge Base (RAG)

Fyso includes a vector knowledge base per tenant. Agents can ingest documents and search by semantic similarity to build RAG systems.

## Use cases

- **Chatbot with custom knowledge** — the agent searches the base before responding
- **Semantic search over internal documentation** — manuals, FAQs, contracts
- **Record classification** — find products similar to a description

## Ingest documents

### Plain text

```
upload_document({
  content: "Fyso is a platform for building backends without code...",
  title: "About Fyso",
  source_type: "text"
})
```

### From a URL

```
upload_document({
  content: "https://docs.fyso.dev/intro",
  source_type: "url",
  title: "Fyso Documentation"
})
```

### PDF or HTML

Upload first with `upload_file` to get a URL, then ingest:

```
upload_document({
  content: "https://my-bucket.s3.amazonaws.com/manual.pdf",
  source_type: "url",
  title: "User Manual",
  mime_type: "application/pdf"
})
```

Supported types: `text/plain`, `text/html`, `application/pdf`.

### Via REST API

```bash
curl -X POST "https://api.fyso.dev/api/knowledge/documents" \
  -H "Authorization: Bearer $FYSO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Document content...",
    "title": "My document",
    "source_type": "text"
  }'
```

## Document status

| Status | Description |
|--------|-------------|
| `pending` | Queued for processing |
| `processing` | Chunking and generating embeddings |
| `ready` | Available for search |
| `error` | Failed during ingestion |

## Search the knowledge base

```
search_knowledge({
  query: "how to configure webhooks in Fyso",
  limit: 5,
  min_score: 0.7
})
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | - | Search text (natural language) |
| `limit` | number | 10 | Maximum results |
| `min_score` | number | 0.0 | Minimum similarity (0.0 - 1.0) |

**Response:**

```json
{
  "results": [
    {
      "documentId": "uuid",
      "title": "Webhooks Documentation",
      "content": "Webhooks are configured from...",
      "score": 0.87,
      "chunkIndex": 2
    }
  ]
}
```

## List documents

```
list_documents()
```

Returns id, title, source_type, status, chunk count, and date.

## View a document

```
get_document({ documentId: "uuid" })
```

## Delete a document

```
delete_document({ documentId: "uuid" })
```

## Statistics

```
get_knowledge_stats()
```

Returns total documents, chunks, storage used, and status distribution.

## Admin panel

In the web panel, go to **Knowledge** in the sidebar.

Includes:
- Base statistics
- Document list with status and type
- Text or URL upload panel
- Semantic search with score display

## Limits

| Resource | Free | Pro |
|----------|------|-----|
| Documents | 50 | Unlimited |
| Chunk storage | Included in general storage | Included in general storage |
| Searches/month | 1,000 | Unlimited |
