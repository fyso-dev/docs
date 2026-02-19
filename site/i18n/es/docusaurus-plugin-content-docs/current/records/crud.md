# CRUD de registros

Operaciones basicas sobre registros: crear, leer, actualizar y eliminar.

## Estructura de un registro

Los campos de la entidad se almacenan dentro de `data`:

```json
{
  "id": "6bd2d1db-d104-4a15-977a-a759c38608a9",
  "entityId": "79d376b6-b00d-4d07-83b6-62276bc57fee",
  "name": "Test Company S.L.",
  "data": {
    "nombre": "Test Company S.L.",
    "email": "test@company.com",
    "phone": "+34 912345678"
  },
  "createdAt": "2026-02-03T12:51:15.352Z",
  "updatedAt": "2026-02-03T12:51:15.352Z"
}
```

**Importante:** Acceder campos via `record.data.email`, NO `record.email`.

---

## create_record

**Perfil:** core

Crea un nuevo registro en una entidad.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |
| `data` | object | Si | Datos del registro (campos de la entidad) |

### Ejemplo

```
create_record({
  entityName: "clientes",
  data: {
    nombre: "Maria Lopez",
    email: "maria@example.com",
    telefono: "+54 11 9876-5432",
    estado: "activo"
  }
})
```

### Respuesta

```json
{
  "success": true,
  "message": "Record created in clientes",
  "record": {
    "id": "uuid-del-registro",
    "nombre": "Maria Lopez",
    "email": "maria@example.com",
    "telefono": "+54 11 9876-5432",
    "estado": "activo"
  }
}
```

Usa `get_entity_schema` primero para conocer los campos requeridos.

---

## query_records

**Perfil:** core

Consulta registros de una entidad con filtros, paginacion, ordenamiento y busqueda semantica.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |
| `filter` | string | No | Filtro simple (ver [Filtros](filtering.md)) |
| `limit` | number | No | Maximo de registros. Default: 50, max: 200 |
| `offset` | number | No | Offset para paginacion |
| `orderBy` | string | No | Campo para ordenar |
| `orderDir` | string | No | Direccion: `"asc"` o `"desc"` |
| `semantic` | string | No | Busqueda semantica en lenguaje natural |
| `minSimilarity` | number | No | Umbral de similitud (0-1) para busqueda semantica |

### Ejemplo basico

```
query_records({
  entityName: "clientes",
  limit: 20,
  orderBy: "nombre",
  orderDir: "asc"
})
```

### Ejemplo con filtro

```
query_records({
  entityName: "clientes",
  filter: "estado = activo",
  limit: 10
})
```

### Ejemplo con busqueda semantica

```
query_records({
  entityName: "productos",
  semantic: "muebles de oficina modernos",
  minSimilarity: 0.7,
  limit: 5
})
```

### Respuesta

```json
{
  "entityName": "clientes",
  "total": 3,
  "records": [
    {
      "id": "uuid",
      "nombre": "Maria Lopez",
      "email": "maria@example.com",
      "estado": "activo"
    }
  ]
}
```

Para busqueda semantica, cada registro incluye un campo `similarity` con la puntuacion.

---

## update_record

**Perfil:** core

Actualiza un registro existente. Solo enviar los campos a modificar (actualizacion parcial).

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |
| `recordId` | string | Si | ID del registro |
| `data` | object | Si | Campos a actualizar |

### Ejemplo

```
update_record({
  entityName: "clientes",
  recordId: "uuid-del-registro",
  data: {
    estado: "inactivo",
    email: "maria.nueva@example.com"
  }
})
```

### Respuesta

```json
{
  "success": true,
  "message": "Record uuid-del-registro updated",
  "record": {
    "id": "uuid-del-registro",
    "nombre": "Maria Lopez",
    "email": "maria.nueva@example.com",
    "estado": "inactivo"
  }
}
```

---

## delete_record

**Perfil:** core

Elimina un registro. Esta accion no se puede deshacer.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |
| `recordId` | string | Si | ID del registro |

### Ejemplo

```
delete_record({
  entityName: "clientes",
  recordId: "uuid-del-registro"
})
```

### Respuesta

```json
{
  "success": true,
  "message": "Record uuid-del-registro deleted from clientes",
  "deleted": true
}
```
