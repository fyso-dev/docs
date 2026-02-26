---
sidebar_position: 8
---

# Invitaciones de plataforma

Las invitaciones de plataforma permiten que los admins del tenant inviten nuevos usuarios a registrarse en la plataforma. Cada usuario invitado crea su propia cuenta de admin al aceptar.

Esto es independiente de las [invitaciones de usuarios del tenant](./users.md) — las invitaciones de plataforma crean nuevas cuentas de admin, mientras que las invitaciones de tenant agregan usuarios a un tenant existente.

## Cuota

Cada admin puede enviar hasta **5 invitaciones activas** a la vez. Las invitaciones vencen a los **7 dias**.

## Endpoints REST

### Enviar una invitacion

```bash
POST /api/platform/invitations
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "email": "nuevousuario@ejemplo.com"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "inviteUrl": "https://app.fyso.dev/signup/invited?token=..."
  }
}
```

Se envia un email de invitacion automaticamente. El `inviteUrl` tambien puede compartirse manualmente.

**Errores:**

| Codigo | Error | Descripcion |
|--------|-------|-------------|
| `400` | `EMAIL_REQUIRED` | Email faltante o invalido |
| `409` | — | El email ya tiene una invitacion activa |
| `422` | — | Cuota agotada (5 invitaciones activas) u otro error de validacion |

### Listar mis invitaciones

```bash
GET /api/platform/invitations
Authorization: Bearer <token-admin>
```

Devuelve todas las invitaciones activas enviadas por el admin autenticado, con el uso de cuota.

### Revocar una invitacion

```bash
DELETE /api/platform/invitations/:id
Authorization: Bearer <token-admin>
```

Invalida el token de invitacion de forma inmediata.

---

## Aceptar una invitacion (publico)

### Validar un token

```bash
GET /api/platform/invitations/:token
```

Devuelve una vista previa de la invitacion antes de que el usuario se registre. Devuelve `410 Gone` si el token vencio.

### Aceptar y registrarse

```bash
POST /api/platform/invitations/:token/accept
Content-Type: application/json

{
  "name": "Nuevo Usuario",
  "password": "contraseñasegura"
}
```

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `name` | string | Si | Nombre completo (minimo 2 caracteres) |
| `password` | string | Si | Contrasena (minimo 8 caracteres) |

El usuario queda autenticado de forma inmediata al aceptar.

---

## Panel de administracion

Ve a **Plataforma → Invitaciones** en el panel para gestionar invitaciones:

- Enviar nuevas invitaciones por email
- Ver el estado de todas las invitaciones activas (pendiente / aceptada / vencida)
- Revocar invitaciones pendientes
