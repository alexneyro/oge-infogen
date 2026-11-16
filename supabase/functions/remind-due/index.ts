// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = 'noreply@oge-infogen.ru';

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  return res.json();
}

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  // Найти задания у которых дедлайн через 23-25 часов и они активны
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('id, title, due_date, class_id, created_at')
    .eq('is_active', true)
    .gte('due_date', in23h)
    .lte('due_date', in25h);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!assignments || assignments.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  let sent = 0;

  for (const assignment of assignments) {
    // Проверить что задание выдано более чем 2 часа назад
    // (чтобы не слать напоминание сразу после выдачи суточного дз)
    const createdAt = new Date(assignment.created_at);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation < 2) continue;

    // Найти учеников класса
    const { data: members } = await supabase
      .from('class_members')
      .select('student_id')
      .eq('class_id', assignment.class_id);

    if (!members || members.length === 0) continue;

    for (const member of members) {
      // Проверить что ученик ещё не сдал
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('user_id', member.student_id)
        .eq('status', 'completed')
        .limit(1);

      if (sessions && sessions.length > 0) continue; // уже сдал — не напоминаем

      // Получить email ученика
      const { data: prof } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', member.student_id)
        .maybeSingle();

      if (!prof?.email || prof.email.endsWith('@oge-infogen.ru')) continue;

      const dueStr = new Date(assignment.due_date).toLocaleString('ru-RU');
      const htmlBody = `
        <h2>Напоминание о задании</h2>
        <p>Не забудьте выполнить задание: <b>${assignment.title}</b></p>
        <p>Срок сдачи: <b>${dueStr}</b> (осталось около суток)</p>
        <p>Перейдите в раздел <a href="https://oge-infogen.ru/#/student/assignments">Мои задания</a>, чтобы открыть его.</p>
      `;

      try {
        await sendEmail(prof.email, `Напоминание: ${assignment.title}`, htmlBody);
        sent++;
      } catch (e) {
        console.error('email error:', e);
      }
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
