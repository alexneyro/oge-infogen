import { supabase } from '../lib/supabase';

export interface JoinClassResult {
  ok: boolean;
  message: string;
}

const GENERIC_ERROR_MESSAGE = 'Не удалось вступить в класс. Попробуйте ещё раз.';

export async function joinClassByCode(code: string): Promise<JoinClassResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized.length !== 6) {
    return {
      ok: false,
      message: 'Введите 6-значный код класса.',
    };
  }

  try {
    const { data, error } = await (supabase as any).rpc('join_class_by_code', {
      p_invite_code: normalized,
    });

    if (error || !data) {
      return {
        ok: false,
        message: GENERIC_ERROR_MESSAGE,
      };
    }

    if (data.success === true && !data.error) {
      return {
        ok: true,
        message: 'Вы вступили в класс. Задания от учителя появятся на этой странице.',
      };
    }

    if (data.error === 'Класс не найден') {
      return {
        ok: false,
        message: 'Класс с таким кодом не найден. Проверьте код.',
      };
    }

    if (data.error === 'Уже в классе') {
      return {
        ok: false,
        message: 'Вы уже состоите в этом классе.',
      };
    }

    return {
      ok: false,
      message: GENERIC_ERROR_MESSAGE,
    };
  } catch {
    return {
      ok: false,
      message: GENERIC_ERROR_MESSAGE,
    };
  }
}
