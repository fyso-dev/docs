---
sidebar_position: 12
---

# Agentes de IA

Fyso incluye un sistema de agentes de IA integrado. Los agentes son asistentes conversacionales que operan sobre los datos de su tenant usando las mismas herramientas disponibles para clientes MCP. Pueden responder preguntas, crear registros, agendar citas y buscar en la base de conocimiento, todo a traves de lenguaje natural.

## Crear un agente

**Herramienta MCP: `fyso_agents`**

```
fyso_agents({
  action: "create",
  name: "Support Bot",
  system_prompt: "You are a helpful support agent for a dental clinic."
})
```

**REST API:**

```bash
curl -X POST "https://api.fyso.dev/api/tenants/:slug/agents-config" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "system_prompt": "You are a helpful support agent for a dental clinic."
  }'
```

El slug del agente se genera automaticamente a partir del nombre (por ejemplo, `Support Bot` se convierte en `support-bot`).

### Campos del agente

| Campo | Tipo | Predeterminado | Descripcion |
|-------|------|----------------|-------------|
| `name` | string | requerido | Nombre visible del agente. El slug se genera automaticamente a partir del nombre. |
| `system_prompt` | string | `""` | Prompt de sistema personalizado que se agrega al prompt base. |
| `fallback_mode` | `llm` \| `message` \| `silent` | `llm` | Que hacer cuando ninguna regla determinista coincide. |
| `fallback_messages` | object | `{}` | Mensajes de respaldo personalizados por idioma. |
| `tools_scope` | object | `{}` | Herramientas de entidades disponibles: `{ "entity_name": ["query", "create", "update"] }` |
| `max_steps` | number | `10` | Maximo de iteraciones de llamadas a herramientas por ejecucion. |
| `memory_enabled` | boolean | `false` | Extraer y recordar datos entre conversaciones. |
| `knowledge_enabled` | boolean | `false` | Inyectar la herramienta `search_knowledge` para busqueda RAG. |
| `schedules_enabled` | boolean | `false` | Inyectar herramientas de agenda (horarios, reservas). |
| `status` | `active` \| `paused` \| `archived` | `active` | Estado del ciclo de vida del agente. |

## Ejecutar un agente

**Herramienta MCP:**

```
fyso_agents({
  action: "run",
  agentId: "support-bot",
  input: "When is my next appointment?"
})
```

**REST API:**

```bash
curl -X POST "https://api.fyso.dev/api/tenants/:slug/agents/support-bot/run" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "When is my next appointment?"}'
```

**Respuesta:**

```json
{
  "response": "Your next appointment is on March 20 at 10:00 AM with Dr. Lopez.",
  "session_id": "a1b2c3d4-...",
  "run_id": "e5f6g7h8-...",
  "path": "llm",
  "steps_used": 3,
  "tokens": { "input": 450, "output": 120 }
}
```

El campo `path` indica como se resolvio la respuesta:

| Path | Significado |
|------|-------------|
| `rule` | Coincidio con una regla determinista — sin llamada al LLM, cero tokens |
| `llm` | Procesado por el modelo de IA |
| `fallback` | Ninguna regla coincidio y no se uso el LLM (modo fallback) |

## Reglas deterministas (ruta rapida)

Los agentes pueden tener reglas deterministas que responden a mensajes del usuario sin llamar al LLM. Las reglas se evaluan en orden — la primera coincidencia gana.

### Tipos de coincidencia

| Tipo | Descripcion | Ejemplo |
|------|-------------|---------|
| `exact` | Coincidencia exacta (sin distinguir mayusculas) | `"hola"` |
| `contains` | Todos los terminos deben estar presentes | `["precio", "producto"]` |
| `starts_with` | El mensaje comienza con la cadena | `"ayuda"` |
| `regex` | Expresion regular | `"^(hola\|buenos dias)"` |

Cuando una regla determinista coincide, la respuesta es instantanea: `steps_used: 0`, `total_tokens: 0`, `path: "rule"`. Esta es la ruta mas economica y rapida — usela para saludos, preguntas frecuentes y consultas comunes.

## Sesiones

Cada ejecucion de un agente pertenece a una sesion. Las sesiones rastrean el historial de conversacion a traves de multiples turnos, para que el agente recuerde lo que se dijo anteriormente en la misma conversacion.

- Las sesiones se identifican por la tupla `(agent_id, external_ref, external_type)`
- Valores de `external_type`: `telegram`, `whatsapp`, `web`, `api`
- Los ultimos 20 mensajes se cargan como contexto para cada ejecucion
- Las sesiones expiran automaticamente despues de inactividad (TTL configurable)
- Los mensajes concurrentes a la misma sesion se serializan con un bloqueo FIFO (timeout de 60s) — sin condiciones de carrera

## Memoria del agente

Cuando `memory_enabled: true`, el agente extrae datos clave de las conversaciones y los recuerda entre sesiones. Despues de 3 o mas turnos del usuario en una conversacion, el agente ejecuta una llamada de IA adicional para extraer datos como nombres, preferencias y contexto.

Los datos se almacenan por par agente + cliente y se inyectan en el prompt del sistema en sesiones posteriores. Esto permite que el agente diga "Bienvenida de nuevo, Maria" o recuerde que un paciente prefiere citas por la manana.

Costo: ~1 llamada de IA adicional por conversacion (se ejecuta despues de la conversacion, no durante).

## Alcance de herramientas

El campo `tools_scope` define que operaciones de entidades puede realizar el agente:

```json
{
  "tools_scope": {
    "citas": ["query", "create", "update"],
    "pacientes": ["query"]
  }
}
```

Esto genera definiciones semanticas de herramientas que el agente puede invocar:

- `query_citas` — buscar con filtros, paginacion
- `create_citas` — campos requeridos inferidos del esquema de la entidad
- `update_citas` — requiere `id`, todos los demas campos son opcionales
- `query_pacientes` — acceso de solo lectura

### Herramientas adicionales

Se inyectan herramientas adicionales segun la configuracion del agente:

| Configuracion | Herramientas inyectadas |
|---------------|------------------------|
| `knowledge_enabled: true` | `search_knowledge` — busqueda RAG, devuelve los 5 mejores resultados |
| `schedules_enabled: true` | `query_available_slots`, `create_booking`, `cancel_booking`, `query_bookings` |

## Plantillas de agentes

Plantillas predefinidas para casos de uso comunes. Cada plantilla viene con reglas deterministas preconfiguradas:

| Plantilla | Descripcion | Reglas |
|-----------|-------------|--------|
| `soporte` | Respuestas a preguntas frecuentes + escalamiento humano | 9 reglas deterministas |
| `citas` | Flujo de agendamiento de citas | 10 reglas deterministas |
| `ventas` | Catalogo de productos + captura de leads | 13 reglas deterministas |

**MCP:**

```
fyso_agents({
  action: "from_template",
  templateId: "soporte",
  name: "Mi Soporte"
})
```

Las plantillas proporcionan un agente funcional listo para usar. Personalice las reglas y el prompt del sistema despues de la creacion.

## Presets por industria

Configuraciones iniciales con un solo clic que crean entidades y un agente preconfigurado juntos. Use estos cuando empiece desde cero:

| Preset | Entidades creadas | Agente |
|--------|-------------------|--------|
| `taller` | vehicles, repairs, parts | Asistente de taller |
| `clinica` | patients, doctors, appointments, treatments | Agente de recepcion |
| `tienda` | products, orders, customers | Asistente de ventas |

**MCP:**

```
fyso_ai({
  action: "install_preset",
  preset: "clinica"
})
```

Esto crea todas las entidades con campos razonables, mas un agente configurado con el `tools_scope` y reglas deterministas adecuadas para esa industria.

## Versionado de prompts

Cada cambio en `system_prompt` o `rules` se versiona automaticamente. Fyso mantiene hasta 50 versiones por agente, rotando las mas antiguas.

**Listar versiones:**

```
fyso_agents({ action: "list_versions", agentId: "support-bot" })
```

```bash
curl "https://api.fyso.dev/api/agents-config/:id/versions" \
  -H "Authorization: Bearer TOKEN"
```

**Revertir a una version anterior:**

```
fyso_agents({ action: "rollback", agentId: "support-bot", versionId: "3" })
```

```bash
curl -X POST "https://api.fyso.dev/api/agents-config/:id/rollback/3" \
  -H "Authorization: Bearer TOKEN"
```

## Plantillas de prompts

Plantillas de prompts reutilizables que se pueden compartir entre agentes y referenciar en acciones `ai_call` de reglas de negocio:

```
fyso_ai({
  action: "create_template",
  name: "classifier",
  prompt: "Classify the following message: {{descripcion}}"
})
```

Las plantillas usan marcadores `{{field_name}}` que se reemplazan en tiempo de ejecucion. Referencie las plantillas en reglas de negocio mediante el slug de `prompt_template`.

## Ejecuciones del agente y observabilidad

Cada ejecucion del agente se registra en `_fyso_agent_runs`. Use esto para depuracion, monitoreo y seguimiento de uso.

**MCP:**

```
fyso_agents({ action: "list_runs", agentId: "support-bot" })
```

**Campos de la ejecucion:**

| Campo | Descripcion |
|-------|-------------|
| `id` | Identificador unico de la ejecucion |
| `agent_id` | Que agente proceso la solicitud |
| `session_id` | Sesion de conversacion |
| `path` | Ruta de resolucion: `rule`, `llm` o `fallback` |
| `steps_used` | Numero de iteraciones de llamadas a herramientas |
| `tokens` | `{ input, output }` conteo de tokens |
| `status` | `success`, `error`, `timeout` o `max_steps` |
| `input_message` | Lo que envio el usuario |
| `output_message` | Lo que respondio el agente |
| `created_at` | Marca de tiempo |

## Probar agentes

El modo dry-run evalua las reglas deterministas sin llamar al LLM. Use esto para verificar sus reglas antes de ponerlas en produccion:

```
fyso_agents({
  action: "test",
  agentId: "support-bot",
  input: "hola"
})
```

La respuesta incluye diagnosticos que muestran cuales reglas coincidieron, cuales no y por que. No se consumen tokens durante el dry-run.
