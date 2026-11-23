import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { fetchAllPages } from '../lib/fetchAllPages';

export interface SessionRecord {
  id: string;
  mode: string;
  score: number;
  max_score: number;
  time_spent_seconds: number;
  created_at: string;
  assignment_id: string | null;
  task_type: number | null;
  status: string | null;
  assignment_type: string | null;
  assignment_title: string | null;
}

const HISTORY_SELECT =
  'id, mode, score, max_score, time_spent_seconds, created_at, assignment_id, task_type, status, assignments(title, assignment_type)';

const HISTORY_ERROR_MESSAGE = 'Не удалось загрузить историю';

export function mapSessionRow(row: any): SessionRecord {
  return {
    id: row.id,
    mode: row.mode,
    score: row.score,
    max_score: row.max_score,
    time_spent_seconds: row.time_spent_seconds ?? 0,
    created_at: row.created_at,
    assignment_id: row.assignment_id ?? null,
    task_type: row.task_type ?? null,
    status: row.status ?? null,
    assignment_type: (row.assignments as any)?.assignment_type ?? null,
    assignment_title: (row as any).assignments?.title ?? null,
  };
}

export function useSessionHistory(
  userId: string | undefined,
  enabled = true
): {
  sessions: SessionRecord[];
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionsUserId, setSessionsUserId] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<{
    userId: string;
    message: string;
  } | null>(null);

  const loadedUserIdRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | undefined>(userId);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const loadForUser = useCallback((targetUserId: string) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setErrorState(null);

    fetchAllPages<any>((from, to) =>
      (supabase as any)
        .from('sessions')
        .select(HISTORY_SELECT)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
    )
      .then((rows) => {
        if (!mountedRef.current || requestIdRef.current !== reqId) return;
        setSessions(rows.map(mapSessionRow));
        setSessionsUserId(targetUserId);
        setLoadedUserId(targetUserId);
        loadedUserIdRef.current = targetUserId;
        setLoading(false);
      })
      .catch(() => {
        if (!mountedRef.current || requestIdRef.current !== reqId) return;
        setErrorState({ userId: targetUserId, message: HISTORY_ERROR_MESSAGE });
        setSessions([]);
        setSessionsUserId(null);
        setLoadedUserId(null);
        loadedUserIdRef.current = null;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      loadedUserIdRef.current = null;
      requestIdRef.current += 1;
      setSessions([]);
      setSessionsUserId(null);
      setLoadedUserId(null);
      setErrorState(null);
      setLoading(false);
    }

    if (!userId || !enabled) {
      setLoading(false);
      return;
    }

    if (loadedUserIdRef.current === userId) {
      return;
    }

    let cancelled = false;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setErrorState(null);

    fetchAllPages<any>((from, to) =>
      (supabase as any)
        .from('sessions')
        .select(HISTORY_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
    )
      .then((rows) => {
        if (cancelled || !mountedRef.current || requestIdRef.current !== reqId) return;
        setSessions(rows.map(mapSessionRow));
        setSessionsUserId(userId);
        setLoadedUserId(userId);
        loadedUserIdRef.current = userId;
        setLoading(false);
      })
      .catch(() => {
        if (cancelled || !mountedRef.current || requestIdRef.current !== reqId) return;
        setErrorState({ userId, message: HISTORY_ERROR_MESSAGE });
        setSessions([]);
        setSessionsUserId(null);
        setLoadedUserId(null);
        loadedUserIdRef.current = null;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  const reload = useCallback(() => {
    if (!userId) return;
    loadForUser(userId);
  }, [userId, loadForUser]);

  const activeError =
    userId && errorState?.userId === userId ? errorState.message : null;
  const activeSessions =
    userId && sessionsUserId === userId ? sessions : [];
  const isLoading =
    loading ||
    Boolean(enabled && userId && !activeError && loadedUserId !== userId);

  return {
    sessions: activeSessions,
    loading: isLoading,
    error: activeError,
    reload,
  };
}
