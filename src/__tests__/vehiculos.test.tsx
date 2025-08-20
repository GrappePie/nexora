import { render, screen } from '@testing-library/react';
import React from 'react';
import VehiculosView from '@/components/pos/vehiculos';
import type { Vehiculo, Cliente } from '@/types/pos';

describe('Vehiculos', () => {
  it('renders without crashing', () => {
    const Wrapper = () => {
      const [vehiculos, setVehiculos] = React.useState<Vehiculo[]>([
        { id: 'v1', desc: 'Auto', clienteId: 'c1' },
      ]);
      const [clientes] = React.useState<Cliente[]>([
        { id: 'c1', nombre: 'Ana', telefono: '555' },
      ]);
      return (
        <VehiculosView
          vehiculos={vehiculos}
          setVehiculos={setVehiculos}
          clientes={clientes}
        />
      );
    };
    render(<Wrapper />);
    expect(screen.getByText(/Vehículos/i)).toBeInTheDocument();
  });
});
