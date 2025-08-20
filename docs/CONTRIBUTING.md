## Flujo de trabajo

1. **Issue → branch**: `feature/…`, `fix/…`, `docs/…`.
2. **Commits** (Conventional Commits):
    - `feat: …`, `fix: …`, `docs: …`, `chore: …`, `refactor: …`, `perf: …`, `build: …`.
3. **PR** contra `main` con descripción, screenshots si aplica y checklist de pruebas.
4. **Code review**: al menos 1 aprobación.

## Entorno de desarrollo

- **Frontend**: Node 20, `npm i`, `npm run dev`.
- **Backend**: Python 3.11, `uvicorn app.main:app --reload` (o `docker compose up`).
- **DB**: Postgres local en Docker (compose).
- **MinIO**: `minio` del compose (console :9001).

## Estilo y linters

- TypeScript/JS: ESLint + Prettier (sugerido).
- Python: Ruff/Black (sugerido).
- YAML/JSON: validación CI.

## Pruebas

- Unit tests backend (pytest) mínimos para licencias y presign.
- E2E ligero: crear cotización → aprobar → subir evidencia.

## Pipeline de CI

- El workflow [`ci.yml`](../.github/workflows/ci.yml) se ejecuta en cada *push* o *pull request*.
- Cachea dependencias de Node y Python.
- Corre `npm run lint` y `npm test` en el frontend.
- Ejecuta `pytest` para el backend.
- Construye las imágenes Docker de ambos servicios (`docker build`).
- Publica los logs de pruebas y las imágenes (`.tar`) como artefactos para su revisión.

## Lanzamientos

- Versionado `MAJOR.MINOR.PATCH`.
- Actualiza `CHANGELOG.md` en cada release.
