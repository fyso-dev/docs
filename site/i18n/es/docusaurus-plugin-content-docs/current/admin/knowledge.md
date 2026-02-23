---
sidebar_position: 4
---

# Base de conocimiento

La Base de conocimiento te permite subir documentos y consultarlos via búsqueda semántica usando RAG (Retrieval-Augmented Generation). Los documentos se dividen en chunks, se embeben e indexan para búsqueda por similitud.

## Subir documentos

**Herramienta MCP: `upload_document`** (Perfil: core)

```
upload_document({
  filePath: "/ruta/al/documento.pdf",
  title: "Manual de producto 2026",
  description: "Descripción opcional"
})
```

Formatos soportados: **PDF**, **HTML** (.html, .htm), **texto plano** (.txt), **Markdown** (.md).

- PDF: el texto se extrae automáticamente antes de dividirlo en chunks.
- HTML: se eliminan las etiquetas preservando la estructura de texto; los bloques `<script>`, `<style>` y `<noscript>` se omiten.
- Texto/Markdown: se divide en chunks e indexa directamente.

Después de subir, el documento se procesa en segundo plano. El estado pasa de `processing` → `ready`.

### Límites por plan

| Plan | Documentos | Almacenamiento |
|------|-----------|----------------|
| Free | 10 | 5 MB |
| Pro | 1,000 | 1 GB |

## Buscar documentos

**Herramienta MCP: `search_knowledge`** (Perfil: core)

```
search_knowledge({
  query: "¿Cómo reseteo el dispositivo?",
  limit: 5,
  minSimilarity: 0.7
})
```

Retorna chunks coincidentes con documento fuente, puntaje de relevancia y extracto de contenido. Cada búsqueda se registra para analytics (ver [Estadísticas](#estadísticas)).

**REST API:**

```bash
curl -X POST https://api.fyso.dev/api/knowledge/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "query": "¿Cómo reseteo el dispositivo?", "limit": 5, "threshold": 0.7 }'
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "content": "Para resetear, mantén el botón de encendido por 10 segundos...",
        "score": 0.92,
        "document": { "id": "...", "title": "Manual de producto 2026", "source_type": "file" },
        "chunk_index": 3
      }
    ],
    "query_time_ms": 45
  }
}
```

## Listar documentos

**Herramienta MCP: `list_documents`** (Perfil: core)

Lista todos los documentos del tenant con metadata (título, fecha de carga, cantidad de chunks, estado de indexación).

Filtrar por estado: `GET /api/knowledge/documents?status=ready`

## Obtener un documento

**Herramienta MCP: `get_document`** (Perfil: core)

```
get_document({ documentId: "uuid" })
```

Retorna metadata, contenido y un preview de los primeros 5 chunks.

## Eliminar documentos

**Herramienta MCP: `delete_document`** (Perfil: advanced)

```
delete_document({ documentId: "uuid" })
```

Elimina el documento y todos sus chunks indexados.

## Estadísticas

**Herramienta MCP: `get_knowledge_stats`** (Perfil: core)

Retorna estadísticas de indexación y analytics de búsqueda:

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
    { "id": "...", "title": "Manual de producto 2026", "hit_count": 48 }
  ]
}
```

`search` y `top_documents` están presentes cuando la tabla de eventos está disponible. `zero_result_rate` es la fracción de búsquedas que no devolvieron resultados. `coverage_score` es la fracción que devolvió al menos un resultado.

## Panel de administración

Desde el panel de admin, ve a **Conocimiento** en el menú lateral para gestionar tu base de conocimiento visualmente:

- **Barra de estadísticas** — cantidad de documentos, almacenamiento usado, total de chunks
- **Lista de documentos** — badge de tipo de fuente, badge de estado (ready/processing/error), fecha de carga, botón de eliminación
- **Panel para agregar documentos** — tab de texto (título + contenido) o tab de URL (título + URL)
- **Panel de búsqueda** — ingresa una consulta, mira resultados con puntajes de relevancia

## Casos de uso

- **Chatbots de soporte**: indexar documentos de FAQ, responder preguntas de usuarios con `search_knowledge`
- **Wikis internas**: subir políticas y procedimientos, que los agentes surfaceen contenido relevante
- **Documentación de productos**: complementar reglas de negocio con conocimiento externo
