"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    LayoutDashboard,
    Wrench,
    ClipboardList,
    CreditCard,
    Users,
    Car,
    Settings,
    Package,
    Share2,
    Upload,
    FileText,
    CheckCircle2,
    XCircle,
    Search,
    QrCode,
    ReceiptText,
    DollarSign,
    ShieldCheck,
    Database,
    AlertTriangle,
    Activity,
    HardDrive,
    Boxes,
    Building,
    KeyRound,
    Trash2,
    Edit,
    PlusCircle,
} from "lucide-react";
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";

/**
 * Nexora POS — Hi‑Fi Mockup (Single‑file React, TailwindCSS)
 *
 * Vistas:
 * - /dashboard
 * - /taller/cotizacion (Creación de Cotización)
 * - /taller/ordenes (Kanban + Detalle c/ evidencias)
 * - /approve/[token]
 * - /dashboard/caja (Cobros + CFDI)
 * - /catalogo, /clientes, /vehiculos, /configuracion (Vistas con funcionalidad CRUD)
 *
 * Mejoras integradas con la doc recibida (Lotes 1 y 2):
 * - Estados de licencia (Activa, Próxima a expirar, En gracia, Limitado).
 * - Tarjetas de Operación (BFF/Core/Cloudflared) y Backups/MinIO.
 * - Cotización con Subtotal/IVA/Total + Vigencia y enlace externo (túnel sólo /approve/*).
 * - Aprobación pública con leyenda legal y vigencia.
 * - Caja con CFDI sandbox (post‑pago: “Timbrado en cola” + placeholders XML/PDF) y bloqueo por licencia.
 * - Botón “Instalar PWA”.
 */

const PALETTE = {
    accent: "#F97316", // naranja CTA
    blue: "#2563EB", // enlaces / confianza
    dark: "#111827", // fondo oscuro / shell
    light: "#F3F4F6", // tarjetas / fondo claro
};

const currency = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
});

// Tipos fuertes
type CatalogItem = { id: string; tipo: "Servicio" | "Refacción"; nombre: string; precio: number };
type Cliente = { id: string; nombre: string; telefono: string };
type Vehiculo = { id: string; desc: string; clienteId: string };
type WorkOrder = { id: string; cliente: string; vehiculo: string; mecanico: string; total: number };

// Mini sparkline data
const spark = [
    { d: "8:00", v: 1200 },
    { d: "10:00", v: 2400 },
    { d: "12:00", v: 1800 },
    { d: "14:00", v: 4200 },
    { d: "16:00", v: 5200 },
    { d: "18:00", v: 6800 },
];

// Initial mock data
const CATALOG_INIT: CatalogItem[] = [
    { id: "srv-01", tipo: "Servicio", nombre: "Cambio de aceite 5W-30", precio: 950 },
    { id: "srv-02", tipo: "Servicio", nombre: "Alineación y balanceo", precio: 650 },
    { id: "ref-10", tipo: "Refacción", nombre: "Filtro de aceite OEM", precio: 280 },
    { id: "ref-11", tipo: "Refacción", nombre: "Pastillas de freno (delanteras)", precio: 1450 },
    { id: "ref-12", tipo: "Refacción", nombre: "Batería 12V 60Ah", precio: 2750 },
];

const CLIENTES_INIT: Cliente[] = [
    { id: "cli-01", nombre: "Juan Pérez", telefono: "+52 55 1234 5678" },
    { id: "cli-02", nombre: "María López", telefono: "+52 55 5555 4444" },
];

const VEHICULOS_INIT: Vehiculo[] = [
    { id: "veh-01", desc: "Nissan Versa 2019 — ABC‑123", clienteId: "cli-01" },
    { id: "veh-02", desc: "VW Jetta 2016 — XYZ‑987", clienteId: "cli-02" },
];

// const MECANICOS = [
//     { id: "mech-01", nombre: "Carlos T." },
//     { id: "mech-02", nombre: "Sofía R." },
//     { id: "mech-03", nombre: "Miguel A." },
// ];

const KANBAN_INIT: Record<string, WorkOrder[]> = {
    Pendiente: [
        { id: "OT-1007", cliente: "Juan Pérez", vehiculo: "Versa 2019", mecanico: "—", total: 0 },
    ],
    "En Proceso": [
        { id: "OT-1001", cliente: "María López", vehiculo: "Jetta 2016", mecanico: "Carlos T.", total: 2350 },
    ],
    "En Espera de Refaccion": [
        { id: "OT-1004", cliente: "Luis G.", vehiculo: "Fiesta 2015", mecanico: "Sofía R.", total: 1480 },
    ],
    Finalizada: [
        { id: "OT-0995", cliente: "Ana Q.", vehiculo: "Corolla 2014", mecanico: "Miguel A.", total: 3120 },
    ],
};

const COBROS = [
    { id: "OT-0995", cliente: "Ana Q.", vehiculo: "Corolla 2014", total: 3120, saldo: 3120 },
    { id: "OT-1002", cliente: "Pedro M.", vehiculo: "Civic 2018", total: 4890, saldo: 4890 },
];

// const BASE_LAN = "http://taller.local";
const BASE_EXTERNAL = "https://aprobar.nexora.com";

type LicenseState = "active" | "expiring" | "grace" | "limited";

// Evento beforeinstallprompt tipado
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string[] }>;
}

function licenseBadge(state: LicenseState) {
    const map: Record<LicenseState, { label: string; className: string }> = {
        active: { label: "Activa", className: "bg-green-100 text-green-700" },
        expiring: { label: "Próx. a expirar", className: "bg-amber-100 text-amber-700" },
        grace: { label: "En gracia", className: "bg-amber-100 text-amber-700" },
        limited: { label: "Limitado", className: "bg-red-100 text-red-700" },
    };
    return map[state];
}

function Sidebar({ route, onNavigate }: { route: string; onNavigate: (r: string) => void }) {
    const NAV = [
        { key: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
        { key: "/taller/cotizacion", label: "Nueva Cotización", icon: <FileText className="h-5 w-5" /> },
        { key: "/taller/ordenes", label: "Órdenes de Trabajo", icon: <ClipboardList className="h-5 w-5" /> },
        { key: "/dashboard/caja", label: "Caja", icon: <CreditCard className="h-5 w-5" /> },
        { key: "/catalogo", label: "Catálogo", icon: <Package className="h-5 w-5" /> },
        { key: "/clientes", label: "Clientes", icon: <Users className="h-5 w-5" /> },
        { key: "/vehiculos", label: "Vehículos", icon: <Car className="h-5 w-5" /> },
        { key: "/configuracion", label: "Configuración", icon: <Settings className="h-5 w-5" /> },
    ];
    return (
        <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-[#0f1623] text-white border-r border-white/5">
            <div className="px-5 py-4 flex items-center gap-2 border-b border-white/10">
                <Wrench className="h-6 w-6" style={{ color: PALETTE.accent }} />
                <div>
                    <div className="text-base font-semibold">Nexora POS</div>
                    <div className="text-xs text-white/60">Taller Mecánico</div>
                </div>
            </div>
            <nav className="p-3 space-y-1">
                {NAV.map((n) => (
                    <button
                        key={n.key}
                        onClick={() => onNavigate(n.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/10 transition ${
                            route === n.key ? "bg-white/10 ring-1 ring-white/10" : ""
                        }`}
                    >
                        {n.icon}
                        <span>{n.label}</span>
                        {n.key === "/dashboard/caja" && (
                            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: PALETTE.accent, color: "#111" }}>$</span>
                        )}
                    </button>
                ))}
            </nav>
            <div className="mt-auto p-4 border-t border-white/10 text-xs text-white/60">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Licencia: <span className="ml-1 text-white">Activa</span></div>
                <div className="mt-2 flex items-center gap-2"><Database className="h-4 w-4" /> Almacenamiento</div>
                <div className="mt-1 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: "62%", background: PALETTE.blue }} />
                </div>
                <div className="mt-1">62% usado</div>
            </div>
        </aside>
    );
}

function Topbar({ onNavigate, route, envHost, onInstallPrompt }: { onNavigate: (r: string) => void; route: string; envHost: "LAN" | "EXTERNAL"; onInstallPrompt: () => void }) {
    return (
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 md:px-6 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex items-center gap-3">
                <button className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl border" onClick={() => onNavigate("__toggleDrawer")}>☰</button>
                <div className="text-sm text-slate-600">{route}</div>
                <span className={`hidden sm:inline ml-2 text-[10px] px-2 py-0.5 rounded-full border ${envHost === "EXTERNAL" ? "border-amber-300 text-amber-700" : "border-emerald-300 text-emerald-700"}`}>
          Host: {envHost}
        </span>
            </div>
            <div className="flex items-center gap-2">
                <button className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border" onClick={onInstallPrompt}>
                    <HardDrive className="h-4 w-4" /> Instalar PWA
                </button>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border bg-white">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input placeholder="Buscar órdenes, clientes, vehículos…" className="outline-none text-sm w-56" />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200" title="Usuario" />
            </div>
        </header>
    );
}

function HealthDot({ ok }: { ok: boolean }) {
    return <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />;
}

function KpiCard({ title, value, foot }: { title: string; value: string; foot?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-col">
            <div className="text-xs text-slate-500">{title}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
            <div className="mt-3 h-16">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spark} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="d" hide />
                        <YAxis hide />
                        <ReTooltip formatter={(v: number) => currency.format(v)} />
                        <Area type="monotone" dataKey="v" stroke={PALETTE.blue} fill={PALETTE.light} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {foot && <div className="mt-2 text-xs text-slate-500">{foot}</div>}
        </div>
    );
}

function Dashboard({ licenseState }: { licenseState: LicenseState }) {
    const lic = licenseBadge(licenseState);
    const storageUsedPct = 62;
    const approvalsPend = 3;
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4 bg-white flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 mt-0.5" style={{ color: licenseState === "limited" ? "#ef4444" : licenseState === "expiring" || licenseState === "grace" ? "#d97706" : "#16a34a" }} />
                    <div>
                        <div className="text-sm font-medium">Licencia: <span className={`px-2 py-0.5 rounded-full text-[10px] ${lic.className}`}>{lic.label}</span></div>
                        <div className="text-xs text-slate-600">Vence el 12/11/2025 • Gracia: 7 días • Plan: Taller PRO</div>
                    </div>
                </div>
                <div className="rounded-2xl border p-4 bg-white flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="w-full">
                        <div className="text-sm font-medium">Almacenamiento</div>
                        <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full" style={{ width: `${storageUsedPct}%`, background: PALETTE.blue }} />
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{storageUsedPct}% usado de 50 GB</div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiCard title="Ingresos de hoy" value={currency.format(6820)} foot={<span>+18% vs ayer</span>} />
                <KpiCard title="Cotizaciones pendientes" value={`${approvalsPend}`} foot={<span>2 con más de 24h</span>} />
                <KpiCard title="Órdenes activas" value="7" foot={<span>2 en espera de refacción</span>} />
                <div className="rounded-2xl border bg-white shadow-sm p-4 flex flex-col">
                    <div className="text-xs text-slate-500 mb-2">Operación</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2"><HealthDot ok={true} /> BFF /api</div>
                        <div className="flex items-center gap-2"><HealthDot ok={true} /> Core</div>
                        <div className="flex items-center gap-2"><HealthDot ok={true} /> Cloudflared</div>
                        <div className="flex items-center gap-2"><HealthDot ok={true} /> MinIO</div>
                    </div>
                    <div className="mt-3 text-xs text-slate-600">Pruebas rápidas: <button className="underline">/api/health</button> • <button className="underline">/approve/check</button></div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="rounded-2xl border bg-white p-4 text-left hover:shadow transition">
                    <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-slate-600" /><div className="font-medium">Nueva cotización</div></div>
                    <div className="text-xs text-slate-600 mt-1">Crea y comparte para aprobación</div>
                </button>
                <button className="rounded-2xl border bg-white p-4 text-left hover:shadow transition">
                    <div className="flex items-center gap-3"><ClipboardList className="h-5 w-5 text-slate-600" /><div className="font-medium">Ver órdenes</div></div>
                    <div className="text-xs text-slate-600 mt-1">Kanban del taller</div>
                </button>
                <button className="rounded-2xl border bg-white p-4 text-left hover:shadow transition">
                    <div className="flex items-center gap-3"><CreditCard className="h-5 w-5 text-slate-600" /><div className="font-medium">Cobrar</div></div>
                    <div className="text-xs text-slate-600 mt-1">Registrar pago y facturar</div>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Boxes className="h-4 w-4" /> Backups</div>
                    <div className="text-xs text-slate-600">Último backup: 18/08/2025 02:10 • Retención: 14 días • Próximo: 02:00</div>
                    <div className="mt-2 flex gap-2 text-xs">
                        <button className="px-3 py-1.5 rounded-xl border">Ver política</button>
                        <button className="px-3 py-1.5 rounded-xl border">Restaurar prueba</button>
                    </div>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Database className="h-4 w-4" /> MinIO</div>
                    <div className="text-xs text-slate-600">Bucket: nexora-evidencias • Lifecycle: 90 días</div>
                    <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: "38%", background: PALETTE.accent }} />
                    </div>
                    <div className="mt-1 text-xs text-slate-600">38% usado de 50 GB</div>
                </div>
            </div>
        </div>
    );
}

function Cotizacion({ catalog, clientes, vehiculos }: { catalog: CatalogItem[]; clientes: Cliente[]; vehiculos: Vehiculo[] }) {
    const [clienteId, setClienteId] = useState<string>("cli-01");
    const [vehiculoId, setVehiculoId] = useState<string>("veh-01");
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<{ id: string; nombre: string; precio: number; qty: number; tipo: string }[]>([]);
    const [showShare, setShowShare] = useState(false);

    const cliente = clientes.find((c) => c.id === clienteId)!;
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId)!;

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return catalog.filter((i) => i.nombre.toLowerCase().includes(q) || i.tipo.toLowerCase().includes(q));
    }, [query, catalog]);

    const subtotal = useMemo(() => items.reduce((s, it) => s + it.precio * it.qty, 0), [items]);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const addItem = (row: CatalogItem) => {
        setItems((prev) => {
            const i = prev.find((p) => p.id === row.id);
            if (i) return prev.map((p) => (p.id === row.id ? { ...p, qty: p.qty + 1 } : p));
            return [...prev, { id: row.id, nombre: row.nombre, precio: row.precio, qty: 1, tipo: row.tipo }];
        });
    };

    const token = "ABC123";
    const publicUrl = `${BASE_EXTERNAL}/approve/${token}`;
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
        `Hola ${cliente?.nombre}, te comparto la cotización para tu ${vehiculo?.desc}. Total: ${currency.format(total)}. Aprueba aquí: ${publicUrl}`,
    )}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl);
        } catch {
            const input = document.getElementById('publicUrlInput') as HTMLInputElement | null;
            if (input) {
                input.select();
                input.setSelectionRange(0, 99999);
                document.execCommand('copy');
            }
        }
    };

    return (
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold mb-3">Cliente y vehículo</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-600">Cliente</label>
                            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                            <div className="text-xs text-slate-500 mt-1">Tel: {cliente?.telefono}</div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-600">Vehículo</label>
                            <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
                                {vehiculos.filter(v => v.clienteId === clienteId).map((v) => (
                                    <option key={v.id} value={v.id}>{v.desc}</option>
                                ))}
                            </select>
                            <div className="text-xs text-slate-500 mt-1">Asociado a: {cliente?.nombre}</div>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold">Servicios y refacciones</div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en catálogo…" className="outline-none text-sm w-48" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filtered.map((row) => (
                            <div key={row.id} className="rounded-xl border p-3 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium">{row.nombre}</div>
                                    <div className="text-xs text-slate-500">{row.tipo}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-semibold">{currency.format(row.precio)}</div>
                                    <button onClick={() => addItem(row)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: PALETTE.blue }}>Agregar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold mb-3">Resumen de cotización</div>
                    <div className="space-y-2 max-h-72 overflow-auto pr-1">
                        {items.length === 0 && <div className="text-sm text-slate-500">Agrega elementos del catálogo…</div>}
                        {items.map((it) => (
                            <div key={it.id} className="flex items-center justify-between gap-3 border rounded-xl p-2">
                                <div>
                                    <div className="text-sm font-medium">{it.nombre}</div>
                                    <div className="text-xs text-slate-500">{it.tipo}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setItems(prev => prev.map(p => p.id===it.id?{...p, qty: Math.max(1, p.qty-1)}:p))} className="w-7 h-7 rounded-lg border">−</button>
                                    <div className="w-8 text-center text-sm">{it.qty}</div>
                                    <button onClick={() => setItems(prev => prev.map(p => p.id===it.id?{...p, qty: p.qty+1}:p))} className="w-7 h-7 rounded-lg border">+</button>
                                </div>
                                <div className="text-sm font-semibold">{currency.format(it.precio * it.qty)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 border-t pt-3 space-y-1">
                        <div className="flex items-center justify-between text-sm text-slate-600"><span>Subtotal</span><span>{currency.format(subtotal)}</span></div>
                        <div className="flex items-center justify-between text-sm text-slate-600"><span>IVA (16%)</span><span>{currency.format(iva)}</span></div>
                        <div className="flex items-center justify-between text-sm text-slate-800"><span className="text-sm">Total</span><span className="text-xl font-semibold">{currency.format(total)}</span></div>
                        <div className="text-[11px] text-slate-500">Vigencia de la cotización: 72h</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium" style={{ background: PALETTE.accent }} onClick={() => setShowShare(true)}>
                            <Share2 className="h-4 w-4" /> Guardar y Compartir para Aprobación
                        </button>
                        <button className="px-4 py-2 rounded-xl border">Guardar borrador</button>
                    </div>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-xs text-slate-600">Notas internas</div>
                    <textarea className="mt-2 w-full rounded-xl border p-2 min-h-[90px]" placeholder="Observaciones, prioridades, etc." />
                </div>
            </div>
            {showShare && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 text-lg font-semibold"><QrCode className="h-5 w-5" /> Compartir cotización</div>
                        <div className="mt-2 text-sm text-slate-600">Envía el enlace al cliente para aprobar o rechazar desde su dispositivo.</div>
                        <div className="mt-3">
                            <QRCodeCanvas value={publicUrl} size={128} />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <input id="publicUrlInput" className="flex-1 rounded-xl border px-3 py-2 text-sm" value={publicUrl} readOnly />
                            <button className="px-3 py-2 rounded-xl border" onClick={handleCopy}>Copiar</button>
                        </div>
                        <div className="mt-3">
                            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium" style={{ background: PALETTE.blue }}>
                                <Share2 className="h-4 w-4" /> Enviar por WhatsApp
                            </a>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-xl border" onClick={() => setShowShare(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OrdenesTrabajo() {
    const [kanban] = useState<Record<string, WorkOrder[]>>(KANBAN_INIT);
    const [detalle, setDetalle] = useState<WorkOrder | null>(null);
    const [evidencias, setEvidencias] = useState<string[]>([]);
    const [errorUpload, setErrorUpload] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const MAX_FILES = 6;
    const MAX_MB = 4;

    const onUpload = (files: FileList | null) => {
        if (!files) return;
        const list = Array.from(files);
        const over = evidencias.length + list.length - MAX_FILES;
        if (over > 0) {
            setErrorUpload(`Límite de ${MAX_FILES} fotos. Quita ${over} archivo(s).`);
            return;
        }
        const tooBig = list.find((f) => f.size > MAX_MB * 1024 * 1024);
        if (tooBig) {
            setErrorUpload(`Cada archivo debe ser ≤ ${MAX_MB} MB`);
            return;
        }
        const readers = list.map(
            (f) =>
                new Promise<string>((resolve) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(fr.result as string);
                    fr.readAsDataURL(f);
                })
        );
        Promise.all(readers).then((imgs) => {
            setEvidencias((prev) => [...prev, ...imgs]);
            setErrorUpload(null);
        });
    };

    const Column = ({ title, cards }: { title: string; cards: WorkOrder[] }) => (
        <div className="rounded-2xl bg-slate-50 border p-3 flex flex-col min-h-[320px]">
            <div className="text-sm font-semibold mb-2">{title}</div>
            <div className="space-y-2">
                {cards.map((c) => (
                    <button key={c.id} onClick={() => setDetalle(c)} className="w-full text-left rounded-xl bg-white border p-3 hover:shadow">
                        <div className="text-sm font-semibold">{c.id}</div>
                        <div className="text-xs text-slate-600">{c.cliente} • {c.vehiculo}</div>
                        <div className="text-xs text-slate-500 mt-1">Mecánico: {c.mecanico}</div>
                    </button>
                ))}
                {cards.length === 0 && <div className="text-xs text-slate-500">Sin elementos</div>}
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(kanban).map(([k, v]) => (
                    <Column key={k} title={k} cards={v} />
                ))}
            </div>

            {detalle && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetalle(null)}>
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Detalle {detalle.id}</div>
                            <button className="w-9 h-9 rounded-xl border" onClick={() => setDetalle(null)}>✕</button>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl border p-3">
                                <div className="text-xs text-slate-600">Cliente</div>
                                <div className="text-sm font-medium">{detalle.cliente}</div>
                                <div className="text-xs text-slate-600 mt-2">Vehículo</div>
                                <div className="text-sm font-medium">{detalle.vehiculo}</div>
                                <div className="text-xs text-slate-600 mt-2">Mecánico</div>
                                <div className="text-sm">{detalle.mecanico}</div>
                            </div>
                            <div className="rounded-xl border p-3 md:col-span-2">
                                <div className="text-sm font-semibold">Evidencias <span className="text-xs text-slate-500">({evidencias.length}/{MAX_FILES})</span></div>
                                <div className="mt-2">
                                    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
                                    <div className="flex gap-2 flex-wrap">
                                        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white"><Upload className="h-4 w-4" /> Subir fotos</button>
                                        <button className="px-3 py-2 rounded-xl border">Tomar foto</button>
                                    </div>
                                    {errorUpload && <div className="mt-2 text-xs text-red-600">{errorUpload}</div>}
                                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {evidencias.map((src, i) => (
                                            <Image key={i} src={src} width={160} height={80} className="w-full h-20 object-cover rounded-lg border" alt={`Evidencia ${i+1}`} />
                                        ))}
                                        {evidencias.length === 0 && <div className="col-span-full text-xs text-slate-500">Aún no hay evidencias subidas.</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-xl border">Guardar</button>
                            <button className="px-4 py-2 rounded-xl text-white font-medium" style={{ background: PALETTE.blue }}>Actualizar estado</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AprobacionPublica() {
    const items = [
        { nombre: "Cambio de aceite 5W-30", qty: 1, precio: 950 },
        { nombre: "Filtro de aceite OEM", qty: 1, precio: 280 },
    ];
    const subtotal = items.reduce((s, it) => s + it.precio * it.qty, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    return (
        <div className="min-h-[60vh] bg-white lg:bg-[#F3F4F6] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border shadow-sm">
                <div className="p-5 border-b flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl text-white grid place-items-center" style={{ background: PALETTE.dark }}><Wrench className="h-5 w-5" /></div>
                    <div>
                        <div className="font-semibold">Taller &quot;Motores &amp; Más&quot;</div>
                        <div className="text-xs text-slate-600">Cotización #COT‑2045 • 18 de agosto 2025 • Vigencia 72h</div>
                    </div>
                </div>
                <div className="p-5">
                    <div className="text-sm font-semibold mb-2">Detalles</div>
                    <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="text-left p-2">Concepto</th>
                                <th className="text-center p-2">Cant.</th>
                                <th className="text-right p-2">Precio</th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((it, i) => (
                                <tr key={i} className="border-t">
                                    <td className="p-2">{it.nombre}</td>
                                    <td className="p-2 text-center">{it.qty}</td>
                                    <td className="p-2 text-right">{currency.format(it.precio)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-6 text-sm">
                        <div>Subtotal: <span className="font-medium">{currency.format(subtotal)}</span></div>
                        <div>IVA (16%): <span className="font-medium">{currency.format(iva)}</span></div>
                        <div className="text-lg">Total: <span className="font-semibold">{currency.format(total)}</span></div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button className="w-full px-4 py-3 rounded-xl text-white text-base font-semibold" style={{ background: PALETTE.accent }}>
                            <CheckCircle2 className="inline h-5 w-5 mr-2" /> Aprobar Cotización
                        </button>
                        <button className="w-full px-4 py-3 rounded-xl border text-base font-semibold">
                            <XCircle className="inline h-5 w-5 mr-2" /> Rechazar
                        </button>
                    </div>

                    <div className="mt-4 text-xs text-slate-500">
                        Al aprobar, autorizas al taller a realizar los trabajos indicados. Podrás recibir notificaciones de avance y la factura al finalizar.
                    </div>
                </div>
            </div>
        </div>
    );
}

function Caja({ licenseState }: { licenseState: LicenseState }) {
    const [selected, setSelected] = useState<string | null>(COBROS[0]?.id ?? null);
    const orden = COBROS.find((o) => o.id === selected) || null;
    const [metodo, setMetodo] = useState("Efectivo");
    const [facturar, setFacturar] = useState(true);
    const [pagado, setPagado] = useState(false);

    const limited = licenseState === "limited";

    return (
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
                <div className="rounded-2xl border bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold">Órdenes finalizadas</div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input placeholder="Buscar por cliente/OT…" className="outline-none text-sm w-48" />
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                        {COBROS.map((o) => (
                            <button key={o.id} onClick={() => { setSelected(o.id); setPagado(false); }} className={`w-full text-left rounded-xl border p-3 hover:shadow ${selected===o.id?"ring-2 ring-[#2563EB]": ""}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold">{o.id} • {o.cliente}</div>
                                        <div className="text-xs text-slate-600">{o.vehiculo}</div>
                                    </div>
                                    <div className="text-sm font-semibold">{currency.format(o.saldo)}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-semibold mb-3">Detalle de cobro</div>
                    {!orden && <div className="text-sm text-slate-500">Selecciona una orden para continuar.</div>}
                    {orden && (
                        <div className="space-y-3">
                            <div className="text-sm">OT <span className="font-medium">{orden.id}</span> — {orden.cliente} • {orden.vehiculo}</div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-600">Total</div>
                                <div className="text-xl font-semibold">{currency.format(orden.total)}</div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-600">Saldo</div>
                                <div className="text-lg font-semibold text-red-600">{currency.format(orden.saldo)}</div>
                            </div>

                            <div className="pt-2">
                                <div className="text-xs text-slate-600 mb-1">Método de pago</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {["Efectivo", "Transferencia", "Tarjeta"].map((m) => (
                                        <button key={m} onClick={() => setMetodo(m)} className={`px-3 py-2 rounded-xl border text-sm ${metodo===m?"bg-slate-50 ring-2 ring-[#2563EB]":""}`}>{m}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input id="facturar" type="checkbox" checked={facturar} onChange={(e) => setFacturar(e.target.checked)} disabled={limited} />
                                <label htmlFor="facturar" className={`text-sm ${limited?"text-slate-400":""}`}>Generar factura (CFDI)</label>
                                {limited && <span className="text-[11px] text-amber-700 ml-1">(deshabilitado por licencia)</span>}
                            </div>

                            <div className="flex gap-2 mt-3">
                                <button className="flex-1 px-4 py-2 rounded-xl border">Cancelar</button>
                                <button className="flex-1 px-4 py-2 rounded-xl text-white font-medium" style={{ background: PALETTE.accent }} onClick={() => setPagado(true)}>
                                    <DollarSign className="inline h-5 w-5 mr-2" /> Registrar pago
                                </button>
                            </div>

                            {facturar && !limited && (
                                <div className="mt-3 rounded-xl border p-3 bg-slate-50">
                                    <div className="text-sm font-semibold flex items-center gap-2"><ReceiptText className="h-4 w-4" /> Facturación</div>
                                    <div className="text-xs text-slate-600 mt-1">Al concluir el pago se generará el CFDI (sandbox) y se enviará por email/WhatsApp.</div>
                                </div>
                            )}

                            {pagado && (
                                <div className="mt-3 rounded-xl border p-3 bg-emerald-50">
                                    <div className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4" /> Timbrado en cola (sandbox)</div>
                                    <div className="text-xs text-slate-600 mt-1">Tu CFDI se está generando. Archivos disponibles pronto:</div>
                                    <div className="mt-2 flex gap-2 text-sm">
                                        <a href="#" className="px-3 py-1.5 rounded-xl border">Descargar XML</a>
                                        <a href="#" className="px-3 py-1.5 rounded-xl border">Descargar PDF</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CatalogoView({ catalog, setCatalog }: { catalog: CatalogItem[]; setCatalog: React.Dispatch<React.SetStateAction<CatalogItem[]>> }) {
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState<CatalogItem | null>(null);

    const handleSave = (item: CatalogItem) => {
        if (currentItem) {
            setCatalog(catalog.map((c: CatalogItem) => c.id === item.id ? item : c));
        } else {
            setCatalog([...catalog, { ...item, id: `item-${Date.now()}` }]);
        }
        setShowModal(false);
        setCurrentItem(null);
    };

    const handleDelete = (id: string) => {
        setCatalog(catalog.filter((c: CatalogItem) => c.id !== id));
    };

    const ItemModal = ({ item, onSave, onCancel }: { item: CatalogItem | null; onSave: (it: CatalogItem) => void; onCancel: () => void }) => {
        const [formData, setFormData] = useState<Partial<CatalogItem>>(
            item ?? { nombre: "", tipo: "Servicio", precio: 0 }
        );
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...(prev || {}),
                [name]: name === "precio" ? Number(value) : value,
            }) as Partial<CatalogItem>);
        };

        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-20">
                <div className="w-full max-w-md rounded-2xl bg-white p-5">
                    <h2 className="text-lg font-semibold mb-4">{item ? 'Editar' : 'Añadir'} Elemento</h2>
                    <div className="space-y-3">
                        <input name="nombre" value={formData.nombre ?? ""} onChange={handleChange} placeholder="Nombre" className="w-full rounded-xl border px-3 py-2" />
                        <select name="tipo" value={formData.tipo ?? "Servicio"} onChange={handleChange} className="w-full rounded-xl border px-3 py-2">
                            <option>Servicio</option>
                            <option>Refacción</option>
                        </select>
                        <input name="precio" type="number" value={formData.precio ?? 0} onChange={handleChange} placeholder="Precio" className="w-full rounded-xl border px-3 py-2" />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={onCancel} className="px-4 py-2 rounded-xl border">Cancelar</button>
                        <button onClick={() => onSave({
                            id: item?.id ?? `item-${Date.now()}`,
                            nombre: formData.nombre || "",
                            tipo: (formData.tipo as CatalogItem["tipo"]) || "Servicio",
                            precio: typeof formData.precio === "number" ? formData.precio : Number(formData.precio || 0)
                        })} className="px-4 py-2 rounded-xl text-white" style={{ background: PALETTE.blue }}>Guardar</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6">
            {showModal && <ItemModal item={currentItem} onSave={handleSave} onCancel={() => { setShowModal(false); setCurrentItem(null); }} />}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold">Catálogo</h1>
                <button onClick={() => { setCurrentItem(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium" style={{ background: PALETTE.blue }}>
                    <PlusCircle className="h-5 w-5" /> Añadir Nuevo
                </button>
            </div>
            <div className="rounded-2xl border bg-white p-4">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b">
                        <th className="text-left p-2">Nombre</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-right p-2">Precio</th>
                        <th className="text-right p-2">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {catalog.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-slate-50">
                            <td className="p-2">{item.nombre}</td>
                            <td className="p-2">{item.tipo}</td>
                            <td className="p-2 text-right">{currency.format(item.precio)}</td>
                            <td className="p-2 text-right">
                                <button onClick={() => { setCurrentItem(item); setShowModal(true); }} className="p-1 text-slate-500 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ClientesView({ clientes }: { clientes: Cliente[]; setClientes: React.Dispatch<React.SetStateAction<Cliente[]>> }) {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-semibold mb-4">Clientes</h1>
            <div className="rounded-2xl border bg-white p-4">
                {clientes.map((cliente) => (
                    <div key={cliente.id} className="p-2 border-b flex justify-between items-center">
                        <div>
                            <p className="font-medium">{cliente.nombre}</p>
                            <p className="text-xs text-slate-600">{cliente.telefono}</p>
                        </div>
                        <div>
                            <button className="p-1 text-slate-500 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                            <button className="p-1 text-slate-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VehiculosView({ vehiculos, clientes }: { vehiculos: Vehiculo[]; setVehiculos: React.Dispatch<React.SetStateAction<Vehiculo[]>>; clientes: Cliente[] }) {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-semibold mb-4">Vehículos</h1>
            <div className="rounded-2xl border bg-white p-4">
                {vehiculos.map((v) => (
                    <div key={v.id} className="p-2 border-b flex justify-between items-center">
                        <div>
                            <p className="font-medium">{v.desc}</p>
                            <p className="text-xs text-slate-600">Propietario: {clientes.find((c) => c.id === v.clienteId)?.nombre}</p>
                        </div>
                        <div>
                            <button className="p-1 text-slate-500 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                            <button className="p-1 text-slate-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ConfiguracionView() {
    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Building className="h-4 w-4" /> Información del taller</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-slate-600">Nombre</div>
                        <div className="font-medium">Motores &amp; Más</div>
                    </div>
                    <div>
                        <div className="text-slate-600">RFC</div>
                        <div className="font-medium">ABC010203XYZ</div>
                    </div>
                </div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2"><KeyRound className="h-4 w-4" /> Seguridad</div>
                <div className="text-xs text-slate-600">2FA recomendado. Gestión de usuarios y roles en construcción.</div>
            </div>
        </div>
    );
}


export default function Pos() {
    const [route, setRoute] = useState<string>("/dashboard");
    const [licenseState] = useState<LicenseState>("active");
    const [envHost, setEnvHost] = useState<"LAN" | "EXTERNAL">("LAN");
    const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

    // State for mock data
    const [catalog, setCatalog] = useState(CATALOG_INIT);
    const [clientes, setClientes] = useState(CLIENTES_INIT);
    const [vehiculos, setVehiculos] = useState(VEHICULOS_INIT);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const host = window.location?.hostname || "taller.local";
            setEnvHost(host.includes("aprobar") ? "EXTERNAL" : "LAN");
        }
        const handler = (e: Event) => { e.preventDefault(); deferredRef.current = e as BeforeInstallPromptEvent; };
        window.addEventListener("beforeinstallprompt", handler as EventListener);
        return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
    }, []);

    const onInstallPrompt = () => {
        if (deferredRef.current) {
            deferredRef.current.prompt();
            deferredRef.current = null;
        } else {
            console.log("La PWA ya está instalada o el navegador no ha emitido el evento de instalación.");
        }
    };

    return (
        <div className="min-h-screen" style={{ background: PALETTE.light, color: "#0f172a" }}>
            <div className="flex min-h-screen">
                { route !== "/approve/[token]" && <Sidebar route={route} onNavigate={(r) => r!=="__toggleDrawer" && setRoute(r)} /> }
                <div className="flex-1 flex flex-col">
                    { route !== "/approve/[token]" && <Topbar route={route} envHost={envHost} onNavigate={(r) => r!=="__toggleDrawer" && setRoute(r)} onInstallPrompt={onInstallPrompt} /> }

                    {/* Content switcher */}
                    {route === "/dashboard" && <Dashboard licenseState={licenseState} />}
                    {route === "/taller/cotizacion" && <Cotizacion catalog={catalog} clientes={clientes} vehiculos={vehiculos} />}
                    {route === "/taller/ordenes" && <OrdenesTrabajo />}
                    {route === "/dashboard/caja" && <Caja licenseState={licenseState} />}
                    {route === "/catalogo" && <CatalogoView catalog={catalog} setCatalog={setCatalog} />}
                    {route === "/clientes" && <ClientesView clientes={clientes} setClientes={setClientes} />}
                    {route === "/vehiculos" && <VehiculosView vehiculos={vehiculos} setVehiculos={setVehiculos} clientes={clientes} />}
                    {route === "/configuracion" && <ConfiguracionView />}
                    {route === "/approve/[token]" && <AprobacionPublica />}

                    { route !== "/approve/[token]" && (
                        <footer className="px-4 md:px-6 py-6 text-xs text-slate-500 mt-auto">
                            <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Nexora POS — Mockup de alta fidelidad • Paleta: <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{background:PALETTE.accent}} /> #F97316</span>,
                                <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{background:PALETTE.blue}} /> #2563EB</span>,
                                <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{background:PALETTE.dark}} /> #111827</span>,
                                <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{background:PALETTE.light}} /> #F3F4F6</span>
                            </div>
                        </footer>
                    )}
                </div>
            </div>

            <div className="fixed bottom-4 right-4 bg-white border rounded-full shadow px-2 py-1 flex items-center gap-2 text-xs z-20">
                <span className="hidden sm:inline">Vistas:</span>
                {[
                    ["Dashboard", "/dashboard"],
                    ["Cotización", "/taller/cotizacion"],
                    ["Órdenes", "/taller/ordenes"],
                    ["Caja", "/dashboard/caja"],
                    ["Catálogo", "/catalogo"],
                    ["Clientes", "/clientes"],
                    ["Vehículos", "/vehiculos"],
                    ["Config.", "/configuracion"],
                    ["Aprobación", "/approve/[token]"],
                ].map(([lbl, r]) => (
                    <button key={r as string} onClick={() => setRoute(r as string)} className={`px-2 py-1 rounded-full border ${route===r?"bg-slate-50 ring-1 ring-slate-200":""}`}>{lbl}</button>
                ))}
            </div>
        </div>
    );
}
