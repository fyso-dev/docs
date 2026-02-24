# API Management

La pagina de **API Management** (`/settings/api-management`) permite a administradores del tenant crear y gestionar definiciones de APIs de plataforma, incluyendo las API keys asociadas a cada una.

> **Requiere:** rol `owner` o `admin` en el tenant.

---

## Que es una Platform API

Una **Platform API** es una definicion de superficie de acceso programatico. Agrupa:

- Un **nombre** y **slug** identificador.
- Los **roles** del tenant que pueden usar esa API (ej: `admin`, `member`, `viewer`).
- Una **matriz de permisos**: que operaciones (`read`, `create`, `update`, `delete`) puede ejecutar cada rol sobre cada entidad.

Las API keys se emiten *por rol* dentro de una Platform API. Una key hereda los permisos definidos en la matriz para ese rol.

---

## Acceder a la pagina

1. Ir a **Settings** en la barra lateral.
2. Bajo la seccion **Develop**, hacer clic en **API Management**.
3. URL directa: `/settings/api-management`

---

## Lista de APIs

La pagina muestra una tabla con todas las APIs del tenant:

| Columna | Descripcion |
|---------|-------------|
| Name | Nombre de la API |
| Slug | Identificador unico (URL-safe) |
| Roles | Roles habilitados para esta API |
| Entities | Cantidad de entidades en la matriz de permisos |
| Status | Activa / Inactiva |
| Actions | Editar / Eliminar |

Cada fila es expandible: al hacer clic muestra las **API keys** emitidas para esa API (ver seccion Keys mas abajo).

---

## Crear una API

1. Hacer clic en **Create API** (boton superior derecho).
2. Completar el formulario:

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| Name | texto | Si | Nombre descriptivo (ej: "Mobile App API") |
| Slug | texto | Si | Auto-generado desde el nombre. Editable. Solo letras, numeros y guiones. |
| Roles | multi-select | Si | Roles del tenant que pueden usar esta API |
| Permission Matrix | tabla | No | Entidades y operaciones permitidas por rol |

3. En la **Permission Matrix**:
   - Hacer clic en **Add entity** para agregar una entidad especifica.
   - Seleccionar `*` (wildcard) para dar acceso a todas las entidades.
   - Marcar los checkboxes: **R** (read), **C** (create), **U** (update), **D** (delete) por cada rol y entidad.
4. Hacer clic en **Create**.

### Slug auto-generado

El slug se genera automaticamente a partir del nombre (minusculas, espacios reemplazados por guiones). Se puede editar manualmente antes de crear. Una vez creada la API, el slug no se puede modificar.

---

## Editar una API

1. En la tabla, hacer clic en el icono de edicion (lapiz) de la API.
2. Se abre el mismo formulario de creacion, pre-llenado.
3. Se puede modificar: nombre, roles habilitados y la matriz de permisos.
4. El slug **no es editable** despues de la creacion.
5. Hacer clic en **Save**.

---

## Eliminar una API

1. Hacer clic en el icono de eliminacion (papelera) de la API.
2. Se muestra un dialogo de confirmacion.
3. **Advertencia:** eliminar una API elimina en cascada todas sus API keys. Las integraciones que usen esas keys dejaran de funcionar inmediatamente.
4. Confirmar para proceder.

---

## Emitir una API Key

Las keys se emiten por API y por rol. Cada key tiene los permisos del rol en esa API.

1. Expandir la fila de una API haciendo clic en ella.
2. Hacer clic en **Issue Key**.
3. Completar el dialogo:

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| Role | select | Si | Rol dentro de la API. Determina los permisos de la key. |
| Label | texto | No | Etiqueta descriptiva (ej: "produccion", "ci-pipeline") |
| TTL | select | No | Tiempo de vida: sin expiracion, 30 dias, 90 dias, 1 año |

4. Hacer clic en **Issue**.

### Revelado unico de la key

Inmediatamente despues de emitir, se muestra el valor completo de la key en formato:

```
fyso_pkey_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Esta es la unica vez que el valor completo es visible.** Copiar la key con el boton **Copy** antes de cerrar el dialogo. Despues de cerrar, solo se muestra el prefijo (primeros 8 caracteres).

---

## Lista de API Keys (por API)

Al expandir una fila de API, se muestra la tabla de keys emitidas:

| Columna | Descripcion |
|---------|-------------|
| Prefix | Primeros 8 caracteres de la key |
| Label | Etiqueta opcional asignada al emitir |
| Role | Rol con el que fue emitida |
| Status | Active / Revoked |
| Last Used | Ultima vez que fue usada en una request |
| Expires | Fecha de expiracion o "Never" |
| Actions | Revocar |

---

## Revocar una API Key

1. En la tabla de keys de una API, hacer clic en **Revoke** junto a la key.
2. La key se desactiva inmediatamente. El estado cambia a **Revoked** en la tabla sin recargar la pagina.
3. Las requests que usen esa key comenzaran a recibir `401 Unauthorized`.

No es posible re-activar una key revocada. Si se necesita acceso nuevamente, emitir una nueva key.

---

## Usar una API Key

Las keys se usan como Bearer token en el header `Authorization` o como `X-API-Key`:

```bash
# Opcion 1: Authorization header
curl -H "Authorization: Bearer fyso_pkey_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "https://api.fyso.dev/api/entities/clientes/records"

# Opcion 2: X-API-Key header
curl -H "X-API-Key: fyso_pkey_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "https://api.fyso.dev/api/entities/clientes/records"
```

Los permisos efectivos de la request seran los definidos en la matriz de la API para el rol de la key.

Para mas detalles sobre la REST API, ver [REST API](../api/rest-api.md).

---

## Endpoints REST (referencia rapida)

La UI consume los siguientes endpoints, disponibles tambien directamente:

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/apis` | Listar APIs del tenant |
| `POST` | `/api/apis` | Crear nueva API |
| `GET` | `/api/apis/:id` | Obtener API por ID |
| `PUT` | `/api/apis/:id` | Actualizar API |
| `DELETE` | `/api/apis/:id` | Eliminar API (cascades keys) |
| `GET` | `/api/apis/:id/keys` | Listar keys de una API |
| `POST` | `/api/apis/:id/keys` | Emitir nueva key |
| `DELETE` | `/api/apis/:id/keys/:keyId` | Revocar key |

> Estos endpoints requieren autenticacion con un token de usuario con rol `owner` o `admin`.

---

## Internacionalizacion

La UI esta disponible en **ingles** y **espanol**. El idioma se selecciona automaticamente segun la configuracion del navegador o el selector de idioma del panel.

---

## Seguridad

- Los valores completos de las keys **nunca se almacenan en texto plano** — solo un hash seguro y el prefijo.
- Las keys solo son visibles en el momento de emision. No hay forma de recuperar el valor original.
- Revocar una key tiene efecto inmediato: no hay periodo de gracia.
- Eliminar una API revoca y elimina todas sus keys de forma irrecuperable.
