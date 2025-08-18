Formato basado en *Keep a Changelog*.

## [0.1.1] — 2025-08-18

### Añadido
- Core (FastAPI): endpoints `/health`, `/license/status`, `/auth/login`, `/quotes` (GET/POST), `/quotes/approve-check` (stub in‑memory).
- BFF (Next.js): `/api/health`, `/api/auth/login`, `/api/quotes` (GET/POST), `/api/approve/check`.
- Página pública `/approve/[token]` que consulta el BFF.
- Scripts npm: `backend:install`, `backend:dev`, `dev:all` (levanta Core+Web juntos).
- `.env.local` con `BACKEND_API_BASE` y `NEXT_PUBLIC_API_BASE` para desarrollo local.

### Documentación
- Nuevo `docs/GETTING_STARTED.md` (arranque rápido Core↔BFF y endpoints mínimos).
- `docs/API_REFERENCE.md`: sección “Slice 1 (implementado)” con contratos actuales.
- `docs/ENVIRONMENT.md`: variables `BACKEND_API_BASE` / `NEXT_PUBLIC_API_BASE`.
- `docs/ADMIN_PANEL.md` creado y enlazado desde `ARCHITECTURE.md`.
- `README.md` actualizado con enlaces a Sprint 0 y Panel.

### Notas
- Auth/JWT es demo (usuario `admin@example.com` / `admin`). Persistencia real y NextAuth quedan en roadmap inmediato.

## [0.1.0] — 2025-08-17

### Añadido

- Scaffold **Next.js (PWA)** + **FastAPI** + **PostgreSQL/Redis/MinIO**.
- Aprobación pública con túnel y **middleware** `/approve/*`.
- Presign de evidencias (MinIO) y **íconos PWA** (maskable/monochrome/iOS splash).
- Documentación: README, ARCHITECTURE, INSTALL, ENVIRONMENT, DNS\_TUNNEL, SECURITY, LICENSING, OPERATIONS, BACKUP\_RESTORE, PWA\_ASSETS, PORTAL, API\_REFERENCE, DATABASE\_SCHEMA, CFDI\_SANDBOX, CONTRIBUTING, FAQ.

### Cambiado

- Variables `.env` para dominios `nexora.grappepie.com`.

### Conocido

- Auth real pendiente; licencias con demo guard.
- CFDI: sandbox en diseño.
