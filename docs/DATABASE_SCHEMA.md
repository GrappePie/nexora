## Entidades (MVP)

- **customers**: clientes (nombre, rfc, email, phone).
- **vehicles**: vehículos (cliente, placas, VIN, make/model/year).
- **quotes**: cotizaciones (cliente, `status`, `approval_token`, `expires_at`).
- **quote\_items**: renglones (pieza/servicio, qty, precio, impuesto, `is_approved`).
- **work\_orders**: OTs generadas desde una cotización.
- **attachments**: archivos/fotos ligados a OT (clave S3/MinIO).
- **license\_state**: licencia y estado local (modo limitado, última verificación).
- **users**: credenciales e información de inicio de sesión.
- **roles**: roles de acceso asignados a usuarios.
- **stock**: inventario de artículos disponibles.
- **invoices**: facturas internas asociadas a clientes.
- **cfdi_documents**: CFDI timbrados con enlaces a XML y PDF.
- **subscriptions**: suscripciones de clientes a planes y proveedor.

## Relaciones

```
customers 1─* vehicles
customers 1─* quotes 1─* quote_items
quotes 1─1 work_orders 1─* attachments
```

## Índices sugeridos

```sql
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes (customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_quotes_approval_token ON quotes (approval_token);
CREATE INDEX IF NOT EXISTS idx_attachments_wo ON attachments (work_order_id);
```

## Migraciones (Alembic)

- Base inicial como **revision 0001**.
- Política: una migración por PR que toque esquema. Describir en `CHANGELOG.md`.

## Datos derivados

- `quote.total = SUM(qty * unit_price)` y `quote.tax_total` desde items.
- Recalcular al aprobar/editar; evitar persistir duplicado salvo para snapshot de PDF.
