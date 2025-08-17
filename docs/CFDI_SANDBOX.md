> **Aviso**: Esta sección es técnica, no legal/fiscal. Para producción se requerirá integrar un **PAC** y validar requisitos del **SAT**.

## Objetivo

Timbrar **en sandbox** para validar flujo: cotización → factura → XML/PDF.

## Ajustes en `.env`

```dotenv
PAC_PROVIDER=sandbox
PAC_USER=demo
PAC_PASS=demo
```

## Flujo (propuesto)

1. **Config fiscal** en el Asistente (solo demo en MVP):
    - Emisor (RFC, régimen, nombre, CP).
    - Receptor (RFC genérico si procede: p. ej. público en general).
    - Uso CFDI, método, forma de pago (demo).
2. **Generar comprobante** desde cotización aprobada (servidor local):
    - Construir JSON del CFDI 4.0 con partidas (claveProdServ, claveUnidad, IVA 16% etc.).
    - Guardar borrador en DB y encolar **timbrado** (cola Redis) si no hay Internet.
3. **Timbrado sandbox** (cuando hay conexión):
    - POST a proveedor **sandbox** → recibir **XML** timbrado (fake) + UUID simulado.
    - Guardar **XML** (MinIO) y generar **PDF** (plantilla simple).
4. **Reintentos**: exponenciar con jitter; marcar como `pending → sent`.

## RFCs y pruebas

- Receptor **público en general** (ejemplo): `XAXX010101000`.
- Extranjero (cuando aplique): `XEXX010101000`.

## Para producción (más adelante)

- Validaciones CFDI 4.0 (domicilio fiscal receptor, uso CFDI válido, etc.).
- Serialización precisa de impuestos/retenciones.
- Cancelación y sustitución.
- Control de folios/serie y sellado con **CSD**.
