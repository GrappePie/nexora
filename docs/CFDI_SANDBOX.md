> **Aviso**: Esta sección es técnica, no legal/fiscal. Para producción se requerirá integrar un **PAC** y validar requisitos del **SAT**.

## Objetivo

Timbrar **en sandbox** para validar flujo: cotización → factura → XML/PDF.

## Ajustes en `.env`

```dotenv
PAC_PROVIDER=sandbox
PAC_USER=demo
PAC_PASS=demo
```

## Flujo

1. **Config fiscal** (`POST /cfdi/config`)
    - Guardar RFC y proveedor en DB.
2. **Cotización aprobada → borrador**
    - Al aprobar se guarda en `cfdi_pending` y se encola en Redis.
3. **Timbrado sandbox** (`POST /cfdi/process-pending`)
    - Procesa la cola, genera XML/PDF y crea `cfdi_documents`.
4. **Reintentos**
    - Backoff exponencial, estados `pending` → `sent`.

## RFCs y pruebas

- Receptor **público en general** (ejemplo): `XAXX010101000`.
- Extranjero (cuando aplique): `XEXX010101000`.

## Para producción (más adelante)

- Validaciones CFDI 4.0 (domicilio fiscal receptor, uso CFDI válido, etc.).
- Serialización precisa de impuestos/retenciones.
- Cancelación y sustitución.
- Control de folios/serie y sellado con **CSD**.
