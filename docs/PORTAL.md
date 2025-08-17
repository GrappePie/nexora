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
