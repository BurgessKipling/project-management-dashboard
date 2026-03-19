import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  GanttChart,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react'
import { ReportsSkeleton } from '@/components/ui/page-skeleton'

export default function Dashboard() {
  const { tasks, risks, milestones, setTasks, setRisks, setMilestones } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 简化版：显示汇总数据
    setLoading(false)
  }, [])

  // 计算统计数据
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const highRisks = risks.filter(r => r.level === 'high' || r.level === 'critical').length
  const upcomingMilestones = milestones.filter(m => m.status === 'pending').length
  const completedMilestones = milestones.filter(m => m.status === 'completed').length

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) {
    return (
      <div className="p-6">
        <ReportsSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">仪表盘</h2>
        <p className="text-muted-foreground">项目整体状态概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">任务完成率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} 任务已完成
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">进行中任务</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">正在执行</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">高风险项</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRisks}</div>
            <p className="text-xs text-muted-foreground">需要关注</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">里程碑</CardTitle>
            <Flag className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMilestones}/{completedMilestones + upcomingMilestones}</div>
            <p className="text-xs text-muted-foreground">已完成</p>
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/projects">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GanttChart className="h-5 w-5 text-primary" />
                甘特图视图
              </CardTitle>
              <CardDescription>查看项目时间线和任务进度</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                前往
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/projects">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                风险监控
              </CardTitle>
              <CardDescription>查看和管理项目风险</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                前往
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/projects">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                里程碑追踪
              </CardTitle>
              <CardDescription>查看关键节点和完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                前往
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* 提示信息 */}
      {totalTasks === 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Activity className="h-6 w-6 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">欢迎使用项目管理系统</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  开始创建您的第一个项目，然后添加任务和里程碑来跟踪进度。
                </p>
                <Link to="/projects">
                  <Button className="mt-4">
                    创建项目
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
