// Project Members API 路由

import { Router } from 'express'
import { SupabaseService } from '../services/supabaseService.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { validate, validateIdParam, memberSchema } from '../middleware/validation.js'
import { logger } from '../middleware/logger.js'
import type { ApiResponse } from '../types/index.js'
import type { ProjectMember } from '../types/db.js'

const router = Router()
const supabase = new SupabaseService()

// 获取成员列表
router.get('/', asyncHandler(async (req, res) => {
  const projectId = req.query.projectId as string | undefined
  logger.info('Fetching members', { projectId })
  
  const members = await supabase.getMembers(projectId)
  
  const response: ApiResponse<ProjectMember[]> = {
    success: true,
    data: members,
    timestamp: new Date().toISOString(),
  }
  res.json(response)
}))

// 获取单个成员
router.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const { id } = req.params
  logger.info('Fetching member', { id })
  
  const members = await supabase.getMembers()
  const member = members.find(m => m.id === id)
  
  if (!member) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'MEMBER_NOT_FOUND', message: '成员不存在' },
      timestamp: new Date().toISOString(),
    }
    return res.status(404).json(response)
  }
  
  const response: ApiResponse<ProjectMember> = {
    success: true,
    data: member,
    timestamp: new Date().toISOString(),
  }
  res.json(response)
}))

// 添加成员
router.post('/', validate(memberSchema), asyncHandler(async (req, res) => {
  logger.info('Creating member', req.body)
  
  const member = await supabase.createMember(req.body)
  
  const response: ApiResponse<ProjectMember> = {
    success: true,
    data: member,
    timestamp: new Date().toISOString(),
  }
  res.status(201).json(response)
}))

// 更新成员
router.put('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const { id } = req.params
  
  logger.info('Updating member', { id })
  
  const member = await supabase.updateMember(id, req.body)
  
  if (!member) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'MEMBER_NOT_FOUND', message: '成员不存在' },
      timestamp: new Date().toISOString(),
    }
    return res.status(404).json(response)
  }
  
  const response: ApiResponse<ProjectMember> = {
    success: true,
    data: member,
    timestamp: new Date().toISOString(),
  }
  res.json(response)
}))

// 删除成员
router.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const { id } = req.params
  logger.info('Deleting member', { id })
  
  await supabase.deleteMember(id)
  
  const response: ApiResponse = {
    success: true,
    timestamp: new Date().toISOString(),
  }
  res.json(response)
}))

export default router
