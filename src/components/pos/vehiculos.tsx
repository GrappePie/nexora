"use client";

import React from "react";
import { Edit, Trash2 } from "lucide-react";

import { Vehiculo, Cliente } from "@/types/pos";

export default function VehiculosView({
  vehiculos,
  clientes,
}: {
  vehiculos: Vehiculo[];
  setVehiculos: React.Dispatch<React.SetStateAction<Vehiculo[]>>;
  clientes: Cliente[];
}) {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Vehículos</h1>
      <div className="rounded-2xl border bg-white p-4">
        {vehiculos.map((v) => (
          <div
            key={v.id}
            className="p-2 border-b flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{v.desc}</p>
              <p className="text-xs text-slate-600">
                Propietario: {clientes.find((c) => c.id === v.clienteId)?.nombre}
              </p>
            </div>
            <div>
              <button className="p-1 text-slate-500 hover:text-blue-600">
                <Edit className="h-4 w-4" />
              </button>
              <button className="p-1 text-slate-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

