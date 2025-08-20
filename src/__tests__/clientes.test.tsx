import { render, screen } from '@testing-library/react';
import React from 'react';
import ClientesView from '@/components/pos/clientes';
import type { Cliente } from '@/types/pos';

describe('Clientes', () => {
  it('renders without crashing', () => {
    const Wrapper = () => {
      const [clientes, setClientes] = React.useState<Cliente[]>([
        { id: 'c1', nombre: 'Ana', telefono: '555' },
      ]);
      return <ClientesView clientes={clientes} setClientes={setClientes} />;
    };
    render(<Wrapper />);
    expect(screen.getByText(/Clientes/i)).toBeInTheDocument();
  });
});
