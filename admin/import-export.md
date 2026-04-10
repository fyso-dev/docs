# Import / Export de metadata

Exportar e importar la estructura (entidades, campos, reglas) de un tenant.

## MCP Tool: `export_metadata`

**Perfil:** core

Exporta la metadata del tenant actual. En MCP, la herramienta devuelve un resumen corto en texto y guarda la exportacion completa en un archivo JSON temporal.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `tenantId` | string | No | ID o slug del tenant. Default: tenant seleccionado |

### Ejemplo

```
export_metadata()
```

### Respuesta

Retorna un resumen en texto similar a:

```text
Export completed: 3 entities, 2 rules (18.4 KB)
Saved to: /tmp/fyso-export-mi-tenant-2026-04-09T21-30-00.json
```

El archivo guardado contiene la estructura completa de la exportacion:

```json
{
  "entities": [
    {
      "name": "clientes",
      "displayName": "Clientes",
      "fields": [...],
      "rules": [...]
    }
  ],
  "version": "1.0",
  "exportedAt": "2026-02-18T10:00:00Z"
}
```

### Comportamiento de la HTTP API

Si llamas directamente a `/metadata/export` en lugar de usar la herramienta MCP:

- Las respuestas normales usan el envelope JSON estandar `{ success, data }`
- Si el cliente envia `Accept-Encoding: gzip` y el payload supera el umbral, el servidor puede responder con `application/gzip`
- Las respuestas gzip incluyen los headers `X-Original-Size` y `X-Compressed-Size`
- Las respuestas JSON y gzip contienen la misma metadata

## MCP Tool: `import_metadata`

**Perfil:** core

Importa metadata a un tenant.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `metadata` | string | Si | JSON string con la metadata a importar |
| `tenantId` | string | No | ID o slug del tenant destino. Default: tenant seleccionado |

### Ejemplo

```
import_metadata({
  metadata: JSON.stringify({
    version: "1.0",
    entities: [...],
    businessRules: [...]
  })
})
```

### Notas

- El parametro MCP `metadata` es un string JSON
- El endpoint HTTP `/metadata/import` acepta tanto un body JSON como un body gzip (`application/gzip` o `Content-Encoding: gzip`)
- La importacion crea las entidades y campos del sistema (`isSystem=true`)
- Los campos custom (`isSystem=false`) creados con `manage_custom_fields` NO se ven afectados
- Si una entidad ya existe, se actualizan sus campos del sistema
- Las reglas de negocio se importan como drafts

## Casos de uso

- **Migrar entre tenants** -- exportar desde uno, importar en otro
- **Backup de estructura** -- exportar periodicamente
- **Templates** -- crear un tenant modelo y exportar para replicar
- **Publicar como app** -- `publish_app` usa export_metadata internamente
