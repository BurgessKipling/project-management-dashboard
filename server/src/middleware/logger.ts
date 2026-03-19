// 日志中间件
// 使用内置console，兼容浏览器和Node.js环境

import type { Request, Response, NextFunction } from 'express'
import type { LogEntry } from '../types/index.js'

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId: (global as any).requestId,
    }
    
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // 控制台输出
    const prefix = `[${level.toUpperCase()}]`
    switch (level) {
      case 'error':
        console.error(prefix, message, context || '')
        break
      case 'warn':
        console.warn(prefix, message, context || '')
        break
      case 'info':
        console.log(prefix, message, context || '')
        break
      case 'debug':
        console.debug(prefix, message, context || '')
        break
    }
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }
}

export const logger = new Logger()

// Express 中间件
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  
  // 请求开始
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  })

  // 响应完成
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    })
  })

  next()
}
