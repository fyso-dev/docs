---
sidebar_position: 9
---

# Requisitos de modelo para tool calling

Los agentes de Fyso usan un loop de tool calling: el modelo recibe una lista de herramientas (`query_records`, `create_record`, `update_record`), las llama para obtener o modificar datos, y luego devuelve una respuesta de texto. Este loop depende completamente de que el modelo pueda emitir respuestas estructuradas con `tool_calls`.

## Que espera el agente del modelo

El runner envia el formato de function calling de OpenAI — `tools` en el cuerpo de la solicitud — y espera `finish_reason: "tool_calls"` con un array `tool_calls` en la respuesta. Si el modelo no soporta este formato, los fallos posibles son:

- **Datos alucinados:** el modelo inventa registros en lugar de consultarlos.
- **Herramientas ignoradas:** el modelo responde desde su conocimiento de entrenamiento, sin consultar las entidades.
- **Fallo silencioso:** el runner interpreta la respuesta de texto como respuesta final, la devuelve, y reporta cero tool calls.

Ninguno de estos fallos produce un error — el agente parece funcionar pero devuelve datos incorrectos.

## Requisitos minimos de capacidad

Para un tool calling confiable, el modelo debe:

1. Soportar la API de function calling de OpenAI (parametro `tools`, `tool_calls` en la respuesta).
2. Emitir correctamente `finish_reason: "tool_calls"` cuando se necesita llamar una herramienta.
3. Devolver JSON valido en `tool_calls[].function.arguments`.

Los modelos que cumplen estos requisitos de forma consistente incluyen las familias **GPT-4o**, **GPT-4.1**, **Claude 3.5+** y **Llama 3.1 70B+**. Los modelos pequenos (menos de ~30B parametros) frecuentemente declaran soporte para function calling pero producen resultados poco confiables en la practica.

## Modelos con problemas conocidos

| Modelo | Problema |
|--------|----------|
| `llama-3.1-8b-instant` | Ignora herramientas con frecuencia; alucina registros |
| Otros modelos instruct menores a 30B | Soporte variable — probar antes de usar en produccion |

Esta lista no es exhaustiva. El comportamiento del modelo depende del fine-tuning del proveedor y la version desplegada.

## Como probar un modelo

Ejecutar el agente con una consulta que requiera una llamada a herramienta y verificar los metadatos de la respuesta:

```json
{
  "response": "...",
  "steps_used": 1,
  "tool_calls_count": 1
}
```

Si `tool_calls_count` es `0` pero el agente produjo una respuesta relacionada con datos, el modelo no uso herramientas. Probar con un modelo mas grande.

## Configurar el modelo

El `default_model` se configura en la configuracion de proveedor de AI para el tenant (panel de admin → configuracion de AI). Fyso no valida el nombre del modelo — se acepta cualquier string y se pasa al proveedor. Si el proveedor devuelve un error para un modelo no soportado, el agente devuelve un error `not_configured`.

```json
{
  "providers": {
    "default": {
      "type": "openai",
      "base_url": "https://api.groq.com/openai/v1",
      "default_model": "llama-3.1-70b-versatile"
    }
  }
}
```

Al usar Groq, Together AI u otro endpoint compatible con OpenAI, seleccionar un modelo que liste explicitamente soporte para function calling / tool use en su documentacion.
