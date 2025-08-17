## DNS + Cloudflare Tunnel — `aprobar.nexora.grappepie.com`

### 1) DNS (en la zona `grappepie.com`)

- `CNAME nexora` → `cname.vercel-dns.com`  *(landing)*
- `CNAME app.nexora` → `cname.vercel-dns.com`  *(portal)*
- `CNAME aprobar.nexora` → `<UUID>.cfargotunnel.com`  *(****proxied****)*

> No borres otros registros existentes (Vercel `@/www`, SendGrid, etc.).

### 2) Crear el túnel

```bash
cloudflared login
cloudflared tunnel create nexora-pos
cloudflared tunnel token nexora-pos
cloudflared tunnel route dns nexora-pos aprobar.nexora.grappepie.com
```

Guarda el token en `.env` → `CF_TUNNEL_TOKEN`.

### 3) Servicio en `docker-compose.yml`

```yaml
cloudflared:
  image: cloudflare/cloudflared:2024.6.0
  environment:
    - TUNNEL_TOKEN=${CF_TUNNEL_TOKEN}
  command: tunnel run --no-autoupdate
  depends_on: [frontend]
  restart: unless-stopped
```

### 4) Restringir a `/approve/*` (Next.js middleware)

```ts
// frontend/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
const PUBLIC_HOST = process.env.PUBLIC_BASE_EXTERNAL_HOST || ''
export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get('host') || ''
  const isExternal = PUBLIC_HOST && host.includes(new URL(PUBLIC_HOST).host)
  const isApprovePath = url.pathname.startsWith('/approve')
  if (isExternal && !isApprovePath) return new NextResponse('Forbidden', { status: 403 })
  return NextResponse.next()
}
export const config = { matcher: ['/((?!_next|icons|manifest.webmanifest|logo.svg).*)'] }
```

### 5) Pruebas

- `https://aprobar.nexora.grappepie.com/approve/test` → debe responder con HTTPS válido.
- Cualquier ruta distinta a `/approve/*` en ese host → **403**.
- Botón **Compartir por WhatsApp** debe usar `PUBLIC_BASE_EXTERNAL`.

### 6) Alternativa temporal

- **Quick Tunnel** (sin DNS):

```bash
cloudflared tunnel --url http://localhost:3000
```

- Copia la URL `https://<algo>.trycloudflare.com` en `PUBLIC_BASE_EXTERNAL` para pruebas.
