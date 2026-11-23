import { describe, it, expect, vi, beforeEach } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import { joinClassByCode } from '../useJoinClass';

describe('joinClassByCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает ошибку без RPC-запроса при пустом коде или длине не 6', async () => {
    expect((await joinClassByCode('')).ok).toBe(false);
    expect((await joinClassByCode('   ')).ok).toBe(false);
    expect((await joinClassByCode('ABC')).ok).toBe(false);
    expect((await joinClassByCode('ABCDEFG')).ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('нормализует код (trim + toUpperCase) и возвращает сообщение об успехе', async () => {
    rpcMock.mockResolvedValue({ data: { success: true, class_id: 'class-1' }, error: null });

    const res = await joinClassByCode('  gcwb2f  ');

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith('join_class_by_code', { p_invite_code: 'GCWB2F' });
    expect(res).toEqual({
      ok: true,
      message: 'Вы вступили в класс. Задания от учителя появятся на этой странице.',
    });
  });

  it('обрабатывает ошибку «Класс не найден»', async () => {
    rpcMock.mockResolvedValue({ data: { error: 'Класс не найден' }, error: null });

    const res = await joinClassByCode('AAAAAA');
    expect(res).toEqual({
      ok: false,
      message: 'Класс с таким кодом не найден. Проверьте код.',
    });
  });

  it('обрабатывает ошибку «Уже в классе»', async () => {
    rpcMock.mockResolvedValue({ data: { error: 'Уже в классе' }, error: null });

    const res = await joinClassByCode('GCWB2F');
    expect(res).toEqual({
      ok: false,
      message: 'Вы уже состоите в этом классе.',
    });
  });

  it('обрабатывает «Нужно войти в аккаунт», «Только ученик может вступить в класс» и прочие ошибки общим сообщением', async () => {
    rpcMock.mockResolvedValue({ data: { error: 'Нужно войти в аккаунт' }, error: null });
    expect(await joinClassByCode('GCWB2F')).toEqual({
      ok: false,
      message: 'Не удалось вступить в класс. Попробуйте ещё раз.',
    });

    rpcMock.mockResolvedValue({ data: { error: 'Только ученик может вступить в класс' }, error: null });
    expect(await joinClassByCode('GCWB2F')).toEqual({
      ok: false,
      message: 'Не удалось вступить в класс. Попробуйте ещё раз.',
    });

    rpcMock.mockResolvedValue({ data: { error: 'Что-то ещё' }, error: null });
    expect(await joinClassByCode('GCWB2F')).toEqual({
      ok: false,
      message: 'Не удалось вступить в класс. Попробуйте ещё раз.',
    });

    rpcMock.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });
    expect(await joinClassByCode('GCWB2F')).toEqual({
      ok: false,
      message: 'Не удалось вступить в класс. Попробуйте ещё раз.',
    });
  });

  it('возвращает общее сообщение при сетевом исключении', async () => {
    rpcMock.mockRejectedValue(new Error('Network down'));

    const res = await joinClassByCode('GCWB2F');
    expect(res).toEqual({
      ok: false,
      message: 'Не удалось вступить в класс. Попробуйте ещё раз.',
    });
  });
});
