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
Antes de desplegar, asegúrate de definir las credenciales de los proveedores de
pago.

### Variables de entorno

- `STRIPE_API_KEY`: clave privada de Stripe.
- `STRIPE_WEBHOOK_SECRET`: secreto para validar los webhooks de Stripe.
- `MP_ACCESS_TOKEN`: token de acceso de Mercado Pago.
- `MP_WEBHOOK_SECRET`: secreto para validar los webhooks de Mercado Pago.

### Webhooks

Registra la URL `https://<tu-dominio>/portal/api/billing/webhook` en los
paneles de Stripe y Mercado Pago para recibir notificaciones de pago.
