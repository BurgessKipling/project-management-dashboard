// Supabase 存储适配器
// 当网络可用时，使用Supabase进行数据存储和同步

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { StorageAdapter } from './storageService'
import { Project, Task, Risk, Milestone, ProjectMember, Invitation } from './localDb'

// ============================================
// Supabase 配置
// ============================================
interface SupabaseConfig {
  url: string
  anonKey: string
  tableNames: {
    projects: string
    tasks: string
    risks: string
    milestones: string
    projectMembers: string
    invitations: string
  }
}

const DEFAULT_CONFIG: SupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  tableNames: {
    projects: 'projects',
    tasks: 'tasks',
    risks: 'risks',
    milestones: 'milestones',
    projectMembers: 'project_members',
    invitations: 'project_invitations'
  }
}

// ============================================
// Supabase 适配器类
// ============================================
class SupabaseStorageAdapter implements StorageAdapter {
  private client?: SupabaseClient
  private config: SupabaseConfig
  private isConnected: boolean = false

  constructor(config: Partial<SupabaseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initialize()
  }

  // 初始化Supabase客户端
  private initialize(): void {
    if (!this.config.url || !this.config.anonKey) {
      console.warn('Supabase配置不完整，跳过初始化')
      return
    }

    try {
      this.client = createClient(this.config.url, this.config.anonKey)
      this.isConnected = true
    } catch (error) {
      console.error('Supabase初始化失败:', error)
      this.isConnected = false
    }
  }

  // 检查连接状态
  private checkConnection(): void {
    if (!this.client) {
      throw new Error('Supabase客户端未初始化')
    }
  }

  // 检查连接是否可用
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false
    }

    try {
      const { error } = await this.client.from(this.config.tableNames.projects).select('id').limit(1)
      this.isConnected = !error
      return this.isConnected
    } catch {
      this.isConnected = false
      return false
    }
  }

  isReady(): boolean {
    return this.isConnected
  }

  // ============================================
  // 项目操作
  // ============================================
  async getProjects(): Promise<Project[]> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.projects)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async getProject(id: string): Promise<Project | null> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.projects)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  async createProject(project: Project): Promise<Project> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.projects)
      .insert(project)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.projects)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return data
  }

  async deleteProject(id: string): Promise<void> {
    this.checkConnection()
    const { error } = await this.client!
      .from(this.config.tableNames.projects)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // ============================================
  // 任务操作
  // ============================================
  async getTasks(projectId?: string): Promise<Task[]> {
    this.checkConnection()
    let query = this.client!.from(this.config.tableNames.tasks).select('*')
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async createTask(task: Task): Promise<Task> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.tasks)
      .insert(task)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.tasks)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return data
  }

  async deleteTask(id: string): Promise<void> {
    this.checkConnection()
    const { error } = await this.client!
      .from(this.config.tableNames.tasks)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // ============================================
  // 风险操作
  // ============================================
  async getRisks(projectId?: string): Promise<Risk[]> {
    this.checkConnection()
    let query = this.client!.from(this.config.tableNames.risks).select('*')
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async createRisk(risk: Risk): Promise<Risk> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.risks)
      .insert(risk)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateRisk(id: string, updates: Partial<Risk>): Promise<Risk | null> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.risks)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return data
  }

  async deleteRisk(id: string): Promise<void> {
    this.checkConnection()
    const { error } = await this.client!
      .from(this.config.tableNames.risks)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // ============================================
  // 里程碑操作
  // ============================================
  async getMilestones(projectId?: string): Promise<Milestone[]> {
    this.checkConnection()
    let query = this.client!.from(this.config.tableNames.milestones).select('*')
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query.order('target_date', { ascending: true })
    if (error) throw error
    return data || []
  }

  async createMilestone(milestone: Milestone): Promise<Milestone> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.milestones)
      .insert(milestone)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | null> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.milestones)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return data
  }

  async deleteMilestone(id: string): Promise<void> {
    this.checkConnection()
    const { error } = await this.client!
      .from(this.config.tableNames.milestones)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // ============================================
  // 成员操作
  // ============================================
  async getMembers(projectId?: string): Promise<ProjectMember[]> {
    this.checkConnection()
    let query = this.client!.from(this.config.tableNames.projectMembers).select('*')
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query.order('joined_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async createMember(member: ProjectMember): Promise<ProjectMember> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.projectMembers)
      .insert(member)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateMember(id: string, updates: Partial<ProjectMember>): Promise<ProjectMember | null> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.projectMembers)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return data
  }

  async deleteMember(id: string): Promise<void> {
    this.checkConnection()
    const { error } = await this.client!
      .from(this.config.tableNames.projectMembers)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // ============================================
  // 邀请码操作
  // ============================================
  async getInvitations(projectId?: string): Promise<Invitation[]> {
    this.checkConnection()
    let query = this.client!.from(this.config.tableNames.invitations).select('*')
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async createInvitation(invitation: Invitation): Promise<Invitation> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.invitations)
      .insert(invitation)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateInvitation(id: string, updates: Partial<Invitation>): Promise<Invitation | null> {
    this.checkConnection()
    const { data, error } = await this.client!
      .from(this.config.tableNames.invitations)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return data
  }

  async deleteInvitation(id: string): Promise<void> {
    this.checkConnection()
    const { error } = await this.client!
      .from(this.config.tableNames.invitations)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 导出适配器工厂函数
export function createSupabaseAdapter(config?: Partial<SupabaseConfig>): SupabaseStorageAdapter {
  return new SupabaseStorageAdapter(config)
}

// 导出类
export { SupabaseStorageAdapter }
