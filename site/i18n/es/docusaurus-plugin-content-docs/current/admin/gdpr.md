---
sidebar_position: 14
---

# Cumplimiento RGPD

Fyso proporciona herramientas integradas de cumplimiento RGPD (GDPR) para tenants que utilizan funciones de IA.

## Acuerdo de procesamiento de datos (DPA)

Antes de usar funciones de IA, el propietario del tenant debe aceptar el DPA:

```bash
curl -X POST "https://api.fyso.dev/api/auth/tenants/:id/dpa-accept" \
  -H "Authorization: Bearer OWNER_TOKEN"
```

La aceptacion del DPA se registra con marca de tiempo y direccion IP. Las funciones de IA se bloquean hasta que se acepte el DPA.

## Consentimiento de sesion

Cada sesion de agente puede rastrear si el usuario ha dado consentimiento explicito para el procesamiento de datos con IA:

```bash
curl -X POST "https://api.fyso.dev/api/rgpd/sessions/:sessionId/consent" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"ai_consent": true}'
```

El campo `ai_consent` se almacena en `_fyso_agent_sessions`. Cuando no se otorga el consentimiento, el agente aun puede responder, pero los datos especificos de IA (payloads de depuracion, extraccion de memoria) se suprimen.

## Supresion de datos

Los usuarios pueden solicitar la eliminacion de todos los datos relacionados con IA para una referencia externa especifica (por ejemplo, un numero de telefono o correo electronico):

```bash
curl -X DELETE "https://api.fyso.dev/api/rgpd/users/:externalRef/ai-data" \
  -H "Authorization: Bearer TOKEN"
```

Esto elimina:
- Sesiones del agente y su historial de mensajes
- Datos de memoria del agente asociados a la referencia externa
- Registros de llamadas de IA vinculados a esas sesiones

La operacion se registra en el log de auditoria de consentimiento.

## Log de auditoria de consentimiento

Todos los eventos relacionados con el consentimiento se registran en `_fyso_consent_audit_log`:
- Aceptacion del DPA
- Cambios de consentimiento de sesion
- Solicitudes de supresion de datos

El log de auditoria es inmutable y se retiene con fines de cumplimiento.
