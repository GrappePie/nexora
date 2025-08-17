## Instalación del host (Ubuntu) — Nexora POS

**Requisitos:** Ubuntu 22.04+, 2 vCPU, 4 GB RAM, 40 GB disco (mínimo), red estable.

### 1) Instalar Docker + Compose

```bash
sudo apt update && sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
cat <<'EOF' | sudo tee /etc/apt/sources.list.d/docker.list
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable
EOF
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER  # cierra y abre sesión
```

### 2) Preparar carpeta del proyecto

```bash
sudo mkdir -p /opt/taller-pos && sudo chown $USER:$USER /opt/taller-pos
cd /opt/taller-pos
cp .env.example .env   # edita según ENVIRONMENT.md
```

### 3) Levantar servicios

```bash
docker compose up -d
```

### 4) Acceso en la red local

- Desde el host: `http://localhost:3000`
- Desde otras PCs/phones: `http://<IP_DEL_SERVIDOR>:3000`
- (Opcional) agrega un alias en `/etc/hosts`: `192.168.1.10  taller.local`

### 5) Provisión inicial

- Desde el **portal** (`https://app.nexora.grappepie.com`) obtén tu **código/QR**.
- Abre `http://taller.local:3000` → **Asistente 3 pasos** → ingresa el código o escanea QR.

### 6) Aprobación externa (Cloudflare Tunnel)

- Sigue `DNS_TUNNEL.md` para crear `aprobar.nexora.grappepie.com` y restringir a `/approve/*`.

### 7) Actualizar / Respaldar

```bash
# Actualizar imágenes y reiniciar
docker compose pull || true && docker compose up -d
# Respaldo Postgres (ver scripts/backup.sh)
/opt/taller-pos/scripts/backup.sh
```
