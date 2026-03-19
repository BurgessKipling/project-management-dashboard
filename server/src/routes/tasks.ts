// Tasks API 路由

import { Router } from 'express'
import { SupabaseService } from '../services/supabaseService.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { validate, validateIdParam, taskSchema, taskUpdateSchema } from '../middleware/validation.js'
import { logger } from '../middleware/logger.js'
import type { ApiResponse } from '../types/index.js'
import type { Task } from '../types/db.js'

const router = Router()
const supabase = new SupabaseService()

// 获取任务列表
router.get('/', asyncHandler(async (req, res) => {
  const projectId = req.query.projectId as string | undefined
  logger.info('Fetching tasks', { projectId })
  
  const tasks = await supabase.getTasks(projectId)
  
  const response: ApiResponse<Task[]> = {
    success: true,
    data: tasks,
    timestamp: new Date().toISOString(),
  }
  res.json(response)
}))

// 获取单个任务
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const { id } = req.params
  logger.info('Fetching task', { id })
  
  const tasks = await supabase.getTasks()
  const task = tasks.find(t => t.id === id)
  
  if (!task) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: '任务不存在' },
      timestamp: new Date().toISOString(),
    }
    return res.status(404).json(response)
  }
  
  const response: ApiResponse<Task> = {
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  }
  res.json(response)
}))

// 创建任务
router.post('/', validate(taskSchema), asyncHandler(async (req, res) => {
  logger.info('Creating task', req.body)
  
  const task = await supabase.createTask({
    ...req.body,
    version: 1,
  })
  
  const response: ApiResponse<Task> = {
    success: true,
    data: task,
    timestamp: new Date().toISOString(),
  }
  res.status(201).json(response)
}))

// 更新任务
router.put('/:id', validateIdParam, validate(taskUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params
  const { version, ...updates } = req.body
  
  logger.info('Updating task', { id, version })
  
  try {
    const task = await supabase.updateTask(id, updates, version)
    
    if (!task) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: '任务不存在' },
        timestamp: new Date().toISOString(),
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<Task> = {
      success: true,
      data: task,
      timestamp: new Date().toISOString(),
    }
    res.json(response)
  } catch (error: any) {
    if (error.message === 'VERSION_MISMATCH') {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VERSION_MISMATCH', message: '数据已被修改，请刷新后重试' },
        timestamp: new Date().toISOString(),
      }
      return res.status(409).json(response)
    }
    throw error
  }
}))

// 删除任务
router.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const { id } = req.params
  logger.info('Deleting task', { id })
  
  await supabase.deleteTask(id)
  
  const response: ApiResponse = {
    success: true,
    timestamp: new Date().toISOString(),
  }
  res.json(response)
}))

export default router
