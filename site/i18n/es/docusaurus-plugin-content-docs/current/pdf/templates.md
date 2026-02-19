# Plantillas PDF

Fyso usa **pdfme** como motor de generacion de PDFs. Las plantillas definen el layout del documento.

## Entidad `pdf_templates`

La entidad `pdf_templates` se crea automaticamente la primera vez que se genera un PDF. Cada registro es una plantilla con estos campos:

| Campo | Descripcion |
|-------|-------------|
| `nombre` | Nombre descriptivo de la plantilla |
| `template_json` | Layout en formato pdfme (JSON) |
| `entidad_origen` | De que entidad toma los datos (ej: `"facturas"`) |

## Formato del template_json

El `template_json` define el tamano de pagina y los campos con sus posiciones:

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

## Reglas del formato

- Las medidas son en **milimetros** (210x297 = A4)
- `position.x` y `position.y`: coordenadas desde la esquina superior izquierda
- El `name` de cada campo debe coincidir con el **fieldKey** de la entidad origen
- `schemas` es un array de paginas -- cada pagina es un array de campos
- Tipo disponible: `text`

## Propiedades de campo

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `name` | string | Nombre del campo (debe coincidir con fieldKey) |
| `type` | string | Tipo de campo (`"text"`) |
| `position` | object | `{ x: number, y: number }` en mm |
| `width` | number | Ancho del campo en mm |
| `height` | number | Alto del campo en mm |
| `fontSize` | number | Tamano de fuente en pt |
| `fontWeight` | string | `"bold"` o normal |
| `fontColor` | string | Color en hex (ej: `"#666666"`) |
| `alignment` | string | `"left"`, `"center"`, `"right"` |

## Multiples paginas

Agregar mas arrays dentro de `schemas`:

```json
{
  "schemas": [
    [ /* campos pagina 1 */ ],
    [ /* campos pagina 2 */ ]
  ]
}
```

## Crear plantilla via MCP

```
create_record({
  entityName: "pdf_templates",
  data: {
    nombre: "Factura estandar",
    entidad_origen: "facturas",
    template_json: { /* layout pdfme */ }
  }
})
```

O pedile al agente: "Crea una plantilla PDF para facturas con campos: empresa, cliente, items, total".
