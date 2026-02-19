# Disponibilidad y horarios

El sistema de turnos de Fyso calcula disponibilidad automaticamente a partir de tres entidades.

## Entidades requeridas

Para usar el sistema de turnos, el tenant debe tener estas tres entidades:

### `horarios`

Define los horarios regulares de cada profesional.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `profesional_id` | relation | Referencia al profesional |
| `rrule` | text | Regla de recurrencia (formato RFC 5545 / RRule) |
| `hora_inicio` | text | Hora de inicio (HH:MM) |
| `hora_fin` | text | Hora de fin (HH:MM) |
| `duracion_turno` | number | Duracion de cada slot en minutos |
| `activo` | boolean | Si el horario esta activo |

Ejemplo de `rrule`: `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` (lunes a viernes).

### `excepciones_horario`

Define excepciones al horario regular (feriados, dias especiales).

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `profesional_id` | relation | Referencia al profesional |
| `fecha` | date | Fecha de la excepcion (YYYY-MM-DD) |
| `tipo` | select | `"bloqueado"` (no atiende) o `"horario_especial"` |
| `hora_inicio` | text | Hora de inicio (solo para `horario_especial`) |
| `hora_fin` | text | Hora de fin (solo para `horario_especial`) |

### `turnos`

Los turnos reservados.

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `profesional_id` | relation | Referencia al profesional |
| `paciente_id` | relation | Referencia al paciente/cliente |
| `fecha` | date | Fecha del turno (YYYY-MM-DD) |
| `hora` | text | Hora del turno (HH:MM) |
| `duracion` | number | Duracion en minutos |
| `estado` | select | `"confirmado"`, `"cancelado"`, etc. |
| `notas` | textarea | Notas opcionales |

## MCP Tool: `get_available_slots`

**Perfil:** core

Calcula los slots disponibles considerando horarios, excepciones y turnos existentes.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `profesional_id` | string | Si | UUID del profesional |
| `fecha` | string | No | Fecha especifica (YYYY-MM-DD) |
| `desde` | string | No | Inicio del rango (YYYY-MM-DD) |
| `hasta` | string | No | Fin del rango (YYYY-MM-DD, max 90 dias) |

Proporcionar `fecha` para un dia, o `desde`/`hasta` para un rango.

### Ejemplo: un dia

```
get_available_slots({
  profesional_id: "uuid-del-profesional",
  fecha: "2026-02-20"
})
```

### Ejemplo: rango de fechas

```
get_available_slots({
  profesional_id: "uuid-del-profesional",
  desde: "2026-02-20",
  hasta: "2026-02-28"
})
```

### Respuesta

```json
[
  { "fecha": "2026-02-20", "hora": "09:00", "duracion": 30, "profesional_id": "uuid" },
  { "fecha": "2026-02-20", "hora": "09:30", "duracion": 30, "profesional_id": "uuid" },
  { "fecha": "2026-02-20", "hora": "10:00", "duracion": 30, "profesional_id": "uuid" }
]
```

### Logica de calculo

1. Obtiene los horarios activos del profesional
2. Genera slots segun `hora_inicio`, `hora_fin` y `duracion_turno`
3. Aplica la regla de recurrencia (`rrule`) para determinar que dias aplica
4. Excluye fechas bloqueadas y ajusta horarios especiales
5. Excluye slots que ya tienen un turno confirmado
