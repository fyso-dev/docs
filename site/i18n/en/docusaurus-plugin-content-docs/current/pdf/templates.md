# PDF Templates

Fyso uses **pdfme** as the PDF generation engine. Templates define the document layout.

## `pdf_templates` Entity

The `pdf_templates` entity is created automatically the first time a PDF is generated. Each record is a template with these fields:

| Field | Description |
|-------|-------------|
| `nombre` | Descriptive name of the template |
| `template_json` | Layout in pdfme format (JSON) |
| `entidad_origen` | Which entity the data comes from (e.g., `"facturas"`) |

## template_json Format

The `template_json` defines the page size and the fields with their positions:

```json
{
  "basePdf": {
    "width": 210,
    "height": 297,
    "padding": [20, 20, 20, 20]
  },
  "schemas": [
    [
      {
        "name": "empresa",
        "type": "text",
        "position": { "x": 20, "y": 20 },
        "width": 100,
        "height": 12,
        "fontSize": 20,
        "fontWeight": "bold"
      },
      {
        "name": "cliente_nombre",
        "type": "text",
        "position": { "x": 20, "y": 50 },
        "width": 100,
        "height": 8,
        "fontSize": 12
      },
      {
        "name": "fecha",
        "type": "text",
        "position": { "x": 150, "y": 20 },
        "width": 40,
        "height": 8,
        "fontSize": 10,
        "alignment": "right"
      },
      {
        "name": "total",
        "type": "text",
        "position": { "x": 130, "y": 250 },
        "width": 60,
        "height": 12,
        "fontSize": 16,
        "fontWeight": "bold",
        "alignment": "right"
      }
    ]
  ]
}
```

## Format Rules

- Measurements are in **millimeters** (210x297 = A4)
- `position.x` and `position.y`: coordinates from the top-left corner
- The `name` of each field must match the **fieldKey** of the source entity
- `schemas` is an array of pages -- each page is an array of fields
- Available type: `text`

## Field Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Field name (must match fieldKey) |
| `type` | string | Field type (`"text"`) |
| `position` | object | `{ x: number, y: number }` in mm |
| `width` | number | Field width in mm |
| `height` | number | Field height in mm |
| `fontSize` | number | Font size in pt |
| `fontWeight` | string | `"bold"` or normal |
| `fontColor` | string | Color in hex (e.g., `"#666666"`) |
| `alignment` | string | `"left"`, `"center"`, `"right"` |

## Multiple Pages

Add more arrays inside `schemas`:

```json
{
  "schemas": [
    [ /* page 1 fields */ ],
    [ /* page 2 fields */ ]
  ]
}
```

## Create Template via MCP

```
create_record({
  entityName: "pdf_templates",
  data: {
    nombre: "Factura estandar",
    entidad_origen: "facturas",
    template_json: { /* pdfme layout */ }
  }
})
```

Or ask the agent: "Create a PDF template for invoices with fields: company, customer, items, total".
