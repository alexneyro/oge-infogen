import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../lib/database.types';
import { joinClassByCode } from './useJoinClass';

export interface UsePendingInviteParams {
  userId: string | null | undefined;
  role: UserRole | null | undefined;
  authLoading: boolean;
  profileReady: boolean;
}

export function usePendingInvite({
  userId,
  role,
  authLoading,
  profileReady,
}: UsePendingInviteParams) {
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !userId || !profileReady) return;

    const code = localStorage.getItem('pendingInviteCode');
    if (!code) return;

    if (role === 'teacher') {
      localStorage.removeItem('pendingInviteCode');
      return;
    }

    if (role === 'student') {
      localStorage.removeItem('pendingInviteCode');
      void (async () => {
        const result = await joinClassByCode(code);
        sessionStorage.setItem(
          'joinClassNotice',
          JSON.stringify({
            type: result.ok ? 'success' : 'error',
            text: result.message,
          })
        );
        navigate('/student/assignments');
      })();
    }
  }, [authLoading, userId, role, profileReady, navigate]);
}
