import { render, screen } from '@testing-library/react';
import Dashboard from '@/components/pos/dashboard';
import React from 'react';
import { useSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

describe('Dashboard RBAC', () => {
  it('denies access without admin role', () => {
    (useSession as any).mockReturnValue({ data: { roles: ['user'] } });
    render(<Dashboard licenseState="active" />);
    expect(screen.getByText(/Acceso denegado/i)).toBeInTheDocument();
  });

  it('renders for admin role', () => {
    (useSession as any).mockReturnValue({ data: { roles: ['admin'] } });
    render(<Dashboard licenseState="active" />);
    expect(screen.getByText(/Ingresos de hoy/i)).toBeInTheDocument();
  });
});
