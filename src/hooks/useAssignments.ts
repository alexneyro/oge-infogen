import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sendNotificationToClass } from '../lib/notifications';
import { useAuth } from './useAuth';

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  variant_seed: string | null;
  set_config: Record<string, unknown> | null;
  due_date: string | null;
  max_attempts: number | null;
  hide_review: boolean;
  assignment_type: 'homework' | 'classwork';
  created_at: string;
  is_active: boolean;
  class_name?: string;
}

export function useAssignments() {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      if (profile?.role === 'teacher') {
        // Учитель видит все свои ДЗ через классы
        const { data, error: err } = await (supabase as any)
          .from('assignments')
          .select('*, classes(name)')
          .eq('classes.teacher_id', user.id)
          .order('created_at', { ascending: false });
        if (err) throw err;
        const mapped = (data || []).map((a: any) => ({
          ...a,
          class_name: a.classes?.name ?? null,
        }));
        setAssignments(mapped);
      } else {
        // Ученик видит активные ДЗ своих классов
        const { data: memberRows, error: memberErr } = await (supabase as any)
          .from('class_members')
          .select('class_id')
          .eq('student_id', user.id);
        if (memberErr) throw memberErr;

        const classIds = (memberRows || []).map((m: any) => m.class_id);
        if (classIds.length === 0) {
          setAssignments([]);
          return;
        }

        const { data, error: err } = await (supabase as any)
          .from('assignments')
          .select('*, classes(name)')
          .in('class_id', classIds)
          .order('created_at', { ascending: false });
        if (err) throw err;
        const mapped = (data || []).map((a: any) => ({
          ...a,
          class_name: a.classes?.name ?? null,
        }));
        setAssignments(mapped);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки ДЗ');
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.role]);

  const createAssignment = useCallback(async (params: {
    classId: string;
    title: string;
    variantSeed: string | null;
    setConfig: Record<string, unknown> | null;
    dueDate: string | null;
    maxAttempts: number | null;
    hideReview: boolean;
    assignmentType: 'homework' | 'classwork';
  }): Promise<{ error: string | null; id?: string }> => {
    if (!user?.id) return { error: 'Не авторизован' };
    try {
      const { data, error: err } = await (supabase as any)
        .from('assignments')
        .insert({
          class_id: params.classId,
          teacher_id: user.id,
          title: params.title,
          variant_seed: params.variantSeed,
          set_config: params.setConfig,
          due_date: params.dueDate,
          max_attempts: params.maxAttempts,
          hide_review: params.hideReview,
          assignment_type: params.assignmentType,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (err) throw err;
      try {
        const newId = (data as any)?.[0]?.id || data?.id;
        await sendNotificationToClass(params.classId, user.id, 'new_assignment', {
          title: 'Новое задание',
          assignmentTitle: params.title,
          message: `Преподаватель выдал вам задание «${params.title}»`,
          assignmentId: newId,
          dueDate: params.dueDate ?? null,
          maxAttempts: params.maxAttempts ?? null,
        });
      } catch (notifErr) {
        console.error('[createAssignment] Failed to send notification to class:', notifErr);
      }
      await fetchAssignments();
      return { error: null, id: data.id };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Ошибка создания ДЗ' };
    }
  }, [user?.id, fetchAssignments]);

  const toggleAssignment = useCallback(async (id: string, isActive: boolean): Promise<{ error: string | null }> => {
    try {
      const { error: err } = await (supabase as any)
        .from('assignments')
        .update({ is_active: isActive })
        .eq('id', id);
      if (err) throw err;
      await fetchAssignments();
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Ошибка обновления ДЗ' };
    }
  }, [fetchAssignments]);

  const deleteAssignment = useCallback(async (id: string): Promise<{ error: string | null }> => {
    try {
      const { error: err } = await (supabase as any)
        .from('assignments')
        .delete()
        .eq('id', id);
      if (err) throw err;
      await fetchAssignments();
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Ошибка удаления задания' };
    }
  }, [fetchAssignments]);

  useEffect(() => {
    if (!user?.id) {
      setAssignments([]);
      setLoading(false);
      setError(null);
      return;
    }
    fetchAssignments();
  }, [user?.id, profile?.role, fetchAssignments]);

  return { assignments, loading, error, fetchAssignments, createAssignment, toggleAssignment, deleteAssignment };
}
