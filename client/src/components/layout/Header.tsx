import { useLocation, Link } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Bell, Wifi, WifiOff, User, LogOut, Copy, Check, Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

export default function Header() {
  const location = useLocation()
  const { currentUser, currentProject, connectionMode } = useStore()
  const [copied, setCopied] = useState(false)

  // 获取页面标题
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/projects') return '项目列表'
    if (path === '/dashboard') return '仪表盘'
    if (path === '/settings') return '设置'
    if (path.includes('/gantt')) return '甘特图'
    if (path.includes('/risks')) return '风险管理'
    if (path.includes('/milestones')) return '里程碑'
    if (path.includes('/reports')) return '报表'
    if (path.includes('/team')) return '团队成员'
    if (path.includes('/projects/') && currentProject) return currentProject.name
    return '项目管理'
  }

  const copyInvitationCode = async () => {
    if (!currentProject?.primary_invitation_code) return

    const url = `${window.location.origin}/join/${currentProject.primary_invitation_code}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast({
      title: "链接已复制",
      description: "邀请链接已复制到剪贴板",
      variant: "default",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* 左侧：标题 */}
      <div className="flex items-center gap-2 lg:gap-4">
        <h1 className="text-lg lg:text-xl font-semibold truncate max-w-[150px] lg:max-w-none">{getPageTitle()}</h1>

        {/* 项目邀请码（仅在项目页面显示，移动端隐藏文本） */}
        {currentProject && location.pathname.includes('/projects/') && currentProject.primary_invitation_code && (
          <Button
            variant="outline"
            size="sm"
            onClick={copyInvitationCode}
            className="gap-1 lg:gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="hidden sm:inline text-green-500">已复制</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">复制邀请链接</span>
                <span className="sm:hidden">邀请</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* 右侧：搜索、通知、用户信息 */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* 搜索框（移动端隐藏） */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索任务..."
            className="w-64 pl-9"
          />
        </div>

        {/* 连接状态 */}
        <div className="flex items-center gap-1 lg:gap-2 text-sm text-muted-foreground">
          {connectionMode === 'websocket' ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="hidden sm:inline">实时同步</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-yellow-500" />
              <span className="hidden sm:inline">轮询模式</span>
            </>
          )}
        </div>

        {/* 通知（移动端隐藏） */}
        <Button variant="ghost" size="icon" className="relative hidden sm:flex">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-1 lg:gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {currentUser?.display_name?.slice(0, 2) || '用户'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">
                {currentUser?.display_name || '未命名用户'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <Link to="/settings">设置</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
