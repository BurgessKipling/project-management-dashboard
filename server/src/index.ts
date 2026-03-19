// 项目管理系统 API 服务器
// Express + TypeScript + Supabase

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 导入中间件
import { requestLogger, logger } from './middleware/logger.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// 导入路由
import projectsRouter from './routes/projects.js'
import tasksRouter from './routes/tasks.js'
import risksRouter from './routes/risks.js'
import milestonesRouter from './routes/milestones.js'
import membersRouter from './routes/members.js'
import invitationsRouter from './routes/invitations.js'

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use(requestLogger)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API 路由
app.use('/api/projects', projectsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/risks', risksRouter)
app.use('/api/milestones', milestonesRouter)
app.use('/api/members', membersRouter)
app.use('/api/invitations', invitationsRouter)

// 日志端点
app.get('/api/logs', (req, res) => {
  const level = req.query.level as string | undefined
  const logs = level 
    ? logger.getLogsByLevel(level as any)
    : logger.getLogs()
  
  res.json({
    success: true,
    data: logs,
    timestamp: new Date().toISOString()
  })
})

// 错误处理
app.use(notFoundHandler)
app.use(errorHandler)

// 启动服务器（仅在非测试环境）
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server started`, { port: PORT })
    console.log(`🚀 API Server running on http://localhost:${PORT}`)
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`)
  })
}

export default app
