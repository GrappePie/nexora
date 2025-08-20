"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Boxes,
  Database,
  ClipboardList,
  CreditCard,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
} from "recharts";

import { PALETTE, currency } from "./constants";
import { LicenseState } from "@/types/pos";

function licenseBadge(state: LicenseState) {
  const map: Record<LicenseState, { label: string; className: string }> = {
    active: { label: "Activa", className: "bg-green-100 text-green-700" },
    expiring: { label: "Próx. a expirar", className: "bg-amber-100 text-amber-700" },
    grace: { label: "En gracia", className: "bg-amber-100 text-amber-700" },
    limited: { label: "Limitado", className: "bg-red-100 text-red-700" },
  };
  return map[state];
}

function HealthDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />;
}

function KpiCard({ title, value, foot }: { title: string; value: string; foot?: React.ReactNode }) {
  const spark = [
    { d: "8:00", v: 1200 },
    { d: "10:00", v: 2400 },
    { d: "12:00", v: 1800 },
    { d: "14:00", v: 4200 },
    { d: "16:00", v: 5200 },
    { d: "18:00", v: 6800 },
  ];

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

export default function Dashboard({ licenseState }: { licenseState: LicenseState }) {
  const lic = licenseBadge(licenseState);
  const storageUsedPct = 62;
  const approvalsPend = 3;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 bg-white flex items-start gap-3">
          <ShieldCheck
            className="h-5 w-5 mt-0.5"
            style={{
              color:
                licenseState === "limited"
                  ? "#ef4444"
                  : licenseState === "expiring" || licenseState === "grace"
                  ? "#d97706"
                  : "#16a34a",
            }}
          />
          <div>
            <div className="text-sm font-medium">
              Licencia: <span className={`px-2 py-0.5 rounded-full text-[10px] ${lic.className}`}>{lic.label}</span>
            </div>
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
            <div className="flex items-center gap-2">
              <HealthDot ok={true} /> BFF /api
            </div>
            <div className="flex items-center gap-2">
              <HealthDot ok={true} /> Core
            </div>
            <div className="flex items-center gap-2">
              <HealthDot ok={true} /> Cloudflared
            </div>
            <div className="flex items-center gap-2">
              <HealthDot ok={true} /> MinIO
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-600">
            Pruebas rápidas: <button className="underline">/api/health</button> •
            <button className="underline">/approve/check</button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="rounded-2xl border bg-white p-4 text-left hover:shadow transition">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-600" />
            <div className="font-medium">Nueva cotización</div>
          </div>
          <div className="text-xs text-slate-600 mt-1">Crea y comparte para aprobación</div>
        </button>
        <button className="rounded-2xl border bg-white p-4 text-left hover:shadow transition">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-slate-600" />
            <div className="font-medium">Ver órdenes</div>
          </div>
          <div className="text-xs text-slate-600 mt-1">Kanban del taller</div>
        </button>
        <button className="rounded-2xl border bg-white p-4 text-left hover:shadow transition">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-slate-600" />
            <div className="font-medium">Cobrar</div>
          </div>
          <div className="text-xs text-slate-600 mt-1">Registrar pago y facturar</div>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Boxes className="h-4 w-4" /> Backups
          </div>
          <div className="text-xs text-slate-600">
            Último backup: 18/08/2025 02:10 • Retención: 14 días • Próximo: 02:00
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <button className="px-3 py-1.5 rounded-xl border">Ver política</button>
            <button className="px-3 py-1.5 rounded-xl border">Restaurar prueba</button>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Database className="h-4 w-4" /> MinIO
          </div>
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

