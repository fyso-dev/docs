---
sidebar_position: 2
---

# Integration SDK

Fyso soporta integraciones de terceros que extienden la plataforma con acciones personalizadas, herramientas y almacenamiento de datos.

## Descripcion general

Una integracion es un paquete con:
- Un **manifiesto** (`fyso-integration.json`) que describe la integracion
- **Handlers de herramientas** que ejecutan acciones
- **Migraciones SQL** para tablas especificas de la integracion (con prefijo automatico)
- Un **esquema de configuracion** que define las credenciales requeridas

## Manifiesto

```json
{
  "slug": "discord",
  "name": "Discord Webhooks",
  "version": "1.0.0",
  "description": "Send messages and embeds to Discord channels",
  "configSchema": {
    "type": "object",
    "properties": {
      "webhook_url": {
        "type": "string",
        "pattern": "^https://discord\\.com/api/webhooks/",
        "description": "Discord webhook URL"
      }
    },
    "required": ["webhook_url"]
  },
  "tools": [
    {
      "slug": "send-message",
      "name": "Send Message",
      "description": "Send a text message to a Discord channel",
      "handler": "tools/send-message.ts",
      "inputSchema": {
        "type": "object",
        "properties": {
          "content": { "type": "string", "maxLength": 2000 }
        },
        "required": ["content"]
      }
    }
  ]
}
```

La validacion del manifiesto exige: patron de slug valido, version semver, JSON Schema valido para la configuracion e inputs, y los archivos de handlers deben existir.

## Escribir un handler de herramienta

```typescript
import { defineAction, IntegrationContext } from '@fyso/integrations-sdk';

export default defineAction(async (ctx: IntegrationContext, input: { content: string }) => {
  const config = await ctx.getConfig();

  const res = await fetch(config.webhook_url + '?wait=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: input.content }),
  });

  if (!res.ok) {
    throw new IntegrationError('Discord API error', { statusCode: res.status, retryable: res.status === 429 });
  }

  return { success: true, messageId: (await res.json()).id };
});
```

`defineAction` envuelve su handler con logging estructurado y un limite de errores.

## Ciclo de vida

Las integraciones pasan por estos estados:

```
registered → installed → active ↔ deactivated → uninstalled
```

| Estado | Descripcion |
|--------|-------------|
| `registered` | Manifiesto validado, disponible en el catalogo |
| `installed` | Migraciones ejecutadas, configuracion almacenada (encriptada) |
| `active` | Herramientas disponibles para agentes y reglas |
| `deactivated` | Herramientas deshabilitadas, configuracion preservada |
| `uninstalled` | Configuracion y datos eliminados |

### Herramientas MCP

| Herramienta | Descripcion |
|-------------|-------------|
| `list_integrations` | Listar integraciones disponibles y su estado |
| `install_integration` | Instalar y configurar una integracion |
| `configure_integration` | Actualizar la configuracion de una integracion |
| `activate_integration` | Habilitar las herramientas de una integracion |
| `test_integration` | Probar la conectividad de una integracion |
| `uninstall_integration` | Eliminar una integracion |
| `list_integration_logs` | Ver los logs de salud de una integracion |

## Almacen de credenciales

Los campos con `format: "secret"` en el esquema de configuracion se encriptan con AES-256-GCM antes de almacenarse. Las credenciales se guardan en `tenant_registry.integration_installations`, fuera de los esquemas del tenant.

El aislamiento entre tenants se aplica de forma estricta — todas las consultas estan delimitadas por `(tenant_id, integration_slug)`.

## Herramientas de integracion en agentes

Las integraciones activas inyectan sus herramientas en el ejecutor del agente como `integration:<slug>:<tool-slug>`. Por ejemplo, cuando la integracion de Discord esta activa, los agentes pueden llamar a `integration:discord:send-message`.

## Circuit breaker

El runtime rastrea fallos consecutivos. Despues de 10 fallos consecutivos, la integracion se desactiva automaticamente. Una ejecucion exitosa reinicia el contador.

## Pruebas

El SDK incluye una bateria de pruebas de 3 niveles:

| Nivel | Enfoque | Verificaciones |
|-------|---------|----------------|
| Estructural | Validez del manifiesto | Archivos existen, handlers exportan, sin imports prohibidos |
| Funcional | Comportamiento de herramientas | Formas de respuesta exitosa/error, guarda de timeout de 5s |
| Seguridad | Aislamiento | Sin SQL directo, sin `SET search_path`, sin configuracion entre integraciones |

```bash
bun run test:integration packages/integrations/discord
```

## Incluida: Discord

La integracion de webhooks de Discord viene incluida con Fyso:

**Herramientas:**
- `send-message` — Enviar un mensaje de texto (maximo 2000 caracteres, manejo de rate limit 429)
- `send-embed` — Enviar un embed enriquecido (titulo, descripcion, color, campos, pie de pagina, marca de tiempo)

**Configuracion:** Requiere una URL de webhook de Discord.
