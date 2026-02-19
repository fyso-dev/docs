# Availability and Schedules

Fyso's scheduling system calculates availability automatically from three entities.

## Required Entities

To use the scheduling system, the tenant must have these three entities:

### `horarios`

Defines the regular schedules for each professional.

| Field | Type | Description |
|-------|------|-------------|
| `profesional_id` | relation | Reference to the professional |
| `rrule` | text | Recurrence rule (RFC 5545 / RRule format) |
| `hora_inicio` | text | Start time (HH:MM) |
| `hora_fin` | text | End time (HH:MM) |
| `duracion_turno` | number | Duration of each slot in minutes |
| `activo` | boolean | Whether the schedule is active |

Example `rrule`: `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` (Monday to Friday).

### `excepciones_horario`

Defines exceptions to the regular schedule (holidays, special days).

| Field | Type | Description |
|-------|------|-------------|
| `profesional_id` | relation | Reference to the professional |
| `fecha` | date | Exception date (YYYY-MM-DD) |
| `tipo` | select | `"bloqueado"` (unavailable) or `"horario_especial"` |
| `hora_inicio` | text | Start time (only for `horario_especial`) |
| `hora_fin` | text | End time (only for `horario_especial`) |

### `turnos`

The booked appointments.

| Field | Type | Description |
|-------|------|-------------|
| `profesional_id` | relation | Reference to the professional |
| `paciente_id` | relation | Reference to the patient/client |
| `fecha` | date | Appointment date (YYYY-MM-DD) |
| `hora` | text | Appointment time (HH:MM) |
| `duracion` | number | Duration in minutes |
| `estado` | select | `"confirmado"`, `"cancelado"`, etc. |
| `notas` | textarea | Optional notes |

## MCP Tool: `get_available_slots`

**Profile:** core

Calculates available slots considering schedules, exceptions, and existing appointments.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `profesional_id` | string | Yes | Professional's UUID |
| `fecha` | string | No | Specific date (YYYY-MM-DD) |
| `desde` | string | No | Range start (YYYY-MM-DD) |
| `hasta` | string | No | Range end (YYYY-MM-DD, max 90 days) |

Provide `fecha` for a single day, or `desde`/`hasta` for a range.

### Example: Single Day

```
get_available_slots({
  profesional_id: "uuid-del-profesional",
  fecha: "2026-02-20"
})
```

### Example: Date Range

```
get_available_slots({
  profesional_id: "uuid-del-profesional",
  desde: "2026-02-20",
  hasta: "2026-02-28"
})
```

### Response

```json
[
  { "fecha": "2026-02-20", "hora": "09:00", "duracion": 30, "profesional_id": "uuid" },
  { "fecha": "2026-02-20", "hora": "09:30", "duracion": 30, "profesional_id": "uuid" },
  { "fecha": "2026-02-20", "hora": "10:00", "duracion": 30, "profesional_id": "uuid" }
]
```

### Calculation Logic

1. Gets the active schedules for the professional
2. Generates slots based on `hora_inicio`, `hora_fin`, and `duracion_turno`
3. Applies the recurrence rule (`rrule`) to determine which days it applies
4. Excludes blocked dates and adjusts special schedules
5. Excludes slots that already have a confirmed appointment
