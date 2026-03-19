/**
 * API 监控看板组件
 * 显示请求响应时间监控
 */

import { useState, useEffect } from 'react'
import { localMonitor, type ApiMetrics } from '@/lib/monitoring'
import { BarChart3, RefreshCw, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ApiMonitorBoardProps {
  refreshInterval?: number
  maxRows?: number
}

export default function ApiMonitorBoard({ 
  refreshInterval = 5000, 
  maxRows = 20 
}: ApiMonitorBoardProps) {
  const [metrics, setMetrics] = useState<ApiMetrics[]>([])
  const [averageTime, setAverageTime] = useState(0)
  const [errorRate, setErrorRate] = useState(0)
  const [slowRequests, setSlowRequests] = useState<ApiMetrics[]>([])

  useEffect(() => {
    const updateMetrics = () => {
      const data = localMonitor.getApiMetrics()
      setMetrics(data.slice(-maxRows))
      setAverageTime(localMonitor.getAverageResponseTime())
      setErrorRate(localMonitor.getErrorRate())
      setSlowRequests(localMonitor.getSlowRequests(3000))
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, maxRows])

  // 获取状态颜色
  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-red-500'
    if (status >= 500) return 'text-red-500'
    if (status >= 400) return 'text-orange-500'
    return 'text-green-500'
  }

  // 获取响应时间颜色
  const getDurationColor = (duration: number) => {
    if (duration > 3000) return 'text-red-500'
    if (duration > 1000) return 'text-orange-500'
    return 'text-green-500'
  }

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm">总请求数</span>
          </div>
          <div className="text-2xl font-bold mt-1">{metrics.length}</div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">平均响应</span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${getDurationColor(averageTime)}`}>
            {averageTime.toFixed(0)}ms
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">错误率</span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${errorRate > 0.1 ? 'text-red-500' : 'text-green-500'}`}>
            {(errorRate * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">慢请求(>3s)</span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${slowRequests.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {slowRequests.length}
          </div>
        </div>
      </div>

      {/* 请求列表 */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
          <span className="font-medium text-sm">API 请求记录</span>
          <button
            onClick={() => localMonitor.clearMetrics()}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            清空
          </button>
        </div>
        
        {metrics.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无请求数据</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">时间</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">方法</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">URL</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">状态</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">耗时</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        m.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                        m.method === 'POST' ? 'bg-green-100 text-green-700' :
                        m.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {m.method}
                      </span>
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate" title={m.url}>
                      {m.url}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {m.statusCode === 0 ? (
                        <XCircle className="h-4 w-4 mx-auto text-red-500" />
                      ) : m.statusCode < 400 ? (
                        <CheckCircle className="h-4 w-4 mx-auto text-green-500" />
                      ) : (
                        <XCircle className={`h-4 w-4 mx-auto ${getStatusColor(m.statusCode)}`} />
                      )}
                    </td>
                    <td className={`px-4 py-2 text-right font-mono ${getDurationColor(m.duration)}`}>
                      {m.duration.toFixed(0)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
