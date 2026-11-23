import { useContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'
import { AuthContext } from '../contexts/AuthContext'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  profileError: boolean
  refreshProfile: () => void
  passwordRecovery: boolean
  clearPasswordRecovery: () => void
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
