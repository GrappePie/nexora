import { render, screen } from '@testing-library/react';
import React from 'react';
import ConfiguracionView from '@/components/pos/configuracion';

describe('Configuracion', () => {
  it('renders without crashing', () => {
    render(<ConfiguracionView />);
    expect(screen.getByText(/Información del taller/i)).toBeInTheDocument();
  });
});
