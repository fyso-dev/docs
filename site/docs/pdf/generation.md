# Generate PDFs

## MCP Tool: `generate_pdf`

**Profile:** core

Generates a PDF by combining a template with data from a record.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | string | Yes | ID of the record in `pdf_templates` |
| `recordId` | string | No | ID of the record with the data |
| `entityName` | string | No | Entity name. If omitted when using `recordId`, resolved from the template's `entidad_origen` field. |
| `data` | object | No | Additional or override data. Keys = template field names |
| `store` | boolean | No | Save the PDF to storage. Default: true |
| `updateField` | string | No | Record field where to save the PDF reference. Default: `pdf_documento` |

### Generation Flow

1. Finds the template by `templateId`
2. If `recordId` is provided without `entityName`, resolves entity from `template.entidad_origen` (fallback added in v1.17.0)
3. Fetches the record from the entity
4. Maps the fields: the template `name` must match the record `fieldKey`
5. If `data` is provided, it is merged (override) over the record data
6. Fields of type `table` receive `array[][]` input (not stringified) so pdfme renders them correctly
7. Generates the PDF
8. If `store=true`, saves it to file storage
9. If `updateField` is defined, updates that field of the record with the PDF link

### Example: Invoice PDF

```
generate_pdf({
  templateId: "uuid-de-la-plantilla",
  recordId: "uuid-de-la-factura",
  entityName: "facturas",
  updateField: "pdf_documento"
})
```

### Example: PDF with recordId only (entity resolved from template)

When the PDF designer dialog passes `recordId` but not `entityName`, the backend resolves the entity automatically from the template definition:

```
generate_pdf({
  templateId: "uuid-de-la-plantilla",
  recordId: "uuid-de-la-factura"
})
```

### Example: PDF with Custom Data

```
generate_pdf({
  templateId: "uuid-de-la-plantilla",
  data: {
    empresa: "Mi Empresa S.A.",
    fecha: "18/02/2026",
    total: "$15,000.00"
  }
})
```

### Example: Record PDF with Extra Data

```
generate_pdf({
  templateId: "uuid-de-la-plantilla",
  recordId: "uuid-de-la-factura",
  entityName: "facturas",
  data: {
    pie_pagina: "Gracias por su compra"
  }
})
```

### Response

Returns the metadata of the generated file (URL, size, etc.) or the PDF in base64 if `store=false`.

### Notes

- Field names matter: the `name` in the template JSON must be exactly the same as the entity's `fieldKey`
- Data in `data` overrides record data if both exist for the same field
- For calculated fields or fixed text not in the record, use the `data` parameter
- **Table fields** receive `array[][]` input. Each inner array is a row; each element is a cell value

---

## Table plugin

The PDF designer (frontend) and generator (backend) support the `table` plugin from `@pdfme/schemas`.

### In the designer

Drag a **Table** element from the sidebar onto the canvas. Configure columns, header row, and column widths in the properties panel.

### In the generator

A field of type `table` expects its input as an array of arrays:

```json
{
  "items_table": [
    ["Description", "Qty", "Unit Price", "Total"],
    ["Widget A", "2", "$10.00", "$20.00"],
    ["Widget B", "1", "$50.00", "$50.00"]
  ]
}
```

The first row is typically the header. pdfme renders borders, column widths, and row styling based on the template configuration.

---

## Upload PDFs to Knowledge Base

Binary PDF files can be uploaded directly to the knowledge base via multipart upload. The document is ingested, chunked, and made available for RAG search.

### Endpoint

```bash
POST /api/knowledge/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF file. Must be `application/pdf`. Maximum 20 MB |
| `title` | string | No | Document title. Defaults to the filename |

### Example

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@invoice.pdf" \
  -F "title=Q1 Invoice" \
  https://api.fyso.dev/api/knowledge/documents/upload
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Q1 Invoice",
    "status": "ingested",
    "createdAt": "2026-02-24T00:00:00Z"
  }
}
```

### Error responses

| Status | Cause |
|--------|-------|
| `400` | Missing `file` field or invalid MIME type (only `application/pdf` accepted) |
| `401` / `403` | Missing or invalid authentication |
| `413` | File exceeds 20 MB limit |

### Notes

- The endpoint converts the binary buffer to base64 and delegates to `documentService.ingestDocument`, which handles text extraction, chunking, and embedding generation
- After upload, the document is immediately searchable via `POST /api/knowledge/search`
- JSON-based ingestion (`POST /api/knowledge/documents`) remains unchanged — this endpoint adds multipart support without affecting the existing flow
