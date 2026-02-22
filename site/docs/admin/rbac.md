# Roles y permisos (RBAC)

Fyso implementa control de acceso basado en roles (RBAC) para los usuarios del tenant.

## Roles del sistema

Cada tenant tiene 3 roles predefinidos que no se pueden eliminar:

| Rol | Descripcion |
|-----|-------------|
| `admin` | Acceso completo. Puede gestionar entidades, reglas, usuarios y configuracion |
| `editor` | Puede crear y editar registros. Sin acceso a configuracion del tenant |
| `viewer` | Solo lectura. No puede crear, editar ni eliminar registros |

## Permisos

Los permisos se definen como un objeto JSON con acciones sobre recursos:

```json
{
  "records:create": true,
  "records:read": true,
  "records:update": true,
  "records:delete": false,
  "entities:manage": false,
  "rules:manage": false,
  "users:manage": false
}
```

Cuando un usuario tiene multiples roles, los permisos se fusionan con semantica de union (un `true` en cualquier rol concede el permiso).

## Gestionar roles desde MCP

### Listar roles

```
list_roles()
```

Retorna los roles del tenant con sus permisos.

### Crear un rol personalizado

```
create_role({
  name: "soporte",
  description: "Acceso de lectura y edicion de registros, sin borrado",
  permissions: {
    "records:create": true,
    "records:read": true,
    "records:update": true,
    "records:delete": false
  }
})
```

### Asignar un rol a un usuario

```
assign_role({
  userId: "uuid-del-usuario",
  roleId: "uuid-del-rol"
})
```

### Revocar un rol

```
revoke_role({
  userId: "uuid-del-usuario",
  roleId: "uuid-del-rol"
})
```

## Gestionar roles desde el panel web

Ir a **Settings** > **Roles** para ver, crear y editar roles.

Ir a **Users** > seleccionar usuario > **Roles** para asignar/revocar.

## Jerarquia de roles

Los roles del sistema tienen una jerarquia implícita:

```
owner > admin > editor > viewer
```

El `owner` es el adminUser que creo el tenant y tiene acceso total irrevocable.

Las rutas de management del tenant aplican el rol minimo requerido para cada operacion:

- Gestionar entidades y reglas: `admin`
- Crear/editar registros: `editor`
- Leer registros: `viewer`

## REST API con RBAC

Los endpoints de la REST API respetan los permisos del token JWT usado. Un token de usuario con rol `viewer` solo puede hacer `GET`; intentar un `POST` retorna `403 Forbidden`.

```bash
# Login como usuario del tenant
curl -X POST "https://api.fyso.dev/api/auth/tenant/login" \
  -H "X-Tenant-ID: mi-empresa" \
  -d '{"email":"editor@empresa.com","password":"..."}'

# Usar el token JWT resultante
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://api.fyso.dev/api/entities/clientes/records"
```

## Ejemplo: setup de equipo con roles diferentes

```
# Crear rol de soporte
create_role({
  name: "soporte",
  permissions: {
    "records:read": true,
    "records:update": true
  }
})

# Crear usuario
create_user({ email: "soporte@empresa.com", password: "..." })

# Asignar rol
assign_role({ userId: "...", roleId: "..." })
```
