## Objetivo

Minimizar superficie expuesta, proteger datos y asegurar que el licenciamiento no pueda ser burlado.

## Superficie expuesta

- **Exterior**: solo `https://aprobar.nexora.grappepie.com/approve/*` (Cloudflare Tunnel).
    - **Middleware** en Next.js bloquea cualquier otra ruta cuando `Host` es el externo.
    - No hay panel de admin/usuario en ese host.
- **Interior (LAN)**: `http://taller.local:3000` (PWA), `http://backend:8000` (solo red Docker).
- **DB/MinIO/Redis**: puertos internos de Docker. **No** mapear al host público.

## Controles

- **Licencia** validada en **backend** (FastAPI) con **Ed25519**. Nunca confiar en check de front.
- **Tokens** (`provision`/`join`/`approve`) con expiración corta y uso único.
- **CORS** del backend restringido a `http://frontend:3000` y al host externo solo para `/approve/*` (si usas CORS).
- **Headers** (recomendado en Next.js):
    - `X-Frame-Options: DENY` (excepto si algún embed es necesario)
    - `Content-Security-Policy` mínimo: `default-src 'self'; img-src 'self' data: blob: https:; connect-src 'self' http://backend:8000 https://aprobar.nexora.grappepie.com; frame-ancestors 'none';` (ajustar a realidad)
    - `Referrer-Policy: no-referrer`
    - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- **MinIO**: usar políticas por bucket; evitar credenciales root en aplicaciones.
- **Backups** cifrados en repositorio externo (si sales del host).
- **Rotación de secretos**: cambiar `APP_SECRET`, `S3_*` y `CF_TUNNEL_TOKEN` si hay sospecha.
- **Actualizaciones**: `watchtower` habilitado para imágenes; revisa changelog antes de subir a prod.

## Licenciamiento/Revocación

- Licencia con `exp` y `grace_days`. Tras gracia sin renovar → **modo limitado** (sin timbrado/envíos/altas de usuarios, etc.).
- **CRL**/revocación: el portal marca revocada; el host aplica cuando recupere conectividad.

## Datos personales

- Clientes, teléfonos, placas/VIN. Mantener **mínimos necesarios**.
- Logs con cuidado (no escribir tokens o PII extensa).

## Monitoreo básico

- `/api/health` (backend).
- Logs de `cloudflared` y `frontend`.
