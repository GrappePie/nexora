import { render, screen } from '@testing-library/react';
import React from 'react';
import ConfiguracionView from '@/components/pos/configuracion';
import { useSession } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

describe('Configuracion', () => {
  it('renders for admin role', () => {
    (useSession as any).mockReturnValue({ data: { roles: ['admin'] } });
    render(<ConfiguracionView />);
    expect(screen.getByText(/Información del taller/i)).toBeInTheDocument();
  });
});
