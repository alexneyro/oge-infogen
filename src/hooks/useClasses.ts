import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { generateStudentCredentials } from '../utils/studentCredentials';

export interface ClassMemberWithProfile {
  student_id: string;
  joined_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string | null;
    role: string;
    generated_login: string | null;
    generated_password: string | null;
  } | null;
}

export interface ClassWithMembers {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  is_archived: boolean;
  members: ClassMemberWithProfile[];
}

export function useClasses() {
  const { user, profile, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassWithMembers[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevUserIdRef = useRef<string | undefined>(user?.id);
  const requestIdRef = useRef(0);

  const fetchClasses = useCallback(async () => {
    const targetUserId = user?.id;
    if (!targetUserId) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // 1. Запрос к таблице 'classes'
      const { data: classRows, error: classErr } = await (supabase as any)
        .from('classes')
        .select('*')
        .eq('teacher_id', targetUserId)
        .eq('is_archived', false);

      if (requestIdRef.current !== reqId) return;

      if (classErr) {
        setError(classErr.message);
        return;
      }

      if (!classRows || classRows.length === 0) {
        setClasses([]);
        return;
      }

      // 2. Запросить участников всех классов одним запросом
      const classIds = classRows.map((c: any) => c.id);
      const { data: memberRows, error: memberErr } = await (supabase as any)
        .from('class_members')
        .select('class_id, student_id, joined_at, profiles(first_name, last_name, email, role, generated_login, generated_password)')
        .in('class_id', classIds);

      if (requestIdRef.current !== reqId) return;

      if (memberErr) {
        console.error('Error fetching class members:', memberErr);
      }

      const membersByClass = new Map<string, ClassMemberWithProfile[]>();
      for (const row of ((memberRows as any[]) || [])) {
        const list = membersByClass.get(row.class_id) || [];
        list.push({
          student_id: row.student_id,
          joined_at: row.joined_at,
          profiles: row.profiles ?? null,
        });
        membersByClass.set(row.class_id, list);
      }

      const classesWithMembers: ClassWithMembers[] = classRows.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        invite_code: cls.invite_code,
        created_at: cls.created_at,
        is_archived: cls.is_archived,
        members: membersByClass.get(cls.id) || [],
      }));

      setClasses(classesWithMembers);
    } catch (err: unknown) {
      if (requestIdRef.current !== reqId) return;
      const msg = err instanceof Error ? err.message : 'Ошибка при загрузке классов';
      setError(msg);
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
        setLoaded(true);
        setLoadedUserId(targetUserId);
      }
    }
  }, [user?.id]);

  const createClass = async (name: string): Promise<{ error: string | null }> => {
    if (!user?.id) {
      return { error: 'Пользователь не авторизован' };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { error: 'Название класса не может быть пустым' };
    }

    // 1. Генерировать invite_code: 6 символов из 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let invite_code = '';
    for (let i = 0; i < 6; i++) {
      invite_code += chars[Math.floor(Math.random() * chars.length)];
    }

    // 2. Вставить в 'classes'
    const { error: insertErr } = await (supabase as any).from('classes').insert({
      teacher_id: user.id,
      name: trimmedName,
      invite_code,
      is_archived: false,
    });

    if (insertErr) {
      return { error: insertErr.message };
    }

    await fetchClasses();
    return { error: null };
  };

  const extractCreateStudentError = async (fnErr: {
    message?: string;
    context?: { json?: () => Promise<{ error?: string }> };
  }): Promise<string> => {
    let rawMsg = fnErr.message || 'Не удалось создать ученика';
    try {
      const ctx = fnErr.context;
      if (ctx && typeof ctx.json === 'function') {
        const errBody = await ctx.json();
        if (errBody?.error) {
          rawMsg = errBody.error;
        }
      }
    } catch {
      // ignore json parse errors
    }

    const lower = rawMsg.toLowerCase();
    if (lower.includes('already been registered') || lower.includes('already registered')) {
      return 'Такой логин уже занят, попробуйте ещё раз';
    }
    if (rawMsg.includes('Password should be at least')) {
      return 'Слишком короткий пароль. Попробуйте ещё раз';
    }
    if (rawMsg.includes('Unauthorized')) {
      return 'Нужно войти в аккаунт заново';
    }
    if (rawMsg.includes('Forbidden')) {
      return 'Нет прав добавлять учеников в этот класс';
    }
    return rawMsg;
  };

  const addStudentByEmail = async (
    classId: string,
    email: string
  ): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { error: 'Введите email ученика' };
    }

    // 1. Найти профиль
    const { data: profileRow, error: profileErr } = await (supabase as any)
      .from('profiles')
      .select('id, role')
      .eq('email', cleanEmail)
      .single();

    if (profileErr || !profileRow) {
      return { error: 'Пользователь с таким email не найден' };
    }

    // 3. Если role !== 'student'
    if (profileRow.role !== 'student') {
      return { error: 'Этот пользователь не является учеником' };
    }

    // 4. Проверить что не состоит
    const { data: existingMember } = await (supabase as any)
      .from('class_members')
      .select('student_id')
      .eq('class_id', classId)
      .eq('student_id', profileRow.id)
      .maybeSingle();

    if (existingMember) {
      return { error: 'Ученик уже в классе' };
    }

    // 5. Вставить в 'class_members'
    const { error: memberInsertErr } = await (supabase as any)
      .from('class_members')
      .insert({
        class_id: classId,
        student_id: profileRow.id,
      });

    if (memberInsertErr) {
      return { error: memberInsertErr.message };
    }

    await fetchClasses();
    return { error: null };
  };

  const addStudentWithoutEmail = async (
    classId: string,
    firstName: string,
    lastName: string
  ): Promise<{ error: string | null; credentials?: { login: string; password: string } }> => {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName || !cleanLastName) {
      return { error: 'Заполните имя и фамилию ученика' };
    }

    // 1. Сгенерировать credentials
    const { login, password } = generateStudentCredentials(firstName, lastName);
    const credentials = { login, password };

    // 2. Вызвать Edge Function
    const { error: fnErr } = await supabase.functions.invoke('create-student', {
      body: {
        email: credentials.login + '@oge-infogen.ru',
        password: credentials.password,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        classId,
      },
    });

    if (fnErr) {
      const errMsg = await extractCreateStudentError(fnErr);
      return { error: errMsg };
    }

    await fetchClasses();
    return { error: null, credentials };
  };

  const removeStudent = async (classId: string, studentId: string): Promise<{ error: string | null }> => {
    try {
      const { error: delErr } = await (supabase as any)
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId)
        .select();
      if (delErr) {
        return { error: delErr.message };
      }
      await fetchClasses();
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при исключении ученика';
      return { error: msg };
    }
  };

  const deleteClass = async (classId: string): Promise<{ error: string | null }> => {
    try {
      const { error: delErr } = await (supabase as any)
        .from('classes')
        .delete()
        .eq('id', classId);

      if (delErr) {
        return { error: delErr.message };
      }

      await fetchClasses();
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при удалении класса';
      return { error: msg };
    }
  };

  useEffect(() => {
    if (prevUserIdRef.current !== user?.id) {
      prevUserIdRef.current = user?.id;
      requestIdRef.current += 1;
      setLoaded(false);
      setLoadedUserId(null);
      setClasses([]);
      setError(null);
      setLoading(false);
    }
    if (authLoading) return;
    if (!user?.id) {
      setClasses([]);
      setLoading(false);
      setError(null);
      setLoaded(true);
      setLoadedUserId(null);
      return;
    }
    if (profile?.role === 'teacher') {
      fetchClasses();
    } else {
      setClasses([]);
      setLoaded(true);
      setLoadedUserId(user.id);
    }
  }, [authLoading, user?.id, profile?.role, fetchClasses]);

  const isLoaded = loaded && loadedUserId === (user?.id ?? null);
  const isLoading =
    loading ||
    authLoading ||
    Boolean(user?.id && profile?.role === 'teacher' && !isLoaded);

  return {
    classes,
    loading: isLoading,
    error,
    fetchClasses,
    createClass,
    deleteClass,
    addStudentByEmail,
    addStudentWithoutEmail,
    removeStudent,
  };
}
