import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { sendNotificationToClass } from '../notifications';

describe('sendNotificationToClass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('без onlyStudentIds отправляет уведомления всем участникам класса, кроме excludeUserId', async () => {
    const inserted: any[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { student_id: 'teacher-1' },
                  { student_id: 's-1' },
                  { student_id: 's-2' },
                  { student_id: 's-3' },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'notifications') {
        return {
          insert: (row: any) => {
            inserted.push(row);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    await sendNotificationToClass('c-1', 'teacher-1', 'new_assignment', {
      title: 'Новое задание',
    });

    expect(inserted.map((r) => r.user_id)).toEqual(['s-1', 's-2', 's-3']);
  });

  it('с onlyStudentIds отправляет уведомления только указанным ученикам', async () => {
    const inserted: any[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { student_id: 's-1' },
                  { student_id: 's-2' },
                  { student_id: 's-3' },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'notifications') {
        return {
          insert: (row: any) => {
            inserted.push(row);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    await sendNotificationToClass(
      'c-1',
      'teacher-1',
      'new_assignment',
      { title: 'Новое задание' },
      ['s-1', 's-3']
    );

    expect(inserted.map((r) => r.user_id)).toEqual(['s-1', 's-3']);
  });

  it('при пустом onlyStudentIds=[] не отправляет ни одного уведомления', async () => {
    await sendNotificationToClass(
      'c-1',
      'teacher-1',
      'new_assignment',
      { title: 'Новое задание' },
      []
    );

    expect(fromMock).not.toHaveBeenCalled();
  });
});
