# Bookings

## MCP Tool: `create_booking`

**Profile:** core

Creates a booking after validating that the slot is available.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `profesional_id` | string | Yes | Professional's UUID |
| `paciente_id` | string | Yes | Patient/client UUID |
| `fecha` | string | Yes | Date (YYYY-MM-DD) |
| `hora` | string | Yes | Time (HH:MM) |
| `duracion` | number | No | Duration in minutes. Default: professional's slot duration |
| `notas` | string | No | Optional notes |

### Internal Flow

1. Queries available slots for the date
2. Verifies that `fecha + hora` is in the available slots list
3. If available, creates a record in the `turnos` entity with `estado = "confirmado"`
4. If not available, returns an error

### Example

```
create_booking({
  profesional_id: "uuid-del-profesional",
  paciente_id: "uuid-del-paciente",
  fecha: "2026-02-20",
  hora: "10:00",
  notas: "Control de rutina"
})
```

### Successful Response

```json
{
  "success": true,
  "message": "Booking created for 2026-02-20 at 10:00",
  "record": {
    "id": "uuid-del-turno",
    "profesional_id": "uuid",
    "paciente_id": "uuid",
    "fecha": "2026-02-20",
    "hora": "10:00",
    "duracion": 30,
    "estado": "confirmado",
    "notas": "Control de rutina"
  }
}
```

### Error: Slot Not Available

```json
{
  "success": false,
  "error": "Slot 2026-02-20 10:00 is not available for this professional"
}
```

## Cancel an Appointment

There is no dedicated tool for canceling. Update the record directly:

```
update_record({
  entityName: "turnos",
  recordId: "uuid-del-turno",
  data: { estado: "cancelado" }
})
```

## REST API

The REST endpoint for availability:

```
GET /api/scheduling/available-slots?profesional_id=uuid&fecha=2026-02-20
```

Headers: `Authorization: Bearer TOKEN`
