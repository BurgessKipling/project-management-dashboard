import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { ReportsSkeleton } from '@/components/ui/page-skeleton'
import {
  GanttChart,
  AlertTriangle,
  Flag,
  BarChart3,
  Users,
  Plus,
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { projectDb, taskDb, riskDb, milestoneDb } from '@/lib/localDb'
import OnlineMembers from '@/components/OnlineMembers'
import { realtimeService } from '@/lib/realtimeService'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentProject,
    setCurrentProject,
    tasks,
    setTasks,
    risks,
    setRisks,
    milestones,
    setMilestones,
  } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadProjectData()
    }
  }, [id])

  const loadProjectData = () => {
    try {
      // 加载项目信息
      const project = projectDb.getById(id!)

      if (project) {
        setCurrentProject(project)

        // 加载任务
        const tasksData = taskDb.getByProject(id!)
        setTasks(tasksData)

        // 加载风险
        const risksData = riskDb.getByProject(id!)
        setRisks(risksData)

        // 加载里程碑
        const milestonesData = milestoneDb.getByProject(id!)
        setMilestones(milestonesData)
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载项目数据",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 计算统计数据
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
  const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length
  const highRisks = risks.filter((r: any) => r.level === 'high' || r.level === 'critical').length
  const upcomingMilestones = milestones.filter((m: any) => m.status === 'pending')
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) {
    return (
      <div className="p-6">
        <ReportsSkeleton />
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">项目不存在</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          返回项目列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => navigate('/projects')} className="-ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回项目列表
      </Button>

      {/* 项目信息 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentProject.name}</h1>
          {currentProject.description && (
            <p className="text-muted-foreground mt-1">{currentProject.description}</p>
          )}
        </div>
        <div className="w-64">
          <OnlineMembers projectId={id!} />
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">任务完成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} 任务
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">正在执行</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">高风险</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highRisks}</div>
            <p className="text-xs text-muted-foreground">需关注</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">待完成里程碑</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{upcomingMilestones.length}</div>
            <p className="text-xs text-muted-foreground">即将到期</p>
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Link to={`/projects/${id}/gantt`}>
          <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="pt-6 text-center">
              <GanttChart className="h-8 w-8 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">甘特图</span>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${id}/risks`}>
          <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">风险管理</span>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${id}/milestones`}>
          <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="pt-6 text-center">
              <Flag className="h-8 w-8 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">里程碑</span>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${id}/reports`}>
          <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">报表</span>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/projects/${id}/team`}>
          <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <span className="text-sm font-medium">团队</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 任务列表预览 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>最近任务</CardTitle>
            <Link to={`/projects/${id}/gantt`}>
              <Button variant="ghost" size="sm">
                查看全部
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              暂无任务，<Link to={`/projects/${id}/gantt`} className="text-primary hover:underline">去添加</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {(tasks as any[]).slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="h-4 w-4 text-blue-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span>{task.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {task.progress || 0}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
