/**
 * 离线数据缓存模块
 * 网络离线时暂存操作，恢复后自动同步
 */

import { useState } from 'react'
import { generateId } from './utils'

interface PendingOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
}

interface SyncStatus {
  isOnline: boolean
  lastSyncTime: number | null
  pendingCount: number
}

class OfflineCache {
  private pendingOps: PendingOperation[] = []
  private syncListeners: Array<(status: SyncStatus) => void> = []
  private isOnline = navigator.onLine

  constructor() {
    // 监听网络状态变化
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // 加载待同步操作
    this.loadPendingOps()
  }

  /**
   * 加载本地存储的待同步操作
   */
  private loadPendingOps() {
    try {
      const stored = localStorage.getItem('pending_sync_ops')
      if (stored) {
        this.pendingOps = JSON.parse(stored)
        console.log(`[Offline] 加载了 ${this.pendingOps.length} 个待同步操作`)
      }
    } catch (e) {
      console.error('[Offline] 加载待同步操作失败:', e)
      this.pendingOps = []
    }
  }

  /**
   * 保存待同步操作到本地存储
   */
  private savePendingOps() {
    try {
      localStorage.setItem('pending_sync_ops', JSON.stringify(this.pendingOps))
    } catch (e) {
      console.error('[Offline] 保存待同步操作失败:', e)
    }
    this.notifyListeners()
  }

  /**
   * 添加待同步操作
   */
  addOperation(type: PendingOperation['type'], table: string, data: any): string {
    const operation: PendingOperation = {
      id: generateId(),
      type,
      table,
      data,
      timestamp: Date.now()
    }

    this.pendingOps.push(operation)
    this.savePendingOps()

    // 如果在线，立即尝试同步
    if (this.isOnline) {
      this.sync()
    }

    return operation.id
  }

  /**
   * 同步操作到数据库
   */
  async sync(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline || this.pendingOps.length === 0) {
      return { success: 0, failed: 0 }
    }

    console.log(`[Offline] 开始同步 ${this.pendingOps.length} 个操作...`)

    let success = 0
    let failed = 0
    const failedOps: PendingOperation[] = []

    // 按时间顺序执行
    const opsToProcess = [...this.pendingOps].sort((a, b) => a.timestamp - b.timestamp)

    for (const op of opsToProcess) {
      try {
        await this.executeOperation(op)
        success++
      } catch (e) {
        console.error(`[Offline] 同步操作失败:`, e)
        failed++
        failedOps.push(op)
      }
    }

    // 更新待同步列表（移除成功的）
    this.pendingOps = failedOps
    this.savePendingOps()

    console.log(`[Offline] 同步完成: 成功 ${success}, 失败 ${failed}`)

    return { success, failed }
  }

  /**
   * 执行单个操作
   */
  private async executeOperation(op: PendingOperation): Promise<void> {
    // 这里需要根据不同的表调用不同的数据库操作
    // 由于使用了适配器模式，可以通过存储服务执行
    const { storageService } = await import('./storageService')
    
    switch (op.table) {
      case 'tasks':
        if (op.type === 'create') {
          await storageService.createTask(op.data)
        } else if (op.type === 'update') {
          await storageService.updateTask(op.id, op.data)
        } else if (op.type === 'delete') {
          await storageService.deleteTask(op.id)
        }
        break
      case 'projects':
        if (op.type === 'create') {
          await storageService.createProject(op.data)
        } else if (op.type === 'update') {
          await storageService.updateProject(op.id, op.data)
        } else if (op.type === 'delete') {
          await storageService.deleteProject(op.id)
        }
        break
      case 'milestones':
        if (op.type === 'create') {
          await storageService.createMilestone(op.data)
        } else if (op.type === 'update') {
          await storageService.updateMilestone(op.id, op.data)
        } else if (op.type === 'delete') {
          await storageService.deleteMilestone(op.id)
        }
        break
      case 'risks':
        if (op.type === 'create') {
          await storageService.createRisk(op.data)
        } else if (op.type === 'update') {
          await storageService.updateRisk(op.id, op.data)
        } else if (op.type === 'delete') {
          await storageService.deleteRisk(op.id)
        }
        break
      default:
        console.warn(`[Offline] 未知表: ${op.table}`)
    }
  }

  /**
   * 网络恢复
   */
  private handleOnline() {
    console.log('[Offline] 网络已恢复')
    this.isOnline = true
    this.notifyListeners()
    
    // 自动同步
    this.sync()
  }

  /**
   * 网络断开
   */
  private handleOffline() {
    console.log('[Offline] 网络已断开')
    this.isOnline = false
    this.notifyListeners()
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSyncTime: null,
      pendingCount: this.pendingOps.length
    }
  }

  /**
   * 手动触发同步
   */
  async manualSync(): Promise<{ success: number; failed: number }> {
    return this.sync()
  }

  /**
   * 清除所有待同步操作（谨慎使用）
   */
  clearPendingOps() {
    this.pendingOps = []
    this.savePendingOps()
  }

  /**
   * 获取待同步操作数量
   */
  getPendingCount(): number {
    return this.pendingOps.length
  }

  /**
   * 订阅同步状态变化
   */
  subscribe(listener: (status: SyncStatus) => void) {
    this.syncListeners.push(listener)
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    const status = this.getSyncStatus()
    this.syncListeners.forEach(listener => listener(status))
  }
}

// 导出单例
export const offlineCache = new OfflineCache()

/**
 * React Hook: 离线状态
 */
export function useOfflineStatus() {
  const [status, setStatus] = useState(offlineCache.getSyncStatus())

  useState(() => {
    return offlineCache.subscribe(setStatus)
  })

  return status
}

