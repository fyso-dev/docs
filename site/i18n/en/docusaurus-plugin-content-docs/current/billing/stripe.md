# Stripe and Payments

Fyso billing is managed through Stripe.

## Subscription Flow

1. The user chooses the Pro plan from the admin panel
2. A Stripe Checkout session is created
3. The user completes the payment on Stripe
4. Fyso receives the webhook and updates the tenant's plan
5. Limits are applied immediately

## Customer Portal

Users with an active subscription can access the Stripe portal to:

- View invoices and receipts
- Update payment method
- Cancel subscription

## Webhooks

Fyso processes the following Stripe events:

- `checkout.session.completed` -- New subscription completed
- `customer.subscription.updated` -- Subscription changes
- `customer.subscription.deleted` -- Subscription canceled
- `invoice.payment_failed` -- Failed payment

## Configuration (admin)

Required environment variables:

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Secret for verifying webhooks |
| `STRIPE_PRICE_ID` | Price ID for the Pro plan |
