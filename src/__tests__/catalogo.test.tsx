import { render, screen } from '@testing-library/react';
import React from 'react';
import CatalogoView from '@/components/pos/catalogo';
import { I18nProvider } from '@/lib/i18n';
import type { CatalogItem } from '@/types/pos';

describe('Catalogo', () => {
  it('renders without crashing', () => {
    const Wrapper = () => {
      const [catalog, setCatalog] = React.useState<CatalogItem[]>([]);
      return (
        <I18nProvider>
          <CatalogoView catalog={catalog} setCatalog={setCatalog} />
        </I18nProvider>
      );
    };
    render(<Wrapper />);
    expect(screen.getByText(/Catálogo/i)).toBeInTheDocument();
  });
});
