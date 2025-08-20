"use client";

import React from "react";
import { Building, KeyRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { hasRole } from "@/lib/utils";

export default function ConfiguracionView() {
  const { data } = useSession();
  if (!hasRole(data?.roles, "admin")) {
    return <div>Acceso denegado</div>;
  }
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Building className="h-4 w-4" /> Información del taller
        </div>
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
        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Seguridad
        </div>
        <div className="text-xs text-slate-600">
          2FA recomendado. Gestión de usuarios y roles en construcción.
        </div>
      </div>
    </div>
  );
}

