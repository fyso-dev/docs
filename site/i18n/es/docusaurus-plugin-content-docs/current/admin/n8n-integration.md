---
sidebar_position: 9
---

# Integracion con n8n

Fyso incluye un paquete oficial de nodo para n8n (`n8n-nodes-fyso`) con soporte completo de CRUD y triggers por webhook.

## Instalacion

En tu instancia de n8n, ve a **Configuracion → Nodos de comunidad** e instala:

```
n8n-nodes-fyso
```

O instalalo manualmente en el directorio de n8n:

```bash
npm install n8n-nodes-fyso
```

## Credenciales

Crea credenciales **Fyso API** en n8n:

| Campo | Descripcion |
|-------|-------------|
| **API Key** | Tu llave de admin de Fyso (`fyso_adm_*`) o token de usuario |
| **API URL** | URL base de tu API de Fyso (por ejemplo, `https://api.fyso.dev`) |

## Nodo Fyso

El nodo **Fyso** admite 7 operaciones:

| Operacion | Descripcion |
|-----------|-------------|
| `List Tenants` | Listar todos los tenants accesibles con la llave API |
| `List Entities` | Listar entidades de metadata para un tenant |
| `Create Record` | Crear un nuevo registro en una entidad |
| `Get Record` | Obtener un registro por ID |
| `List Records` | Listar registros de una entidad (con filtros) |
| `Update Record` | Actualizar un registro por ID |
| `Delete Record` | Eliminar un registro por ID |

## Nodo Fyso Trigger

El nodo **Fyso Trigger** escucha eventos de entidades via webhooks de Fyso.

| Evento | Descripcion |
|--------|-------------|
| `record.created` | Se dispara cuando se crea un registro en la entidad |
| `record.updated` | Se dispara cuando se actualiza un registro |
| `record.deleted` | Se dispara cuando se elimina un registro |

### Configuracion

1. Agrega un nodo **Fyso Trigger** al inicio del workflow
2. Selecciona el **Evento** (por ejemplo, `Record Created`)
3. Define la **Entidad** a observar (por ejemplo, `pedidos`)
4. Activa el workflow — n8n registra automaticamente una suscripcion de webhook en Fyso

Al activar, n8n llama a `POST /api/webhooks/subscriptions`. Al desactivar, la suscripcion se elimina automaticamente.

## Notas

- El nodo Fyso Trigger requiere que el tenant de Fyso admita webhooks (disponible en todos los planes)
- Usa una llave de admin (`fyso_adm_*`) para operaciones de gestion, o un token de usuario para operaciones con contexto de tenant
- Para acceso publico de solo lectura, usa una [llave publica](./anonymous-keys.md) con scope `records:read`
