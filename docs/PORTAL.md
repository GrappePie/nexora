## Funcionamiento local y rol del portal

El portal Nexora solo es necesario para la gestión de licencias, suscripciones y administración de usuarios/dispositivos. La provisión y operación diaria del sistema Nexora POS se realiza en la red local (LAN), sin requerir acceso al portal ni conexión a Internet, salvo para la verificación y renovación de la licencia.

## Dominios

- **Landing**: `https://nexora.grappepie.com`
- **Portal**: `https://app.nexora.grappepie.com`
- **Aprobación pública**: `https://aprobar.nexora.grappepie.com/approve/<token>`

## Módulos del portal

- **Productos**: catálogo y detalles.
- **Suscripciones**: plan/módulos/asientos; upgrade/downgrade/cancelación.
- **Pagos**: método de pago, facturas (si aplica).
- **Instalación**: descargas (Windows) / comandos (Ubuntu), **código de provisión** + **QR** para el host.
- **Dispositivos**: clientes unidos (revocar, renombrar).
- **Usuarios/Roles**: invitar miembros, permisos por rol.
- **Soporte**: tickets, guía rápida.

## APIs portal ↔ host (concepto)

- `POST /portal/api/licenses/provision` → entrega licencia firmada.
- `POST /portal/api/licenses/renew` → nueva licencia (al renovar plan).
- `POST /portal/api/devices/join` → valida `join_token`.

## Seguridad

- Firmas **Ed25519** (portal crea, host verifica).
- Tokens de provisión/join 15 min, un solo uso.
- Revocación desde portal; host aplica al reconectar.

## Despliegue de facturación

El backend del portal expone el módulo de facturación en `/portal/api/billing`.
Antes de desplegar, define las credenciales del proveedor de pago
seleccionado y la variable `BILLING_PROVIDER` (`stripe`, `mercadopago` o
`paddle`).

### Variables de entorno

- `STRIPE_API_KEY` y `STRIPE_WEBHOOK_SECRET`.
- `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET`.
- `PADDLE_API_KEY` y `PADDLE_WEBHOOK_SECRET`.

### Webhooks

Registra la URL `https://<tu-dominio>/portal/api/billing/webhook` en el
panel del proveedor seleccionado para recibir notificaciones de pago.

### Páginas de suscripción

El frontend incluye una vista en `/billing` para administrar los planes. Solo los usuarios con rol `admin` pueden acceder.
La página usa el token de NextAuth para invocar la API del portal:

- `POST /portal/api/billing/subscribe`
- `POST /portal/api/billing/cancel`
- `GET /portal/api/billing/subscription?customer_id=...&plan_id=...`

#### Configuración

- Establece `NEXT_PUBLIC_API_BASE` apuntando al backend.
- Asegúrate de que el usuario autenticado tenga el rol `admin`.

#### Uso

1. Abrir `/billing` en el portal.
2. Capturar `customer_id` y `plan_id` del cliente.
3. Utilizar **Suscribirse** para activar el plan o **Cancelar** para finalizarlo.
