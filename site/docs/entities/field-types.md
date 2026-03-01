# Field Types

Complete reference for the field types available in Fyso.

## text

Short single-line text.

- **Storage:** string
- **Config:** none
- **Example value:** `"Juan Perez"`

## textarea

Long multi-line text.

- **Storage:** string
- **Config:** none
- **Example value:** `"Long description\nwith line breaks"`

## number

Numeric value (integer or decimal).

- **Storage:** number
- **Config:** none
- **Example value:** `150.50`

## email

Email address.

- **Storage:** string
- **Config:** none
- **Example value:** `"juan@example.com"`

## phone

Phone number.

- **Storage:** string
- **Config:** none
- **Example value:** `"+54 11 1234-5678"`

## date

Date (without time).

- **Storage:** string (ISO format `YYYY-MM-DD`)
- **Config:** none
- **Example value:** `"2026-02-18"`

## boolean

True/false value.

- **Storage:** boolean
- **Config:** none
- **Example value:** `true`

## select

Selection from a predefined list of options.

- **Storage:** string (the value of the selected option)
- **Config:**

| Config | Type | Description |
|--------|------|-------------|
| `options` | `string[]` or `{value, label}[]` | Available options |

- **Config example:**

```json
{
  "options": ["activo", "inactivo", "pendiente"]
}
```

Or with labels:

```json
{
  "options": [
    { "value": "active", "label": "Activo" },
    { "value": "inactive", "label": "Inactivo" }
  ]
}
```

- **Example value:** `"activo"`

## relation

Reference to a record in another entity.

- **Storage:** string (UUID of the related record)
- **Config:**

| Config | Type | Description |
|--------|------|-------------|
| `relatedEntity` | string | Name of the related entity |

- **Config example:**

```json
{
  "relatedEntity": "clientes"
}
```

- **Example value:** `"6bd2d1db-d104-4a15-977a-a759c38608a9"`

When querying records with `resolve=true`, the relation is expanded to the full record.

## has_many

Reverse one-to-many relationship. Declares that records in another entity reference this entity via a foreign key.

- **Storage:** virtual (no column stored — resolved at query time)
- **Config:**

| Config | Type | Description |
|--------|------|-------------|
| `relatedEntity` | string | Name of the entity containing the related records |
| `foreignKey` | string | Field in the related entity that references this entity's ID |

- **Config example:**

```json
{
  "relatedEntity": "lineas_factura",
  "foreignKey": "factura_id"
}
```

- **Resolved value (with `resolve=true`):**

```json
[
  { "id": "uuid-1", "data": { "producto": "Widget A", "cantidad": 3 } },
  { "id": "uuid-2", "data": { "producto": "Widget B", "cantidad": 1 } }
]
```

Without `resolve=true`, `has_many` fields are not included in the response. See [Relations](/records/relations) for details on nested resolution and permission-aware filtering.

## file

File attachment. Uploaded using the `upload_file` tool.

- **Storage:** object

```json
{
  "key": "uploads/file.pdf",
  "url": "/files/file.pdf",
  "name": "file.pdf",
  "size": 1024,
  "mimeType": "application/pdf"
}
```

- **Config:**

| Config | Type | Description |
|--------|------|-------------|
| `accept` | `string[]` | Allowed MIME types (e.g., `["image/*", "application/pdf"]`) |
| `maxSize` | number | Maximum size in bytes |
| `multiple` | boolean | Allow multiple files. Default: false |
| `maxFiles` | number | Maximum files when `multiple=true` |

- **Config example:**

```json
{
  "accept": ["image/*", "application/pdf"],
  "maxSize": 5242880,
  "multiple": false
}
```

## location

Geographic location with coordinates and optional address data.

- **Storage:** object

```json
{
  "lat": -34.6037,
  "lng": -58.3816,
  "address": "Av. 9 de Julio 1000",
  "city": "Buenos Aires",
  "country": "Argentina"
}
```

- **Config:**

| Config | Type | Description |
|--------|------|-------------|
| `displayFormat` | string | `"map"`, `"text"`, or `"both"` (default: `"both"`) |
| `defaultZoom` | number | Initial map zoom (1-20, default: 13) |
| `defaultCenter` | object | Initial center: `{ lat: number, lng: number }` |

- **Config example:**

```json
{
  "displayFormat": "both",
  "defaultZoom": 15,
  "defaultCenter": { "lat": -34.6037, "lng": -58.3816 }
}
```

## Type Summary

| Type | Stores | Required Config |
|------|--------|-----------------|
| `text` | string | - |
| `textarea` | string | - |
| `number` | number | - |
| `email` | string | - |
| `phone` | string | - |
| `date` | string | - |
| `boolean` | boolean | - |
| `select` | string | `options` |
| `relation` | string (UUID) | `relatedEntity` |
| `has_many` | virtual (array) | `relatedEntity`, `foreignKey` |
| `file` | object | `accept`, `maxSize`, `multiple` |
| `location` | object | `displayFormat`, `defaultZoom` |
