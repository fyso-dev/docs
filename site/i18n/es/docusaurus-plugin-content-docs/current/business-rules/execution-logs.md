# Logs de ejecucion

Los logs de ejecucion permiten depurar reglas de negocio y entender que ocurrio en cada ejecucion.

## MCP Tool: `get_rule_logs`

**Perfil:** advanced

Obtiene los logs de ejecucion de reglas para una entidad.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |
| `ruleId` | string | No | Filtrar por regla especifica |
| `limit` | number | No | Maximo de logs a retornar |

### Ejemplo

```
get_rule_logs({
  entityName: "facturas",
  limit: 20
})
```

### Informacion en los logs

Cada log incluye:

- Regla que se ejecuto (nombre e ID)
- Registro afectado (ID)
- Trigger que disparo la ejecucion
- Resultado: exito, fallo o error
- Valores de entrada y salida
- Timestamp

## MCP Tool: `test_business_rule`

**Perfil:** advanced

Prueba una regla con datos de prueba sin afectar registros reales.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `entityName` | string | Si | Nombre de la entidad |
| `ruleId` | string | Si | ID de la regla a probar |
| `testData` | object | Si | Datos de prueba |

### Ejemplo

```
test_business_rule({
  entityName: "facturas",
  ruleId: "uuid-de-la-regla",
  testData: {
    cantidad: 10,
    precio_unitario: 100,
    iva_pct: 21
  }
})
```

El resultado muestra los valores calculados sin guardar nada en la base de datos.
