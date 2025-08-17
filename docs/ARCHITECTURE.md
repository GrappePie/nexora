## Nexora POS — Arquitectura (Local‑first + Portal)

**Fecha:** 2025‑08‑17

### Visión general

```
                     ┌────────────────────────────┐
  Internet           │        Portal Nexora       │
 (externo)           │  (app.nexora.grappepie.com)│
     ▲               │  Auth, Suscripciones, Lic. │
     │               └───────────────┬────────────┘
     │                               │  REST/WS (emitir licencias,
     │                               │  tokens de provisión/join)
     │                               ▼
     │               ┌────────────────────────────┐
     │               │  Cloudflare DNS + Tunnel   │
     │               │  aprobar.nexora.grappepie… │
     │               └───────────────┬────────────┘
     │                               │  HTTPS externo (solo /approve/*)
     │                               │
     │                        ┌──────▼──────┐
     │    LAN (sin Internet)  │  Frontend   │  Next.js (PWA)
     └────────────────────────►  :3000      │  Service Worker
                              └────┬───────┘
                                   │
                      ┌────────────▼────────────┐
                      │        Backend           │  FastAPI
                      │        :8000             │  Licencias, APIs
                      └──────────┬──────────────┘
                                 │
      ┌──────────────────────────┼──────────────────────────┐
      │                          │                          │
┌─────▼─────┐              ┌─────▼─────┐              ┌─────▼─────┐
│ PostgreSQL│              │   Redis   │              │   MinIO   │
│   datos   │              │  colas    │              │ evidencias│
└───────────┘              └───────────┘              └───────────┘
```

### Principios

- **Local‑first**: todo corre en la PC del taller; funciona sin Internet (gracia offline).
- **Exposición mínima**: solo `/approve/*` sale a Internet mediante **Cloudflare Tunnel**.
- **Suscripciones**: licencia firmada (Ed25519) con `exp` + `grace_days`. Al expirar → **modo limitado**.
- **PWA**: instalable en Android/iOS/PC, con caché y futura Background Sync.

### Flujos clave

1. **Provisionar host**: Portal emite `provision_token` → asistente del host (`/provision`) lo consume → descarga **licencia**.
2. **Unir dispositivos** (empleados): **QR** con `join_token` temporal → PWA en la misma LAN → sesión/tenant.
3. **Aprobación del cliente**: el POS genera `https://aprobar.nexora.grappepie.com/approve/<token>` → WhatsApp/Email.
4. **Renovación/upgrade**: Portal actualiza suscripción → re‑emite **licencia** → host sincroniza al estar online.

### Superficie de ataque y controles

- **Host externo**: `aprobar…` solo acepta `GET/POST` bajo `/approve/*` (middleware). Sin cookies de admin.
- **DB/MinIO**: solo puertos internos en Docker; **no** exponer públicamente.
- **Secrets**: variables `.env` + rotación. No commitear `.env`.
- **Licencia**: verificación en **backend** (no confiar en el front); CRL/revocación vía portal al reconectar.
