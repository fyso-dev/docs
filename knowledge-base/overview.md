# Knowledge Base (RAG)

Fyso permite crear una base de conocimiento a partir de documentos. Los documentos se procesan automaticamente: se dividen en fragmentos (chunks), se generan embeddings vectoriales y se indexan para busqueda semantica.

## Conceptos

| Concepto | Descripcion |
|----------|-------------|
| **Documento** | Archivo fuente (PDF, TXT, MD) subido a la knowledge base |
| **Chunk** | Fragmento de ~500 tokens con overlap de 50 tokens |
| **Embedding** | Representacion vectorial del chunk para busqueda semantica |
| **Busqueda** | Cosine similarity sobre embeddings via pgvector |

## MCP Tools

### `upload_document`

**Perfil:** advanced

Sube y procesa un documento. El procesamiento es asincrono: el documento se divide en chunks y se generan embeddings.

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `title` | string | Si | Titulo del documento |
| `content` | string | Condicional | Contenido como texto plano o markdown |
| `url` | string | Condicional | URL publica del documento |
| `file_base64` | string | Condicional | Archivo en base64 |
| `mime_type` | string | No | Tipo MIME (auto-detectado si no se provee) |
| `metadata` | object | No | Metadata adicional (autor, categoria, tags) |

Se debe proveer `content`, `url`, o `file_base64`.

#### Ejemplo

```
upload_document({
  title: "Manual de operaciones",
  content: "# Capitulo 1\n\nEste manual describe...",
  metadata: { category: "operations", author: "admin" }
})
```

### `search_knowledge`

**Perfil:** core

Busqueda semantica en la knowledge base. Retorna los chunks mas relevantes.

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `query` | string | Si | Texto de busqueda en lenguaje natural |
| `limit` | number | No | Maximo de resultados (default: 5, max: 20) |
| `min_similarity` | number | No | Similitud minima 0-1 (default: 0.7) |
| `metadata_filter` | object | No | Filtrar por metadata del documento |

#### Ejemplo

```
search_knowledge({
  query: "como procesar una devolucion",
  limit: 3,
  metadata_filter: { category: "operations" }
})
```

#### Respuesta

```json
{
  "results": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "document_title": "Manual de operaciones",
      "content": "Para procesar una devolucion, el operador debe...",
      "similarity": 0.89,
      "chunk_index": 12
    }
  ],
  "total": 1
}
```

### `list_documents`

**Perfil:** core

Lista todos los documentos en la knowledge base.

```
list_documents()
```

Retorna: id, titulo, estado (processing/ready/error), chunk_count, total_tokens, fecha.

### `get_document`

**Perfil:** advanced

Detalle de un documento con metadata y estadisticas.

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `document_id` | string | Si | ID del documento |

### `delete_document`

**Perfil:** advanced

Elimina un documento y todos sus chunks asociados (CASCADE).

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `document_id` | string | Si | ID del documento |

### `get_knowledge_stats`

**Perfil:** core

Estadisticas globales de la knowledge base.

```
get_knowledge_stats()
```

Retorna:

```json
{
  "documents": 15,
  "chunks": 342,
  "total_tokens": 171000,
  "storage_mb": 2.4,
  "avg_similarity_score": 0.82,
  "last_ingestion": "2026-02-19T10:00:00Z"
}
```

## Proveedor de embeddings

El proveedor es configurable via variable de entorno `EMBEDDING_PROVIDER`:

| Valor | Proveedor | Nota |
|-------|-----------|------|
| `openai` (default) | OpenAI text-embedding-3-small | Requiere `OPENAI_API_KEY` |
| `ollama` | Ollama local | Requiere `OLLAMA_URL` |
| `transformers` | Transformers.js (en proceso) | Sin dependencia externa |

## Limites

| Plan | Documentos | Chunks |
|------|-----------|--------|
| Free | No disponible | - |
| Pro | 100 | 10,000 |
| Enterprise | Custom | Custom |
