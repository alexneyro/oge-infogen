import { useState, useEffect, useCallback } from 'react';
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

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data as NotificationItem[]) || []);
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
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchNotifications();
    } catch (err) {
      console.error('[useNotifications] markAllAsRead error:', err);
    }
  }, [user?.id, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
