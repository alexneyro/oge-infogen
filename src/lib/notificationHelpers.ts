import { supabase } from './supabase';

export async function notifyStudentsNewAssignment(
  classId: string,
  assignmentTitle: string,
  assignmentId: string
): Promise<void> {
  try {
    const { data: members, error: membersError } = await (supabase as any)
      .from('class_members')
      .select('student_id')
      .eq('class_id', classId);

    if (membersError) {
      console.error('[notifyStudentsNewAssignment] Error fetching class members:', membersError);
      return;
    }

    if (!members || members.length === 0) return;

    const rows = members
      .filter((m: { student_id?: string }) => Boolean(m.student_id))
      .map((m: { student_id: string }) => ({
        user_id: m.student_id,
        type: 'new_assignment',
        is_read: false,
        payload: {
          title: 'Новое задание',
          message: `Вам выдано задание «${assignmentTitle}»`,
          assignmentId,
          assignmentTitle,
        },
        created_at: new Date().toISOString(),
      }));

    if (rows.length === 0) return;

    const { error: insertError } = await (supabase as any)
      .from('notifications')
      .insert(rows);

    if (insertError) {
      console.error('[notifyStudentsNewAssignment] Error inserting notifications:', insertError);
    }
  } catch (err) {
    console.error('[notifyStudentsNewAssignment] Unexpected error:', err);
  }
}

export async function notifyTeacherAssignmentSubmit(
  teacherUserId: string,
  studentName: string,
  assignmentTitle: string,
  assignmentId: string
): Promise<void> {
  try {
    if (!teacherUserId) return;

    const { error } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: teacherUserId,
        type: 'assignment_submitted',
        is_read: false,
        payload: {
          title: 'Работа сдана',
          message: `${studentName} сдал(а) «${assignmentTitle}»`,
          assignmentId,
          assignmentTitle,
        },
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[notifyTeacherAssignmentSubmit] Error inserting notification:', error);
    }
  } catch (err) {
    console.error('[notifyTeacherAssignmentSubmit] Unexpected error:', err);
  }
}
