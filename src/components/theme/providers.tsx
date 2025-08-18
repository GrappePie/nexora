"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={100}>
      {children}
      <Toaster richColors theme="dark" position="top-center" />
    </TooltipProvider>
  );
}

