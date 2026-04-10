# Reservas

## MCP Tool: `create_booking`

**Perfil:** core

Crea una reserva despues de validar que el slot siga disponible.

La reserva se guarda en `_fyso_bookings` con `status = "confirmed"`.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `professional_id` | string | Si | UUID del profesional |
| `patient_id` | string | Si | UUID del paciente/cliente |
| `date` | string | Si | Fecha en `YYYY-MM-DD` |
| `time` | string | Si | Hora en `HH:MM` |
| `duration` | number | No | Duracion en minutos. Default: tamanio de slot del horario |
| `notes` | string | No | Notas opcionales |

### Ejemplo

```js
create_booking({
  professional_id: "9d5e3e28-6eb8-49e3-8a34-1a6b7d91f002",
  patient_id: "1f8f3577-365a-4e28-aa41-88e8cb4a351e",
  date: "2026-05-05",
  time: "10:00",
  notes: "Routine checkup"
})
```

### Flujo interno

1. Valida UUIDs y formatos de fecha/hora.
2. Verifica que el tenant tenga inicializadas las entidades de scheduling.
3. Calcula disponibilidad actual para el slot pedido.
4. Crea un registro en `_fyso_bookings` con `status = "confirmed"` si el slot sigue libre.
5. Rechaza la request si el slot no existe o ya fue tomado.

### Respuesta exitosa

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

### Errores comunes

Slot no disponible:

```json
{
  "success": false,
  "error": "Slot 2026-05-05 10:00 is not available for this professional"
}
```

Scheduling no inicializado:

```json
{
  "success": false,
  "error": "Scheduling entities not found. Run setup_scheduling (MCP) or POST /scheduling/setup to initialise _fyso_schedules, _fyso_schedule_exceptions, and _fyso_bookings."
}
```

## REST API

Crear booking:

```text
POST /api/scheduling/bookings
Authorization: Bearer TOKEN
Content-Type: application/json
```

Body:

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

Consulta de disponibilidad:

```text
GET /api/scheduling/available-slots?professional_id=<uuid>&date=2026-05-05
```

## Cancelacion

Todavia no hay una tool dedicada para cancelar reservas.

Para cancelar, actualiza el registro en `_fyso_bookings` y pon:

```json
{ "status": "cancelled" }
```

## Notas

- `create_booking` usa nombres de parametros en ingles tanto en MCP como en REST.
- El motor no escribe en entidades de dominio como `appointments`.
- Si tu tenant usa el preset `clinica`, trata `_fyso_bookings` como estado interno del scheduling engine y agrega tu propia sincronizacion hacia `appointments` si tu flujo de producto necesita ambos.
