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

Formatos soportados: PDF, texto plano (.txt), Markdown (.md).

Después de subir, el documento se divide en chunks e indexa automáticamente en segundo plano.

## Buscar documentos

**Herramienta MCP: `search_knowledge`** (Perfil: core)

```
search_knowledge({
  query: "¿Cómo reseteo el dispositivo?",
  limit: 5,
  minSimilarity: 0.7
})
```

Retorna chunks coincidentes con documento fuente, puntaje de relevancia y extracto de contenido.

## Listar documentos

**Herramienta MCP: `list_documents`** (Perfil: core)

Lista todos los documentos del tenant con metadata (título, fecha de carga, cantidad de chunks, estado de indexación).

## Obtener un documento

**Herramienta MCP: `get_document`** (Perfil: core)

```
get_document({ documentId: "uuid" })
```

Retorna metadata y contenido del documento.

## Estadísticas de indexación

**Herramienta MCP: `get_knowledge_stats`** (Perfil: core)

Retorna:
- Total de documentos
- Total de chunks indexados
- Cobertura de embeddings (%)
- Documentos pendientes de indexación

## Eliminar documentos

**Herramienta MCP: `delete_document`** (Perfil: advanced)

```
delete_document({ documentId: "uuid" })
```

Elimina el documento y todos sus chunks indexados.

## Casos de uso

- **Chatbots de soporte**: indexar documentos de FAQ, responder preguntas de usuarios con `search_knowledge`
- **Wikis internas**: subir políticas y procedimientos, que los agentes surfaceen contenido relevante
- **Documentación de productos**: complementar reglas de negocio con conocimiento externo
