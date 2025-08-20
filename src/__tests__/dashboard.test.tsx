import { render, screen } from '@testing-library/react';
import Dashboard from '@/components/pos/dashboard';
import React from 'react';

describe('Dashboard', () => {
  it('renders without crashing', () => {
    render(<Dashboard licenseState="active" />);
    expect(screen.getByText(/Ingresos de hoy/i)).toBeInTheDocument();
  });
});
