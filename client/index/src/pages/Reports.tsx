// 报表统计页面
// 责任人/单位完成率报表、图表可视化

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useStore } from '@/hooks/useStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Download, Users, Building2, BarChart3, PieChart, TrendingUp, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { taskDb } from '@/lib/localDb'
import { dataCache } from '@/lib/dataCache'

// 简单图表组件（不依赖外部库）
function SimpleBarChart({ data, title }: { data: { label: string; value: number; color?: string }[]; title: string }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="space-y-3">
      <h4 className="font-medium">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-20 text-sm truncate">{item.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded transition-all duration-300"
                style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: item.color || '#3b82f6' }}
              />
            </div>
            <span className="w-12 text-right text-sm">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimplePieChart({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  
  return (
    <div className="space-y-3">
      <h4 className="font-medium">{title}</h4>
      <div className="flex items-center gap-4">
        <div className="relative w-32 h-32 rounded-full" style={{ background: `conic-gradient(${data.map((d, i) => `${d.color} ${((d.value / total) * 100)}%`).join(', ')})` }} />
        <div className="space-y-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span>{item.label}: {item.value} ({Math.round((item.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const navigate = useNavigate()
  const { currentProject, tasks, setTasks } = useStore()
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 缓存命名空间
  const cacheNamespace = `reports_${currentProject?.id || 'no-project'}`

  // 加载任务数据（带缓存）
  const loadTasks = useCallback(() => {
    if (!currentProject) return

    // 尝试从缓存获取
    const cached = dataCache.get<any[]>(cacheNamespace)
    if (cached) {
      setTasks(cached)
      setLastUpdated(new Date())
      return
    }

    // 从数据库获取并缓存
    const tasksData = taskDb.getByProject(currentProject.id)
    dataCache.set(cacheNamespace, tasksData, { ttl: 5 * 60 * 1000 }) // 5分钟缓存
    setTasks(tasksData)
    setLastUpdated(new Date())
  }, [currentProject, cacheNamespace, setTasks])

  // 初始加载
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // 手动刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    dataCache.delete(cacheNamespace) // 清除缓存
    loadTasks()
    setTimeout(() => setRefreshing(false), 500)
  }

  // 责任人统计
  const assigneeStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; inProgress: number }> = {}
    
    tasks.forEach((task: any) => {
      const assignee = task.assignee || '未分配'
      if (!stats[assignee]) {
        stats[assignee] = { total: 0, completed: 0, inProgress: 0 }
      }
      stats[assignee].total++
      if (task.status === 'completed') stats[assignee].completed++
      if (task.status === 'in_progress') stats[assignee].inProgress++
    })
    
    return Object.entries(stats).map(([name, stat]) => ({
      name,
      ...stat,
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
    })).sort((a, b) => b.completionRate - a.completionRate)
  }, [tasks])

  // 责任单位统计
  const unitStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; inProgress: number }> = {}
    
    tasks.forEach((task: any) => {
      const unit = task.assignee_unit || '未分配'
      if (!stats[unit]) {
        stats[unit] = { total: 0, completed: 0, inProgress: 0 }
      }
      stats[unit].total++
      if (task.status === 'completed') stats[unit].completed++
      if (task.status === 'in_progress') stats[unit].inProgress++
    })
    
    return Object.entries(stats).map(([name, stat]) => ({
      name,
      ...stat,
      completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
    })).sort((a, b) => b.completionRate - a.completionRate)
  }, [tasks])

  // 任务状态分布
  const statusDistribution = useMemo(() => {
    const stats = { todo: 0, in_progress: 0, completed: 0 }
    tasks.forEach((task: any) => {
      if (stats.hasOwnProperty(task.status)) {
        stats[task.status as keyof typeof stats]++
      }
    })
    return [
      { label: '待处理', value: stats.todo, color: '#6b7280' },
      { label: '进行中', value: stats.in_progress, color: '#3b82f6' },
      { label: '已完成', value: stats.completed, color: '#10b981' }
    ]
  }, [tasks])

  // 导出报表
  const handleExport = () => {
    const report = {
      项目: currentProject?.name || '',
      生成时间: new Date().toISOString(),
      任务总数: tasks.length,
      责任人统计: assigneeStats,
      责任单位统计: unitStats,
      状态分布: statusDistribution
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject?.name || '项目'}-报表-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "报表导出成功" })
  }

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">请先选择一个项目</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          返回项目列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(`/projects/${currentProject.id}`)} className="-ml-4 mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回项目
          </Button>
          <h2 className="text-2xl font-bold">报表统计</h2>
          <p className="text-muted-foreground">
            {currentProject.name} - 责任人及责任单位完成率
            {lastUpdated && <span className="ml-2 text-xs">（缓存: {lastUpdated.toLocaleTimeString()}）</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      <Tabs defaultValue="assignee" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignee" className="flex items-center gap-2">
            <Users className="h-4 w-4" />责任人统计
          </TabsTrigger>
          <TabsTrigger value="unit" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />责任单位统计
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />概览
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignee">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />责任人完成率
              </CardTitle>
              <CardDescription>按责任人统计任务完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              {assigneeStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">暂无任务数据</p>
              ) : (
                <div className="space-y-4">
                  {assigneeStats.map((stat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stat.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {stat.completed}/{stat.total} ({stat.completionRate}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${stat.completionRate}%`,
                            backgroundColor: stat.completionRate >= 80 ? '#10b981' : stat.completionRate >= 50 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />责任单位完成率
              </CardTitle>
              <CardDescription>按责任单位统计任务完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              {unitStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">暂无任务数据</p>
              ) : (
                <div className="space-y-4">
                  {unitStats.map((stat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stat.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {stat.completed}/{stat.total} ({stat.completionRate}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${stat.completionRate}%`,
                            backgroundColor: stat.completionRate >= 80 ? '#10b981' : stat.completionRate >= 50 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />任务状态分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimplePieChart data={statusDistribution} title="" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />完成率排名
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={assigneeStats.slice(0, 5).map(s => ({ 
                    label: s.name, 
                    value: s.completionRate,
                    color: s.completionRate >= 80 ? '#10b981' : s.completionRate >= 50 ? '#f59e0b' : '#ef4444'
                  }))} 
                  title="责任人完成率Top5" 
                />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>统计摘要</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{tasks.length}</div>
                    <div className="text-sm text-muted-foreground">总任务数</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {tasks.filter((t: any) => t.status === 'completed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">已完成</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {tasks.filter((t: any) => t.status === 'in_progress').length}
                    </div>
                    <div className="text-sm text-muted-foreground">进行中</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">
                      {assigneeStats.length}
                    </div>
                    <div className="text-sm text-muted-foreground">责任人数量</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
