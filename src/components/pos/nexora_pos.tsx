"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  CreditCard,
  Users,
  Car,
  Settings,
  Package,
  FileText,
  Search,
  HardDrive,
  ShieldCheck,
  Database,
} from "lucide-react";

import { PALETTE } from "./constants";
import {
  CatalogItem,
  Cliente,
  Vehiculo,
  LicenseState,
  BeforeInstallPromptEvent,
} from "@/types/pos";
import {
  Dashboard,
  Cotizacion,
  OrdenesTrabajo,
  Caja,
  CatalogoView,
  ClientesView,
  VehiculosView,
  ConfiguracionView,
  AprobacionPublica,
} from ".";
import { useTranslations } from "@/lib/i18n";

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

function Sidebar({
  route,
  onNavigate,
}: {
  route: string;
  onNavigate: (r: string) => void;
}) {
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
              <span
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: PALETTE.accent, color: "#111" }}
              >
                $
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t border-white/10 text-xs text-white/60">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Licencia: <span className="ml-1 text-white">Activa</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Database className="h-4 w-4" /> Almacenamiento
        </div>
        <div className="mt-1 h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full" style={{ width: "62%", background: PALETTE.blue }} />
        </div>
        <div className="mt-1">62% usado</div>
      </div>
    </aside>
  );
}

function Topbar({
  onNavigate,
  route,
  envHost,
  onInstallPrompt,
}: {
  onNavigate: (r: string) => void;
  route: string;
  envHost: "LAN" | "EXTERNAL";
  onInstallPrompt: () => void;
}) {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 md:px-6 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl border"
          onClick={() => onNavigate("__toggleDrawer")}
          aria-label={t.actions.openMenu}
        >
          ☰
        </button>
        <div className="text-sm text-slate-600">{route}</div>
        <span
          className={`hidden sm:inline ml-2 text-[10px] px-2 py-0.5 rounded-full border ${
            envHost === "EXTERNAL" ? "border-amber-300 text-amber-700" : "border-emerald-300 text-emerald-700"
          }`}
        >
          Host: {envHost}
        </span>
      </div>
        <div className="flex items-center gap-2">
          <button
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
            onClick={onInstallPrompt}
          >
            <HardDrive className="h-4 w-4" /> Instalar PWA
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border bg-white">
            <Search className="h-4 w-4 text-slate-400" />
            <label htmlFor="global-search" className="sr-only">
              {t.search.global}
            </label>
            <input
              id="global-search"
              aria-label={t.search.global}
              placeholder={t.search.global}
              className="outline-none text-sm w-56"
            />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200" title="Usuario" />
        </div>
    </header>
  );
}

export default function Pos() {
  const [route, setRoute] = useState<string>("/dashboard");
  const [licenseState] = useState<LicenseState>("active");
  const [envHost, setEnvHost] = useState<"LAN" | "EXTERNAL">("LAN");
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  const [catalog, setCatalog] = useState(CATALOG_INIT);
  const [clientes, setClientes] = useState(CLIENTES_INIT);
  const [vehiculos, setVehiculos] = useState(VEHICULOS_INIT);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location?.hostname || "taller.local";
      setEnvHost(host.includes("aprobar") ? "EXTERNAL" : "LAN");
    }
    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
    };
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
        {route !== "/approve/[token]" && (
          <Sidebar route={route} onNavigate={(r) => r !== "__toggleDrawer" && setRoute(r)} />
        )}
        <div className="flex-1 flex flex-col">
          {route !== "/approve/[token]" && (
            <Topbar
              route={route}
              envHost={envHost}
              onNavigate={(r) => r !== "__toggleDrawer" && setRoute(r)}
              onInstallPrompt={onInstallPrompt}
            />
          )}

          {route === "/dashboard" && <Dashboard licenseState={licenseState} />}
          {route === "/taller/cotizacion" && (
            <Cotizacion catalog={catalog} clientes={clientes} vehiculos={vehiculos} />
          )}
          {route === "/taller/ordenes" && <OrdenesTrabajo />}
          {route === "/dashboard/caja" && <Caja licenseState={licenseState} />}
          {route === "/catalogo" && <CatalogoView catalog={catalog} setCatalog={setCatalog} />}
          {route === "/clientes" && <ClientesView clientes={clientes} setClientes={setClientes} />}
          {route === "/vehiculos" && (
            <VehiculosView vehiculos={vehiculos} setVehiculos={setVehiculos} clientes={clientes} />
          )}
          {route === "/configuracion" && <ConfiguracionView />}
          {route === "/approve/[token]" && <AprobacionPublica />}

          {route !== "/approve/[token]" && (
            <footer className="px-4 md:px-6 py-6 text-xs text-slate-500 mt-auto">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Nexora POS — Mockup de alta fidelidad • Paleta:
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm" style={{ background: PALETTE.accent }} />
                  #F97316
                </span>,
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm" style={{ background: PALETTE.blue }} />
                  #2563EB
                </span>,
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm" style={{ background: PALETTE.dark }} />
                  #111827
                </span>,
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm" style={{ background: PALETTE.light }} />
                  #F3F4F6
                </span>
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
          <button
            key={r as string}
            onClick={() => setRoute(r as string)}
            className={`px-2 py-1 rounded-full border ${
              route === r ? "bg-slate-50 ring-1 ring-slate-200" : ""
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

