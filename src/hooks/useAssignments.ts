import { useState, useEffect, useCallback, useRef } from 'react';
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
  audience: 'class' | 'selected';
  created_at: string;
  is_active: boolean;
  class_name?: string;
}

export function useAssignments() {
  const { user, profile, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [hasClasses, setHasClasses] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevUserIdRef = useRef<string | undefined>(user?.id);
  const requestIdRef = useRef(0);

  const fetchAssignments = useCallback(async () => {
    const targetUserId = user?.id;
    if (!targetUserId) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setHasClasses(null);
    try {
      if (profile?.role === 'teacher') {
        // Учитель видит все свои ДЗ через классы
        const { data, error: err } = await (supabase as any)
          .from('assignments')
          .select('id, class_id, title, variant_seed, set_config, due_date, max_attempts, hide_review, assignment_type, audience, created_at, is_active, classes(name)')
          .eq('classes.teacher_id', targetUserId)
          .order('created_at', { ascending: false });
        if (requestIdRef.current !== reqId) return;
        if (err) throw err;
        const mapped = (data || []).map((a: any) => ({
          ...a,
          audience: a.audience ?? 'class',
          class_name: a.classes?.name ?? null,
        }));
        setHasClasses(null);
        setAssignments(mapped);
      } else {
        // Ученик видит активные ДЗ своих классов
        const { data: memberRows, error: memberErr } = await (supabase as any)
          .from('class_members')
          .select('class_id')
          .eq('student_id', targetUserId);
        if (requestIdRef.current !== reqId) return;
        if (memberErr) throw memberErr;

        const classIds = (memberRows || []).map((m: any) => m.class_id);
        setHasClasses(classIds.length > 0);
        if (classIds.length === 0) {
          setAssignments([]);
          return;
        }

        const { data, error: err } = await (supabase as any)
          .from('assignments')
          .select('*, classes(name)')
          .in('class_id', classIds)
          .order('created_at', { ascending: false });
        if (requestIdRef.current !== reqId) return;
        if (err) throw err;
        const mapped = (data || []).map((a: any) => ({
          ...a,
          class_name: a.classes?.name ?? null,
        }));
        setAssignments(mapped);
      }
    } catch (e: unknown) {
      if (requestIdRef.current !== reqId) return;
      setHasClasses(null);
      setError(e instanceof Error ? e.message : 'Ошибка загрузки ДЗ');
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
        setLoaded(true);
        setLoadedUserId(targetUserId);
      }
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
    studentIds?: string[];
  }): Promise<{ error: string | null; id?: string }> => {
    if (!user?.id) return { error: 'Не авторизован' };
    try {
      const targetStudentIds = Array.from(
        new Set((params.studentIds ?? []).filter((id) => typeof id === 'string' && id.length > 0))
      );
      const audience: 'class' | 'selected' = targetStudentIds.length > 0 ? 'selected' : 'class';

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
          audience,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (err) throw err;

      const newId: string | undefined = (data as any)?.[0]?.id || data?.id;
      if (!newId) {
        throw new Error('Не удалось получить идентификатор созданного задания');
      }

      if (audience === 'selected') {
        const targetRows = targetStudentIds.map((studentId) => ({
          assignment_id: newId,
          student_id: studentId,
        }));
        const { error: targetsErr } = await (supabase as any)
          .from('assignment_targets')
          .insert(targetRows);
        if (targetsErr) {
          try {
            await (supabase as any)
              .from('assignments')
              .delete()
              .eq('id', newId);
          } catch (cleanupErr) {
            console.error('[createAssignment] Failed to rollback assignment:', cleanupErr);
          }
          return { error: 'Не удалось выдать задание выбранным ученикам' };
        }
      }

      try {
        await sendNotificationToClass(
          params.classId,
          user.id,
          'new_assignment',
          {
            title: 'Новое задание',
            assignmentTitle: params.title,
            message: `Преподаватель выдал вам задание «${params.title}»`,
            assignmentId: newId,
            dueDate: params.dueDate ?? null,
            maxAttempts: params.maxAttempts ?? null,
          },
          audience === 'selected' ? targetStudentIds : undefined
        );
      } catch (notifErr) {
        console.error('[createAssignment] Failed to send notification to class:', notifErr);
      }
      await fetchAssignments();
      return { error: null, id: newId };
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
    if (prevUserIdRef.current !== user?.id) {
      prevUserIdRef.current = user?.id;
      requestIdRef.current += 1;
      setLoaded(false);
      setLoadedUserId(null);
      setHasClasses(null);
      setAssignments([]);
      setError(null);
      setLoading(false);
    }
    if (authLoading) return;
    if (!user?.id) {
      setAssignments([]);
      setLoading(false);
      setError(null);
      setLoaded(true);
      setLoadedUserId(null);
      setHasClasses(null);
      return;
    }
    fetchAssignments();
  }, [authLoading, user?.id, profile?.role, fetchAssignments]);

  const isLoaded = loaded && loadedUserId === (user?.id ?? null);
  const isLoading =
    loading ||
    authLoading ||
    Boolean(user?.id && !isLoaded);

  return { assignments, loading: isLoading, error, hasClasses, fetchAssignments, createAssignment, toggleAssignment, deleteAssignment };
}
