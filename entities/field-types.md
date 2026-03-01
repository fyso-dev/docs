# Tipos de campo

Referencia completa de los tipos de campo disponibles en Fyso.

## text

Texto corto de una sola linea.

- **Almacenamiento:** string
- **Config:** ninguna
- **Ejemplo de valor:** `"Juan Perez"`

## textarea

Texto largo de multiples lineas.

- **Almacenamiento:** string
- **Config:** ninguna
- **Ejemplo de valor:** `"Descripcion larga\ncon saltos de linea"`

## number

Valor numerico (entero o decimal).

- **Almacenamiento:** number
- **Config:** ninguna
- **Ejemplo de valor:** `150.50`

## email

Direccion de correo electronico.

- **Almacenamiento:** string
- **Config:** ninguna
- **Ejemplo de valor:** `"juan@example.com"`

## phone

Numero de telefono.

- **Almacenamiento:** string
- **Config:** ninguna
- **Ejemplo de valor:** `"+54 11 1234-5678"`

## date

Fecha (sin hora).

- **Almacenamiento:** string (ISO format `YYYY-MM-DD`)
- **Config:** ninguna
- **Ejemplo de valor:** `"2026-02-18"`

## boolean

Valor verdadero/falso.

- **Almacenamiento:** boolean
- **Config:** ninguna
- **Ejemplo de valor:** `true`

## select

Seleccion de una opcion de una lista predefinida.

- **Almacenamiento:** string (el valor de la opcion seleccionada)
- **Config:**

| Config | Tipo | Descripcion |
|--------|------|-------------|
| `options` | `string[]` o `{value, label}[]` | Opciones disponibles |

- **Ejemplo de config:**

```json
{
  "options": ["activo", "inactivo", "pendiente"]
}
```

O con labels:

```json
{
  "options": [
    { "value": "active", "label": "Activo" },
    { "value": "inactive", "label": "Inactivo" }
  ]
}
```

- **Ejemplo de valor:** `"activo"`

## relation

Referencia a un registro de otra entidad.

- **Almacenamiento:** string (UUID del registro relacionado)
- **Config:**

| Config | Tipo | Descripcion |
|--------|------|-------------|
| `relatedEntity` | string | Nombre de la entidad relacionada |

- **Ejemplo de config:**

```json
{
  "relatedEntity": "clientes"
}
```

- **Ejemplo de valor:** `"6bd2d1db-d104-4a15-977a-a759c38608a9"`

Al consultar registros con `resolve=true`, la relacion se expande al registro completo.

## has_many

Relacion inversa uno-a-muchos. Declara que registros en otra entidad referencian a esta entidad via una clave foranea.

- **Almacenamiento:** virtual (no se almacena columna — se resuelve en tiempo de consulta)
- **Config:**

| Config | Tipo | Descripcion |
|--------|------|-------------|
| `relatedEntity` | string | Nombre de la entidad que contiene los registros relacionados |
| `foreignKey` | string | Campo en la entidad relacionada que referencia el ID de esta entidad |

- **Ejemplo de config:**

```json
{
  "relatedEntity": "lineas_factura",
  "foreignKey": "factura_id"
}
```

- **Valor resuelto (con `resolve=true`):**

```json
[
  { "id": "uuid-1", "data": { "producto": "Widget A", "cantidad": 3 } },
  { "id": "uuid-2", "data": { "producto": "Widget B", "cantidad": 1 } }
]
```

Sin `resolve=true`, los campos `has_many` no se incluyen en la respuesta. Ver [Relaciones](/records/relations) para detalles sobre resolucion anidada y filtrado con permisos.

## file

Archivo adjunto. Se sube usando el tool `upload_file`.

- **Almacenamiento:** object

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

| Config | Tipo | Descripcion |
|--------|------|-------------|
| `accept` | `string[]` | MIME types permitidos (ej: `["image/*", "application/pdf"]`) |
| `maxSize` | number | Tamano maximo en bytes |
| `multiple` | boolean | Permitir multiples archivos. Default: false |
| `maxFiles` | number | Maximo de archivos cuando `multiple=true` |

- **Ejemplo de config:**

```json
{
  "accept": ["image/*", "application/pdf"],
  "maxSize": 5242880,
  "multiple": false
}
```

## location

Ubicacion geografica con coordenadas y datos de direccion opcionales.

- **Almacenamiento:** object

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

| Config | Tipo | Descripcion |
|--------|------|-------------|
| `displayFormat` | string | `"map"`, `"text"`, o `"both"` (default: `"both"`) |
| `defaultZoom` | number | Zoom inicial del mapa (1-20, default: 13) |
| `defaultCenter` | object | Centro inicial: `{ lat: number, lng: number }` |

- **Ejemplo de config:**

```json
{
  "displayFormat": "both",
  "defaultZoom": 15,
  "defaultCenter": { "lat": -34.6037, "lng": -58.3816 }
}
```

## Resumen de tipos

| Tipo | Almacena | Config necesaria |
|------|----------|-----------------|
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
