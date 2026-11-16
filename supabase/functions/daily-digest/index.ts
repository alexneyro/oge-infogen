// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM_EMAIL = 'noreply@oge-infogen.ru';

function pluralStudents(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ученик`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ученика`;
  return `${n} учеников`;
}
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
    const nowUtc = new Date();
    const mskHour = (nowUtc.getUTCHours() + 3) % 24;
    const mskMinute = nowUtc.getUTCMinutes();
    const currentMskTime = `${String(mskHour).padStart(2, '0')}:${String(mskMinute).padStart(2, '0')}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Найти учителей: profiles WHERE role = 'teacher' AND notification_interval = 'daily'
    const { data: allTeachers, error: tErr } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, notification_time')
      .eq('role', 'teacher')
      .eq('notification_interval', 'daily');

    if (tErr) throw tErr;

    // Сравнивать только часы: notification_time совпадает с текущим часом МСК (по умолчанию 18:00)
    const teachers = (allTeachers || []).filter((t: any) => {
      const timeStr = t.notification_time || '18:00';
      const hour = parseInt(timeStr.split(':')[0], 10);
      return hour === mskHour;
    });

    const dateStr = nowUtc.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Moscow',
    });

    let processedCount = 0;

    for (const teacher of teachers) {
      // Пропустить если email отсутствует или заканчивается на @oge-infogen.ru
      if (!teacher.email || teacher.email.endsWith('@oge-infogen.ru')) {
        continue;
      }

      // a. Найти классы: classes WHERE teacher_id = teacher.id
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacher.id);

      const classIds = (classes || []).map((c: any) => c.id);
      if (!classIds.length) continue;

      // b. Найти assignments: assignments WHERE class_id IN (classIds)
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, assignment_type')
        .in('class_id', classIds);

      const assignmentIds = (assignments || []).map((a: any) => a.id);
      if (!assignmentIds.length) continue;

      const assignmentMetaMap = new Map<string, { title: string; type: string }>();
      for (const a of assignments || []) {
        assignmentMetaMap.set(a.id, {
          title: a.title || 'Без названия',
          type: a.assignment_type === 'classwork' ? 'Классная' : 'ДЗ',
        });
      }

      // c. Найти завершённые сессии за последние 24 часа:
      // sessions WHERE assignment_id IN (assignmentIds) AND status = 'completed' AND created_at > 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: sessions, error: sessErr } = await supabase
        .from('sessions')
        .select('id, user_id, score, max_score, assignment_id, created_at')
        .in('assignment_id', assignmentIds)
        .eq('status', 'completed')
        .gt('created_at', twentyFourHoursAgo);

      if (sessErr) {
        console.error(`[daily-digest] Error fetching sessions for teacher ${teacher.id}:`, sessErr);
        continue;
      }

      // d. Если сессий нет — пропустить
      if (!sessions || sessions.length === 0) continue;

      // e. Сгруппировать по assignment_id, для каждого задания собрать список учеников с именами
      const studentUserIds = Array.from(new Set(sessions.map((s: any) => s.user_id).filter(Boolean)));
      const studentMap = new Map<string, string>();
      if (studentUserIds.length > 0) {
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, display_name, email')
          .in('id', studentUserIds);

        for (const sp of studentProfiles || []) {
          const name =
            [sp.last_name, sp.first_name].filter(Boolean).join(' ') ||
            sp.display_name ||
            sp.email ||
            'Ученик';
          studentMap.set(sp.id, name);
        }
      }

      const byAssignment = new Map<
        string,
        Array<{ studentName: string; score: number | null; maxScore: number | null }>
      >();
      for (const s of sessions) {
        if (!byAssignment.has(s.assignment_id)) {
          byAssignment.set(s.assignment_id, []);
        }
        const studentName = studentMap.get(s.user_id) || 'Ученик';
        byAssignment.get(s.assignment_id)!.push({
          studentName,
          score: s.score,
          maxScore: s.max_score,
        });
      }

      const totalCount = sessions.length;

      // f. Сформировать HTML письмо
      let assignmentsHtml = '';
      for (const [asgId, list] of byAssignment.entries()) {
        const meta = assignmentMetaMap.get(asgId) || { title: 'Задание', type: 'ДЗ' };
        const items = list
          .map(
            (item) =>
              `<li>${item.studentName} — ${item.score ?? '—'}/${item.maxScore ?? '—'} баллов</li>`
          )
          .join('');

        assignmentsHtml += `
          <div style="margin-bottom:16px; padding:12px; border-left:3px solid #4f46e5;">
            <h3 style="margin:0 0 8px;">${meta.title} (${meta.type})</h3>
            <p style="margin:0 0 8px; color:#666;">Завершили: ${list.length} учеников</p>
            <ul style="margin:0; padding-left:20px;">
              ${items}
            </ul>
          </div>
        `;
      }

      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <h2 style="margin: 0 0 16px 0; color: #0f172a;">Сводка за ${dateStr} — ${totalCount} работ сдано</h2>
          ${assignmentsHtml}
          <div style="margin-top: 24px;">
            <a href="https://oge-infogen.ru/#/teacher/assignments" 
               style="display:inline-block; padding:10px 20px; background:#4f46e5; 
                      color:white; border-radius:8px; text-decoration:none;">
              Смотреть все результаты →
            </a>
          </div>
        </div>
      `;

      // g. Subject: Сводка за {дата} — {totalCount} работ сдано
      const subject = `Сводка за ${dateStr} — ${totalCount} работ сдано`;

      // h. Отправить через fetch https://api.resend.com/emails
      if (RESEND_API_KEY) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [teacher.email],
            subject,
            html: htmlBody,
          }),
        });

        if (!res.ok) {
          const errData = await res.text();
          console.error(`[daily-digest] Failed to send email to ${teacher.email}:`, errData);
        } else {
          processedCount++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: processedCount, mskTime: currentMskTime }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('[daily-digest] execution error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
