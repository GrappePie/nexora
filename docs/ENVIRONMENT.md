## Variables de entorno — Referencia

**Archivo:** `.env` (basado en `.env.example`).

### App

| Variable     | Ejemplo       | Descripción                      |
| ------------ | ------------- | -------------------------------- |
| `APP_ENV`    | `local`       | Entorno (`local/staging/prod`).  |
| `APP_SECRET` | `cambia_esto` | Clave de app (firmas, sesiones). |

### Base de datos

| Variable            | Ejemplo |
| ------------------- | ------- |
| `POSTGRES_DB`       | `pos`   |
| `POSTGRES_USER`     | `pos`   |
| `POSTGRES_PASSWORD` | `pos`   |

### Redis

\| `REDIS_URL` | `redis://redis:6379/0` |

### Storage (MinIO)

| Variable        | Ejemplo             |
| --------------- | ------------------- |
| `S3_ENDPOINT`   | `http://minio:9000` |
| `S3_BUCKET`     | `pos-media`         |
| `S3_ACCESS_KEY` | `pos`               |
| `S3_SECRET_KEY` | `pos`               |

### Correo (SMTP) — opcional

| Variable    | Ejemplo                                |
| ----------- | -------------------------------------- |
| `SMTP_HOST` | `smtp.example.com`                     |
| `SMTP_PORT` | `587`                                  |
| `SMTP_USER` | `apikey`                               |
| `SMTP_PASS` | `***`                                  |
| `SMTP_FROM` | `"Nexora POS <no-reply@nexora.local>"` |

### WhatsApp — sin costo (link share)

| Variable      | Ejemplo                           |
| ------------- | --------------------------------- |
| `WA_PROVIDER` | `meta`                            |
| `WA_TOKEN`    | *(vacío para compartir por link)* |
| `WA_PHONE_ID` | *(vacío)*                         |

### PAC (sandbox)

| Variable       | Ejemplo   |
| -------------- | --------- |
| `PAC_PROVIDER` | `sandbox` |
| `PAC_USER`     | `demo`    |
| `PAC_PASS`     | `demo`    |

### Licencias

| Variable                 | Ejemplo     | Nota                                          |
| ------------------------ | ----------- | --------------------------------------------- |
| `LICENSE_PUBLIC_KEY_HEX` | `ffffffff…` | Clave pública (hex) para verificar licencias. |
| `LICENSE_GRACE_DAYS`     | `30`        | Días de gracia offline.                       |

### Exposición LAN/Externa (aprobación pública)

| Variable                    | Ejemplo                                | Uso                                        |
| --------------------------- | -------------------------------------- | ------------------------------------------ |
| `PUBLIC_BASE_LAN`           | `http://taller.local:3000`             | Base en LAN.                               |
| `PUBLIC_BASE_EXTERNAL_HOST` | `https://aprobar.nexora.grappepie.com` | Host externo (para middleware).            |
| `PUBLIC_BASE_EXTERNAL`      | `https://aprobar.nexora.grappepie.com` | Base externa (para compartir en WhatsApp). |
| `CF_TUNNEL_TOKEN`           | `eyJh…`                                | Token del túnel de Cloudflare.             |

> El frontend expone `NEXT_PUBLIC_PUBLIC_BASE_LAN` y `NEXT_PUBLIC_PUBLIC_BASE_EXTERNAL` tomadas de estas variables para armar el link de aprobación.
