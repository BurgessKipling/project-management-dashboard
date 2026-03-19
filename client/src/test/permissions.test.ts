// 权限模块测试
import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRoleDisplayName,
  getRoleDescription,
  ROLE_PERMISSIONS,
} from '@/lib/permissions'

describe('权限模块', () => {
  describe('hasPermission', () => {
    it('管理员拥有所有权限', () => {
      expect(hasPermission('admin', 'view:project')).toBe(true)
      expect(hasPermission('admin', 'edit:project')).toBe(true)
      expect(hasPermission('admin', 'delete:project')).toBe(true)
      expect(hasPermission('admin', 'manage:settings')).toBe(true)
    })

    it('编辑者拥有限制性权限', () => {
      expect(hasPermission('editor', 'view:project')).toBe(true)
      expect(hasPermission('editor', 'edit:project')).toBe(true)
      expect(hasPermission('editor', 'delete:project')).toBe(false)
      expect(hasPermission('editor', 'manage:settings')).toBe(false)
    })

    it('访客只拥有查看权限', () => {
      expect(hasPermission('guest', 'view:project')).toBe(true)
      expect(hasPermission('guest', 'edit:project')).toBe(false)
      expect(hasPermission('guest', 'delete:project')).toBe(false)
      expect(hasPermission('guest', 'create:task')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('应该返回 true 如果拥有任意一个权限', () => {
      // editor 拥有 view:project 和 edit:project
      expect(hasAnyPermission('editor', ['view:project', 'manage:settings'])).toBe(true)
    })

    it('应该返回 false 如果没有任何权限', () => {
      expect(hasAnyPermission('guest', ['delete:project', 'manage:settings'])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('应该返回 true 如果拥有所有权限', () => {
      expect(hasAllPermissions('admin', ['view:project', 'edit:project'])).toBe(true)
    })

    it('应该返回 false 如果缺少任何权限', () => {
      expect(hasAllPermissions('editor', ['view:project', 'delete:project'])).toBe(false)
    })
  })

  describe('getRoleDisplayName', () => {
    it('应该返回正确的中文名称', () => {
      expect(getRoleDisplayName('admin')).toBe('管理员')
      expect(getRoleDisplayName('editor')).toBe('编辑者')
      expect(getRoleDisplayName('guest')).toBe('访客')
    })
  })

  describe('getRoleDescription', () => {
    it('应该返回角色的描述', () => {
      expect(getRoleDescription('admin')).toContain('完全访问')
      expect(getRoleDescription('editor')).toContain('编辑')
      expect(getRoleDescription('guest')).toContain('只能查看')
    })
  })

  describe('ROLE_PERMISSIONS', () => {
    it('admin 应该有最多的权限', () => {
      const adminPermissions = ROLE_PERMISSIONS.admin.length
      const editorPermissions = ROLE_PERMISSIONS.editor.length
      const guestPermissions = ROLE_PERMISSIONS.guest.length
      
      expect(adminPermissions).toBeGreaterThan(editorPermissions)
      expect(editorPermissions).toBeGreaterThan(guestPermissions)
    })

    it('所有角色都应该有 view:project 权限', () => {
      expect(ROLE_PERMISSIONS.admin).toContain('view:project')
      expect(ROLE_PERMISSIONS.editor).toContain('view:project')
      expect(ROLE_PERMISSIONS.guest).toContain('view:project')
    })
  })
})
