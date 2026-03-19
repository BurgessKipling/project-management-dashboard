/**
 * CPM (Critical Path Method) 关键路径算法库
 * 实现完整的前向传递、后向传递、浮动时间计算
 */

// 任务类型扩展 - 支持依赖关系
export interface TaskNode {
  id: string
  name: string
  duration: number  // 工期（天）
  startDate?: Date
  endDate?: Date
  dependencies: string[]  // 依赖的任务ID列表
}

// CPM计算结果
export interface CPMResult {
  criticalPath: string[]  // 关键路径上的任务ID
  criticalTasks: TaskNode[]  // 关键任务详情
  earliestStart: Map<string, number>  // 最早开始时间（相对于项目开始）
  earliestFinish: Map<string, number>  // 最早结束时间
  latestStart: Map<string, number>  // 最晚开始时间
  latestFinish: Map<string, number>  // 最晚结束时间
  float: Map<string, number>  // 浮动时间
  projectDuration: number  // 项目总工期
}

/**
 * 日期工具函数
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function daysBetween(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

/**
 * CPM核心算法
 * @param tasks 任务节点列表
 * @param projectStart 项目开始日期
 * @returns CPM计算结果
 */
export function calculateCPM(tasks: TaskNode[], projectStart: Date = new Date()): CPMResult {
  if (tasks.length === 0) {
    return {
      criticalPath: [],
      criticalTasks: [],
      earliestStart: new Map(),
      earliestFinish: new Map(),
      latestStart: new Map(),
      latestFinish: new Map(),
      float: new Map(),
      projectDuration: 0
    }
  }

  // 构建依赖图
  const taskMap = new Map<string, TaskNode>()
  tasks.forEach(t => taskMap.set(t.id, t))

  // 构建后继映射
  const successors = new Map<string, string[]>()
  tasks.forEach(t => {
    if (!successors.has(t.id)) {
      successors.set(t.id, [])
    }
    t.dependencies.forEach(depId => {
      if (!successors.has(depId)) {
        successors.set(depId, [])
      }
      successors.get(depId)!.push(t.id)
    })
  })

  // ===== 前向传递 (Forward Pass) =====
  // 计算每个任务的最早开始和最早结束时间
  const earliestStart = new Map<string, number>()
  const earliestFinish = new Map<string, number>()

  // 按依赖关系拓扑排序
  const sortedTasks = topologicalSort(tasks, taskMap, successors)

  sortedTasks.forEach(taskId => {
    const task = taskMap.get(taskId)!
    
    if (task.dependencies.length === 0) {
      // 无依赖，最早开始为0
      earliestStart.set(taskId, 0)
    } else {
      // 最早开始 = 所有前驱任务的最早结束的最大值
      let maxFinish = 0
      task.dependencies.forEach(depId => {
        const depFinish = earliestFinish.get(depId) || 0
        maxFinish = Math.max(maxFinish, depFinish)
      })
      earliestStart.set(taskId, maxFinish)
    }
    
    // earliestFinish = earliestStart + duration - 1 (inclusive: 第0天开始，持续N天，结束于第N-1天)
    earliestFinish.set(taskId, (earliestStart.get(taskId) || 0) + task.duration - 1)
  })

  // 项目总工期 = 所有任务最早结束的最大值 + 1 (因为earliestFinish是0-based的结束日)
  let projectDuration = 0
  earliestFinish.forEach(finish => {
    projectDuration = Math.max(projectDuration, finish)
  })
  projectDuration += 1

  // ===== 后向传递 (Backward Pass) =====
  // 计算每个任务的最晚开始和最晚结束时间
  const latestFinish = new Map<string, number>()
  const latestStart = new Map<string, number>()

  // 反向拓扑排序
  const reverseSorted = [...sortedTasks].reverse()

  reverseSorted.forEach(taskId => {
    const task = taskMap.get(taskId)!
    const taskSuccessors = successors.get(taskId) || []
    
    if (taskSuccessors.length === 0) {
      // 无后继，最晚结束 = 项目总工期 - 1 (因为项目总工期是0-based)
      latestFinish.set(taskId, projectDuration - 1)
    } else {
      // 最晚结束 = 所有后继任务最晚开始的最小值 - 1
      let minStart = projectDuration
      taskSuccessors.forEach(succId => {
        const succStart = latestStart.get(succId)
        if (succStart !== undefined) {
          minStart = Math.min(minStart, succStart)
        }
      })
      latestFinish.set(taskId, minStart - 1)
    }
    
    // latestStart = latestFinish - duration + 1
    latestStart.set(taskId, (latestFinish.get(taskId) || projectDuration) - task.duration + 1)
  })

  // ===== 计算浮动时间 =====
  const float = new Map<string, number>()
  tasks.forEach(task => {
    const ls = latestStart.get(task.id) || 0
    const es = earliestStart.get(task.id) || 0
    float.set(task.id, ls - es)
  })

  // ===== 识别关键路径 =====
  // 浮动时间为0的任务组成关键路径
  const criticalPath: string[] = []
  const criticalTasks: TaskNode[] = []
  
  tasks.forEach(task => {
    const taskFloat = float.get(task.id) || 0
    if (taskFloat <= 0) {
      criticalPath.push(task.id)
      criticalTasks.push(task)
    }
  })

  return {
    criticalPath,
    criticalTasks,
    earliestStart,
    earliestFinish,
    latestStart,
    latestFinish,
    float,
    projectDuration
  }
}

/**
 * 拓扑排序 - 确保依赖任务排在前面
 */
function topologicalSort(
  tasks: TaskNode[],
  taskMap: Map<string, TaskNode>,
  successors: Map<string, string[]>
): string[] {
  const result: string[] = []
  const visited = new Set<string>()
  const temp = new Set<string>()

  function visit(taskId: string) {
    if (temp.has(taskId)) {
      // 循环依赖，跳过
      return
    }
    if (visited.has(taskId)) {
      return
    }
    
    temp.add(taskId)
    
    const task = taskMap.get(taskId)
    if (task) {
      task.dependencies.forEach(depId => {
        if (taskMap.has(depId)) {
          visit(depId)
        }
      })
    }
    
    temp.delete(taskId)
    visited.add(taskId)
    result.push(taskId)
  }

  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      visit(task.id)
    }
  })

  return result
}

/**
 * 判断任务是否在关键路径上
 */
export function isCriticalTask(taskId: string, cpmResult: CPMResult): boolean {
  return cpmResult.criticalPath.includes(taskId)
}

/**
 * 获取任务的时间缓冲（百分比）
 */
export function getTaskBuffer(taskId: string, cpmResult: CPMResult): number {
  const float = cpmResult.float.get(taskId) || 0
  const duration = cpmResult.earliestFinish.get(taskId)! - cpmResult.earliestStart.get(taskId)!
  if (duration === 0) return 0
  return (float / duration) * 100
}

/**
 * 获取项目的关键路径摘要
 */
export function getCriticalPathSummary(cpmResult: CPMResult): string {
  if (cpmResult.criticalPath.length === 0) {
    return '无关键路径'
  }
  return `${cpmResult.criticalPath.length}个关键任务，总工期${cpmResult.projectDuration}天`
}

/**
 * 计算任务进度对项目的影响
 * 如果关键路径上的任务延期，项目总工期将相应延长
 */
export function calculateDelayImpact(
  taskId: string,
  delayDays: number,
  cpmResult: CPMResult
): number {
  const float = cpmResult.float.get(taskId) || 0
  
  if (float >= delayDays) {
    // 有足够的缓冲，延期不影响项目工期
    return 0
  }
  
  // 返回实际影响的工期延长天数
  return delayDays - float
}
