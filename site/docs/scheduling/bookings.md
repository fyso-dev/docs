# Bookings

## MCP Tool: `create_booking`

**Profile:** core

Creates a booking after validating that the requested slot is available.

The booking is stored in `_fyso_bookings` with `status = "confirmed"`.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `professional_id` | string | Yes | Professional UUID |
| `patient_id` | string | Yes | Patient/client UUID |
| `date` | string | Yes | Date in `YYYY-MM-DD` |
| `time` | string | Yes | Time in `HH:MM` |
| `duration` | number | No | Duration in minutes. Defaults to the schedule slot size |
| `notes` | string | No | Optional notes |

### Example

```js
create_booking({
  professional_id: "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  patient_id: "1f8f3577-365a-4e28-aa41-88e8cb4a351e",
  date: "2026-05-05",
  time: "10:00",
  notes: "Routine checkup"
})
```

### Internal Flow

1. Validates request shape and UUID/date/time formats.
2. Checks whether scheduling entities exist for the tenant.
3. Computes current availability for the requested slot.
4. Creates a record in `_fyso_bookings` with `status = "confirmed"` if the slot is still available.
5. Rejects the request if the slot is missing or already taken.

### Successful Response

```json
{
  "success": true,
  "data": {
    "id": "uuid-del-booking",
    "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
    "patient_id": "1f8f3577-365a-4e28-aa41-88e8cb4a351e",
    "date": "2026-05-05",
    "time": "10:00",
    "duration": 30,
    "status": "confirmed",
    "notes": "Routine checkup"
  }
}
```

### Common Errors

Slot not available:

```json
{
  "success": false,
  "error": "Slot 2026-05-05 10:00 is not available for this professional"
}
```

Scheduling not initialized:

```json
{
  "success": false,
  "error": "Scheduling entities not found. Run setup_scheduling (MCP) or POST /scheduling/setup to initialise _fyso_schedules, _fyso_schedule_exceptions, and _fyso_bookings."
}
```

## REST API

Create booking:

```text
POST /api/scheduling/bookings
Authorization: Bearer TOKEN
Content-Type: application/json
```

Request body:

```json
{
  "professional_id": "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  "patient_id": "1f8f3577-365a-4e28-aa41-88e8cb4a351e",
  "date": "2026-05-05",
  "time": "10:00",
  "duration": 30,
  "notes": "Routine checkup"
}
```

Availability lookup:

```text
GET /api/scheduling/available-slots?professional_id=<uuid>&date=2026-05-05
```

## Cancellation

There is no dedicated cancel-booking tool yet.

To cancel a booking, update the `_fyso_bookings` record and set:

```json
{ "status": "cancelled" }
```

## Notes

- `create_booking` uses English parameter names in both MCP and REST.
- The engine does not write to domain entities such as `appointments`.
- If your tenant uses the `clinica` preset, treat `_fyso_bookings` as scheduling-engine state and add your own sync to `appointments` if your product flow needs both.
