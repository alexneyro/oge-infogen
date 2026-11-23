import { describe, it, expect, vi, beforeEach } from 'vitest';

const { resetPasswordForEmailMock } = vi.hoisted(() => ({
  resetPasswordForEmailMock: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  },
}));

import { resetPassword } from '../auth';

describe('auth.resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('вызывает resetPasswordForEmail с redirectTo = origin + "/"', async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({ data: {}, error: null });

    const res = await resetPassword('user@example.com');

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith('user@example.com', {
      redirectTo: `${window.location.origin}/`,
    });
    expect(res).toEqual({ data: {}, error: null });
  });
});
