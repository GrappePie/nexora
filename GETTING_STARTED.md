# Cómo empezar (Sprint 0)

Este proyecto usa dos backends: BFF en Next.js (LAN) y Core en FastAPI (Docker red interna). Empezar por el Core y un slice E2E pequeño.

Prerrequisitos
- Node 18/20+, PNPM/NPM, Python 3.11+, Docker Desktop/Engine, GitHub CLI (gh).

Paso 1 — Crear issues del backlog
- Desde la raíz del repo, usa los scripts incluidos:
  - PowerShell (Windows): `./create_gh_issues.ps1`
  - Bash (WSL/macOS/Linux): `./gh_issues/create_gh_issues.sh`
- Revisa `gh_issues/README.md` y `created_issues.log`.

Paso 2 — Backend Core (FastAPI)
- Objetivo: Auth JWT, RBAC, Licencia, Cotizaciones y Aprobación pública.
- Basarte en docs: ARCHITECTURE.md (§2, §6), DATABASE_SCHEMA.md, LICENSING.md, SECURITY.md.
- Entregables mínimos:
  - OpenAPI con rutas: `POST /auth/login`, `GET /license/status`, `GET/POST /quotes`, `POST /quotes/{id}/approve-check`, `POST /work-orders`, `POST /evidence/presign`.
  - DB: esquema base y migraciones (Alembic).
  - Licencia: verificación Ed25519 y “modo limitado”.
  - Storage: presigned URLs (MinIO/S3-compatible).

Paso 3 — Frontend (Next.js, BFF)
- Objetivo: proteger `/dashboard/*` (NextAuth), UI mínima y BFF que llama al Core.
- Entregables mínimos:
  - Guardas de sesión/rol en middleware.
  - Página pública `/approve/[token]` que consulta al Core.
  - BFF: API routes que validan sesión y proxéan al Core.
  - Variables: `NEXT_PUBLIC_API_BASE=http://backend:8000` (en Docker) y `PUBLIC_BASE_*` para enlaces.

Paso 4 — Túnel externo solo para aprobaciones
- Sigue DNS_TUNNEL.md. Restringe host externo a `/approve/*` (ver SECURITY.md ejemplo de middleware).

Paso 5 — Smoke test E2E (Slice 1)
- Flujo: crear cotización → compartir link `/approve/<token>` → aprobar → crear orden.
- Ver KPIs básicos en el dashboard.

Referencias útiles
- Panel admin: docs/ADMIN_PANEL.md
- Arquitectura y roles: docs/ARCHITECTURE.md
- Seguridad: docs/SECURITY.md
- Licenciamiento: docs/LICENSING.md
- CFDI sandbox: docs/CFDI_SANDBOX.md
- Backups: docs/BACKUP_RESTORE.md

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
