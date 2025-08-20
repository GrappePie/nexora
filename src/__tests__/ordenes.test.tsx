import { render, screen } from '@testing-library/react';
import React from 'react';
import OrdenesTrabajo from '@/components/pos/taller/ordenes';

describe('Ordenes', () => {
  it('renders without crashing', () => {
    render(<OrdenesTrabajo />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });
});
