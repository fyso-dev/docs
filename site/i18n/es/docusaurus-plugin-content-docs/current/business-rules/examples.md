# Ejemplos de reglas de negocio

Patrones comunes para reglas de negocio en Fyso.

## Calculo de factura con IVA

Calcula subtotal, IVA y total automaticamente.

```
generate_business_rule({
  entityName: "facturas",
  dsl: {
    type: "compute",
    triggers: ["cantidad", "precio_unitario", "iva_pct"],
    compute: {
      subtotal: "cantidad * precio_unitario",
      iva: "subtotal * iva_pct / 100",
      total: "subtotal + iva"
    }
  },
  auto_publish: true
})
```

## Validar stock minimo

Impide guardar si el stock es negativo.

```
generate_business_rule({
  entityName: "productos",
  dsl: {
    type: "validate",
    triggers: ["stock"],
    validate: [{
      id: "stock_no_negativo",
      condition: "stock >= 0",
      message: "El stock no puede ser negativo",
      severity: "error",
      field: "stock"
    }]
  },
  auto_publish: true
})
```

## Descuento por volumen

Aplica descuento segun la cantidad comprada.

```
generate_business_rule({
  entityName: "lineas_pedido",
  dsl: {
    type: "compute",
    triggers: ["cantidad"],
    compute: {
      descuento_pct: {
        type: "conditional",
        conditions: [
          { when: "cantidad >= 100", then: "15" },
          { when: "cantidad >= 50", then: "10" },
          { when: "cantidad >= 20", then: "5" }
        ],
        default: "0"
      },
      descuento: "subtotal * descuento_pct / 100",
      total: "subtotal - descuento"
    }
  },
  auto_publish: true
})
```

## Lookup de precio desde catalogo

Busca el precio del producto cuando se selecciona en una linea de pedido.

```
generate_business_rule({
  entityName: "lineas_pedido",
  dsl: {
    type: "compute",
    triggers: ["producto_id"],
    compute: {
      precio_unitario: {
        type: "lookup",
        entity: "productos",
        matchField: "id",
        matchValue: "producto_id",
        resultField: "precio"
      },
      subtotal: "cantidad * precio_unitario"
    }
  },
  auto_publish: true
})
```

## Actualizar total del pedido padre

Cuando se modifica una linea, recalcula el total del pedido.

```
generate_business_rule({
  entityName: "lineas_pedido",
  dsl: {
    type: "action",
    triggerType: "after_save",
    triggers: ["subtotal"],
    actions: [{
      type: "update_related",
      entity: "pedidos",
      recordId: "pedido_id",
      data: {
        total: {
          type: "aggregate",
          entity: "lineas_pedido",
          aggregateOp: "sum",
          aggregateField: "subtotal",
          filter: { pedido_id: "pedido_id" }
        },
        cantidad_items: {
          type: "aggregate",
          entity: "lineas_pedido",
          aggregateOp: "count",
          filter: { pedido_id: "pedido_id" }
        }
      }
    }]
  },
  auto_publish: true
})
```

## Normalizar texto

Convierte nombre a mayusculas y limpia espacios del email.

```
generate_business_rule({
  entityName: "clientes",
  dsl: {
    type: "compute",
    triggers: ["nombre", "email"],
    transform: {
      nombre: { type: "uppercase" },
      email: { type: "trim" }
    }
  },
  auto_publish: true
})
```

## Multiples validaciones

```
generate_business_rule({
  entityName: "empleados",
  dsl: {
    type: "validate",
    triggers: ["salario", "fecha_ingreso"],
    validate: [
      {
        id: "salario_positivo",
        condition: "salario > 0",
        message: "El salario debe ser mayor a cero",
        severity: "error",
        field: "salario"
      },
      {
        id: "salario_razonable",
        condition: "salario <= 1000000",
        message: "Verificar: el salario parece muy alto",
        severity: "warning",
        field: "salario"
      }
    ]
  },
  auto_publish: true
})
```
