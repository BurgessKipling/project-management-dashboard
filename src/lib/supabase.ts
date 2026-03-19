import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 类型定义 - 与数据库表结构匹配
export interface User {
  id: string
  device_id: string
  display_name?: string
  avatar_url?: string
  joined_at: string
  last_active: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status?: string
  start_date?: string
  end_date?: string
  owner_id?: string
  created_at: string
  updated_at: string
  version?: number
}

export interface Task {
  id: string
  project_id: string
  name: string
  description?: string
  status?: string
  priority?: string
  start_date?: string
  end_date?: string
  progress?: number
  dependencies?: string[]
  assignee_id?: string
  assignee_name?: string
  responsible_unit?: string
  created_at: string
  updated_at: string
  version?: number
}

export interface Risk {
  id: string
  project_id: string
  title: string
  description?: string
  level?: string
  status?: string
  probability?: number
  impact?: number
  mitigation?: string
  owner_id?: string
  created_at: string
  updated_at: string
  version?: number
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description?: string
  target_date?: string
  status?: string
  created_at: string
  updated_at: string
  version?: number
}

export interface Invitation {
  id: string
  project_id: string
  invite_code: string
  role?: string
  max_uses?: number
  used_count?: number
  expires_at?: string
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id?: string
  role?: string
  joined_at: string
}
