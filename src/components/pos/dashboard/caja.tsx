"use client";

import React, { useState } from "react";
import { Search, DollarSign, ReceiptText, Activity } from "lucide-react";

import { PALETTE, currency } from "../constants";
import { LicenseState, WorkOrder } from "@/types/pos";

type Cobro = WorkOrder & { saldo: number };

const COBROS: Cobro[] = [
  { id: "OT-0995", cliente: "Ana Q.", vehiculo: "Corolla 2014", mecanico: "", total: 3120, saldo: 3120 },
  { id: "OT-1002", cliente: "Pedro M.", vehiculo: "Civic 2018", mecanico: "", total: 4890, saldo: 4890 },
];

export default function Caja({ licenseState }: { licenseState: LicenseState }) {
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
              <button
                key={o.id}
                onClick={() => {
                  setSelected(o.id);
                  setPagado(false);
                }}
                className={`w-full text-left rounded-xl border p-3 hover:shadow ${
                  selected === o.id ? "ring-2 ring-[#2563EB]" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {o.id} • {o.cliente}
                    </div>
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
              <div className="text-sm">
                OT <span className="font-medium">{orden.id}</span> — {orden.cliente} • {orden.vehiculo}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Total</div>
                <div className="text-xl font-semibold">{currency.format(orden.total)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Saldo</div>
                <div className="text-lg font-semibold text-red-600">
                  {currency.format(orden.saldo)}
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs text-slate-600 mb-1">Método de pago</div>
                <div className="grid grid-cols-3 gap-2">
                  {["Efectivo", "Transferencia", "Tarjeta"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetodo(m)}
                      className={`px-3 py-2 rounded-xl border text-sm ${
                        metodo === m ? "bg-slate-50 ring-2 ring-[#2563EB]" : ""
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  id="facturar"
                  type="checkbox"
                  checked={facturar}
                  onChange={(e) => setFacturar(e.target.checked)}
                  disabled={limited}
                />
                <label
                  htmlFor="facturar"
                  className={`text-sm ${limited ? "text-slate-400" : ""}`}
                >
                  Generar factura (CFDI)
                </label>
                {limited && (
                  <span className="text-[11px] text-amber-700 ml-1">
                    (deshabilitado por licencia)
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 px-4 py-2 rounded-xl border">Cancelar</button>
                <button
                  className="flex-1 px-4 py-2 rounded-xl text-white font-medium"
                  style={{ background: PALETTE.accent }}
                  onClick={() => setPagado(true)}
                >
                  <DollarSign className="inline h-5 w-5 mr-2" /> Registrar pago
                </button>
              </div>

              {facturar && !limited && (
                <div className="mt-3 rounded-xl border p-3 bg-slate-50">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <ReceiptText className="h-4 w-4" /> Facturación
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Al concluir el pago se generará el CFDI (sandbox) y se enviará por email/WhatsApp.
                  </div>
                </div>
              )}

              {pagado && (
                <div className="mt-3 rounded-xl border p-3 bg-emerald-50">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Timbrado en cola (sandbox)
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Tu CFDI se está generando. Archivos disponibles pronto:
                  </div>
                  <div className="mt-2 flex gap-2 text-sm">
                    <a href="#" className="px-3 py-1.5 rounded-xl border">
                      Descargar XML
                    </a>
                    <a href="#" className="px-3 py-1.5 rounded-xl border">
                      Descargar PDF
                    </a>
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

