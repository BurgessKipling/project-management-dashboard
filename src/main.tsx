import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import { storageService } from "./lib/storageService"
import { initMonitoring } from "./lib/monitoring"

// 初始化存储服务（尝试连接Supabase，成功则自动切换到同步模式）
storageService.initialize()

// 初始化监控系统
initMonitoring({
  enabled: import.meta.env.VITE_MONITORING_ENABLED !== 'false',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV || 'development',
  sampleRate: 0.1,
  enablePerformanceMonitoring: true,
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
