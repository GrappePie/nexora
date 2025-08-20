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

## Roles y permisos

La autenticación emite JWT con los roles del usuario. Estos roles se conservan en la sesión del portal.

La matriz de roles se define en `backend/app/auth.py` como `ROLE_MATRIX`.

| Rol   | Permisos principales                                |
|-------|-----------------------------------------------------|
| admin | Gestión completa y operaciones críticas             |
| user  | Operaciones estándar en la PWA                      |
| viewer| Acceso de solo lectura a paneles e informes         |

## JWT y NextAuth

- El backend firma los JWT con el algoritmo indicado en `JWT_ALGO` y el secreto `JWT_SECRET`.
- Los tokens incluyen el sujeto (`sub`), tiempo de emisión (`iat`), expiración (`exp`) y la lista de `roles` del usuario.
- El archivo `src/app/api/auth/[...nextauth]/route.ts` configura NextAuth para usar el backend (`/auth/login` y `/auth/refresh`).
- Los roles y el `accessToken` se almacenan en la sesión de NextAuth y se renuevan automáticamente.
- En el frontend se consume la sesión mediante `useSession` y el helper `hasRole` para restringir vistas.
