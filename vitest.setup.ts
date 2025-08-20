import React from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
vi.stubGlobal('ResizeObserver', ResizeObserver);

// Basic fetch stub returning empty arrays
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({ json: () => Promise.resolve([]) }) as any
));

vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return React.createElement('img', { src: typeof src === 'string' ? src : src.src, alt, ...rest });
  },
}));
