"use client";

import React, { useMemo, useState } from "react";
import { Search, Share2, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

import { CatalogItem, Cliente, Vehiculo } from "@/types/pos";
import { PALETTE, currency } from "../constants";
import { useTranslations } from "@/lib/i18n";

const BASE_EXTERNAL = "https://aprobar.nexora.com";

export default function Cotizacion({
  catalog,
  clientes,
  vehiculos,
  }: {
    catalog: CatalogItem[];
    clientes: Cliente[];
    vehiculos: Vehiculo[];
  }) {
  const [clienteId, setClienteId] = useState<string>("cli-01");
  const [vehiculoId, setVehiculoId] = useState<string>("veh-01");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<{
    id: string;
    nombre: string;
    precio: number;
    qty: number;
    tipo: string;
  }[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const cliente = clientes.find((c) => c.id === clienteId)!;
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId)!;
    const t = useTranslations();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return catalog.filter(
      (i) => i.nombre.toLowerCase().includes(q) || i.tipo.toLowerCase().includes(q)
    );
  }, [query, catalog]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.precio * it.qty, 0),
    [items]
  );
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const addItem = (row: CatalogItem) => {
    setItems((prev) => {
      const i = prev.find((p) => p.id === row.id);
      if (i) return prev.map((p) => (p.id === row.id ? { ...p, qty: p.qty + 1 } : p));
      return [
        ...prev,
        { id: row.id, nombre: row.nombre, precio: row.precio, qty: 1, tipo: row.tipo },
      ];
    });
  };

  const publicUrl = token ? `${BASE_EXTERNAL}/approve/${token}` : "";
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Hola ${cliente?.nombre}, te comparto la cotización para tu ${
      vehiculo?.desc
    }. Total: ${currency.format(total)}. Aprueba aquí: ${publicUrl}`,
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const input = document.getElementById(
        "publicUrlInput"
      ) as HTMLInputElement | null;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand("copy");
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
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <div className="text-xs text-slate-500 mt-1">
                Tel: {cliente?.telefono}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600">Vehículo</label>
              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              >
                {vehiculos
                  .filter((v) => v.clienteId === clienteId)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.desc}
                    </option>
                  ))}
              </select>
              <div className="text-xs text-slate-500 mt-1">
                Asociado a: {cliente?.nombre}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Servicios y refacciones</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white">
              <Search className="h-4 w-4 text-slate-400" />
              <label htmlFor="catalog-search" className="sr-only">
                {t.search.catalog}
              </label>
              <input
                id="catalog-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search.catalog}
                aria-label={t.search.catalog}
                className="outline-none text-sm w-48"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium">{row.nombre}</div>
                  <div className="text-xs text-slate-500">{row.tipo}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">
                    {currency.format(row.precio)}
                  </div>
                  <button
                    onClick={() => addItem(row)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                    style={{ background: PALETTE.blue }}
                  >
                    Agregar
                  </button>
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
            {items.length === 0 && (
              <div className="text-sm text-slate-500">
                Agrega elementos del catálogo…
              </div>
            )}
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between gap-3 border rounded-xl p-2"
              >
                <div>
                  <div className="text-sm font-medium">{it.nombre}</div>
                  <div className="text-xs text-slate-500">{it.tipo}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((p) =>
                          p.id === it.id
                            ? { ...p, qty: Math.max(1, p.qty - 1) }
                            : p
                        )
                      )
                    }
                    className="w-7 h-7 rounded-lg border"
                  >
                    −
                  </button>
                  <div className="w-8 text-center text-sm">{it.qty}</div>
                  <button
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((p) =>
                          p.id === it.id ? { ...p, qty: p.qty + 1 } : p
                        )
                      )
                    }
                    className="w-7 h-7 rounded-lg border"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm font-semibold">
                  {currency.format(it.precio * it.qty)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-3 space-y-1">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>IVA (16%)</span>
              <span>{currency.format(iva)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-800">
              <span className="text-sm">Total</span>
              <span className="text-xl font-semibold">
                {currency.format(total)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Vigencia de la cotización: 72h
            </div>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600">{error}</div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
              style={{ background: PALETTE.accent }}
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const res = await fetch("/cotizacion", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      clienteId,
                      vehiculoId,
                      items,
                      total,
                    }),
                  });
                  if (!res.ok) throw new Error();
                  const data = await res.json();
                  setToken(data?.token || null);
                  setShowShare(true);
                } catch {
                  setError("No se pudo guardar la cotización.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Share2 className="h-4 w-4" />
              {loading ? "Guardando…" : "Guardar y Compartir para Aprobación"}
            </button>
            <button className="px-4 py-2 rounded-xl border">Guardar borrador</button>
          </div>
        </div>
          <div className="rounded-2xl border bg-white p-4">
            <label htmlFor="internal-notes" className="text-xs text-slate-600">
              {t.notes.internal}
            </label>
            <textarea
              id="internal-notes"
              className="mt-2 w-full rounded-xl border p-2 min-h-[90px]"
              placeholder={t.notes.placeholder}
              aria-label={t.notes.internal}
            />
          </div>
        </div>
      {showShare && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowShare(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <QrCode className="h-5 w-5" /> Compartir cotización
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Envía el enlace al cliente para aprobar o rechazar desde su
              dispositivo.
            </div>
            <div className="mt-3">
              <QRCodeCanvas value={publicUrl} size={128} />
            </div>
            <div className="mt-3 flex items-center gap-2">
                <label htmlFor="publicUrlInput" className="sr-only">
                  {t.share.publicUrl}
                </label>
                <input
                  id="publicUrlInput"
                  className="flex-1 rounded-xl border px-3 py-2 text-sm"
                  value={publicUrl}
                  readOnly
                  aria-label={t.share.publicUrl}
                />
              <button className="px-3 py-2 rounded-xl border" onClick={handleCopy}>
                Copiar
              </button>
            </div>
            <div className="mt-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium"
                style={{ background: PALETTE.blue }}
              >
                <Share2 className="h-4 w-4" /> Enviar por WhatsApp
              </a>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl border"
                onClick={() => setShowShare(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

