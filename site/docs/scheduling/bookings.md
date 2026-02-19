# Reservas (Bookings)

## MCP Tool: `create_booking`

**Perfil:** core

Crea una reserva validando primero que el slot este disponible.

### Parametros

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `profesional_id` | string | Si | UUID del profesional |
| `paciente_id` | string | Si | UUID del paciente/cliente |
| `fecha` | string | Si | Fecha (YYYY-MM-DD) |
| `hora` | string | Si | Hora (HH:MM) |
| `duracion` | number | No | Duracion en minutos. Default: duracion del slot del profesional |
| `notas` | string | No | Notas opcionales |

### Flujo interno

1. Consulta slots disponibles para la fecha
2. Verifica que `fecha + hora` este en la lista de slots disponibles
3. Si esta disponible, crea un registro en la entidad `turnos` con `estado = "confirmado"`
4. Si no esta disponible, retorna error

### Ejemplo

```
create_booking({
  profesional_id: "uuid-del-profesional",
  paciente_id: "uuid-del-paciente",
  fecha: "2026-02-20",
  hora: "10:00",
  notas: "Control de rutina"
})
```

### Respuesta exitosa

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

### Error: slot no disponible

```json
{
  "success": false,
  "error": "Slot 2026-02-20 10:00 is not available for this professional"
}
```

## Cancelar un turno

No hay tool dedicado para cancelar. Actualizar el registro directamente:

```
update_record({
  entityName: "turnos",
  recordId: "uuid-del-turno",
  data: { estado: "cancelado" }
})
```

## REST API

El endpoint REST para disponibilidad:

```
GET /api/scheduling/available-slots?profesional_id=uuid&fecha=2026-02-20
```

Headers: `Authorization: Bearer TOKEN`
