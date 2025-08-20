"use client";

import React from "react";
import { Wrench, CheckCircle2, XCircle } from "lucide-react";

import { PALETTE, currency } from "./constants";

export default function AprobacionPublica() {
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
          <div
            className="w-10 h-10 rounded-xl text-white grid place-items-center"
            style={{ background: PALETTE.dark }}
          >
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Taller &quot;Motores &amp; Más&quot;</div>
            <div className="text-xs text-slate-600">
              Cotización #COT‑2045 • 18 de agosto 2025 • Vigencia 72h
            </div>
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
            <div>
              Subtotal: <span className="font-medium">{currency.format(subtotal)}</span>
            </div>
            <div>
              IVA (16%): <span className="font-medium">{currency.format(iva)}</span>
            </div>
            <div className="text-lg">
              Total: <span className="font-semibold">{currency.format(total)}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              className="w-full px-4 py-3 rounded-xl text-white text-base font-semibold"
              style={{ background: PALETTE.accent }}
            >
              <CheckCircle2 className="inline h-5 w-5 mr-2" /> Aprobar Cotización
            </button>
            <button className="w-full px-4 py-3 rounded-xl border text-base font-semibold">
              <XCircle className="inline h-5 w-5 mr-2" /> Rechazar
            </button>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Al aprobar, autorizas al taller a realizar los trabajos indicados. Podrás recibir
            notificaciones de avance y la factura al finalizar.
          </div>
        </div>
      </div>
    </div>
  );
}

