> **Aviso**: Esta sección es técnica, no legal/fiscal. Para producción se requerirá integrar un **PAC** y validar requisitos del **SAT**.

## Objetivo

Timbrar **en sandbox** para validar flujo: cotización → factura → XML/PDF.

## Ajustes en `.env`

```dotenv
PAC_PROVIDER=sandbox
PAC_USER=demo
PAC_PASS=demo
# Redis opcional para cola (usa fakeredis si está ausente)
REDIS_URL=redis://localhost:6379/0
# Límite de reintentos antes de marcar `failed`
CFDI_MAX_ATTEMPTS=5
```

## Flujo

1. **Config fiscal** (`POST /cfdi/config`)
    - Guardar RFC y proveedor en DB.
2. **Cotización aprobada → borrador**
    - Al aprobar se guarda en `cfdi_pending` y se encola en Redis.
3. **Timbrado sandbox** (`POST /cfdi/process-pending`)
    - Procesa la cola, genera XML/PDF y crea `cfdi_documents`.
4. **Reintentos**
    - Backoff exponencial (`2^n` segundos, máx 60) y hasta `CFDI_MAX_ATTEMPTS`.
    - Estados: `pending` → `sent` o `failed`.

### Ejemplos

```bash
# Configurar RFC/proveedor
curl -X POST http://localhost:8000/cfdi/config \
  -H 'content-type: application/json' \
  -d '{"rfc":"XAXX010101000","provider":"sandbox"}'

# Generar CFDI inmediato
curl -X POST http://localhost:8000/cfdi/ \
  -H 'content-type: application/json' \
  -d '{"customer":"ACME","items":[{"description":"Servicio","quantity":1,"unit_price":100}]}'

# Procesar pendientes (cola)
curl -X POST http://localhost:8000/cfdi/process-pending

# Descargar XML
curl -L http://localhost:8000/cfdi/<UUID>?file=xml
```

## RFCs y pruebas

- Receptor **público en general** (ejemplo): `XAXX010101000`.
- Extranjero (cuando aplique): `XEXX010101000`.

## Pruebas automatizadas

1. Configurar entorno de sandbox:

   ```bash
   export PAC_PROVIDER=sandbox
   export PAC_USER=demo
   export PAC_PASS=demo
   export REDIS_URL=""
   ```

   Si `REDIS_URL` está vacío, se utiliza **fakeredis** para la cola.

2. Ejecutar los tests:

   ```bash
   pytest backend/tests/test_cfdi_async.py backend/tests/test_cfdi_queue_retry.py
   ```

### Resultados esperados

- `test_cfdi_async.py` aprueba una cotización, genera XML/PDF y cambia el estado de `pending` a `sent`.
- `test_cfdi_queue_retry.py` fuerza errores hasta agotar `CFDI_MAX_ATTEMPTS` y marca el registro como `failed`.

## Para producción (más adelante)

- Validaciones CFDI 4.0 (domicilio fiscal receptor, uso CFDI válido, etc.).
- Serialización precisa de impuestos/retenciones.
- Cancelación y sustitución.
- Control de folios/serie y sellado con **CSD**.
