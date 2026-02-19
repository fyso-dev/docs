# Quick Start

Tu primera app en Fyso en 5 minutos.

## 1. Seleccionar un tenant

Cada espacio de trabajo en Fyso es un **tenant**. Lo primero es listar y seleccionar uno.

**MCP:**
```
list_tenants()
select_tenant({ tenantSlug: "mi-empresa" })
```

**Panel web:** Se selecciona automaticamente al iniciar sesion.

## 2. Crear una entidad

Las entidades son las tablas de tu app. Ejemplo: crear una entidad `clientes`.

**MCP:**
```
generate_entity({
  definition: {
    entity: { name: "clientes", displayName: "Clientes" },
    fields: [
      { name: "Nombre", fieldKey: "nombre", fieldType: "text", isRequired: true },
      { name: "Email", fieldKey: "email", fieldType: "email" },
      { name: "Telefono", fieldKey: "telefono", fieldType: "phone" }
    ]
  },
  auto_publish: true,
  version_message: "Initial entity"
})
```

## 3. Crear registros

**MCP:**
```
create_record({
  entityName: "clientes",
  data: {
    nombre: "Juan Perez",
    email: "juan@example.com",
    telefono: "+54 11 1234-5678"
  }
})
```

## 4. Consultar registros

**MCP:**
```
query_records({
  entityName: "clientes",
  filter: "nombre contains Juan",
  limit: 10
})
```

## 5. Agregar una regla de negocio

Ejemplo: validar que el email sea obligatorio.

**MCP:**
```
generate_business_rule({
  entityName: "clientes",
  dsl: {
    type: "validate",
    triggers: ["email"],
    validate: [{
      id: "email_requerido",
      condition: "len(email) > 0",
      message: "El email es obligatorio",
      severity: "error"
    }]
  },
  auto_publish: true
})
```

## Siguiente paso

Lee [Conceptos](concepts.md) para entender la arquitectura de Fyso.
