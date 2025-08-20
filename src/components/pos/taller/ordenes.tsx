"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ClipboardList, Upload } from "lucide-react";

import { PALETTE } from "../constants";
import { WorkOrder } from "@/types/pos";

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

export default function OrdenesTrabajo() {
  const [kanban] = useState<Record<string, WorkOrder[]>>(KANBAN_INIT);
  const [detalle, setDetalle] = useState<WorkOrder | null>(null);
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);
  const [errorEvidencias, setErrorEvidencias] = useState<string | null>(null);
  const [errorUpload, setErrorUpload] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILES = 6;
  const MAX_MB = 4;

  const onUpload = (files: FileList | null) => {
    if (!files || !detalle) return;
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
    Promise.all(readers).then(async (imgs) => {
      setUploading(true);
      try {
        const res = await fetch("/evidencias", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ otId: detalle.id, evidencias: imgs }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEvidencias((prev) => [...prev, ...(data || [])]);
        setErrorUpload(null);
      } catch {
        setErrorUpload("Error al subir evidencias");
      } finally {
        setUploading(false);
      }
    });
  };

  useEffect(() => {
    if (!detalle) return;
    setLoadingEvidencias(true);
    setErrorEvidencias(null);
    fetch(`/evidencias?otId=${detalle.id}`)
      .then((r) => r.json())
      .then((data) => setEvidencias(data || []))
      .catch(() => setErrorEvidencias("Error al cargar evidencias"))
      .finally(() => setLoadingEvidencias(false));
  }, [detalle]);

  const Column = ({ title, cards }: { title: string; cards: WorkOrder[] }) => (
    <div className="rounded-2xl bg-slate-50 border p-3 flex flex-col min-h-[320px]">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="space-y-2">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setDetalle(c)}
            className="w-full text-left rounded-xl bg-white border p-3 hover:shadow"
          >
            <div className="text-sm font-semibold">{c.id}</div>
            <div className="text-xs text-slate-600">
              {c.cliente} • {c.vehiculo}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Mecánico: {c.mecanico}
            </div>
          </button>
        ))}
        {cards.length === 0 && (
          <div className="text-xs text-slate-500">Sin elementos</div>
        )}
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
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetalle(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="h-5 w-5" /> Detalle {detalle.id}
              </div>
              <button className="w-9 h-9 rounded-xl border" onClick={() => setDetalle(null)}>
                ✕
              </button>
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
                <div className="text-sm font-semibold">
                  Evidencias <span className="text-xs text-slate-500">({evidencias.length}/{MAX_FILES})</span>
                </div>
                <div className="mt-2">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onUpload(e.target.files)}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white"
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Subiendo…" : "Subir fotos"}
                    </button>
                    <button className="px-3 py-2 rounded-xl border" disabled={uploading}>Tomar foto</button>
                  </div>
                  {errorUpload && (
                    <div className="mt-2 text-xs text-red-600">{errorUpload}</div>
                  )}
                  {loadingEvidencias && (
                    <div className="mt-2 text-xs text-slate-500">Cargando evidencias…</div>
                  )}
                  {errorEvidencias && (
                    <div className="mt-2 text-xs text-red-600">{errorEvidencias}</div>
                  )}
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {evidencias.map((src, i) => (
                      <Image
                        key={i}
                        src={src}
                        width={160}
                        height={80}
                        className="w-full h-20 object-cover rounded-lg border"
                        alt={`Evidencia ${i + 1}`}
                      />
                    ))}
                    {evidencias.length === 0 && !loadingEvidencias && (
                      <div className="col-span-full text-xs text-slate-500">
                        Aún no hay evidencias subidas.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border">Guardar</button>
              <button
                className="px-4 py-2 rounded-xl text-white font-medium"
                style={{ background: PALETTE.blue }}
              >
                Actualizar estado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

