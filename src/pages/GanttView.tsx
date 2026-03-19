import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, Calendar, Save, Trash2, GitBranch, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { taskDb, generateId } from '@/lib/localDb'
import { calculateCPM, isCriticalTask, getCriticalPathSummary, type CPMResult } from '@/lib/cpm'
import { GanttViewSkeleton } from '@/components/ui/page-skeleton'
import { Pagination, usePagination } from '@/components/ui/Pagination'

// Task类型（本地版本）
interface Task {
  id: string
  project_id: string
  title?: string
  name?: string  // 兼容旧字段
  description?: string
  status?: string
  priority?: string
  start_date?: string | null
  end_date?: string | null
  progress?: number
  assignee?: string
  assignee_name?: string
  assignee_unit?: string
  responsible_unit?: string
  dependencies?: string[]
  is_critical?: boolean  // 手动标记的关键任务
  version?: number
  created_at: string
  updated_at: string
}

export default function GanttView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tasks, setTasks, addTask, updateTask, deleteTask, currentProject } = useStore()
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    start_date: '',
    end_date: '',
    progress: 0,
    assignee_name: '',
    responsible_unit: '',
    dependencies: [] as string[],
  })

  // 分页状态
  const {
    currentData: paginatedTasks,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize,
    goToFirst,
    goToPrev,
    goToNext,
  } = usePagination<Task>({
    data: tasks as Task[],
    initialPageSize: 20,
  })

  // CPM计算结果（考虑手动标记的关键任务）
  const cpmResult: CPMResult | null = useMemo(() => {
    if (tasks.length === 0) return null
    
    // 转换为CPM任务节点
    const taskNodes = tasks.map(t => {
      const taskName = t.title || t.name || ''
      const startDate = t.start_date ? new Date(t.start_date) : new Date()
      const endDate = t.end_date ? new Date(t.end_date) : addDays(startDate, 1)
      // 使用inclusive计算：结束日-开始日+1，例如03/01到03/21=21天
      const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      
      return {
        id: t.id,
        name: taskName,
        duration,
        startDate,
        endDate,
        dependencies: t.dependencies || []
      }
    })
    
    // 自动计算CPM
    const autoCpm = calculateCPM(taskNodes, new Date())
    
    // 合并手动标记的关键任务
    const manualCriticalIds = tasks.filter(t => t.is_critical).map(t => t.id)
    const combinedCriticalPath = [...new Set([...autoCpm.criticalPath, ...manualCriticalIds])]
    
    return {
      ...autoCpm,
      criticalPath: combinedCriticalPath
    }
  }, [tasks])

  // 工具函数：日期加减
  function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  // 项目统计信息
  const projectStats = useMemo(() => {
    if (!cpmResult) return null
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const criticalTaskCount = cpmResult.criticalPath.length
    
    return {
      totalTasks,
      completedTasks,
      criticalTaskCount,
      projectDuration: cpmResult.projectDuration,
      criticalPathSummary: getCriticalPathSummary(cpmResult)
    }
  }, [tasks, cpmResult])

  useEffect(() => {
    if (id) {
      loadTasks()
    }
  }, [id])

  const loadTasks = () => {
    try {
      const data = taskDb.getByProject(id!)
      // 按开始日期排序
      const sorted = data.sort((a: Task, b: Task) => {
        if (!a.start_date) return 1
        if (!b.start_date) return -1
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      })
      setTasks(sorted)
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTask = () => {
    if (!formData.name.trim() || !id) {
      toast({ title: "请输入任务名称", variant: "destructive" })
      return
    }

    // 验证依赖任务的日期
    if (formData.dependencies && formData.dependencies.length > 0) {
      const newStartDate = formData.start_date ? new Date(formData.start_date) : null
      const newEndDate = formData.end_date ? new Date(formData.end_date) : null
      
      for (const depId of formData.dependencies) {
        const depTask = tasks.find(t => t.id === depId)
        if (!depTask) continue
        
        const depStartDate = depTask.start_date ? new Date(depTask.start_date) : null
        const depEndDate = depTask.end_date ? new Date(depTask.end_date) : null
        
        // 验证：任务的开始时间不能早于依赖任务的完成时间
        if (newStartDate && depEndDate && newStartDate < depEndDate) {
          toast({ 
            title: "日期冲突", 
            description: `依赖任务"${depTask.title || depTask.name}"完成于${depTask.end_date}，当前任务开始时间不能早于此时间`,
            variant: "destructive" 
          })
          return
        }
        
        // 验证：任务的开始时间不能早于依赖任务的开始时间（建议）
        if (newStartDate && depStartDate && newStartDate < depStartDate) {
          toast({ 
            title: "日期建议", 
            description: `依赖任务"${depTask.title || depTask.name}"开始于${depTask.start_date}，建议当前任务在此之后开始`,
          })
        }
      }
    }

    try {
      // 字段映射：将表单字段转换为数据库字段
      const taskData: any = {
        title: formData.name,  // name -> title
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        progress: formData.progress,
        assignee: formData.assignee_name,  // assignee_name -> assignee
        assignee_unit: formData.responsible_unit,  // responsible_unit -> assignee_unit
        dependencies: formData.dependencies || [],
        project_id: id,
        updated_at: new Date().toISOString(),
      }

      if (editingTask) {
        const updated = taskDb.update(editingTask.id, { ...taskData, version: (editingTask.version || 1) + 1 })
        if (updated) {
          updateTask(editingTask.id, { ...editingTask, ...taskData })
          toast({ title: "任务已更新" })
        } else {
          // 版本冲突，直接更新
          updateTask(editingTask.id, { ...editingTask, ...taskData })
          toast({ title: "任务已更新" })
        }
      } else {
        const newTask: any = {
          ...taskData,
          id: generateId(),
          version: 1,
          created_at: new Date().toISOString(),
          is_milestone: false,
        }
        taskDb.create(newTask)
        addTask(newTask)
        toast({ title: "任务已创建" })
      }

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('保存任务失败:', error)
      toast({ title: "保存失败: " + (error as Error).message, variant: "destructive" })
    }
  }

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return

    try {
      taskDb.delete(taskId)
      deleteTask(taskId)
      toast({ title: "任务已删除" })
    } catch (error) {
      console.error('删除任务失败:', error)
      toast({ title: "删除失败", variant: "destructive" })
    }
  }

  // 切换关键任务状态
  const handleToggleCritical = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newCriticalStatus = !task.is_critical
    try {
      taskDb.update(taskId, { is_critical: newCriticalStatus })
      // 更新本地状态
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, is_critical: newCriticalStatus } : t
      )
      setTasks(updatedTasks)
      toast({ 
        title: newCriticalStatus ? "已标记为关键任务" : "已取消关键任务标记",
        description: newCriticalStatus ? "该任务将显示在关键路径中" : ""
      })
    } catch (error) {
      console.error('更新关键任务状态失败:', error)
      toast({ title: "操作失败", variant: "destructive" })
    }
  }

  const handleStatusChange = (taskId: string, val: string) => {
    const updated = taskDb.update(taskId, { status: val, updated_at: new Date().toISOString() })
    if (updated) {
      updateTask(taskId, { status: val })
    }
  }

  const handlePriorityChange = (taskId: string, val: string) => {
    const updated = taskDb.update(taskId, { priority: val, updated_at: new Date().toISOString() })
    if (updated) {
      updateTask(taskId, { priority: val })
    }
  }

  const openEditDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setFormData({
        name: task.title || task.name || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        start_date: task.start_date || '',
        end_date: task.end_date || '',
        progress: task.progress || 0,
        assignee_name: task.assignee_name || '',
        responsible_unit: task.responsible_unit || '',
        dependencies: task.dependencies || [],
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  // 处理依赖关系变更
  const handleDependencyChange = (taskId: string, checked: boolean) => {
    const currentDeps = formData.dependencies || []
    if (checked) {
      // 不能依赖自己
      if (taskId !== editingTask?.id) {
        setFormData({ ...formData, dependencies: [...currentDeps, taskId] })
      }
    } else {
      setFormData({ ...formData, dependencies: currentDeps.filter(id => id !== taskId) })
    }
  }

  const resetForm = () => {
    setEditingTask(null)
    setFormData({
      name: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      start_date: '',
      end_date: '',
      progress: 0,
      assignee_name: '',
      responsible_unit: '',
      dependencies: [],
    })
  }

  // 判断任务是否在关键路径上
  const isOnCriticalPath = (taskId: string): boolean => {
    if (!cpmResult) return false
    return isCriticalTask(taskId, cpmResult)
  }

  // 获取任务的浮动时间
  const getTaskFloat = (taskId: string): number => {
    if (!cpmResult) return 0
    return cpmResult.float.get(taskId) || 0
  }

  if (loading) {
    return (
      <div className="p-6">
        <GanttViewSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回项目
          </Button>
          <h2 className="text-xl font-semibold">甘特图</h2>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          添加任务
        </Button>
      </div>

      {/* 项目统计信息 */}
      {projectStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总任务数</p>
                  <p className="text-2xl font-bold">{projectStats.totalTasks}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">已完成</p>
                  <p className="text-2xl font-bold text-green-600">{projectStats.completedTasks}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">关键任务</p>
                  <p className="text-2xl font-bold text-red-600">{projectStats.criticalTaskCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">项目工期</p>
                  <p className="text-2xl font-bold">{projectStats.projectDuration}天</p>
                </div>
                <GitBranch className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 甘特图展示区 */}
      <Card>
        <CardHeader>
          <CardTitle>任务时间线</CardTitle>
          {projectStats && projectStats.criticalTaskCount > 0 && (
            <p className="text-sm text-muted-foreground font-normal">
              关键路径: {projectStats.criticalPathSummary}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无任务</p>
              <Button className="mt-4" onClick={() => openEditDialog()}>
                添加第一个任务
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* 表头 */}
                <div className="flex border-b pb-2 mb-2 font-medium text-sm">
                  <div className="w-48 flex-shrink-0">任务名称</div>
                  <div className="w-24 flex-shrink-0">状态</div>
                  <div className="w-24 flex-shrink-0">优先级</div>
                  <div className="w-24 flex-shrink-0">进度</div>
                  <div className="flex-1">时间线</div>
                </div>

                {/* 任务列表 */}
                {(paginatedTasks).map(task => {
                  const onCriticalPath = isOnCriticalPath(task.id)
                  const float = getTaskFloat(task.id)
                  
                  return (
                  <div
                    key={task.id}
                    className={`flex items-center border-b py-2 hover:bg-accent/50 ${onCriticalPath ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                  >
                    <div className="w-48 flex-shrink-0 flex items-center gap-2">
                      {onCriticalPath && (
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" title="关键路径任务" />
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)} className={onCriticalPath ? "font-semibold text-red-700" : ""}>
                        {task.title || task.name}
                      </Button>
                      {float > 0 && !onCriticalPath && (
                        <span className="text-xs text-muted-foreground" title={`浮动时间: ${float}天`}>
                          +{float}天
                        </span>
                      )}
                    </div>
                    <div className="w-24 flex-shrink-0">
                      <Select value={task.status || 'todo'} onValueChange={(val) => handleStatusChange(task.id, val)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">待办</SelectItem>
                          <SelectItem value="in_progress">进行中</SelectItem>
                          <SelectItem value="completed">已完成</SelectItem>
                          <SelectItem value="blocked">已阻塞</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 flex-shrink-0">
                      <Select value={task.priority || 'medium'} onValueChange={(val) => handlePriorityChange(task.id, val)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">低</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="high">高</SelectItem>
                          <SelectItem value="critical">紧急</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs">{task.progress || 0}%</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {task.start_date ? formatDate(task.start_date) : '-'}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm text-muted-foreground">
                        {task.end_date ? formatDate(task.end_date) : '-'}
                      </span>
                      {/* 关键任务切换按钮 */}
                      <Button 
                        variant={task.is_critical ? "default" : "outline"} 
                        size="sm" 
                        className={`h-7 px-2 ${task.is_critical ? 'bg-red-500 hover:bg-red-600' : ''}`}
                        onClick={() => handleToggleCritical(task.id)}
                        title={task.is_critical ? "取消关键任务" : "设为关键任务"}
                      >
                        {task.is_critical ? "关键" : "设为关键"}
                      </Button>
                      <Button variant="ghost" size="icon" className="ml-1 h-8 w-8 text-destructive" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  )
                })}

                {/* 分页控件 */}
                {totalItems > pageSize && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    pageSizeOptions={[10, 20, 50, 100]}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 任务编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? '编辑任务' : '添加任务'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>任务名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入任务名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">待办</SelectItem>
                    <SelectItem value="in_progress">进行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="blocked">已阻塞</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>优先级</Label>
                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="critical">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>进度 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>责任人</Label>
                <Input
                  value={formData.assignee_name}
                  onChange={(e) => setFormData({ ...formData, assignee_name: e.target.value })}
                  placeholder="负责人姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>责任单位</Label>
                <Input
                  value={formData.responsible_unit}
                  onChange={(e) => setFormData({ ...formData, responsible_unit: e.target.value })}
                  placeholder="所属部门/单位"
                />
              </div>
            </div>

            {/* 依赖关系选择 */}
            {tasks.length > 1 && (
              <div className="space-y-2">
                <Label>前置依赖任务</Label>
                <div className="border rounded-md max-h-32 overflow-y-auto p-2 space-y-1">
                  {tasks
                    .filter(t => t.id !== editingTask?.id)
                    .map(task => (
                      <label
                        key={task.id}
                        className="flex items-center gap-2 p-1 hover:bg-accent rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(formData.dependencies || []).includes(task.id)}
                          onChange={(e) => handleDependencyChange(task.id, e.target.checked)}
                          className="rounded border-input"
                        />
                        <span className="text-sm">{task.title || task.name}</span>
                        {isOnCriticalPath(task.id) && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                      </label>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  选择此任务依赖的前置任务（完成后才能开始）
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveTask}>
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
