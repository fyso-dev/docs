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
