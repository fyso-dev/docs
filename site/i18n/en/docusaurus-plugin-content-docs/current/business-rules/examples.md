# Business Rule Examples

Common patterns for business rules in Fyso.

## Invoice Calculation with Tax

Automatically calculates subtotal, tax, and total.

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

## Validate Minimum Stock

Prevents saving if stock is negative.

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

## Volume Discount

Applies a discount based on the purchased quantity.

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

## Price Lookup from Catalog

Looks up the product price when selected in an order line.

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

## Update Parent Order Total

When an order line is modified, recalculates the order total.

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

## Normalize Text

Converts name to uppercase and trims whitespace from email.

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

## Multiple Validations

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
