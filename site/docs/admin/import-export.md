# Import / Export de metadata

Exportar e importar la estructura (entidades, campos, reglas) de un tenant.

## MCP Tool: `export_metadata`

**Perfil:** core

Exporta la metadata del tenant actual a un JSON.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `tenantId` | string | No | ID o slug del tenant. Default: tenant seleccionado |

### Ejemplo

```
export_metadata()
```

### Respuesta

Retorna un JSON con la estructura completa:

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

## MCP Tool: `import_metadata`

**Perfil:** core

Importa metadata desde un JSON a un tenant.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `metadata` | string | Si | JSON string con la metadata a importar |
| `tenantId` | string | No | ID o slug del tenant destino. Default: tenant seleccionado |

### Ejemplo

```
import_metadata({
  metadata: '{"entities":[...],"version":"1.0"}'
})
```

### Notas

- La importacion crea las entidades y campos del sistema (`isSystem=true`)
- Los campos custom (`isSystem=false`) creados con `manage_custom_fields` NO se ven afectados
- Si una entidad ya existe, se actualizan sus campos del sistema
- Las reglas de negocio se importan como drafts

## Casos de uso

- **Migrar entre tenants** -- exportar desde uno, importar en otro
- **Backup de estructura** -- exportar periodicamente
- **Templates** -- crear un tenant modelo y exportar para replicar
- **Publicar como app** -- `publish_app` usa export_metadata internamente
