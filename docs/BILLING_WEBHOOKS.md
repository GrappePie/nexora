# Webhooks de facturación

El backend expone endpoints para **gestionar suscripciones** y un único endpoint para recibir eventos de facturación de los proveedores soportados.

## Endpoints de suscripción

- `GET  /portal/api/billing/subscription?customer_id=<id>&plan_id=<id>`
- `POST /portal/api/billing/subscribe` *(body: `{customer_id, plan_id}`)*
- `POST /portal/api/billing/cancel` *(body: `{customer_id, plan_id}`)*

La vista `/billing` del portal (React/Next.js) utiliza estos endpoints para dar de alta, cancelar y consultar el estado de las suscripciones.

## Webhook

```
POST /portal/api/billing/webhook
```

Cada proveedor envía un encabezado de firma y un payload JSON. La firma se valida con la clave configurada en las variables de entorno.

## Stripe

1. Crea un webhook en el panel de Stripe apuntando a la URL anterior.
2. Selecciona eventos como `customer.subscription.deleted`.
3. Copia el secreto del webhook y colócalo en `STRIPE_WEBHOOK_SECRET`.
4. Stripe enviará la firma en el encabezado `Stripe-Signature`.

## Mercado Pago

1. Configura la **URL de notificación** con `https://<tu-dominio>/portal/api/billing/webhook`.
2. Define un token secreto y guárdalo en `MERCADOPAGO_WEBHOOK_SECRET`.
3. Mercado Pago firma la solicitud en el encabezado `X-Signature`.

## Paddle

1. En el panel de Paddle, agrega un webhook hacia la misma URL.
2. Establece el secreto en `PADDLE_WEBHOOK_SECRET`.
3. Paddle envía el valor de la firma en `X-Signature`.

En todos los casos, cuando se recibe un evento válido se actualiza el estado de la suscripción en la tabla `subscriptions`.
