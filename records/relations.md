# Relaciones

Las relaciones conectan registros de distintas entidades usando campos de tipo `relation`.

## Crear una relacion

Al definir un campo de tipo `relation`, se especifica la entidad relacionada:

```
generate_entity({
  definition: {
    entity: { name: "facturas" },
    fields: [
      {
        name: "Cliente",
        fieldKey: "cliente_id",
        fieldType: "relation",
        config: { relatedEntity: "clientes" }
      }
    ]
  }
})
```

## Almacenamiento

El campo relation almacena el UUID del registro relacionado:

```json
{
  "cliente_id": "6bd2d1db-d104-4a15-977a-a759c38608a9"
}
```

## Resolver relaciones

Al consultar registros, se pueden expandir las relaciones con `resolve`:

### MCP

`query_records` resuelve relaciones automaticamente (usa `resolve=true` internamente).

### REST API

```
GET /api/entities/facturas/records?resolve=true
GET /api/entities/facturas/records/{id}?resolve=true
```

Sin resolve, el campo muestra solo el UUID. Con resolve, se expande al objeto completo:

**Sin resolve:**
```json
{
  "cliente_id": "6bd2d1db-..."
}
```

**Con resolve:**
```json
{
  "cliente_id": {
    "id": "6bd2d1db-...",
    "data": {
      "nombre": "Juan Perez",
      "email": "juan@example.com"
    }
  }
}
```

## Crear registros con relaciones

Al crear un registro, pasar el UUID del registro relacionado:

```
create_record({
  entityName: "facturas",
  data: {
    numero: "FAC-001",
    cliente_id: "6bd2d1db-d104-4a15-977a-a759c38608a9",
    fecha: "2026-02-18",
    total: 1500
  }
})
```

## Relaciones has_many

Un campo `has_many` define una relacion inversa uno-a-muchos. En lugar de almacenar una clave foranea, declara que otra entidad tiene registros que apuntan a esta.

### Definir un campo has_many

```
generate_entity({
  definition: {
    entity: { name: "facturas" },
    fields: [
      {
        name: "Lineas",
        fieldKey: "lineas",
        fieldType: "has_many",
        config: {
          relatedEntity: "lineas_factura",
          foreignKey: "factura_id"
        }
      }
    ]
  }
})
```

### Resolver has_many

Al consultar un registro con `resolve=true`, el campo `has_many` se llena con un array de registros relacionados:

```
GET /api/entities/facturas/records/{id}?resolve=true
```

```json
{
  "id": "uuid-factura",
  "data": {
    "numero": "FAC-001",
    "lineas": [
      {
        "id": "uuid-linea-1",
        "data": { "producto": "Widget A", "cantidad": 3, "precio": 100 }
      },
      {
        "id": "uuid-linea-2",
        "data": { "producto": "Widget B", "cantidad": 1, "precio": 250 }
      }
    ]
  }
}
```

### Resolucion anidada con resolve_depth

```
GET /api/entities/facturas/records/{id}?resolve=true&resolve_depth=2
```

Con `resolve_depth=2`, si una `linea_factura` tiene un campo `relation` apuntando a `productos`, esa relacion tambien se resuelve.

### Resolucion con permisos

La resolucion en cascada respeta los permisos RBAC por entidad:

| Permiso | Comportamiento |
|---------|----------------|
| Sin permiso `read` en entidad relacionada | El campo se omite por completo de la respuesta |
| `rowFilter` en entidad relacionada | Solo se devuelven los registros relacionados que cumplen el filtro |
| `fields` whitelist en entidad relacionada | Solo aparecen los campos permitidos en registros relacionados |
| `excludeFields` blocklist en entidad relacionada | Se eliminan los campos listados de los registros relacionados |

## Relaciones en reglas de negocio

Las reglas pueden usar lookups para acceder a datos de entidades relacionadas:

```json
{
  "type": "compute",
  "triggers": ["cliente_id"],
  "compute": {
    "cliente_nombre": {
      "type": "lookup",
      "entity": "clientes",
      "matchField": "id",
      "matchValue": "cliente_id",
      "resultField": "nombre"
    }
  }
}
```
