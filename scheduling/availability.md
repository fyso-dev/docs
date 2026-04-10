# Disponibilidad y horarios

El motor de scheduling de Fyso calcula disponibilidad a partir de tres entidades de sistema:

- `_fyso_schedules`
- `_fyso_schedule_exceptions`
- `_fyso_bookings`

Estas entidades son independientes de entidades de dominio como `doctors`, `patients` o `appointments`.

## Setup

Ejecuta `setup_scheduling` una vez por tenant, o llama a `POST /api/scheduling/setup`.

El setup es idempotente. Crea y publica las tres entidades `_fyso_*` si no existen.

## Entidades requeridas

### `_fyso_schedules`

Horarios regulares de cada profesional.

| `fieldKey` | `fieldType` | Requerido | Descripcion |
|------------|-------------|-----------|-------------|
| `professional_id` | `text` | Si | UUID del profesional |
| `rrule` | `text` | Si | String RRULE RFC 5545 |
| `start_time` | `text` | No | Hora de inicio `HH:MM`. Default `09:00` si falta |
| `end_time` | `text` | No | Hora de fin `HH:MM`. Default `17:00` si falta |
| `slot_duration` | `number` | No | Duracion del slot en minutos. Default `30` si falta |
| `active` | `boolean` | No | Si el horario esta activo. Default `true` |

Ejemplo:

```json
{
  "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  "rrule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  "start_time": "09:00",
  "end_time": "13:00",
  "slot_duration": 30,
  "active": true
}
```

### `_fyso_schedule_exceptions`

Dias bloqueados o sobrescrituras de horario especial.

| `fieldKey` | `fieldType` | Requerido | Descripcion |
|------------|-------------|-----------|-------------|
| `professional_id` | `text` | Si | UUID del profesional |
| `date` | `date` | Si | Fecha de excepcion en `YYYY-MM-DD` |
| `type` | `select` | Si | `blocked` o `special_hours` |
| `start_time` | `text` | No | Requerido cuando `type = "special_hours"` |
| `end_time` | `text` | No | Requerido cuando `type = "special_hours"` |

Ejemplo de dia bloqueado:

```json
{
  "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  "date": "2026-05-01",
  "type": "blocked"
}
```

Ejemplo de horario especial:

```json
{
  "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  "date": "2026-05-02",
  "type": "special_hours",
  "start_time": "10:00",
  "end_time": "12:00"
}
```

### `_fyso_bookings`

Reservas confirmadas que el motor usa para descartar slots ocupados.

| `fieldKey` | `fieldType` | Requerido | Descripcion |
|------------|-------------|-----------|-------------|
| `professional_id` | `text` | Si | UUID del profesional |
| `patient_id` | `text` | Si | UUID del paciente/cliente |
| `date` | `date` | Si | Fecha del turno en `YYYY-MM-DD` |
| `time` | `text` | Si | Hora del turno en `HH:MM` |
| `duration` | `number` | No | Duracion en minutos |
| `status` | `select` | Si | `confirmed`, `cancelled` o `completed` |
| `notes` | `textarea` | No | Notas opcionales |

## Notas sobre RRULE

El motor usa `rrule` para decidir en que fechas aplica el horario, y luego combina eso con `start_time`, `end_time` y `slot_duration`.

- `rrule` define los dias activos.
- `start_time` y `end_time` definen la ventana horaria de cada fecha.
- `slot_duration` define el tamanio de cada slot.
- Si `DTSTART` no viene en el string, el motor lo agrega automaticamente segun el rango consultado.

Horario tipico de lunes a viernes por la maniana:

```text
FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
```

Todos los lunes de 09:00 a 13:00:

```json
{
  "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  "rrule": "FREQ=WEEKLY;BYDAY=MO",
  "start_time": "09:00",
  "end_time": "13:00",
  "slot_duration": 30,
  "active": true
}
```

## MCP Tool: `get_available_slots`

**Perfil:** core

Calcula slots disponibles considerando horarios, excepciones y bookings confirmados.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `professional_id` | string | Si | UUID del profesional |
| `date` | string | No | Fecha especifica en `YYYY-MM-DD` |
| `from` | string | No | Inicio del rango en `YYYY-MM-DD` |
| `to` | string | No | Fin del rango en `YYYY-MM-DD` |

Usa `date` para un solo dia, o `from` y `to` para un rango. Maximo: 90 dias.

### Ejemplo: un dia

```js
get_available_slots({
  professional_id: "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  date: "2026-05-05"
})
```

### Ejemplo: rango

```js
get_available_slots({
  professional_id: "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  from: "2026-05-05",
  to: "2026-05-09"
})
```

### Respuesta

```json
[
  {
    "date": "2026-05-05",
    "time": "09:00",
    "duration": 30,
    "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002"
  },
  {
    "date": "2026-05-05",
    "time": "09:30",
    "duration": 30,
    "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002"
  }
]
```

## REST API

REST usa los mismos nombres de parametros que MCP:

```text
GET /api/scheduling/available-slots?professional_id=<uuid>&date=2026-05-05
GET /api/scheduling/available-slots?professional_id=<uuid>&from=2026-05-05&to=2026-05-09
```

## Troubleshooting

### `422 Scheduling entities not found`

El tenant todavia no fue inicializado para scheduling.

Solucion:

```js
setup_scheduling()
```

o:

```text
POST /api/scheduling/setup
```

### Respuesta vacia

Un array vacio es valido cuando:

- el profesional no tiene horarios activos
- el rango no tiene ocurrencias que matcheen el RRULE
- todas las fechas quedaron bloqueadas por excepciones
- todos los slots ya estan reservados

### RRULE invalido

Un RRULE invalido no rompe la request, pero no genera fechas. Verifica primero el formato.

## Compatibilidad legacy

Tenants viejos pueden seguir teniendo nombres legacy como `horarios`, `excepciones_horario`, `turnos`, o field keys como `profesional_id` y `fecha`.

Fyso migra esas entidades de sistema a nombres `_fyso_*` y field keys en ingles. La documentacion nueva usa solo los nombres actuales.

## Preset `clinica`

El preset `clinica` instala entidades de dominio como `doctors`, `patients` y `appointments`.

Esas entidades no son la capa de almacenamiento del scheduling engine. El motor lee solo `_fyso_schedules`, `_fyso_schedule_exceptions` y `_fyso_bookings`.

Si instalas `clinica` y quieres usar `get_available_slots` o `create_booking`, ejecuta `setup_scheduling` y modela el scheduling en las entidades `_fyso_*`, o agrega tu propia capa de sincronizacion/reglas entre las entidades de dominio y el sistema de scheduling.
