---
sidebar_position: 13
---

# Canales

Los canales conectan agentes de IA con plataformas de mensajeria externas. Cada agente puede estar conectado a multiples canales simultaneamente.

## Canales soportados

| Canal | Streaming | Configuracion |
|-------|-----------|---------------|
| **Web Widget** | Streaming de tokens por SSE | Insertar etiqueta `<script>` |
| **Telegram** | Indicador de escritura | Conectar token del bot via MCP |

## Web Widget

Inserte un agente como una burbuja de chat flotante en cualquier sitio web.

### Configuracion

```html
<script
  src="https://api.fyso.dev/widget.js"
  data-tenant="my-tenant"
  data-agent="my-bot"
  data-title="Chat with us"
  data-color="#4F46E5"
  data-position="bottom-right"
></script>
```

El widget abre una interfaz de chat que transmite las respuestas del agente token por token mediante Server-Sent Events (SSE).

### Endpoint de streaming

```
POST /api/tenants/:slug/agents/:agentSlug/chat/stream
Content-Type: application/json

{ "message": "Hello", "session_id": "optional-uuid" }
```

Respuesta: flujo SSE con fragmentos `data: {"token": "Hello"}`, finalizando con `data: {"done": true, "session_id": "uuid"}`.

Si el streaming falla, el widget recurre al endpoint estandar sin streaming.

## Telegram

Conecte un bot de Telegram a un agente para que los usuarios puedan chatear via Telegram.

### Conectar via MCP

```
fyso_agents({ action: "connect_telegram", agentId: "my-bot", bot_token: "123456:ABC-DEF...", secret_token: "my-webhook-secret" })
```

Esto:
1. Verifica el token del bot mediante la API `getMe` de Telegram
2. Registra una URL de webhook: `https://api.fyso.dev/api/webhooks/telegram/:tenantSlug`
3. Encripta y almacena la configuracion del bot en los secretos del tenant

### Desconectar

```
fyso_agents({ action: "disconnect_telegram", agentId: "my-bot" })
```

Elimina el webhook de Telegram y borra la configuracion almacenada.

### Como funciona

1. El usuario envia un mensaje al bot de Telegram
2. Telegram envia un POST del webhook a `https://api.fyso.dev/api/webhooks/telegram/:tenantSlug`
3. El receptor del webhook valida el encabezado `X-Telegram-Bot-Api-Secret-Token`
4. Carga la configuracion del bot desde los secretos del tenant
5. Ejecuta el agente con el mensaje entrante
6. Envia la respuesta de vuelta mediante `sendMessage` de Telegram (Markdown)

Tipos de mensajes de Telegram soportados: texto, foto, documento, ubicacion.

Antes de que el LLM responda, se envia un indicador de escritura (`sendChatAction: typing`) para que el usuario vea que el bot esta trabajando.

### Firma del webhook

El `secret_token` (opcional pero recomendado) se verifica en cada webhook entrante. Si el encabezado no coincide, la solicitud se rechaza con 401.

## Arquitectura de canales

Cada canal implementa la interfaz `ChannelAdapter`:

- `send(externalRef, message)` — Enviar un mensaje al usuario
- `receive(payload)` — Analizar el payload del webhook entrante en un `IncomingMessage` normalizado
- `getStatus()` — Verificacion de salud (por ejemplo, prueba `getMe` de Telegram)

Los canales que soportan streaming tambien implementan:
- `sendChunk(externalRef, chunk)` — Enviar una respuesta parcial
- `sendStreamStart(externalRef)` — Senalar el inicio del stream (por ejemplo, indicador de escritura)

## Relacion agente-canal

Cada agente puede tener multiples canales (1:N). Conecte canales a traves del editor de agentes en la interfaz o herramientas MCP. Un canal conectado a un agente recibe mensajes unicamente para ese agente.
