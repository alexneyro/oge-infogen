import { supabase } from './supabase'
import type { UserRole } from './database.types'

export async function signUpWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        role,
      },
    },
  })
  return { data, error }
}

export async function signInWithEmail(email: string, password: string) {
  const normalizedEmail = email.trim().includes('@')
    ? email.trim()
    : email.trim() + '@oge-infogen.ru';
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  return { data, error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}
