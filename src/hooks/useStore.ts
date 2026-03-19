import { create } from 'zustand'
import { Project, Task, Risk, Milestone, Invitation, ProjectMember, User } from '@/lib/supabase'

interface AppState {
  // 当前用户
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // 当前项目
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

  // 项目列表
  projects: Project[]
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // 任务列表
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  // 风险列表
  risks: Risk[]
  setRisks: (risks: Risk[]) => void
  addRisk: (risk: Risk) => void
  updateRisk: (id: string, updates: Partial<Risk>) => void
  deleteRisk: (id: string) => void

  // 里程碑列表
  milestones: Milestone[]
  setMilestones: (milestones: Milestone[]) => void
  addMilestone: (milestone: Milestone) => void
  updateMilestone: (id: string, updates: Partial<Milestone>) => void

  // 邀请码
  invitations: Invitation[]
  setInvitations: (invitations: Invitation[]) => void
  addInvitation: (invitation: Invitation) => void
  revokeInvitation: (code: string) => void

  // 项目成员
  members: ProjectMember[]
  setMembers: (members: ProjectMember[]) => void
  addMember: (member: ProjectMember) => void

  // UI状态
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // 连接模式
  connectionMode: 'websocket' | 'polling'
  setConnectionMode: (mode: 'websocket' | 'polling') => void
}

export const useStore = create<AppState>((set) => ({
  // 当前用户
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // 当前项目
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  // 项目列表
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id)
  })),

  // 任务列表
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id)
  })),

  // 风险列表
  risks: [],
  setRisks: (risks) => set({ risks }),
  addRisk: (risk) => set((state) => ({ risks: [...state.risks, risk] })),
  updateRisk: (id, updates) => set((state) => ({
    risks: state.risks.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  deleteRisk: (id) => set((state) => ({
    risks: state.risks.filter(r => r.id !== id)
  })),

  // 里程碑列表
  milestones: [],
  setMilestones: (milestones) => set({ milestones }),
  addMilestone: (milestone) => set((state) => ({ milestones: [...state.milestones, milestone] })),
  updateMilestone: (id, updates) => set((state) => ({
    milestones: state.milestones.map(m => m.id === id ? { ...m, ...updates } : m)
  })),

  // 邀请码
  invitations: [],
  setInvitations: (invitations) => set({ invitations }),
  addInvitation: (invitation) => set((state) => ({ invitations: [...state.invitations, invitation] })),
  revokeInvitation: (code) => set((state) => ({
    invitations: state.invitations.map(i => i.invitation_code === code ? { ...i, is_revoked: true } : i)
  })),

  // 项目成员
  members: [],
  setMembers: (members) => set({ members }),
  addMember: (member) => set((state) => ({ members: [...state.members, member] })),

  // UI状态
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // 连接模式
  connectionMode: 'websocket',
  setConnectionMode: (mode) => set({ connectionMode: mode }),
}))
