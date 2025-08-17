## Postgres (dump gzip)

- Script incluido: `scripts/backup.sh` → guarda `backups/pos_YYYY-MM-DD.sql.gz` y retira >14 días.

### Restaurar

```bash
# detener servicios que escriban en DB
docker compose stop frontend backend
# restaurar
gunzip -c backups/pos_2025-08-01.sql.gz | docker exec -i $(docker ps -qf name=db) psql -U ${POSTGRES_USER:-pos} -d ${POSTGRES_DB:-pos}
# arrancar
docker compose up -d frontend backend
```

## MinIO (evidencias)

- Recomiendo habilitar **lifecycle** para expirar objetos muy antiguos o moverlos a otra ubicación.
- Con `mc` (cliente MinIO):

```bash
mc alias set local http://localhost:9000 $S3_ACCESS_KEY $S3_SECRET_KEY
mc ilm add --expiry-days 365 local/$S3_BUCKET   # ejemplo: 1 año
mc ls --recursive local/$S3_BUCKET | head
```

## Prueba de restore

- Recupera un respaldo en una VM separada y valida inicio de sesión y lectura de OTs/adjuntos.
