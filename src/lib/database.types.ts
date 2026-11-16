export type UserRole = 'teacher' | 'student'
export type AppMode = 'single' | 'variant' | 'set'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          display_name: string
          first_name: string
          last_name: string
          email: string | null
          created_at: string
          last_active_at: string
          exam_date: string | null
          streak_current: number
          streak_max: number
          total_tasks_solved: number
          notification_interval?: 'instant' | 'daily' | 'weekly' | 'never'
          notification_time?: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'last_active_at' | 'streak_current' | 'streak_max' | 'total_tasks_solved' | 'first_name' | 'last_name'> & {
          first_name?: string
          last_name?: string
          notification_interval?: 'instant' | 'daily' | 'weekly' | 'never'
          notification_time?: string
          created_at?: string
          last_active_at?: string
          streak_current?: number
          streak_max?: number
          total_tasks_solved?: number
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      classes: {
        Row: {
          id: string
          teacher_id: string
          name: string
          invite_code: string
          created_at: string
          is_archived: boolean
        }
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at' | 'is_archived'> & {
          id?: string
          created_at?: string
          is_archived?: boolean
        }
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
      }
      class_members: {
        Row: {
          class_id: string
          student_id: string
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['class_members']['Row'], 'joined_at'> & {
          joined_at?: string
        }
        Update: Partial<Database['public']['Tables']['class_members']['Insert']>
      }
      assignments: {
        Row: {
          id: string
          class_id: string
          title: string
          variant_seed: string | null
          set_config: Record<string, unknown> | null
          due_date: string | null
          created_at: string
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at' | 'is_active'> & {
          id?: string
          created_at?: string
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>
      }
      assignment_attempts: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          started_at: string
          finished_at: string | null
          score: number | null
          max_score: number | null
          answers: Record<string, unknown> | null
          time_spent_seconds: number | null
        }
        Insert: Omit<Database['public']['Tables']['assignment_attempts']['Row'], 'id' | 'started_at'> & {
          id?: string
          started_at?: string
        }
        Update: Partial<Database['public']['Tables']['assignment_attempts']['Insert']>
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          mode: 'trainer' | 'variant'
          task_type: number | null
          variant_seed: string | null
          score: number | null
          max_score: number | null
          answers: Record<string, unknown> | null
          time_spent_seconds: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          type: string
          unlocked_at: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'unlocked_at'> & {
          id?: string
          unlocked_at?: string
        }
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          payload: Record<string, unknown> | null
          is_read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'is_read'> & {
          id?: string
          created_at?: string
          is_read?: boolean
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
  }
}
