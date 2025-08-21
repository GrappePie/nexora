## Visión

Backend **FastAPI** con OpenAPI disponible en `/docs` y `/openapi.json` desde la LAN. El host externo **NO** expone API (solo `/approve/*` del frontend).

### Base

- **LAN**: `http://taller.local:3000` (Frontend) → `http://backend:8000` (API)
- **Desarrollo local**: `http://localhost:3000` (Frontend) → `http://localhost:8000` (API)
- **Producción externa**: no aplica (se usa túnel para `/approve/*`).

---

## Slice 1 (implementado)

Endpoints actuales en el código, listos para pruebas E2E.

### Core (FastAPI)

- `GET /health` → `{ ok: true, service: "core", version: "0.1.1" }`
- `POST /auth/login`
  - Body: `{ "email": string, "password": string }`
  - Resp: `{ "access_token": string, "token_type": "bearer", "exp": number, "roles": string[] }`
  - Nota: usuario demo `admin@example.com` / `admin`.
- `POST /auth/signup`
  - Body: `{ "email": string, "password": string, "roles?": string[] }`
  - Resp: `{ "access_token": string, "token_type": "bearer", "exp": number, "roles": string[] }`
  - Nota: si no se especifican roles se asigna automáticamente `user`.
- `GET /auth/roles`
  - Requiere token. Devuelve `{ "roles": string[] }` del usuario autenticado.
- `POST /auth/roles`
  - Solo admin. Body: `{ "email": string, "role": string }` → agrega rol y responde `{ "roles": string[] }`.
- `DELETE /auth/roles`
  - Solo admin. Body: `{ "email": string, "role": string }` → quita rol y responde `{ "roles": string[] }`.
- `GET /quotes/` → lista de cotizaciones (in‑memory stub)
- `POST /quotes/`
  - Body: `{ "customer": string, "total": number }`
  - Resp: `{ id: string, customer: string, total: number, status: "pending", token: string }`
- `POST /quotes/approve-check`
  - Body: `{ "token": string }`
  - Resp: `{ ok: boolean, quote_id?: string }`
- `GET /customers/` → lista de clientes
- `POST /customers/` → crea cliente `{ name, rfc, email?, phone? }`
- `GET /vehicles/` → lista de vehículos
- `POST /vehicles/` → crea vehículo `{ customer_id, plates, vin?, make?, model?, year? }`
- `GET /quote-items/` → lista renglones
- `POST /quote-items/` → crea renglón `{ quote_id, description, qty, unit_price, tax_rate }`
- `GET /work-orders/` → lista órdenes de trabajo
- `POST /work-orders/` → crea OT `{ quote_id?, status? }`
- `GET /attachments/` → lista archivos de OT
- `POST /attachments/` → crea archivo `{ work_order_id, s3_key }`

### BFF (Next.js API Routes)

- `GET /api/health` → proxy a Core `/health`.
- `POST /api/auth/login` → proxy a Core `/auth/login`.
- `GET /api/quotes` → proxy a Core `/quotes/`.
- `POST /api/quotes` → proxy a Core `/quotes/`.
- `GET /api/approve/check?token=...` → proxy a Core `/quotes/approve-check`.

### Página pública

- `GET /approve/[token]` → vista que consulta `GET /api/approve/check?token=...` y muestra estado.

Notas

- Variables: `BACKEND_API_BASE` y `NEXT_PUBLIC_API_BASE` controlan el destino del BFF (ver `docs/ENVIRONMENT.md`).
- Seguridad: el host externo solo debe servir `/approve/*` (ver `docs/SECURITY.md`).

---

## Rutas de referencia (plan y evolución)

> Los nombres pueden ajustarse en iteraciones siguientes. Esta sección conserva objetivos de alcance más amplio.

### Health

- `GET /api/health` → `{ ok: true }`

### Licensing

- `GET /api/licensing/provision?code=ABC123` → Provisión demo del host.

### Quotes (Cotizaciones)

- `POST /api/quotes`
  Body ejemplo (objetivo ampliado):
  ```json
  {
    "customer_id": "uuid",
    "items": [
      {"kind": "service", "description": "Cambio de aceite", "qty": 1, "unit_price": 600, "tax_rate": 16}
    ]
  }
  ```
  Resp: `{ "id": "uuid", "approval_token": "hex" }`

- `POST /api/quotes/{quoteId}/approve`
  Body: `items: string[]` (ids aprobados) → crea **OT** y marca aprobados.

### Uploads (Evidencias)

- `POST /api/uploads/photos/presign`
  Body:
  ```json
  {"work_order_id":"uuid","filename":"foto.jpg","content_type":"image/jpeg"}
  ```
  Resp: `{ url, s3_key }` (PUT directo a MinIO por 15 min).

### Convenciones

- **Errores**: JSON `{ detail: string }` (HTTP 4xx/5xx).
- **Moneda**: MXN, decimales 2, `tax_rate` en % (ej. 16.0).
- **Fechas**: ISO-8601 en API pública; `epoch` solo adentro de licencias.

### Versionado

- Prefijo futuro: `/v1/*`. Se anunciarán breaking changes en `CHANGELOG.md`.
