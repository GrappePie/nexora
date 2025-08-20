import { render, screen } from '@testing-library/react';
import React from 'react';
import Caja from '@/components/pos/dashboard/caja';
import { I18nProvider } from '@/lib/i18n';

describe('Caja', () => {
  it('renders without crashing', () => {
    render(
      <I18nProvider>
        <Caja licenseState="active" />
      </I18nProvider>
    );
    expect(screen.getByText(/Órdenes finalizadas/i)).toBeInTheDocument();
  });
});
