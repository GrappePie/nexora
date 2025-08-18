### ¿El sistema funciona completamente en local?

Sí. Nexora POS está diseñado para operar en la red local (LAN) del taller. La provisión de dispositivos, operación diaria y conexión de teléfonos/tablets se realiza sin Internet. **Solo la verificación y renovación de la licencia requiere acceso online**; el resto del sistema es local. Si la licencia expira y no puede renovarse online, el sistema entra en modo limitado tras el periodo de gracia.

### ¿Necesito Internet para usarlo?

En la **LAN** funciona sin Internet. El timbrado/envíos quedan en **pendiente** hasta que vuelva la conexión.

### ¿Cómo instalo en el servidor del taller?

Sigue `docs/INSTALL.md`. Requiere Ubuntu 22.04+, Docker y Compose. Luego abre `http://taller.local:3000`.

### ¿Puedo usar teléfonos/tablets?

Sí. En la **misma Wi‑Fi**, abre `http://taller.local:3000` y **Agrega a la pantalla de inicio** (PWA). No requieren ser servidor.

### ¿Cómo aprueba el cliente fuera de la red?

Se genera un link `https://aprobar.nexora.grappepie.com/approve/<token>` que viaja por WhatsApp/Email. Solo esa ruta está expuesta por túnel.

### ¿Qué pasa si se vence la suscripción?

Tras los **días de gracia** definidos, entra en **modo limitado** (sin timbrado/envíos/altas). Al renovar, vuelve a normal.

### ¿Cómo respaldo mis datos?

`docs/BACKUP_RESTORE.md` cubre Postgres (dump diario) y MinIO (lifecycle). Recomendado validar **restore** en una VM aparte.

### ¿Cómo actualizo?

`scripts/update.sh` o `docker compose pull && docker compose up -d`.

### ¿Esto es una app Android/iOS?

No, es una **PWA** (Next.js). Se instala desde el navegador y funciona como app.

### ¿Puedo cambiar el dominio?

Sí. Ajusta `PUBLIC_BASE_*` en `.env` y tus DNS. Ver `docs/DNS_TUNNEL.md`.

### ¿Qué proveedor de pagos/CFDI usan?

En MVP no hay pasarela obligatoria; puedes activar manualmente. El CFDI está en **sandbox**. Producción se integrará después.
