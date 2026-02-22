# Base de conocimiento (RAG)

Fyso incluye una base de conocimiento vectorial por tenant. Los agentes pueden ingestar documentos y buscar por similitud semantica para construir sistemas RAG.

## Casos de uso

- **Chatbot con conocimiento propio** — el agente busca en la base antes de responder
- **Busqueda semantica sobre documentacion interna** — manuales, FAQs, contratos
- **Clasificacion de registros** — encontrar productos similares a una descripcion

## Ingestar documentos

### Texto plano

```
upload_document({
  content: "Fyso es una plataforma para construir backends sin codigo...",
  title: "Descripcion de Fyso",
  source_type: "text"
})
```

### Desde una URL

```
upload_document({
  content: "https://docs.fyso.dev/intro",
  source_type: "url",
  title: "Documentacion de Fyso"
})
```

### PDF o HTML

Subir primero con `upload_file` para obtener una URL, luego ingestar:

```
upload_document({
  content: "https://mi-bucket.s3.amazonaws.com/manual.pdf",
  source_type: "url",
  title: "Manual de usuario",
  mime_type: "application/pdf"
})
```

Tipos soportados: `text/plain`, `text/html`, `application/pdf`.

### Via REST API

```bash
curl -X POST "https://api.fyso.dev/api/knowledge/documents" \
  -H "Authorization: Bearer $FYSO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Contenido del documento...",
    "title": "Mi documento",
    "source_type": "text"
  }'
```

## Estados del documento

| Estado | Descripcion |
|--------|-------------|
| `pending` | En cola para procesamiento |
| `processing` | Fragmentando y generando embeddings |
| `ready` | Disponible para busqueda |
| `error` | Fallo durante la ingesta |

## Buscar en la base de conocimiento

```
search_knowledge({
  query: "como configurar webhooks en Fyso",
  limit: 5,
  min_score: 0.7
})
```

**Parametros:**

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `query` | string | - | Texto de busqueda (lenguaje natural) |
| `limit` | number | 10 | Maximos resultados |
| `min_score` | number | 0.0 | Similitud minima (0.0 - 1.0) |

**Respuesta:**

```json
{
  "results": [
    {
      "documentId": "uuid",
      "title": "Documentacion de Webhooks",
      "content": "Los webhooks se configuran desde...",
      "score": 0.87,
      "chunkIndex": 2
    }
  ]
}
```

## Listar documentos

```
list_documents()
```

Retorna id, titulo, source_type, estado, cantidad de chunks y fecha.

## Ver un documento

```
get_document({ documentId: "uuid" })
```

## Eliminar un documento

```
delete_document({ documentId: "uuid" })
```

## Estadisticas

```
get_knowledge_stats()
```

Retorna total de documentos, chunks, storage utilizado y distribucion por estado.

## Panel de administracion

En el panel web, ir a **Knowledge** en la barra lateral.

Incluye:
- Estadisticas de la base
- Listado de documentos con estado y tipo
- Panel de carga de texto o URL
- Busqueda semantica con score visible

## Integrar RAG en una regla de negocio

Se puede usar la base de conocimiento desde una regla via el action `http_callback`:

```yaml
actions:
  - type: http_callback
    url: "https://mi-agente.com/responder"
    method: POST
    body:
      pregunta: "{{data.pregunta}}"
```

O llamando directamente a la REST API de knowledge desde el agente que procesa el webhook.

## Limites

| Recurso | Free | Pro |
|---------|------|-----|
| Documentos | 50 | Ilimitado |
| Storage de chunks | Incluido en storage general | Incluido en storage general |
| Busquedas/mes | 1.000 | Ilimitado |
