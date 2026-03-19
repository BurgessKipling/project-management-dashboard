import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 类型定义 - 与数据库表结构匹配
export interface User {
  id: string
  device_id?: string
  display_name?: string
  avatar_url?: string
  joined_at?: string
  last_active?: string
}

export interface Project {
  id?: string
  name?: string
  description?: string
  status?: string
  start_date?: string
  end_date?: string
  owner_id?: string
  created_at?: string
  updated_at?: string
  version?: number
  primary_invitation_code?: string
  created_by?: string
}

export interface Task {
  id?: string
  project_id?: string
  name?: string
  title?: string
  description?: string
  status?: string
  priority?: string
  start_date?: string | null
  end_date?: string | null
  progress?: number
  dependencies?: string[]
  assignee_id?: string
  assignee?: string
  assignee_unit?: string
  assignee_name?: string
  responsible_unit?: string
  created_at?: string
  updated_at?: string
  version?: number
  is_milestone?: boolean
  is_critical?: boolean
  updated_by?: string
}

export interface Risk {
  id?: string
  project_id?: string
  title?: string
  description?: string
  level?: string
  status?: string
  probability?: number
  impact?: number
  mitigation?: string
  owner_id?: string
  created_at?: string
  updated_at?: string
  version?: number
  task_id?: string
}

export interface Milestone {
  id?: string
  project_id?: string
  name?: string
  title?: string
  description?: string
  target_date?: string
  completed_at?: string
  status?: string
  created_at?: string
  updated_at?: string
  version?: number
  related_task_ids?: string[]
}

export interface Invitation {
  id?: string
  project_id?: string
  invite_code?: string
  invitation_code?: string
  role?: string
  permission_level?: string
  max_uses?: number
  used_count?: number
  expires_at?: string
  created_at?: string
  created_by?: string
  is_revoked?: boolean
  is_active?: boolean
}

export interface ProjectMember {
  id?: string
  project_id?: string
  user_id?: string
  role?: string
  joined_at?: string
  invitation_code_id?: string
  last_activity?: string
  is_active?: boolean
}
