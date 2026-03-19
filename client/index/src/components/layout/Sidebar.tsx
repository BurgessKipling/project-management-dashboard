import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  GanttChart,
  AlertTriangle,
  Flag,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Menu,
  X,
  Shield,
  Activity
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

// 基础导航 - 所有人可见
const navigation = [
  { name: '项目列表', href: '/projects', icon: FolderKanban },
  { name: '仪表盘', href: '/dashboard', icon: LayoutDashboard },
  { name: '监控', href: '/monitoring', icon: Activity },
  { name: '设置', href: '/settings', icon: Settings },
]

// 项目导航 - 根据权限过滤
const projectNavigationAll = [
  { name: '概览', href: '/projects/:id', icon: LayoutDashboard, permission: 'view:project' as const },
  { name: '甘特图', href: '/projects/:id/gantt', icon: GanttChart, permission: 'view:task' as const },
  { name: '风险管理', href: '/projects/:id/risks', icon: AlertTriangle, permission: 'view:risk' as const },
  { name: '里程碑', href: '/projects/:id/milestones', icon: Flag, permission: 'view:milestone' as const },
  { name: '报表', href: '/projects/:id/reports', icon: BarChart3, permission: 'view:reports' as const },
  { name: '团队', href: '/projects/:id/team', icon: Users, permission: 'view:team' as const },
]

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen, currentProject, projects } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // 权限检查
  const { can } = usePermissions()

  // 根据权限过滤项目导航
  const projectNavigation = projectNavigationAll.filter(item => can.check(item.permission))

  // 判断是否在项目详情页面
  const isProjectPage = location.pathname.match(/\/projects\/[^\/]+$/)
  const currentNav = isProjectPage ? projectNavigation : navigation

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-background border rounded-md p-2 shadow-md"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 移动端遮罩层 */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 移动端侧边栏 */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "w-64" : "w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* 关闭按钮（仅移动端） */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 lg:hidden p-1 rounded-md hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>
      {/* Logo区域 */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {sidebarOpen && (
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GanttChart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">项目管理系统</span>
          </Link>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-md p-1 hover:bg-accent"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* 导航区域 */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {currentNav.map((item) => {
            const isActive = location.pathname === item.href.replace(':id', currentProject?.id || '')
            return (
              <li key={item.name}>
                <Link
                  to={item.href.replace(':id', currentProject?.id || '')}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* 项目列表（侧边栏展开时显示） */}
        {sidebarOpen && !isProjectPage && projects.length > 0 && (
          <div className="mt-6">
            <div className="px-3 text-xs font-semibold text-muted-foreground">
              我的项目
            </div>
            <ul className="mt-2 space-y-1">
              {projects.slice(0, 5).map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <FolderKanban className="h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* 底部区域 */}
      <div className="border-t p-2">
        {sidebarOpen ? (
          <Link
            to="/projects"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            新建项目
          </Link>
        ) : (
          <Link
            to="/projects"
            className="flex justify-center rounded-md p-2 hover:bg-accent"
          >
            <Plus className="h-5 w-5" />
          </Link>
        )}
      </div>
    </aside>
    </>
  )
}
