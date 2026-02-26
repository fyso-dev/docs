# Generar PDFs

## MCP Tool: `generate_pdf`

**Perfil:** core

Genera un PDF combinando una plantilla con datos de un registro.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `templateId` | string | Si | ID del registro en `pdf_templates` |
| `recordId` | string | No | ID del registro con los datos |
| `entityName` | string | No | Nombre de la entidad. Si se omite al usar `recordId`, se resuelve desde el campo `entidad_origen` de la plantilla. |
| `data` | object | No | Datos adicionales o override. Keys = nombres de campo del template |
| `store` | boolean | No | Guardar el PDF en storage. Default: true |
| `updateField` | string | No | Campo del registro donde guardar la referencia al PDF. Default: `pdf_documento` |

### Flujo de generacion

1. Busca la plantilla por `templateId`
2. Si se proporciona `recordId`, busca el registro de la entidad
3. Mapea los campos: el `name` del template debe coincidir con el `fieldKey` del registro
4. Si se proporciona `data`, se mergea (override) sobre los datos del registro
5. Genera el PDF
6. Si `store=true`, lo guarda en file storage
7. Si `updateField` esta definido, actualiza ese campo del registro con el link al PDF

### Ejemplo: PDF de una factura

```
generate_pdf({
  templateId: "uuid-de-la-plantilla",
  recordId: "uuid-de-la-factura",
  entityName: "facturas",
  updateField: "pdf_documento"
})
```

### Ejemplo: PDF con datos custom

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

### Ejemplo: PDF de registro con datos extra

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

### Respuesta

Retorna los metadatos del archivo generado (URL, tamano, etc.) o el PDF en base64 si `store=false`.

### Notas

- Los nombres de campos importan: el `name` en el template JSON debe ser exactamente igual al `fieldKey` de la entidad
- Los datos en `data` sobreescriben los del registro si ambos existen para el mismo campo
- Para campos calculados o texto fijo que no esta en el registro, usar el parametro `data`
