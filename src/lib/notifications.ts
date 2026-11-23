import { supabase } from './supabase';

export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const { error } = await (supabase as any).functions.invoke('send-email', {
    body: { to, subject, html },
  });
  if (error) {
    console.error('[sendEmailNotification] error:', error);
  }
}

export async function sendNotification(
  userId: string,
  type: string,
  payload: object
): Promise<void> {
  const { error } = await (supabase as any)
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      payload,
      is_read: false,
    });

  if (error) {
    throw error;
  }
}

export async function sendNotificationToClass(
  classId: string,
  excludeUserId: string,
  type: string,
  payload: object
): Promise<void> {
  const { data: members, error } = await (supabase as any)
    .from('class_members')
    .select('student_id')
    .eq('class_id', classId);

  if (error) {
    throw error;
  }

  if (!members || members.length === 0) return;

  const validMembers = members.filter(
    (m: { student_id?: string }) => m.student_id && m.student_id !== excludeUserId
  );

  await Promise.all(
    validMembers.map(async (m: { student_id: string }) => {
      await sendNotification(m.student_id, type, payload);

      try {
        const { data: prof } = await (supabase as any)
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('id', m.student_id)
          .maybeSingle();

        if (prof?.email && !prof.email.endsWith('@oge-infogen.ru')) {
          const p = payload as any;
          const assignmentTitle = p.assignmentTitle || p.title || 'Новое задание';
          const dueDate = p.dueDate ? `<p>Срок сдачи: <b>${new Date(p.dueDate).toLocaleString('ru-RU')}</b></p>` : '';
          const attemptsInfo = p.maxAttempts ? `<p>Количество попыток: <b>${p.maxAttempts}</b></p>` : '';
          const htmlBody = `
    <h2>Новое задание</h2>
    <p>Вам выдано задание: <b>${assignmentTitle}</b></p>
    ${dueDate}
    ${attemptsInfo}
    <p>Перейдите в раздел <a href="https://oge-infogen.ru/#/student/assignments">Мои задания</a>, чтобы открыть его.</p>
  `;
          await sendEmailNotification(prof.email, `Новое задание: ${assignmentTitle}`, htmlBody);
        }
      } catch (emailErr) {
        console.error('[sendNotificationToClass] email error:', emailErr);
      }
    })
  );
}

export async function sendNotificationToTeacher(
  assignmentId: string,
  type: string,
  payload: object
): Promise<void> {
  const { error } = await (supabase as any).functions.invoke('send-email', {
    body: {
      notify_teacher: true,
      assignmentId,
      type,
      payload,
    },
  });
  if (error) {
    console.error('[sendNotificationToTeacher] error:', error);
  }
}
