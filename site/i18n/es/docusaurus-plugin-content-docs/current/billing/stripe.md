# Stripe y pagos

La facturacion de Fyso se gestiona a traves de Stripe.

## Flujo de suscripcion

1. El usuario elige el plan Pro desde el panel admin
2. Se crea una sesion de Stripe Checkout
3. El usuario completa el pago en Stripe
4. Fyso recibe el webhook y actualiza el plan del tenant
5. Los limites se aplican inmediatamente

## Portal de clientes

Los usuarios con suscripcion activa pueden acceder al portal de Stripe para:

- Ver facturas y recibos
- Actualizar metodo de pago
- Cancelar suscripcion

## Webhooks

Fyso procesa los siguientes eventos de Stripe:

- `checkout.session.completed` -- Suscripcion nueva completada
- `customer.subscription.updated` -- Cambios en la suscripcion
- `customer.subscription.deleted` -- Suscripcion cancelada
- `invoice.payment_failed` -- Pago fallido

## Configuracion (admin)

Variables de entorno requeridas:

| Variable | Descripcion |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto para verificar webhooks |
| `STRIPE_PRICE_ID` | ID del precio del plan Pro |
