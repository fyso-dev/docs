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

Supported formats: PDF, plain text (.txt), Markdown (.md).

After upload, the document is automatically chunked and indexed in the background.

## Searching Documents

**MCP Tool: `search_knowledge`** (Profile: core)

```
search_knowledge({
  query: "How do I reset the device?",
  limit: 5,
  minSimilarity: 0.7
})
```

Returns matching chunks with source document, relevance score, and content excerpt.

## Listing Documents

**MCP Tool: `list_documents`** (Profile: core)

Lists all documents in the tenant with metadata (title, upload date, chunk count, indexing status).

## Getting a Document

**MCP Tool: `get_document`** (Profile: core)

```
get_document({ documentId: "uuid" })
```

Returns document metadata and content.

## Indexing Stats

**MCP Tool: `get_knowledge_stats`** (Profile: core)

Returns:
- Total documents
- Total chunks indexed
- Embedding coverage (%)
- Documents pending indexing

## Deleting Documents

**MCP Tool: `delete_document`** (Profile: advanced)

```
delete_document({ documentId: "uuid" })
```

Removes the document and all its indexed chunks.

## Use Cases

- **Support chatbots**: Index FAQ documents, answer user questions with `search_knowledge`
- **Internal wikis**: Upload policies and procedures, let agents surface relevant content
- **Product documentation**: Augment business rules with external knowledge
