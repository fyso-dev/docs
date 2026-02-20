# Fyso Documentation

Fyso es una plataforma para construir aplicaciones de negocio a traves de agentes de IA (via MCP) o un panel web. De conversacion a app publicada.

## Quick Start

1. [Primeros pasos](getting-started/quick-start.md) -- Tu primera app en 5 minutos
2. [Conceptos clave](getting-started/concepts.md) -- Tenants, entidades, campos, registros, reglas
3. [Configurar MCP](getting-started/mcp-setup.md) -- Conectar agentes de IA a Fyso

## Seccion por seccion

| Seccion | Descripcion |
|---------|-------------|
| [Entidades](entities/) | Crear, configurar y publicar entidades |
| [Registros](records/) | CRUD, filtros, relaciones y busqueda semantica |
| [Reglas de negocio](business-rules/) | Compute, validate, action -- DSL completo |
| [Knowledge Base](knowledge-base/) | RAG: ingerir documentos, busqueda semantica |
| [PDF](pdf/) | Plantillas pdfme y generacion de documentos |
| [Facturacion](billing/) | Planes Free / Pro / Enterprise, limites, Stripe |
| [Deploy](deployment/) | Sites estaticos, Docker, GitHub Actions |
| [API](api/) | REST API, referencia MCP (85 tools), safety annotations |
| [Turnos](scheduling/) | Disponibilidad, reservas, horarios |
| [Admin](admin/) | Usuarios, RBAC, apps, import/export |

## Novedades v1.10.0

- **85 MCP tools** con safety annotations (readOnlyHint, destructiveHint)
- **Knowledge Base (RAG)** -- Ingerir documentos y buscar con semantica
- **RBAC** -- Roles custom con permisos granulares por entidad
- **Open Core** -- Arquitectura de plugin @fyso/pro para features premium
- **Enterprise Dedicated** -- Despliegue en Docker en infraestructura del cliente
- **Superadmin** -- Panel de gestion de la plataforma
- **API Management** -- OpenAPI 3.1, rate limiting por plan, dashboard de uso
- **Embedding Provider** -- Proveedor de embeddings configurable (OpenAI, Ollama, etc.)
- **Marketplace ready** -- Manifests para Anthropic, Smithery, Cursor, Cline

## Audiencia

Esta documentacion sirve para dos audiencias:

- **Agentes de IA usando MCP** -- Nombres exactos de tools, parametros, tipos, respuestas esperadas
- **Humanos usando el panel web** -- Guias claras con ejemplos y flujos de trabajo
