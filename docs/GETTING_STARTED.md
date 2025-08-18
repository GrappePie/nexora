# Cómo empezar (Sprint 0)

Esta guía está sincronizada con el archivo raíz GETTING_STARTED.md. Si necesitas la versión completa con comandos y contexto del proyecto, revisa también ../../GETTING_STARTED.md.

Resumen de arranque
- Dos backends: BFF (Next.js) y Core (FastAPI).
- Instala dependencias y levanta ambos servicios juntos:

Comandos rápidos (Windows PowerShell)
```powershell
# En la raíz del repo
npm install
npm run backend:install
# Variables locales para el puente BFF↔Core
# (.env.local ya incluido con BACKEND_API_BASE=http://localhost:8000)
# Levantar ambos: Core (uvicorn) + Web (Next.js)
npm run dev:all
```

Endpoints mínimos (E2E)
- Core: GET http://127.0.0.1:8000/health
- BFF→Core: GET http://localhost:3000/api/health
- Crear cotización: POST http://localhost:3000/api/quotes { customer, total }
- Verificar aprobación: GET http://localhost:3000/api/approve/check?token=<TOKEN>
- Página pública: http://localhost:3000/approve/<TOKEN>

Más detalles en:
- docs/API_REFERENCE.md (endpoints Core y BFF)
- docs/ADMIN_PANEL.md (alcance del panel)
- docs/ARCHITECTURE.md (RBAC, rutas y visión)
- docs/ENVIRONMENT.md (variables BACKEND_API_BASE / NEXT_PUBLIC_API_BASE)

