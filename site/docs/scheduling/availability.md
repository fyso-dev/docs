# Availability and Schedules

Fyso's scheduling engine calculates availability from three dedicated system entities:

- `_fyso_schedules`
- `_fyso_schedule_exceptions`
- `_fyso_bookings`

These entities are separate from domain entities such as `doctors`, `patients`, or `appointments`.

## Setup

Run `setup_scheduling` once per tenant, or call `POST /api/scheduling/setup`.

The setup is idempotent. It creates and publishes the three `_fyso_*` entities if they do not exist.

## Required Entities

### `_fyso_schedules`

Regular schedules for each professional.

| `fieldKey` | `fieldType` | Required | Description |
|------------|-------------|----------|-------------|
| `professional_id` | `text` | Yes | UUID of the professional |
| `rrule` | `text` | Yes | RFC 5545 RRULE string |
| `start_time` | `text` | No | Start time in `HH:MM`. Defaults to `09:00` if missing |
| `end_time` | `text` | No | End time in `HH:MM`. Defaults to `17:00` if missing |
| `slot_duration` | `number` | No | Slot duration in minutes. Defaults to `30` if missing |
| `active` | `boolean` | No | Whether the schedule is active. Defaults to `true` |

Example:

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

Blocked days or special-hours overrides.

| `fieldKey` | `fieldType` | Required | Description |
|------------|-------------|----------|-------------|
| `professional_id` | `text` | Yes | UUID of the professional |
| `date` | `date` | Yes | Exception date in `YYYY-MM-DD` |
| `type` | `select` | Yes | `blocked` or `special_hours` |
| `start_time` | `text` | No | Required when `type = "special_hours"` |
| `end_time` | `text` | No | Required when `type = "special_hours"` |

Blocked-day example:

```json
{
  "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  "date": "2026-05-01",
  "type": "blocked"
}
```

Special-hours example:

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

Confirmed bookings already taken by the engine into account.

| `fieldKey` | `fieldType` | Required | Description |
|------------|-------------|----------|-------------|
| `professional_id` | `text` | Yes | UUID of the professional |
| `patient_id` | `text` | Yes | UUID of the patient/client |
| `date` | `date` | Yes | Booking date in `YYYY-MM-DD` |
| `time` | `text` | Yes | Booking time in `HH:MM` |
| `duration` | `number` | No | Duration in minutes |
| `status` | `select` | Yes | `confirmed`, `cancelled`, or `completed` |
| `notes` | `textarea` | No | Optional notes |

## RRULE Notes

The engine reads recurring days from `rrule`, then combines that with `start_time`, `end_time`, and `slot_duration`.

- `rrule` chooses which dates are active.
- `start_time` and `end_time` define the time window for each matching date.
- `slot_duration` defines the size of each generated slot.
- If `DTSTART` is omitted, the engine prepends one automatically for the query range.

Typical weekday morning schedule:

```text
FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
```

Every Monday from 09:00 to 13:00:

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

**Profile:** core

Calculates available slots considering schedules, exceptions, and confirmed bookings.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `professional_id` | string | Yes | Professional UUID |
| `date` | string | No | Specific date in `YYYY-MM-DD` |
| `from` | string | No | Range start in `YYYY-MM-DD` |
| `to` | string | No | Range end in `YYYY-MM-DD` |

Provide `date` for a single day, or `from` and `to` for a range. Maximum range: 90 days.

### Example: Single Day

```js
get_available_slots({
  professional_id: "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  date: "2026-05-05"
})
```

### Example: Date Range

```js
get_available_slots({
  professional_id: "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  from: "2026-05-05",
  to: "2026-05-09"
})
```

### Response

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

REST uses the same parameter names as MCP:

```text
GET /api/scheduling/available-slots?professional_id=<uuid>&date=2026-05-05
GET /api/scheduling/available-slots?professional_id=<uuid>&from=2026-05-05&to=2026-05-09
```

## Troubleshooting

### `422 Scheduling entities not found`

The tenant has not been initialized for scheduling yet.

Fix:

```js
setup_scheduling()
```

or:

```text
POST /api/scheduling/setup
```

### Empty array response

An empty array is valid when:

- the professional has no active schedules
- the date range has no matching RRULE occurrences
- all generated slots are blocked by exceptions
- all generated slots are already booked

### Invalid RRULE

Invalid RRULE strings do not crash the request, but they produce no generated dates. Verify the rule format first.

## Legacy Compatibility

Older tenants may still contain legacy names such as `horarios`, `excepciones_horario`, `turnos`, or field keys like `profesional_id` and `fecha`.

Fyso migrates those legacy system entities to `_fyso_*` names and English field keys. New documentation uses only the current names.

## `clinica` Preset

The `clinica` preset installs domain entities such as `doctors`, `patients`, and `appointments`.

Those entities are not the scheduling engine's storage layer. The engine reads only `_fyso_schedules`, `_fyso_schedule_exceptions`, and `_fyso_bookings`.

If you install `clinica` and want to use `get_available_slots` or `create_booking`, run `setup_scheduling` and model the scheduling data in the `_fyso_*` entities, or add your own synchronization/business-rule layer between domain records and the scheduling system.
