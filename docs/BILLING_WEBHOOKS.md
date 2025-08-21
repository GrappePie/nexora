# Webhooks de facturación

El backend expone un único endpoint para recibir eventos de facturación de los proveedores soportados.

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
