import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface NotificationItem {
  id: string;
  type: string;
  payload: {
    title?: string;
    message?: string;
    assignmentId?: string;
    assignmentTitle?: string;
    maxAttempts?: number | null;
    dueDate?: string | null;
    studentName?: string | null;
    [key: string]: unknown;
  };
  is_read: boolean;
  created_at: string;
}

export type Notification = NotificationItem;

const CLEANUP_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const cleanedUserIdRef = useRef<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      if (cleanedUserIdRef.current !== user.id) {
        cleanedUserIdRef.current = user.id;
        try {
          const cutoffIso = new Date(Date.now() - CLEANUP_MAX_AGE_MS).toISOString();
          const { error: cleanupError } = await (supabase as any)
            .from('notifications')
            .delete()
            .eq('user_id', user.id)
            .eq('is_read', true)
            .lt('created_at', cutoffIso);
          if (cleanupError) {
            console.error('[useNotifications] cleanup error:', cleanupError);
          }
        } catch (cleanupErr) {
          console.error('[useNotifications] cleanup error:', cleanupErr);
        }
      }

      const [listRes, countRes] = await Promise.all([
        (supabase as any)
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        (supabase as any)
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false),
      ]);

      if (listRes.error) throw listRes.error;
      const list = (listRes.data as NotificationItem[]) || [];
      setNotifications(list);

      if (!countRes.error && typeof countRes.count === 'number') {
        setUnreadCount(countRes.count);
      } else {
        setUnreadCount(list.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error('[useNotifications] fetchNotifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      await fetchNotifications();
    } catch (err) {
      console.error('[useNotifications] markAsRead error:', err);
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      await fetchNotifications();
    } catch (err) {
      console.error('[useNotifications] markAllAsRead error:', err);
    }
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
