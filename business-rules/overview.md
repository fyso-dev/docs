# Reglas de negocio

Las reglas de negocio automatizan logica sobre los datos: calculos, validaciones y acciones.

## Tipos de reglas

### compute

Calcula campos automaticamente cuando cambian otros campos.

```json
{
  "type": "compute",
  "triggers": ["cantidad", "precio"],
  "compute": {
    "total": "cantidad * precio"
  }
}
```

### validate

Valida datos antes de guardar el registro. Si la validacion falla, el guardado se rechaza.

```json
{
  "type": "validate",
  "triggers": ["precio"],
  "validate": [{
    "id": "precio_positivo",
    "condition": "precio > 0",
    "message": "El precio debe ser positivo",
    "severity": "error"
  }]
}
```

### action

Ejecuta efectos secundarios despues de guardar (ej: actualizar registros relacionados).

```json
{
  "type": "action",
  "triggerType": "after_save",
  "triggers": ["subtotal"],
  "actions": [{
    "type": "update_related",
    "entity": "pedidos",
    "recordId": "pedido_id",
    "data": {
      "total": {
        "type": "aggregate",
        "entity": "lineas",
        "aggregateOp": "sum",
        "aggregateField": "subtotal",
        "filter": { "pedido_id": "pedido_id" }
      }
    }
  }]
}
```

### on_query

Filtra registros en tiempo de consulta compilando condiciones DSL a clausulas SQL `WHERE`. Se usa para seguridad a nivel de fila: solo los registros que cumplan la condicion son devueltos al usuario.

```json
{
  "type": "on_query",
  "triggerType": "on_query",
  "conditions": "createdBy == $userId AND status != 'deleted'"
}
```

La regla se vincula a un rol via el campo `rowFilter` en el `EntityPermissionConfig` del rol. Cuando un usuario con ese rol consulta la entidad, la condicion se compila a una clausula SQL `WHERE` con Drizzle y se agrega a la query.

**Sintaxis de expresiones:**
- Operadores de comparacion: `==`, `!=`, `>`, `>=`, `<`, `<=`
- Operadores logicos: `AND`, `OR`
- Variables: `$userId`, `$tenantId` (resueltas por request)
- Strings literales: `'value'`
- `!=` usa `IS DISTINCT FROM` para manejo correcto de NULL

**Semantica de union:** Si un usuario tiene multiples roles y alguno otorga acceso de lectura sin restricciones (sin `rowFilter`), no se aplica ningun filtro.

## Ciclo de vida

Las reglas tienen el mismo ciclo draft/published que las entidades:

1. Se crean como **draft**
2. Se publican con `publish_business_rule`
3. Solo las reglas publicadas se ejecutan

## Trigger types

| Tipo | Cuando se ejecuta |
|------|-------------------|
| `field_change` | Cuando cambia uno de los campos trigger (default) |
| `before_save` | Antes de guardar el registro |
| `after_save` | Despues de guardar el registro |
| `on_load` | Al cargar el registro |
| `on_query` | En tiempo de consulta — se compila a clausula SQL WHERE para filtrado a nivel de fila |
| `scheduled` | Programado (basado en cron) |

## Tools MCP relacionados

| Tool | Perfil | Descripcion |
|------|--------|-------------|
| `generate_business_rule` | core | Crear regla (via DSL o prompt) |
| `create_business_rule` | advanced | Crear regla con DSL directo |
| `list_business_rules` | core | Listar reglas de una entidad |
| `get_business_rule` | advanced | Ver detalle de una regla |
| `test_business_rule` | advanced | Probar una regla con datos de prueba |
| `publish_business_rule` | core | Publicar una regla draft |
| `delete_business_rule` | advanced | Eliminar una regla |
| `get_rule_logs` | advanced | Ver logs de ejecucion |
