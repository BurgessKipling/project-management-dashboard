// 网络状态检测模块
// 实现智能网络质量检测和存储模式自动切换

import { NetworkStatus, StorageMode, ConnectivityResult } from './storageService'

// ============================================
// 网络检测配置
// ============================================
interface NetworkMonitorConfig {
  supabaseUrl: string
  testEndpoints: string[]
  checkInterval: number // 检测间隔（毫秒）
  timeout: number // 超时时间（毫秒）
  latencyThresholds: {
    good: number // 良好阈值（毫秒）
    acceptable: number // 可接受阈值（毫秒）
  }
}

const DEFAULT_CONFIG: NetworkMonitorConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  testEndpoints: [
    'https://www.google.com/generate_204',
    'https://www.gstatic.com/generate_204',
    'https://clients3.google.com/generate_204'
  ],
  checkInterval: 30000, // 30秒
  timeout: 5000, // 5秒
  latencyThresholds: {
    good: 500, // < 500ms 良好
    acceptable: 2000 // < 2000ms 可接受
  }
}

// ============================================
// 网络监控类
// ============================================
class NetworkMonitorImpl {
  private config: NetworkMonitorConfig
  private currentStatus: NetworkStatus = NetworkStatus.ONLINE
  private currentLatency: number = 0
  private listeners: Set<(status: NetworkStatus, latency: number) => void> = new Set()
  private intervalId?: number
  private lastCheckTime: number = 0

  constructor(config: Partial<NetworkMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // 检测网络连通性
  async checkConnectivity(): Promise<ConnectivityResult> {
    const startTime = performance.now()
    
    try {
      // 首先检查基本网络状态
      if (!navigator.onLine) {
        return {
          status: NetworkStatus.OFFLINE,
          latency: -1,
          mode: StorageMode.LOCAL,
          error: '网络离线'
        }
      }

      // 尝试访问检测端点
      const latency = await this.measureLatency()
      this.currentLatency = latency
      this.lastCheckTime = Date.now()

      // 根据延迟判断网络状态
      if (latency < 0) {
        this.currentStatus = NetworkStatus.OFFLINE
        return {
          status: NetworkStatus.OFFLINE,
          latency: -1,
          mode: StorageMode.LOCAL,
          error: '无法连接到网络'
        }
      } else if (latency < this.config.latencyThresholds.good) {
        this.currentStatus = NetworkStatus.ONLINE
        return {
          status: NetworkStatus.ONLINE,
          latency,
          mode: StorageMode.SYNC
        }
      } else if (latency < this.config.latencyThresholds.acceptable) {
        this.currentStatus = NetworkStatus.SLOW
        return {
          status: NetworkStatus.SLOW,
          latency,
          mode: StorageMode.SYNC // 慢速网络也尝试同步
        }
      } else {
        this.currentStatus = NetworkStatus.OFFLINE
        return {
          status: NetworkStatus.OFFLINE,
          latency,
          mode: StorageMode.LOCAL,
          error: '网络连接过慢'
        }
      }
    } catch (error) {
      this.currentStatus = NetworkStatus.OFFLINE
      return {
        status: NetworkStatus.OFFLINE,
        latency: -1,
        mode: StorageMode.LOCAL,
        error: error instanceof Error ? error.message : '检测失败'
      }
    }
  }

  // 测量延迟
  private async measureLatency(): Promise<number> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const startTime = performance.now()
      
      // 尝试多个端点
      for (const endpoint of this.config.testEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'HEAD',
            cache: 'no-cache',
            signal: controller.signal
          })
          
          if (response.ok || response.status === 204) {
            clearTimeout(timeoutId)
            return performance.now() - startTime
          }
        } catch {
          // 继续尝试下一个端点
          continue
        }
      }
      
      clearTimeout(timeoutId)
      return -1
    } catch {
      clearTimeout(timeoutId)
      return -1
    }
  }

  // 检测Supabase连通性（可选）
  async checkSupabaseConnectivity(): Promise<ConnectivityResult> {
    if (!this.config.supabaseUrl) {
      return {
        status: NetworkStatus.OFFLINE,
        latency: -1,
        mode: StorageMode.LOCAL,
        error: '未配置Supabase URL'
      }
    }

    const startTime = performance.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
      
      const response = await fetch(`${this.config.supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const latency = performance.now() - startTime
      
      if (response.ok) {
        return {
          status: NetworkStatus.ONLINE,
          latency,
          mode: StorageMode.SYNC
        }
      } else if (response.status === 401 || response.status === 404) {
        // 连接成功但认证失败，说明网络可达
        return {
          status: NetworkStatus.ONLINE,
          latency,
          mode: StorageMode.SYNC
        }
      } else {
        return {
          status: NetworkStatus.SLOW,
          latency,
          mode: StorageMode.LOCAL,
          error: `Supabase响应错误: ${response.status}`
        }
      }
    } catch (error) {
      return {
        status: NetworkStatus.OFFLINE,
        latency: -1,
        mode: StorageMode.LOCAL,
        error: error instanceof Error ? error.message : 'Supabase连接失败'
      }
    }
  }

  // 获取当前状态
  getStatus(): { status: NetworkStatus; latency: number } {
    return {
      status: this.currentStatus,
      latency: this.currentLatency
    }
  }

  // 订阅状态变化
  subscribe(callback: (status: NetworkStatus, latency: number) => void): () => void {
    this.listeners.add(callback)
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(callback)
    }
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentStatus, this.currentLatency)
      } catch (error) {
        console.error('NetworkMonitor listener error:', error)
      }
    })
  }

  // 开始持续检测
  startMonitoring(onStatusChange?: (result: ConnectivityResult) => void): void {
    if (this.intervalId) {
      return // 已经在监控
    }

    // 立即执行一次检测
    this.checkConnectivity().then(result => {
      this.notifyListeners()
      onStatusChange?.(result)
    })

    // 设置定时检测
    this.intervalId = window.setInterval(async () => {
      const result = await this.checkConnectivity()
      this.notifyListeners()
      onStatusChange?.(result)
    }, this.config.checkInterval)
  }

  // 停止检测
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  // 手动触发一次检测
  async refresh(): Promise<ConnectivityResult> {
    return this.checkConnectivity()
  }
}

// 单例实例
export const networkMonitor = new NetworkMonitorImpl()

// 导出类型
export type { NetworkMonitorConfig }
