import React, { createContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { AuthState } from '../hooks/useAuth';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const activeUserIdRef = useRef<string | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const requestIdRef = useRef(0);
  const unmountedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string, isCancelled?: () => boolean) => {
    const reqId = ++requestIdRef.current;
    setProfileError(false);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (unmountedRef.current || isCancelled?.() || activeUserIdRef.current !== userId || reqId !== requestIdRef.current) {
        return;
      }

      const fetchedProfile = data as Profile | null;

      if (
        error ||
        !fetchedProfile ||
        (fetchedProfile.id !== undefined && fetchedProfile.id !== userId)
      ) {
        const hasSameUserProfile = profileRef.current?.id === userId;
        if (!hasSameUserProfile) {
          profileRef.current = null;
          setProfile(null);
          setProfileError(true);
        }
      } else {
        profileRef.current = fetchedProfile;
        setProfile(fetchedProfile);
        setProfileError(false);
      }
    } catch {
      if (unmountedRef.current || isCancelled?.() || activeUserIdRef.current !== userId || reqId !== requestIdRef.current) {
        return;
      }
      const hasSameUserProfile = profileRef.current?.id === userId;
      if (!hasSameUserProfile) {
        profileRef.current = null;
        setProfile(null);
        setProfileError(true);
      }
    } finally {
      if (!unmountedRef.current && !isCancelled?.() && activeUserIdRef.current === userId && reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refreshProfile = useCallback(() => {
    const currentUserId = activeUserIdRef.current;
    if (!currentUserId || unmountedRef.current) return;
    setLoading(true);
    setProfileError(false);
    void fetchProfile(currentUserId);
  }, [fetchProfile]);

  const clearPasswordRecovery = useCallback(() => {
    setPasswordRecovery(false);
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    let cancelled = false;
    const isCancelled = () => cancelled;

    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        if (activeUserIdRef.current !== session.user.id) {
          profileRef.current = null;
          setProfile(null);
        }
        activeUserIdRef.current = session.user.id;
        void fetchProfile(session.user.id, isCancelled);
      } else {
        activeUserIdRef.current = null;
        profileRef.current = null;
        setProfile(null);
        setProfileError(false);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    // Слушаем изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true);
        }
        if (session?.user) {
          if (activeUserIdRef.current !== session.user.id) {
            profileRef.current = null;
            setProfile(null);
          }
          activeUserIdRef.current = session.user.id;
          void fetchProfile(session.user.id, isCancelled);
        } else {
          setPasswordRecovery(false);
          activeUserIdRef.current = null;
          profileRef.current = null;
          setProfile(null);
          setProfileError(false);
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      unmountedRef.current = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      session,
      loading,
      profileError,
      refreshProfile,
      passwordRecovery,
      clearPasswordRecovery,
    }),
    [user, profile, session, loading, profileError, refreshProfile, passwordRecovery, clearPasswordRecovery]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
