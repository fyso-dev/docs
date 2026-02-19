# Quick Start

Your first Fyso app in 5 minutes.

## 1. Select a tenant

Every workspace in Fyso is a **tenant**. The first step is to list and select one.

**MCP:**
```
list_tenants()
select_tenant({ tenantSlug: "mi-empresa" })
```

**Web panel:** It is selected automatically when you log in.

## 2. Create an entity

Entities are the tables of your app. Example: create a `clientes` entity.

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

## 3. Create records

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

## 4. Query records

**MCP:**
```
query_records({
  entityName: "clientes",
  filter: "nombre contains Juan",
  limit: 10
})
```

## 5. Add a business rule

Example: validate that the email is required.

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

## Next step

Read [Concepts](concepts.md) to understand the Fyso architecture.
