# Planes y limites

Fyso ofrece planes con distintos limites de uso.

## Comparacion de planes

| Recurso | Free | Pro (14.99 EUR/mes) | Enterprise |
|---------|------|---------------------|------------|
| Tenants | 1 | 5 | Por contrato |
| Entidades | 3 | Ilimitado | Ilimitado |
| Registros | 500 | 50,000 | Por contrato |
| Sites estaticos | 1 | Ilimitado | Ilimitado |
| Usuarios | 2 | Ilimitado | Ilimitado |
| API rate limit | 60 req/min | 300 req/min | Custom |
| Knowledge Base | No | Si | Si |
| RBAC custom | No | Si | Si |
| Soporte | Comunidad | Email | Dedicado + SLA |

## Plan Free

Incluido sin costo. Ideal para probar la plataforma o proyectos pequenos.

**Limites:**
- Hasta 3 entidades
- Hasta 500 registros totales (sumando todas las entidades)
- 1 site estatico
- 2 usuarios del tenant

Cuando se alcanza un limite, la operacion se rechaza con un mensaje descriptivo.

## Plan Pro

Plan completo sin restricciones de uso.

**Incluye:**
- Entidades ilimitadas
- Registros ilimitados
- Sites estaticos ilimitados
- Usuarios ilimitados

## Plan Beta

Acceso completo durante la fase beta de Fyso. Mismos limites que Pro.

## Plan Enterprise

Para empresas que necesitan aislamiento total, SLA dedicado o despliegue en su propia infraestructura.

**Incluye:**
- Instancia dedicada en Azure/AWS del cliente
- SLA personalizado
- Soporte dedicado
- Rate limits custom
- Backup y recovery gestionado

Contacto: enterprise@fyso.dev

## Uso y quotas (v1.10.0)

El uso se puede consultar via API (`GET /api/usage`) o MCP (`get_usage`).

Cuando se excede un limite:
- La operacion se rechaza con HTTP 402 (Payment Required)
- El mensaje indica el limite alcanzado y sugiere upgrade
- Los agentes MCP reciben el mismo mensaje y pueden informar al usuario

## Verificar uso actual

El uso se puede consultar desde el panel admin. Muestra:
- Plan actual
- Entidades: usadas / limite
- Registros: usados / limite
- Sites: usados / limite
- Usuarios: usados / limite
