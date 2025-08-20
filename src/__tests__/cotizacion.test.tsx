import { render, screen } from '@testing-library/react';
import React from 'react';
import Cotizacion from '@/components/pos/taller/cotizacion';
import { I18nProvider } from '@/lib/i18n';
import type { CatalogItem, Cliente, Vehiculo } from '@/types/pos';

describe('Cotizacion', () => {
  it('renders without crashing', () => {
    const catalog: CatalogItem[] = [{ id: 'it1', nombre: 'Aceite', precio: 100, tipo: 'Servicio' }];
    const clientes: Cliente[] = [{ id: 'c1', nombre: 'Juan', telefono: '123' }];
    const vehiculos: Vehiculo[] = [{ id: 'v1', desc: 'Auto', clienteId: 'c1' }];
    render(
      <I18nProvider>
        <Cotizacion catalog={catalog} clientes={clientes} vehiculos={vehiculos} />
      </I18nProvider>
    );
    expect(screen.getByText(/Resumen de cotización/i)).toBeInTheDocument();
  });
});
