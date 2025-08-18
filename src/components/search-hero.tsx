"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SearchHero() {
  const [q, setQ] = React.useState("");

  function onSearch() {
    if (!q.trim()) {
      toast("Ingresa un término de búsqueda");
      return;
    }
    toast.success(`Buscando “${q}” en la documentación...`);
    // Aquí podrías navegar a /docs con query param
  }

  return (
    <div className="mt-6 max-w-md mx-auto flex gap-2">
      <Input
        placeholder="Buscar en documentación"
        aria-label="Buscar en documentación"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Button variant="secondary" onClick={onSearch}>Buscar</Button>
    </div>
  );
}

