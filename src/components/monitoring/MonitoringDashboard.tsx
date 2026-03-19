/**
 * 监控仪表盘页面
 * 集成 API 监控、性能指标、错误追踪
 */

import { useState } from 'react'
import { Activity, Clock, AlertTriangle, Bug, BarChart3, Zap } from 'lucide-react'
import ApiMonitorBoard from './ApiMonitorBoard'
import { localMonitor } from '@/lib/monitoring'

export default function MonitoringDashboard() {
  const [activeTab, setActiveTab] = useState<'api' | 'performance' | 'errors'>('api')

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          系统监控
        </h1>
        <p className="text-muted-foreground mt-1">
          实时监控系统性能和服务状态
        </p>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="API 请求"
          value={localMonitor.getApiMetrics().length}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="平均响应"
          value={`${localMonitor.getAverageResponseTime().toFixed(0)}ms`}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="错误率"
          value={`${(localMonitor.getErrorRate() * 100).toFixed(1)}%`}
          color={localMonitor.getErrorRate() > 0.1 ? 'red' : 'green'}
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="慢请求"
          value={localMonitor.getSlowRequests(3000).length}
          color={localMonitor.getSlowRequests(3000).length > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Tab 切换 */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: 'api', label: 'API 监控', icon: BarChart3 },
            { id: 'performance', label: '性能指标', icon: Zap },
            { id: 'errors', label: '错误追踪', icon: Bug },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 内容 */}
      <div className="mt-6">
        {activeTab === 'api' && (
          <ApiMonitorBoard />
        )}
        
        {activeTab === 'performance' && (
          <PerformanceMetrics />
        )}
        
        {activeTab === 'errors' && (
          <ErrorTracker />
        )}
      </div>
    </div>
  )
}

// 统计卡片组件
function StatCard({ 
  icon, 
  label, 
  value, 
  color = 'blue' 
}: { 
  icon: React.ReactNode
  label: string
  value: string | number
  color?: 'blue' | 'green' | 'red' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
  }

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

// 性能指标组件
function PerformanceMetrics() {
  const metrics = localMonitor.getPerformanceMetrics()
  
  if (metrics.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无性能数据</p>
        <p className="text-sm mt-1">性能指标将在您使用系统时自动收集</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 border-b">
          <span className="font-medium text-sm">性能追踪记录</span>
        </div>
        <div className="divide-y">
          {metrics.slice(-20).map((m, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-medium">{m.name}</span>
                {m.metadata && (
                  <span className="text-muted-foreground text-sm ml-2">
                    {JSON.stringify(m.metadata)}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground">
                {m.value.toFixed(2)}ms • {new Date(m.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 错误追踪组件
function ErrorTracker() {
  const errorMetrics = localMonitor.getApiMetrics().filter(m => m.error || m.statusCode >= 400)
  
  if (errorMetrics.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无错误记录</p>
        <p className="text-sm mt-1">错误信息将在出现问题时自动显示</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
          <span className="font-medium text-sm">错误记录</span>
          <span className="text-sm text-red-500">{errorMetrics.length} 个错误</span>
        </div>
        <div className="divide-y">
          {errorMetrics.slice(-20).map((m, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-red-500">
                  {m.method} {m.url}
                </span>
                <span className="text-muted-foreground text-sm">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                状态码: {m.statusCode || 'N/A'} • 耗时: {m.duration.toFixed(0)}ms
              </div>
              {m.error && (
                <div className="text-sm text-red-500 mt-1 font-mono">
                  {m.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
