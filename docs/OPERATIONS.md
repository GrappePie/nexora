## Tareas diarias

- Verificar `http://<IP>:3000` (front) y `GET /api/health` (backend).
- Espacio en disco (fotos en MinIO).
- `docker compose logs -f frontend backend cloudflared` ante incidencias.

## Arranque/Paro/Actualización

```bash
docker compose up -d         # levantar
docker compose stop          # parar
docker compose pull && docker compose up -d   # actualizar
```

## Comunes

- **No carga el host externo** → revisar `cloudflared` (token, DNS proxied).
- **No suben fotos** → revisar `S3_*`, puerto 9000 accesible en red Docker.
- **Lento** → aumentar CPU/RAM o purgar adjuntos viejos (ver BACKUP\_RESTORE.md).

## Logs útiles

```bash
docker compose logs -n 200 backend
curl -I https://aprobar.nexora.grappepie.com/approve/test
```
