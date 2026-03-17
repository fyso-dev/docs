---
sidebar_position: 4
---

# Base de conocimiento

La Base de conocimiento te permite subir documentos y consultarlos via busqueda semantica usando RAG (Retrieval-Augmented Generation). Los documentos se dividen en fragmentos, se generan embeddings y se indexan para busqueda por similitud.

## Subir documentos

**Herramienta MCP: `upload_document`** (Perfil: core)

```
upload_document({
  filePath: "/path/to/document.pdf",
  title: "Manual de producto 2026",
  description: "Descripcion opcional"
})
```

Formatos soportados: **PDF**, **HTML** (.html, .htm), **texto plano** (.txt), **Markdown** (.md).

- PDF: el texto se extrae automaticamente antes de fragmentar.
- HTML: se eliminan los tags, preservando la estructura del texto. Elementos de navegacion (`<nav>`, `<header>`, `<footer>`, `<aside>`, `<svg>`, `<form>`, `<button>`) y bloques script/style se eliminan.
- Texto/Markdown: se fragmenta e indexa directamente.

Despues de subir, el documento se fragmenta e indexa automaticamente. El estado cambia de `processing` a `ready`.

### Ingesta por URL

Se puede ingestar contenido desde una URL. Fyso descarga la pagina, extrae texto limpio (eliminando navegacion/chrome del HTML), y lo indexa:

```
upload_document({
  title: "Politica de la empresa",
  content: "https://example.com/politica",
  source_type: "url"
})
```

**API REST:**

```bash
curl -X POST https://api.fyso.dev/api/knowledge/documents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Politica de la empresa",
    "content": "https://example.com/politica",
    "source_type": "url"
  }'
```

- Solo recursos basados en texto (HTML, texto plano, JSON, XML)
- Timeout de 15 segundos para la descarga
- Proteccion SSRF: IPs privadas/internas estan bloqueadas

### Subir PDF binario (API REST)

Para subir un archivo PDF directamente desde tu backend o pipeline CI, usa el endpoint multipart:

```bash
POST /api/knowledge/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

curl -X POST https://api.fyso.dev/api/knowledge/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/manual.pdf" \
  -F "title=Manual de producto 2026"
```

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `file` | binary | Si | Archivo PDF (`application/pdf` unicamente, max 20 MB) |
| `title` | string | No | Titulo del documento. Por defecto usa el nombre del archivo. |

Retorna `201` en caso de exito con los metadatos del documento.

**Errores:**

| Codigo | Descripcion |
|--------|-------------|
| `400` | Campo `file` faltante o tipo MIME no soportado (solo PDF aceptado) |
| `403` | Limite de documentos o almacenamiento del plan alcanzado |

### Indexacion masiva de URLs

Indexar multiples URLs en una sola solicitud (max 50):

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

### Subida masiva de archivos

Subir multiples archivos en una sola solicitud (max 50):

```bash
curl -X POST https://api.fyso.dev/api/knowledge/documents/upload/bulk \
  -H "Authorization: Bearer <token>" \
  -F "files=@manual1.pdf" \
  -F "files=@manual2.pdf"
```

Ambos endpoints masivos retornan una respuesta `207` con exito/error por cada elemento:

```json
{
  "results": [
    { "title": "FAQ", "status": "success", "document_id": "uuid" },
    { "title": "Pricing", "status": "error", "error": "URL fetch timeout" }
  ]
}
```

Los limites del plan se verifican antes de procesar. Si el lote excede la cuota del plan, la solicitud completa se rechaza.

### Limites por plan

| Plan | Documentos | Almacenamiento |
|------|-----------|----------------|
| Free | 10 | 5 MB |
| Pro | 1,000 | 1 GB |

## Buscar documentos

**Herramienta MCP: `search_knowledge`** (Perfil: core)

```
search_knowledge({
  query: "Como reinicio el dispositivo?",
  limit: 5,
  threshold: 0.3,
  one_per_document: true
})
```

Retorna fragmentos coincidentes con documento fuente, puntaje de relevancia y extracto del contenido. Cada busqueda se registra para analiticas (ver [Estadisticas](#estadisticas)).

### Parametros

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `query` | string | requerido | Consulta en lenguaje natural |
| `limit` | number | 10 | Maximo de resultados (max 50) |
| `threshold` | number | 0.3 | Puntaje minimo de similitud 0-1. Menor = mas resultados |
| `one_per_document` | boolean | false | Retorna solo el mejor fragmento por documento |
| `document_ids` | string[] | todos | Restringir busqueda a documentos especificos |

:::tip Tips de busqueda
La busqueda funciona por significado, no por palabras exactas. En vez de buscar una sola palabra como "precio", intenta buscar algo como "cual es el precio del producto" o "informacion sobre precios". Cuanto mas describas lo que buscas, mejores resultados se obtienen.
:::

**API REST:**

```bash
curl -X POST https://api.fyso.dev/api/knowledge/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Como reinicio el dispositivo?",
    "limit": 5,
    "threshold": 0.3,
    "one_per_document": true
  }'
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "content": "Para reiniciar, mantenga presionado el boton de encendido 10 segundos...",
        "score": 0.92,
        "document": { "id": "...", "title": "Manual de producto 2026", "source_type": "file" },
        "chunk_index": 3,
        "token_count": 145
      }
    ],
    "query_time_ms": 45
  }
}
```

## Listar documentos

**Herramienta MCP: `list_documents`** (Perfil: core)

Lista todos los documentos del tenant con metadatos (titulo, fecha de subida, cantidad de fragmentos, estado de indexacion).

Filtrar por estado: `GET /api/knowledge/documents?status=ready`

## Obtener un documento

**Herramienta MCP: `get_document`** (Perfil: core)

```
get_document({ documentId: "uuid" })
```

Retorna metadatos del documento, contenido y una vista previa de los primeros 5 fragmentos.

## Eliminar documentos

**Herramienta MCP: `delete_document`** (Perfil: advanced)

```
delete_document({ documentId: "uuid" })
```

Elimina el documento y todos sus fragmentos indexados. Se registra un evento `knowledge_delete` para analiticas.

## Estadisticas

**Herramienta MCP: `get_knowledge_stats`** (Perfil: core)

Retorna estadisticas de indexacion, analiticas de busqueda y uso de embeddings:

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
    { "id": "...", "title": "Manual de producto 2026", "hit_count": 48 }
  ]
}
```

### Campos de estadisticas

| Campo | Descripcion |
|-------|-------------|
| `search.total_queries_30d` | Cantidad de busquedas en los ultimos 30 dias |
| `search.avg_score` | Puntaje promedio de relevancia |
| `search.zero_result_rate` | Fraccion de busquedas sin resultados |
| `search.coverage_score` | Fraccion de busquedas con al menos un resultado |
| `embedding_usage_30d.search_tokens` | Tokens de embedding OpenAI usados en busquedas |
| `embedding_usage_30d.ingest_tokens` | Tokens de embedding OpenAI usados en ingesta de documentos |
| `embedding_usage_30d.total_tokens` | Total de tokens de embedding (busqueda + ingesta) |
| `embedding_usage_30d.avg_ingest_ms` | Tiempo promedio de procesamiento de documentos |

## Tracking de eventos

Todas las operaciones de la base de conocimiento se registran como eventos para analiticas y billing:

| Evento | Datos registrados |
|--------|-------------------|
| `knowledge_ingest` | document_id, title, source_type, mime_type, original_size_bytes, chunk_count, total_tokens, embedding_tokens_used, processing_ms |
| `knowledge_search` | query, result_count, top_score, latency_ms, document_ids_hit, embedding_tokens_used |
| `knowledge_delete` | document_id, title, source_type, chunk_count, total_tokens, original_size_bytes |

## Uso de almacenamiento

Para obtener un desglose del almacenamiento de la base de conocimiento:

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

## Panel de administracion

Desde el panel de admin, anda a **Conocimiento** en la barra lateral para gestionar tu base de conocimiento visualmente:

- **Barra de estadisticas** — cantidad de documentos, almacenamiento usado, fragmentos totales
- **Lista de documentos** — badge PDF, estado (listo/procesando/error), tamano, vista previa de contenido, boton eliminar
- **Panel de agregar** — pestana texto (titulo + contenido), pestana URL (descarga e indexa la pagina), o pestana archivo (PDF)
- **Panel de busqueda** — ingresa una consulta, ajusta el slider de precision, alterna fragmentos/un-por-doc, ve resultados con barra de certeza
- **Modal de ayuda** — explica las opciones de busqueda y como buscar efectivamente
- **Pagina de uso** — desglose de almacenamiento por tipo de archivo

## Casos de uso

- **Chatbots de soporte**: Indexa documentos de FAQ, responde preguntas con `search_knowledge`
- **Wikis internas**: Suba politicas y procedimientos, permita que los agentes encuentren contenido relevante
- **Documentacion de producto**: Complementa reglas de negocio con conocimiento externo
- **Contenido web**: Ingesta paginas via URL, limpiadas automaticamente de navegacion/chrome
