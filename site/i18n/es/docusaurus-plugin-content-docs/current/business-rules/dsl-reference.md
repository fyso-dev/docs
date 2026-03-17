# DSL Reference

Referencia completa del DSL (Domain Specific Language) para reglas de negocio en Fyso.

## Estructura general

```json
{
  "type": "compute | validate | action",
  "triggers": ["campo1", "campo2"],
  "triggerType": "field_change | before_save | after_save | on_load",
  "compute": { ... },
  "validate": [ ... ],
  "transform": { ... },
  "actions": [ ... ]
}
```

## Compute

Calcula valores automaticamente. Soporta varios formatos:

### Formula simple (shorthand)

```json
{
  "compute": {
    "total": "cantidad * precio"
  }
}
```

El shorthand se normaliza internamente a:

```json
{
  "compute": {
    "total": { "type": "formula", "expression": "cantidad * precio" }
  }
}
```

### Formula explicita

```json
{
  "compute": {
    "iva": { "type": "formula", "expression": "subtotal * 0.21" },
    "total": { "type": "formula", "expression": "subtotal + iva" }
  }
}
```

### Condicional

Calcula un valor basado en condiciones:

```json
{
  "compute": {
    "descuento": {
      "type": "conditional",
      "conditions": [
        { "when": "cantidad >= 100", "then": "0.15" },
        { "when": "cantidad >= 50", "then": "0.10" },
        { "when": "cantidad >= 10", "then": "0.05" }
      ],
      "default": "0"
    }
  }
}
```

### Lookup

Busca un valor en otra entidad:

```json
{
  "compute": {
    "precio_unitario": {
      "type": "lookup",
      "entity": "productos",
      "matchField": "id",
      "matchValue": "producto_id",
      "resultField": "precio"
    }
  }
}
```

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `entity` | string | Entidad donde buscar |
| `matchField` | string | Campo de la entidad destino para hacer match |
| `matchValue` | string | Campo del registro actual con el valor a buscar |
| `resultField` | string | Campo de la entidad destino cuyo valor retornar |

### Aggregate

Agrega valores de multiples registros de otra entidad:

```json
{
  "compute": {
    "total_lineas": {
      "type": "aggregate",
      "entity": "lineas_factura",
      "aggregateOp": "sum",
      "aggregateField": "subtotal",
      "filter": { "factura_id": "id" }
    },
    "cantidad_items": {
      "type": "aggregate",
      "entity": "lineas_factura",
      "aggregateOp": "count",
      "filter": { "factura_id": "id" }
    }
  }
}
```

| Propiedad | Tipo | Descripcion |
|-----------|------|-------------|
| `entity` | string | Entidad a agregar |
| `aggregateOp` | string | Operacion: `"sum"` o `"count"` |
| `aggregateField` | string | Campo a sumar (requerido para `sum`) |
| `filter` | object | Filtro: `{ campo_destino: "campo_actual" }` |

## Validate

Array de reglas de validacion:

```json
{
  "validate": [
    {
      "id": "precio_positivo",
      "condition": "precio > 0",
      "message": "El precio debe ser mayor a cero",
      "severity": "error",
      "field": "precio"
    }
  ]
}
```

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `id` | string | Si | Identificador unico de la validacion |
| `condition` | string | Si | Expresion booleana que debe ser verdadera |
| `message` | string | Si | Mensaje de error si la condicion es falsa |
| `severity` | string | Si | `"error"` (bloquea guardado), `"warning"`, `"info"` |
| `field` | string | No | Campo al que asociar el error en la UI |

## Transform

Transforma valores de campos:

```json
{
  "transform": {
    "nombre": { "type": "uppercase" },
    "email": { "type": "lowercase" },
    "descripcion": { "type": "trim" },
    "precio": { "type": "round", "decimals": 2 }
  }
}
```

| Tipo | Descripcion |
|------|-------------|
| `uppercase` | Convierte a mayusculas |
| `lowercase` | Convierte a minusculas |
| `trim` | Elimina espacios al inicio y final |
| `round` | Redondea a N decimales |

## Actions

Efectos secundarios que se ejecutan despues de guardar. Las acciones se ejecutan secuencialmente y pueden compartir datos a traves del [contexto de ejecucion](#contexto-de-ejecucion).

### `update_related`

Actualiza un registro en una entidad diferente:

```json
{
  "actions": [
    {
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
    }
  ]
}
```

### `update_record`

Actualiza campos en el registro actual. A diferencia de `update_related`, no requiere `entity` ni `recordId` — apunta al registro que disparo la regla.

```json
{
  "type": "update_record",
  "fields": {
    "estado": "aprobado",
    "aprobado_por": "$ctx.approver_name"
  }
}
```

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `fields` | object | Si | Pares campo→valor a establecer en el registro actual |

Los valores pueden referenciar variables del contexto de ejecucion usando la sintaxis `$ctx.*`. Esto es util para encadenar acciones — por ejemplo, almacenar el resultado de una clasificacion por IA y luego escribirlo de vuelta en el registro.

### `ai_call`

Invoca un modelo de IA como accion de regla. Util para clasificacion, extraccion, resumen, o cualquier tarea de generacion de texto disparada por cambios en registros.

```json
{
  "type": "ai_call",
  "prompt": "Classify this support ticket: {{descripcion}}",
  "system_prompt": "You are a ticket classifier. Respond with exactly one of: bug, feature, question",
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "max_tokens": 100,
  "store_result_as": "$ctx.classification"
}
```

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `prompt` | string | Si (salvo `prompt_template`) | El prompt a enviar. Soporta sustitucion `{{campo}}` desde el registro actual. |
| `prompt_template` | string | No | Slug de un prompt template reutilizable (se resuelve desde `_fyso_ai_templates`) |
| `system_prompt` | string | No | System prompt para la llamada de IA |
| `system_prompt_template` | string | No | Slug de un system prompt template |
| `model` | string | No | Modelo a usar. Si se omite, usa el modelo predeterminado del tenant. |
| `temperature` | number | No | 0–2. Si se omite, usa el valor predeterminado del proveedor. |
| `max_tokens` | number | No | 1–32000 |
| `store_result_as` | string | No | Almacena la respuesta de la IA en el contexto de ejecucion. Debe seguir el formato `$ctx.<identificador>`. |

**Protecciones:**

- Se verifica el presupuesto antes de cada llamada de IA. Si el tenant agoto su presupuesto de IA, la llamada se omite.
- Se verifica el limite de tasa antes de la verificacion de presupuesto.
- Los errores se capturan como validaciones de tipo `error` — el pipeline continua con las acciones restantes.
- Todas las llamadas se registran en `_fyso_ai_call_logs`.

### `webhook_send`

Envia una solicitud HTTP POST a una URL externa. Util para notificaciones, integraciones y reenvio de eventos.

```json
{
  "type": "webhook_send",
  "url": "https://hooks.example.com/notify",
  "headers": {
    "X-Api-Key": "my-token"
  },
  "payload": {
    "ticket_id": "id",
    "status": "estado",
    "customer": "nombre_cliente"
  },
  "timeoutMs": 5000
}
```

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `url` | string | Si | URL de destino. Soporta templates `{{campo}}`. Proteccion SSRF habilitada. |
| `headers` | object | No | Headers HTTP personalizados. Soporta templates `{{campo}}`. |
| `payload` | object | No | Payload clave→valor. Los valores se resuelven desde el registro actual al momento de ejecucion. `_record_id` se inyecta automaticamente. |
| `timeoutMs` | number | No | 100–30000 ms (por defecto: 5000) |

**Comportamiento:**

- Siempre envia una solicitud `POST` con cuerpo JSON.
- 1 reintento automatico en caso de fallo (fire-and-forget — no bloquea el pipeline de reglas).
- El filtro SSRF bloquea IPs privadas/internas tanto al guardar la regla como al ejecutarla.

## Contexto de ejecucion

Las reglas de negocio pueden compartir datos entre acciones usando el **contexto de ejecucion** (`$ctx`). Asi se encadenan acciones — por ejemplo, llamando a un modelo de IA y luego escribiendo el resultado de vuelta en el registro.

El flujo:

1. Una accion `ai_call` almacena su resultado via `store_result_as: "$ctx.classification"`.
2. Una accion `update_record` posterior referencia `$ctx.classification` en sus `fields`.

```json
{
  "actions": [
    {
      "type": "ai_call",
      "prompt": "Classify: {{descripcion}}",
      "system_prompt": "Respond with one of: bug, feature, question",
      "store_result_as": "$ctx.classification"
    },
    {
      "type": "update_record",
      "fields": {
        "categoria": "$ctx.classification"
      }
    }
  ]
}
```

Las variables de contexto tienen alcance dentro de una sola ejecucion de regla. No persisten entre disparos de reglas separados.

## Bloqueo optimista

Todos los registros incluyen un campo `_record_version` en las respuestas de la API. Cuando se actualiza un registro via la API e incluyen `_record_version` en el payload, el servidor verifica que la version coincida con el valor almacenado. Si no coincide (otra actualizacion ocurrio en el intermedio), la solicitud se rechaza con un error de conflicto de version.

Las acciones disparadas por reglas de negocio (`update_related`, `update_record`) omiten la verificacion de version para evitar conflictos durante el procesamiento automatizado.

## Operadores permitidos

| Categoria | Operadores |
|-----------|-----------|
| Aritmeticos | `+`, `-`, `*`, `/` |
| Comparacion | `>`, `<`, `>=`, `<=`, `==`, `!=` |
| Logicos | `and`, `or` |

## Funciones permitidas

| Funcion | Descripcion | Ejemplo |
|---------|-------------|---------|
| `round(x, n)` | Redondea a n decimales | `round(total, 2)` |
| `coalesce(a, b)` | Primer valor no nulo | `coalesce(descuento, 0)` |
| `abs(x)` | Valor absoluto | `abs(diferencia)` |
| `min(a, b)` | Minimo | `min(stock, pedido)` |
| `max(a, b)` | Maximo | `max(precio, precio_minimo)` |
| `floor(x)` | Redondeo hacia abajo | `floor(cantidad)` |
| `ceil(x)` | Redondeo hacia arriba | `ceil(horas)` |
| `len(s)` | Longitud de string | `len(nombre)` |
| `upper(s)` | Mayusculas | `upper(codigo)` |
| `lower(s)` | Minusculas | `lower(email)` |
| `trim(s)` | Eliminar espacios | `trim(nombre)` |
| `now()` | Fecha y hora actual | `now()` |
| `today()` | Fecha actual | `today()` |
