## Formato de licencia (JSON)

```json
{
  "payload": {
    "tenant_id": "ten_...",
    "product": "pos_taller",
    "plan": "pro",
    "modules": ["cfdi","inventario_avanzado","whatsapp_email"],
    "seats": 5,
    "exp": 1767225600,
    "grace_days": 30,
    "host_fingerprint": "fp_sha256",
    "key_id": "ed25519:2025-01"
  },
  "sig": "<hex_ed25519>"
}
```

- `exp`: epoch segundos.
- `host_fingerprint`: hash derivado de HW del host (MAC, CPU id, etc.).

## Verificación (backend)

- **Ed25519** con `LICENSE_PUBLIC_KEY_HEX`.
- Rechazar si `now > exp + grace_days*86400`.
- Si fingerprint no coincide: permitir **una** migración autorizada (flujo de re‑vinculación) o bloquear.

## Provisión

1. Portal emite `provision_code`/`provision_qr` (válido 15 min).
2. Host abre `/provision` → envía `code` a `POST /api/licensing/provision`.
3. Portal devuelve licencia firmada → se guarda en DB.

## Renovación / Upgrade

- Portal re‑emite licencia (nuevos módulos/asientos/`exp`).
- Host sincroniza al volver a estar online o manualmente (QR/código en Asistente).

## Modo limitado

- Persisten funciones básicas de consulta/impresión.
- Bloqueados: timbrado, envíos externos, altas de usuarios y creación de nuevas OTs (configurable).
