# Planes y limites

Fyso ofrece planes con distintos limites de uso. El plan pertenece al builder (adminUser), no al tenant: un builder puede crear multiples tenants bajo un mismo plan.

## Comparacion de planes

| Recurso | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Entidades | 3 | Ilimitado | Ilimitado |
| Registros | 500 | Ilimitado | Ilimitado |
| Sites estaticos | 1 | Ilimitado | Ilimitado |
| Usuarios | 2 | Ilimitado | Ilimitado |
| Storage | 100 MB | 10 GB | Custom |
| API requests/mes | 10.000 | 1.000.000 | Custom |
| Rate limit API | 60 req/min | 300 req/min | 600 req/min |
| Dominio personalizado | No | Si | Si |
| Deployment dedicado | No | No | Si |

## Plan Free

Incluido sin costo. Ideal para probar la plataforma o proyectos pequenos.

**Limites:**
- Hasta 3 entidades
- Hasta 500 registros totales (sumando todas las entidades)
- 1 site estatico
- 2 usuarios del tenant
- 10.000 API requests por mes
- Rate limit: 60 req/min por API key

Cuando se alcanza un limite, la operacion se rechaza con `HTTP 402 Payment Required` y un mensaje descriptivo.

## Plan Pro

Plan completo para proyectos en produccion.

**Incluye:**
- Entidades ilimitadas
- Registros ilimitados
- Sites estaticos ilimitados
- Usuarios ilimitados
- 1.000.000 API requests por mes
- Rate limit: 300 req/min por API key
- Dominio personalizado para sites estaticos

## Plan Enterprise

Para organizaciones que requieren aislamiento y recursos dedicados.

**Incluye todo lo de Pro, mas:**
- Instancia API dedicada (sin recursos compartidos)
- Rate limits personalizados
- Storage personalizado
- SLA y soporte prioritario

## Respuesta al superar un limite

```json
{
  "success": false,
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "Has alcanzado el limite de 3 entidades del plan Free. Actualiza a Pro."
  }
}
```

Codigo HTTP: `402 Payment Required`

## Rate limiting

Los rate limits se aplican por API key (o por tenant para autenticacion JWT):

- **Headers de respuesta:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Policy`
- Al superar el limite: `HTTP 429 Too Many Requests`

Ademas del rate limit por API key, existe un rate limit de 200 req/min por tenant en las rutas de entidades, metadata, generacion y reglas.

## Verificar uso actual

```bash
curl -H "Authorization: Bearer $FYSO_API_KEY" \
  "https://api.fyso.dev/api/usage"
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "plan": "free",
    "period": "2026-02",
    "entities": { "used": 2, "limit": 3, "pct": 67 },
    "records": { "used": 120, "limit": 500, "pct": 24 },
    "api_requests": { "used": 3500, "limit": 10000, "pct": 35 },
    "storage_bytes": { "used": 5242880, "limit": 104857600, "pct": 5 }
  }
}
```

## Actualizar plan

Desde el panel web: **Billing** > **Upgrade to Pro**.

O desde Stripe directamente si ya tienes una suscripcion activa.
