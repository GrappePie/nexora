# Nexora POS — README (Local‑first + Portal)

## Funcionamiento local y requerimientos online

Nexora POS está diseñado para operar completamente en la red local (LAN), permitiendo la provisión, operación y conexión de dispositivos sin necesidad de Internet. La **única función que requiere acceso online** es la verificación y renovación de la licencia. Si la licencia expira y no puede renovarse online, el sistema entra en modo limitado tras el periodo de gracia.

## Descripción general
Nexora POS es un sistema de punto de venta local-first con portal web, diseñado para operar tanto en modo offline como online, permitiendo la gestión eficiente de ventas y operaciones desde una máquina principal y dispositivos móviles conectados.

## Instalación y despliegue
Para instalar y desplegar Nexora POS en la máquina principal, sigue las instrucciones detalladas en [docs/INSTALL.md](docs/INSTALL.md).

## Portal y autenticación
El portal web permite la administración centralizada del sistema. La autenticación garantiza el acceso seguro de los usuarios. Consulta:
- [docs/PORTAL.md](docs/PORTAL.md) — Detalles del portal web
- [docs/SECURITY.md](docs/SECURITY.md) — Seguridad y autenticación

## Conexión de dispositivos móviles (QR)
Puedes conectar celulares y tablets al sistema principal mediante códigos QR, facilitando el acceso y la operación remota. Revisa la documentación técnica para detalles de implementación.

## Documentación adicional
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) — Referencia de API
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Arquitectura
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — Esquema de base de datos
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — Operaciones y administración
- [docs/FAQ.md](docs/FAQ.md) — Preguntas frecuentes

Para información más específica, consulta los archivos en la carpeta docs.

---

## 📚 Documentación

Guía completa en `docs/`:

- **Arquitectura** → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Instalación (Ubuntu host)** → [docs/INSTALL.md](docs/INSTALL.md)
- **Variables **`` → [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)
- **DNS + Cloudflare Tunnel** → [docs/DNS\_TUNNEL.md](docs/DNS_TUNNEL.md)
- **Seguridad** → [docs/SECURITY.md](docs/SECURITY.md)
- **Licenciamiento** → [docs/LICENSING.md](docs/LICENSING.md)
- **Operación** → [docs/OPERATIONS.md](docs/OPERATIONS.md)
- **Backups / Restore** → [docs/BACKUP\_RESTORE.md](docs/BACKUP_RESTORE.md)
- **Assets PWA (manifest/íconos)** → [docs/PWA\_ASSETS.md](docs/PWA_ASSETS.md)
- **Portal (SaaS)** → [docs/PORTAL.md](docs/PORTAL.md)
- **API Reference (MVP)** → [docs/API\_REFERENCE.md](docs/API_REFERENCE.md)
- **Modelo de datos** → [docs/DATABASE\_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- **CFDI Sandbox** → [docs/CFDI\_SANDBOX.md](docs/CFDI_SANDBOX.md)
- **Contribución** → [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- **Changelog** → [docs/CHANGELOG.md](docs/CHANGELOG.md)
- **FAQ** → [docs/FAQ.md](docs/FAQ.md)

> Sugerencia: en Git, coloca un índice similar en la parte superior del repositorio para navegación rápida.

---

## 0) ¿Qué es este sistema?

- **On‑premise**: corre en **una PC del taller** (servidor). Los demás equipos/phones se conectan por **LAN**.
- **PWA**: se instala desde el navegador (Android/iOS/PC). Funciona **offline** en LAN.
- **Externo**: solo se expone **/approve/** vía un **túnel seguro** (Cloudflare), para que los clientes autoricen cotizaciones fuera de la red.
- **Licencias**: suscripción con gracia **offline** y **modo limitado** al expirar.

---

## 1) Estructura del monorepo

```
taller-pos/
├─ docker-compose.yml
├─ .env.example
├─ scripts/
│  ├─ install.sh   # instala Docker y levanta
│  ├─ update.sh    # actualiza/levanta
│  └─ backup.sh    # respaldo Postgres
├─ backend/        # FastAPI
│  ├─ Dockerfile
│  ├─ requirements.txt
│  └─ app/
│     ├─ main.py
│     ├─ db.py, models.py, deps.py, licensing.py
│     └─ routers/ (health, licensing, uploads, quotes, ...)
└─ frontend/       # Next.js PWA
   ├─ Dockerfile
   ├─ package.json, next.config.mjs
   ├─ public/
   │  ├─ manifest.webmanifest
   │  ├─ logo-nexora-pos.svg, logo-nexora-pos-white.svg, logo-nexora-symbol.svg
   │  ├─ favicon.ico, apple-touch-icon.png
   │  ├─ icons/
   │  │  ├─ icon-192.png, icon-512.png
   │  │  ├─ icon-512-maskable.png  # Android (maskable)
   │  │  └─ icon-512-mono.png      # Android 13+ (themed icon)
   │  └─ splash/                   # iOS startup images
   └─ app/
      ├─ layout.tsx, page.tsx (asistente 3 pasos)
      ├─ approve/[token]/page.tsx  # público externo
      └─ provision/page.tsx        # pareo inicial (código/QR)
```

---

## 2) Quickstart (Ubuntu)

```bash
# 1) Instalar Docker + Compose
sudo apt update && sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER  # re-login

# 2) Carpeta del proyecto
sudo mkdir -p /opt/taller-pos && sudo chown $USER:$USER /opt/taller-pos
cd /opt/taller-pos

# 3) Copiar archivos del repositorio
# 4) Configurar .env
tcp .env.example .env 2>/dev/null || cp .env.example .env

# 5) Levantar
docker compose up -d

# 6) Acceso en LAN
#   http://<IP_DEL_SERVIDOR>:3000  (o configura taller.local en /etc/hosts)
```

**/etc/hosts (opcional en cada PC)**

```
192.168.1.10    taller.local
```

---

## 3) Variables de entorno (`.env`)

```dotenv
# App
APP_ENV=local
APP_SECRET=change_me_supersecret

# DB
POSTGRES_DB=pos
POSTGRES_USER=pos
POSTGRES_PASSWORD=pos

# Redis
REDIS_URL=redis://redis:6379/0

# Storage (MinIO)
S3_ENDPOINT=http://minio:9000
S3_BUCKET=pos-media
S3_ACCESS_KEY=pos
S3_SECRET_KEY=pos

# SMTP (opcional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Nexora POS <no-reply@nexora.local>"

# WhatsApp (sin costo, link share; si luego usas API, completa)
WA_PROVIDER=meta
WA_TOKEN=
WA_PHONE_ID=

# PAC (sandbox)
PAC_PROVIDER=sandbox
PAC_USER=
PAC_PASS=

# Licencias
LICENSE_PUBLIC_KEY_HEX=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
LICENSE_GRACE_DAYS=30

# Exposición LAN/Externa (aprobación pública)
PUBLIC_BASE_LAN=http://taller.local:3000
PUBLIC_BASE_EXTERNAL_HOST=https://aprobar.nexora.grappepie.com
PUBLIC_BASE_EXTERNAL=https://aprobar.nexora.grappepie.com
CF_TUNNEL_TOKEN=

# Stripe (Portal/billing)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_BASIC=price_xxx_basic
STRIPE_PRICE_PRO=price_xxx_pro
```

> El **frontend** exporta `NEXT_PUBLIC_PUBLIC_BASE_LAN/EXTERNAL` para el botón **Compartir por WhatsApp**. Si no hay EXTERNAL, usa LAN.
> En desarrollo con Next.js puedes usar `.env.local` para sobreescribir estas variables localmente.
> El webhook de Stripe apunta a `/api/webhooks`; copia el secreto del dashboard en `STRIPE_WEBHOOK_SECRET`.

---

## 4) Túnel seguro (Cloudflare) — **solo **``

1. **Crear túnel y DNS**

```bash
cloudflared login
cloudflared tunnel create nexora-pos
cloudflared tunnel token nexora-pos
cloudflared tunnel route dns nexora-pos aprobar.nexora.grappepie.com
```

2. **Servicio en **``

```yaml
cloudflared:
  image: cloudflare/cloudflared:2024.6.0
  environment:
    - TUNNEL_TOKEN=${CF_TUNNEL_TOKEN}
  command: tunnel run --no-autoupdate
  depends_on:
    - frontend
  restart: unless-stopped
```

3. **Middleware (Next.js) para restringir host externo**

```ts
// frontend/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
const PUBLIC_HOST = process.env.PUBLIC_BASE_EXTERNAL_HOST || ''
export function middleware(req: NextRequest) {
    const url = req.nextUrl
    const host = req.headers.get('host') || ''
    const isExternal = PUBLIC_HOST && host.includes(new URL(PUBLIC_HOST).host)
    const ok = url.pathname.startsWith('/approve')
    if (isExternal && !ok) return new NextResponse('Forbidden', { status: 403 })
    return NextResponse.next()
}
export const config = { matcher: ['/((?!_next|icons|manifest.webmanifest|logo.svg).*)'] }
```

4. **Probar**: `https://aprobar.nexora.grappepie.com/approve/test` responde (403 o vista) pero **no** otras rutas.

> Alternativa temporal: **Quick Tunnel** con `trycloudflare.com` (ver guía en el repo), sin usar tu subdominio.

---

## 5) PWA (instalable) e íconos

- `public/manifest.webmanifest`:

```json
{
  "name": "Nexora POS",
  "short_name": "Nexora POS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#F97316",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512-mono.png", "sizes": "512x512", "type": "image/png", "purpose": "monochrome" }
  ]
}
```

- **Android**: usa manifest (iconos 192/512, maskable/monochrome). Genera **splash** automático; no requiere imágenes por tamaño.
- **iOS**: agregar `apple-touch-icon.png` y **splash** en `public/splash/` + metatags. (Incluido en el proyecto).

---

## 6) WhatsApp “Compartir cotización” (sin costo)

El botón abre WhatsApp con texto + link externo.

```ts
// frontend/app/lib/share.ts
export function buildWhatsAppShare(quoteId: string, token: string, total: number) {
    const base = process.env.NEXT_PUBLIC_PUBLIC_BASE_EXTERNAL || process.env.NEXT_PUBLIC_PUBLIC_BASE_LAN || ''
    const approveBase = (base || '').replace(/\/$/, '')
    const url = `${approveBase}/approve/${token}`
    const msg = `Hola 👋, te compartimos la cotización ${quoteId}. Total estimado: $${total.toFixed(2)} MXN.\n\nRevisa y autoriza aquí: ${url}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
}
```

En `docker-compose.yml` del **frontend**:

```yaml
environment:
  NEXT_PUBLIC_API_BASE: http://backend:8000
  NEXT_PUBLIC_PUBLIC_BASE_LAN: ${PUBLIC_BASE_LAN}
  NEXT_PUBLIC_PUBLIC_BASE_EXTERNAL: ${PUBLIC_BASE_EXTERNAL}
```

---

## 7) Flujos principales

- **Provisionar HOST** (PC servidor): desde el **portal** (app.nexora...) obtener **código/QR** → abrir `http://taller.local:3000` → asistente 3 pasos → pareo → descarga licencia.
- **Unir DISPOSITIVOS** (clientes LAN): QR de **join** con `http://taller.local:3000/provision?join=<token>` → se unen al tenant.
- **Aprobación CLIENTE FINAL** (externo): link `https://aprobar.nexora.grappepie.com/approve/<token>` por WhatsApp/Email.
- **Upgrade/Downgrade**: en el portal; el host sincroniza nueva licencia (online) o por QR/código.

---

## 8) Modo offline y sincronización

- LAN sin Internet: **funciona** (app+DB locales). Timbrado/envíos quedan **pendientes**.
- Licencia expirada + sin Internet: tras **gracia** (`LICENSE_GRACE_DAYS`) → **modo limitado**.
- La PWA usa **service worker**; implementar **Background Sync** e **IndexedDB outbox** en la siguiente iteración.

---

## 9) Seguridad

- **Licencias** firmadas (Ed25519). Validación en backend (no confiar en el front).
- **Tokens** de provisión/unión **de corta vida** y uso único.
- Túnel externo restringido a **/approve/**. No exponer DB/MinIO al exterior.
- **Backups** periódicos (ver `scripts/backup.sh`).

---

## 10) Scripts

- `scripts/install.sh` — instala Docker/Compose y levanta el stack.
- `scripts/update.sh` — actualiza imágenes y reinicia.
- `scripts/backup.sh` — respaldo Postgres gzip, retiene 14 días.

---

## 11) Roadmap

- Auth real (JWT/NextAuth) y matriz de **roles**.
- Alembic (migraciones) + entidades faltantes (stock, facturación completa, etc.).
- **CFDI sandbox** de punta a punta.
- PWA **Background Sync** / reintentos y mejoras offline.
- Portal: **billing** (Stripe/Mercado Pago/Paddle) + webhooks.

---

## 12) Créditos/Branding

- **Logo** y **íconos** Nexora incluidos (`public/`).
- Paleta: **#F97316** (CTA), **#2563EB** (confianza), **#111827** (acero), **#F3F4F6** (claro).

---

## 13) Soporte

- Portal: `https://app.nexora.grappepie.com` → sección **Soporte**.
- Contacto inicial por email/WhatsApp (definir proveedor al pasar a prod).
