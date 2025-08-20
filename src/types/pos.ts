export type CatalogItem = {
  id: string;
  tipo: "Servicio" | "Refacción";
  nombre: string;
  precio: number;
};

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
};

export type Vehiculo = {
  id: string;
  desc: string;
  clienteId: string;
};

export type WorkOrder = {
  id: string;
  cliente: string;
  vehiculo: string;
  mecanico: string;
  total: number;
  saldo?: number;
};

export type LicenseState = "active" | "expiring" | "grace" | "limited";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string[] }>;
}

