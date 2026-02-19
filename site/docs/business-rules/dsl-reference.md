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

Efectos secundarios que se ejecutan despues de guardar:

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
