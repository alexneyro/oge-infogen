// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FROM_EMAIL = 'noreply@oge-infogen.ru';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.json();

    // Режим 1: прямая отправка email (to, subject, html)
    if (body.to && body.subject && body.html) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [body.to],
          subject: body.subject,
          html: body.html,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: data }), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Режим 2: уведомление учителю по assignmentId (notify_teacher: true)
    if (body.notify_teacher && body.assignmentId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Получить class_id из assignments
      const { data: asg } = await supabase
        .from('assignments')
        .select('class_id, title')
        .eq('id', body.assignmentId)
        .maybeSingle();

      if (!asg?.class_id) {
        return new Response(JSON.stringify({ error: 'assignment not found' }), { status: 404 });
      }

      // Получить teacher_id из classes
      const { data: cls } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', asg.class_id)
        .maybeSingle();

      if (!cls?.teacher_id) {
        return new Response(JSON.stringify({ error: 'teacher not found' }), { status: 404 });
      }

      // Отправить уведомление в БД
      await supabase.from('notifications').insert({
        user_id: cls.teacher_id,
        type: body.type || 'set_finished',
        payload: body.payload || {},
        is_read: false,
      });

      // Получить email учителя
      const { data: teacherProf } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, notification_interval')
        .eq('id', cls.teacher_id)
        .maybeSingle();

      const interval = teacherProf?.notification_interval ?? 'instant';
      const isInstant = interval === 'instant';

      if (teacherProf?.email && !teacherProf.email.endsWith('@oge-infogen.ru') && isInstant) {
        const p = body.payload || {};
        const assignmentTitle = asg.title || 'Набор';
        const htmlBody = `
          <h2>Ученик сдал работу</h2>
          <p>${p.message || ''}</p>
          <p>Результат: <b>${p.score ?? '—'} из ${p.maxScore ?? '—'} баллов</b></p>
          <p><a href="https://oge-infogen.ru/#/teacher/assignments/${body.assignmentId}">Открыть журнал задания →</a></p>
        `;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [teacherProf.email],
            subject: `Ученик завершил работу — ${assignmentTitle}`,
            html: htmlBody,
          }),
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Missing fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
