// 数据库表类型定义

export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'archived' | 'completed'
  primary_invitation_code?: string
  created_at: string
  updated_at: string
  version: number
}

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  start_date?: string
  end_date?: string
  progress: number
  assignee?: string
  assignee_unit?: string
  parent_task_id?: string
  dependencies?: string[]
  milestone_id?: string
  created_at: string
  updated_at: string
  version: number
}

export interface Risk {
  id: string
  project_id: string
  title: string
  description?: string
  category: 'schedule' | 'budget' | 'resource' | 'technical' | 'external'
  probability: number
  impact: number
  status: 'identified' | 'mitigating' | 'occurred' | 'closed'
  mitigation_plan?: string
  created_at: string
  updated_at: string
  version: number
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description?: string
  target_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  completion_rate: number
  created_at: string
  updated_at: string
  version: number
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  display_name?: string
  joined_at: string
}

export interface Invitation {
  id: string
  project_id: string
  code: string
  role: 'editor' | 'viewer'
  status: 'active' | 'used' | 'revoked' | 'expired'
  expires_at?: string
  created_by: string
  created_at: string
}
