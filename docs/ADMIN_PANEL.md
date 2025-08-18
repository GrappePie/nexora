# Panel de administración (/dashboard)

Resumen
- Vista para usuarios con rol Admin y, según permisos, Manager/Cajero/Mecánico. Reúne configuración, operación diaria y reportes.

Acceso y seguridad
- Rutas: /dashboard/* protegidas por NextAuth + RBAC (ver ARCHITECTURE.md §6 y §1.2).
- Host: disponible solo en LAN; el host externo solo expone /approve/* (ver SECURITY.md).
- Licencia: estado del plan y modo limitado impactan funciones (ver LICENSING.md).

Navegación principal
- Inicio: KPIs del día, alertas de licencia, backups, espacio en MinIO, pendientes de aprobación.
- Catálogos: clientes, vehículos, servicios, refacciones, proveedores, listas de precios.
- Taller: cotizaciones, aprobaciones, órdenes de trabajo, asignación, tiempos y evidencias.
- Caja: cobros, cortes, CFDI (sandbox/real), cancelaciones.
- Reportes: ingresos, utilización, top servicios/refacciones, CxC.
- Configuración: empresa, folios/series, usuarios y roles, integraciones, almacenamiento, backups.

Módulos y capacidades
- Empresa y licencia
  - Datos fiscales, logo, series/folios, estado de plan, renovación.
- Usuarios y roles (RBAC)
  - Invitar/bloquear usuarios, reset de contraseña, asignar roles y políticas.
- Catálogos
  - CRUD de clientes, vehículos (VIN/placa), servicios, refacciones, proveedores, precios.
- Cotizaciones
  - Crear/editar, versiones, envío, link de aprobación pública, historial y comentarios.
- Órdenes de trabajo
  - Apertura desde cotización o directa, estados, asignación a mecánicos, tareas/tiempos.
- Evidencias
  - Fotos/comentarios por orden, límites por tamaño y cantidad, descarga. Offline-first en cliente.
- Cobros y CFDI
  - Efectivo/transferencia/TPV; emisión/cancelación CFDI 4.0; sandbox/real; timbrado en cola.
- Reportes
  - Períodos, filtros por servicio/mecánico, exportación (CSV/PDF, futuro).
- Almacenamiento
  - Uso de MinIO, buckets por dominio (evidence/, invoices/), políticas de retención/lifecycle.
- Integraciones
  - Stripe, correo (SMTP), webhooks; túnel externo para aprobaciones públicas.
- Seguridad y auditoría
  - 2FA (si aplica), sesiones activas, registro de accesos/acciones por usuario.
- Sistema y operaciones
  - Backups/restauración, salud del sistema, logs, PWA e instalación en dispositivos.

Flujo típico (resumen)
1) Cotización → 2) Aprobación pública (/approve/<token>) → 3) Orden de trabajo → 4) Evidencias → 5) Cobro → 6) CFDI.

MVP (primera entrega)
- Dashboard básico, usuarios/roles, catálogos esenciales, cotizaciones + aprobación pública, órdenes de trabajo, evidencias (offline-first con límites), cobros manuales, CFDI en sandbox, reportes simples y backups.

Límites y políticas recomendadas
- Evidencias: ≤4MB por imagen, 1600px máx, borrar EXIF; límite por orden configurable.
- Retención: lifecycle en MinIO para purgar adjuntos antiguos si se define.
- Aprobar públicamente: rate limiting y validaciones estrictas (ver SECURITY.md y DNS_TUNNEL.md).

Enlaces
- ARCHITECTURE.md: rutas protegidas y RBAC.
- SECURITY.md: exposición de superficies y cabeceras.
- CFDI_SANDBOX.md: emisión en entorno de prueba.
- BACKUP_RESTORE.md: copias y restauración.
- PORTAL.md: portal de licencias y provisión (no confundir con el panel interno).

