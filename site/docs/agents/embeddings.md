---
sidebar_position: 8
---

# Embeddings & Semantic Search

Fyso provides two embedding systems that enable semantic (meaning-based) search across your data:

1. **Record Embeddings** -- vector representations of entity field values, enabling semantic search over structured records.
2. **Knowledge Base RAG** -- document ingestion with chunking and embeddings for retrieval-augmented generation over unstructured content.

Both systems use OpenAI `text-embedding-3-small` (1536 dimensions) and store vectors in PostgreSQL via pgvector.

---

## Record Embeddings

Record embeddings let you search entity records by meaning rather than exact text. When a field has `embedding: true` in its config, Fyso automatically generates and maintains vector embeddings for that field's content.

### Enabling Embeddings on Fields

When creating or updating an entity, set `embedding: true` in the field config:

```
generate_entity({
  name: "articles",
  fields: [
    { name: "title", type: "text", config: { embedding: true } },
    { name: "body", type: "textarea", config: { embedding: true } },
    { name: "category", type: "select", options: ["tech", "science", "health"] }
  ],
  auto_publish: true
})
```

Each field with `embedding: true` gets its own independent vector. When a record is created or updated, embeddings are queued automatically.

### Grouped Embeddings

By default, each embedding field produces a separate vector. If you want to combine multiple fields into a single embedding (useful when fields are semantically related), use `embeddingGroup`:

```
generate_entity({
  name: "products",
  fields: [
    { name: "name", type: "text", config: { embedding: true, embeddingGroup: "description" } },
    { name: "summary", type: "textarea", config: { embedding: true, embeddingGroup: "description" } },
    { name: "specs", type: "textarea", config: { embedding: true } }
  ],
  auto_publish: true
})
```

In this example:
- `name` and `summary` are concatenated (sorted by display order) into a single `_group:description` embedding.
- `specs` gets its own standalone embedding.

Group names must match `^[a-zA-Z][a-zA-Z0-9_-]*$`.

### Embedding TTL

By default, embeddings are regenerated every time a record is updated. For entities with frequent updates where embedding freshness is less critical, set `embeddingTTL` in the entity metadata (in seconds):

```
// Set TTL to 1 hour -- skip re-embedding if the last embedding is < 1 hour old
// (even if content changed)
PATCH /api/entities/articles
{
  "metadata": { "embeddingTTL": 3600 }
}
```

Set `embeddingTTL` to `0` or omit it to always re-embed on update (default behavior).

### How the Worker Operates

- A background worker polls every **60 seconds** for pending embeddings across all tenants.
- Processes up to **50 embeddings per batch**.
- Uses **OpenAI `text-embedding-3-small`** (1536 dimensions).
- Content is hashed (SHA-256) to avoid re-embedding identical content.
- Status transitions: `pending` -> `completed` or `error`.

### Querying with Semantic Search

#### MCP Tool: `query_records`

Add the `semantic` parameter to search by meaning:

```
query_records({
  entityName: "articles",
  semantic: "machine learning for healthcare",
  minSimilarity: 0.6,
  limit: 5
})
```

This matches records whose embedded fields are semantically similar to the query, even if they don't contain the exact words. Each result includes a `similarity` score.

You can combine `semantic` with `filter` -- the filter is applied as a post-filter on semantic results:

```
query_records({
  entityName: "articles",
  semantic: "renewable energy research",
  filter: "category = science",
  limit: 10
})
```

#### REST API

```bash
GET /api/entities/{entityName}/records/search/semantic?q={query}&limit=10&minSimilarity=0.7
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | required | Natural language search query |
| `limit` | number | 10 | Maximum results |
| `minSimilarity` | number | -- | Similarity threshold (0-1) |
| `filter` | string | -- | Simple filter (`field = value`) applied after ranking |

```bash
curl "https://api.fyso.dev/api/entities/articles/records/search/semantic?q=climate+change+impacts&limit=5&minSimilarity=0.7" \
  -H "Authorization: Bearer <token>"
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "rec-uuid",
      "similarity": 0.89,
      "data": {
        "title": "Effects of Global Warming on Agriculture",
        "body": "Rising temperatures are affecting crop yields...",
        "category": "science"
      }
    }
  ]
}
```

### DSL Business Rules: `semantic_search`

Business rules can use the `semantic_search` operation in the Tool DSL to build custom search tools:

```json
{
  "operation": "semantic_search",
  "entity": "articles",
  "semanticField": "query",
  "minSimilarity": 0.6,
  "fieldMapping": {
    "query": "query"
  },
  "semanticFilters": [
    { "field": "category", "valueFrom": "category" }
  ],
  "pagination": {
    "limitParam": "limit"
  }
}
```

| DSL Field | Description |
|-----------|-------------|
| `semanticField` | Parameter name containing the search query |
| `minSimilarity` | Similarity threshold (0-1) |
| `semanticFilters` | Pre-filters applied before similarity ranking |
| `pagination.limitParam` | Parameter name for result limit |

---

## Knowledge Base RAG

The Knowledge Base is a separate system for unstructured documents (PDFs, HTML, text, markdown). Documents are chunked, embedded, and indexed for similarity search. This is ideal for support content, policies, manuals, and other reference material.

For full Knowledge Base documentation, see [Knowledge Base](../admin/knowledge.md).

### Key Differences from Record Embeddings

| | Record Embeddings | Knowledge Base RAG |
|-|-------------------|-------------------|
| **Data source** | Entity field values | Uploaded documents (PDF, HTML, text, markdown, URLs) |
| **Granularity** | One vector per field or field group | One vector per document chunk |
| **Search tool** | `query_records` with `semantic` param | `search_knowledge` |
| **REST endpoint** | `GET /api/entities/{name}/records/search/semantic` | `POST /api/knowledge/search` |
| **Use case** | Structured data search (products, articles, tickets) | Unstructured content RAG (manuals, FAQs, policies) |

### MCP Tools

| Tool | Profile | Description |
|------|---------|-------------|
| `query_records` | core | Records semantic search (via `semantic` param) |
| `search_knowledge` | core | Knowledge base similarity search |
| `upload_document` | core | Ingest documents into knowledge base |
| `list_documents` | core | List all knowledge base documents |
| `get_document` | core | Get document metadata and chunk preview |
| `delete_document` | advanced | Remove document and its chunks |
| `get_knowledge_stats` | core | Knowledge base indexing and search stats |

---

## Admin Endpoints

### Record Embedding Stats

```bash
GET /api/metadata/embeddings/stats
Authorization: Bearer <token>
```

Returns embedding counts by status (pending, completed, error), per-entity breakdown, worker health, and pgvector version.

### Knowledge Base Stats

```bash
GET /api/knowledge/stats
Authorization: Bearer <token>
```

Returns document counts, chunk totals, token usage, search analytics, and top documents. See [Knowledge Base - Stats](../admin/knowledge.md#stats) for the full response shape.

### Reindex Knowledge Base

Regenerate embeddings for knowledge base chunks with missing vectors:

```bash
POST /api/knowledge/reindex
Authorization: Bearer <token>
Content-Type: application/json

# Reindex all documents with missing embeddings
{}

# Reindex specific documents
{ "documentIds": ["uuid-1", "uuid-2"] }
```

### Reindex Record Embeddings

Re-queue failed record embeddings:

```bash
POST /api/knowledge/reindex-records
Authorization: Bearer <token>
Content-Type: application/json

# Re-queue all errors
{}

# Re-queue for a specific entity (include pending too)
{ "entityId": "uuid", "includePending": true }
```

---

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | No | `openai` | Embedding provider (currently only `openai`) |
| `OPENAI_API_KEY` | Yes (for embeddings) | -- | OpenAI API key for generating embeddings |

Without `OPENAI_API_KEY`, the embedding worker does not start and semantic search returns no results. The Knowledge Base similarly requires this key for document indexing and search.
