// 数据验证中间件

import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import type { ApiResponse } from '../types/index.js'

// UUID 验证
export const uuidSchema = z.string().uuid()

// 项目验证 Schema
export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
})

export const projectUpdateSchema = projectSchema.partial().extend({
  version: z.number().int().positive(),
})

// 任务验证 Schema
export const taskSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  progress: z.number().min(0).max(100).default(0),
  assignee: z.string().optional(),
  assignee_unit: z.string().optional(),
  parent_task_id: uuidSchema.optional(),
  dependencies: z.array(uuidSchema).optional(),
  milestone_id: uuidSchema.optional(),
})

export const taskUpdateSchema = taskSchema.partial().extend({
  version: z.number().int().positive(),
})

// 风险验证 Schema
export const riskSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  category: z.enum(['schedule', 'budget', 'resource', 'technical', 'external']),
  probability: z.number().min(0).max(100),
  impact: z.number().min(0).max(100),
  status: z.enum(['identified', 'mitigating', 'occurred', 'closed']).default('identified'),
  mitigation_plan: z.string().optional(),
})

export const riskUpdateSchema = riskSchema.partial().extend({
  version: z.number().int().positive(),
})

// 里程碑验证 Schema
export const milestoneSchema = z.object({
  project_id: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  target_date: z.string().datetime(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).default('pending'),
  completion_rate: z.number().min(0).max(100).default(0),
})

export const milestoneUpdateSchema = milestoneSchema.partial().extend({
  version: z.number().int().positive(),
})

// 成员验证 Schema
export const memberSchema = z.object({
  project_id: uuidSchema,
  user_id: uuidSchema,
  role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  display_name: z.string().optional(),
})

// 邀请码验证 Schema
export const invitationSchema = z.object({
  project_id: uuidSchema,
  code: z.string().length(8),
  role: z.enum(['editor', 'viewer']),
  status: z.enum(['active', 'used', 'revoked', 'expired']).default('active'),
  expires_at: z.string().datetime().optional(),
  created_by: uuidSchema,
})

export const invitationCreateSchema = z.object({
  project_id: uuidSchema,
  role: z.enum(['editor', 'viewer']),
  expires_at: z.string().datetime().optional(),
})

// 验证中间件工厂
export function validate<T extends z.ZodType>(schema: T, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[source])
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '数据验证失败',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
        }
        return res.status(400).json(response)
      }
      next(error)
    }
  }
}

// ID 参数验证
export const idParamSchema = z.object({
  id: uuidSchema,
})

export function validateIdParam(req: Request, res: Response, next: NextFunction) {
  try {
    idParamSchema.parse(req.params)
    next()
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '无效的ID参数',
      },
      timestamp: new Date().toISOString(),
    }
    return res.status(400).json(response)
  }
}

// 分页验证
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export function validatePagination(req: Request, res: Response, next: NextFunction) {
  try {
    const result = paginationSchema.parse(req.query)
    req.query = result as any
    next()
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '无效的分页参数',
      },
      timestamp: new Date().toISOString(),
    }
    return res.status(400).json(response)
  }
}
