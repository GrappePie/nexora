import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ForgotPasswordPage from '@/app/forgot-password/page';
import ResetPasswordPage from '@/app/reset-password/[token]/page';
import { ApproveActions } from '@/app/approve/[token]/page';
import { vi, describe, it, beforeEach, expect } from 'vitest';

vi.mock('@/lib/db', () => ({
  enqueueOperation: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'tok' }),
}));

import { enqueueOperation } from '@/lib/db';

describe('offline ui operations', () => {
  beforeEach(() => {
    (enqueueOperation as any).mockClear();
    global.fetch = vi.fn().mockRejectedValue(new Error('offline')) as any;
  });

  it('queues forgot password on network error', async () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /enviar/i }).closest('form')!);
    await waitFor(() => {
      expect(enqueueOperation).toHaveBeenCalledWith('auth/forgot-password', { email: 'a@b.com' });
    });
  });

  it('queues reset password on network error', async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText(/nueva contraseña/i), { target: { value: '123456' } });
    fireEvent.submit(screen.getByRole('button', { name: /restablecer/i }).closest('form')!);
    await waitFor(() => {
      expect(enqueueOperation).toHaveBeenCalledWith('auth/reset-password', { token: 'tok', password: '123456' });
    });
  });

  it('queues approve confirm on network error', async () => {
    render(<ApproveActions token="tok" quoteId="q1" />);
    fireEvent.click(screen.getByRole('button', { name: /aprobar cotización/i }));
    await waitFor(() => {
      expect(enqueueOperation).toHaveBeenCalledWith('approve/confirm', { token: 'tok' });
    });
  });
});
