/**
 * 数据备份服务
 * 本地存储数据的导出和备份功能
 */

import { userDb, projectDb, taskDb, riskDb, milestoneDb } from './localDb'
import { format } from 'date-fns'

interface BackupData {
  version: string
  timestamp: string
  data: {
    users: unknown[]
    projects: unknown[]
    tasks: unknown[]
    risks: unknown[]
    milestones: unknown[]
  }
}

// 导出所有数据
export function exportAllData(): BackupData {
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    data: {
      users: userDb.findAll(),
      projects: projectDb.findAll(),
      tasks: taskDb.findAll(),
      risks: riskDb.findAll(),
      milestones: milestoneDb.findAll(),
    },
  }
}

// 下载备份文件
export function downloadBackup(): void {
  const data = exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 导入备份数据
export async function importBackup(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text()
    const data: BackupData = JSON.parse(text)

    // 验证版本
    if (!data.version || !data.timestamp || !data.data) {
      return { success: false, message: '无效的备份文件格式' }
    }

    // 导入数据（覆盖模式）
    if (data.data.users) {
      data.data.users.forEach((user: any) => {
        const existing = userDb.findByDeviceId(user.device_id)
        if (existing) {
          userDb.update(existing.id, user)
        } else {
          userDb.create(user)
        }
      })
    }

    if (data.data.projects) {
      data.data.projects.forEach((project: any) => {
        const existing = projectDb.get(project.id)
        if (existing) {
          projectDb.update(project.id, project)
        } else {
          projectDb.create(project)
        }
      })
    }

    if (data.data.tasks) {
      data.data.tasks.forEach((task: any) => {
        const existing = taskDb.get(task.id)
        if (existing) {
          taskDb.update(task.id, task)
        } else {
          taskDb.create(task)
        }
      })
    }

    if (data.data.risks) {
      data.data.risks.forEach((risk: any) => {
        const existing = riskDb.get(risk.id)
        if (existing) {
          riskDb.update(risk.id, risk)
        } else {
          riskDb.create(risk)
        }
      })
    }

    if (data.data.milestones) {
      data.data.milestones.forEach((milestone: any) => {
        const existing = milestoneDb.get(milestone.id)
        if (existing) {
          milestoneDb.update(milestone.id, milestone)
        } else {
          milestoneDb.create(milestone)
        }
      })
    }

    return { success: true, message: `成功导入 ${data.timestamp} 的备份` }
  } catch (error) {
    return { success: false, message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}` }
  }
}

// 自动备份到 localStorage（定时任务）
let autoBackupInterval: ReturnType<typeof setInterval> | null = null

export function startAutoBackup(intervalMs = 24 * 60 * 60 * 1000): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval)
  }
  
  // 立即执行一次备份
  const performBackup = () => {
    const data = exportAllData()
    const key = `auto_backup_${format(new Date(), 'yyyy-MM-dd')}`
    localStorage.setItem(key, JSON.stringify(data))
    
    // 只保留最近7天的自动备份
    for (let i = 7; i < 30; i++) {
      const oldKey = `auto_backup_${format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}`
      localStorage.removeItem(oldKey)
    }
    
    console.log('[Backup] 自动备份完成')
  }
  
  performBackup()
  autoBackupInterval = setInterval(performBackup, intervalMs)
}

export function stopAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval)
    autoBackupInterval = null
  }
}

// 获取自动备份列表
export function getAutoBackupList(): { date: string; timestamp: string }[] {
  const backups: { date: string; timestamp: string }[] = []
  
  for (let i = 0; i < 30; i++) {
    const date = format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    const key = `auto_backup_${date}`
    const data = localStorage.getItem(key)
    
    if (data) {
      try {
        const parsed = JSON.parse(data)
        backups.push({ date, timestamp: parsed.timestamp })
      } catch {
        // 忽略解析错误
      }
    }
  }
  
  return backups
}
