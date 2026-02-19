# Generate PDFs

## MCP Tool: `generate_pdf`

**Profile:** core

Generates a PDF by combining a template with data from a record.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | string | Yes | ID of the record in `pdf_templates` |
| `recordId` | string | No | ID of the record with the data |
| `entityName` | string | Conditional | Entity name (required if using `recordId`) |
| `data` | object | No | Additional or override data. Keys = template field names |
| `store` | boolean | No | Save the PDF to storage. Default: true |
| `updateField` | string | No | Record field where to save the PDF reference. Default: `pdf_documento` |

### Generation Flow

1. Finds the template by `templateId`
2. If `recordId` is provided, fetches the record from the entity
3. Maps the fields: the template `name` must match the record `fieldKey`
4. If `data` is provided, it is merged (override) over the record data
5. Generates the PDF
6. If `store=true`, saves it to file storage
7. If `updateField` is defined, updates that field of the record with the PDF link

### Example: Invoice PDF

```
generate_pdf({
  templateId: "uuid-de-la-plantilla",
  recordId: "uuid-de-la-factura",
  entityName: "facturas",
  updateField: "pdf_documento"
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
