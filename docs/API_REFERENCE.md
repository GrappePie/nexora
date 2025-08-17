## Visión

Backend **FastAPI** con OpenAPI disponible en `/docs` y `/openapi.json` desde la LAN. El host externo **NO** expone API (solo `/approve/*` del frontend).

### Base

- **LAN**: `http://taller.local:3000` (Frontend) → `http://backend:8000` (API)
- **Producción externa**: no aplica (se usa túnel para `/approve/*`).

### Autenticación (MVP)

- MVP usa `require_user()` simulado. En iteración 2: **JWT** (bearer) + roles.

### Rutas principales (MVP)

> Los nombres pueden ajustarse en iteración 2. Esta referencia cubre lo *usable hoy*.

#### Health

- `GET /api/health` → `{ ok: true }`

#### Licensing

- `GET /api/licensing/provision?code=ABC123` → Provisión demo del host.

#### Quotes (Cotizaciones)

- `POST /api/quotes`\
  **Body**:

  ```json
  {
    "customer_id": "uuid",
    "items": [
      {"kind": "service", "description": "Cambio de aceite", "qty": 1, "unit_price": 600, "tax_rate": 16}
    ]
  }
  ```

  **Resp**: `{ "id": "uuid", "approval_token": "hex" }`

- `POST /api/quotes/{quoteId}/approve`\
  **Body**: `items: string[]` (ids aprobados) → crea **OT** y marca aprobados.

#### Uploads (Evidencias)

- `POST /api/uploads/photos/presign`\
  **Body**:
  ```json
  {"work_order_id":"uuid","filename":"foto.jpg","content_type":"image/jpeg"}
  ```
  **Resp**: `{ url, s3_key }` (PUT directo a MinIO por 15 min).

### Convenciones

- **Errores**: JSON `{ detail: string }` (HTTP 4xx/5xx).
- **Moneda**: MXN, decimales 2, `tax_rate` en % (ej. 16.0).
- **Fechas**: ISO-8601 en API pública; `epoch` solo adentro de licencias.

### Versionado

- Prefijo futuro: `/v1/*`. Se anunciarán breaking changes en `CHANGELOG.md`.
