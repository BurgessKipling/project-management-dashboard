// 工具函数测试
import { describe, it, expect } from 'vitest'
import { 
  cn, 
  formatDate, 
  generateDeviceId,
  formatDateTime
} from '../lib/utils'

describe('工具函数模块', () => {
  describe('generateDeviceId', () => {
    it('应该生成设备 ID', () => {
      const id1 = generateDeviceId()
      const id2 = generateDeviceId()
      // 可能相同（从 localStorage 获取），所以不测试唯一性
      expect(typeof id1).toBe('string')
    })

    it('生成的 ID 应该有合理的长度', () => {
      const id = generateDeviceId()
      expect(id.length).toBeGreaterThan(5)
    })
  })

  describe('cn (classNames)', () => {
    it('应该合并类名', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('应该过滤掉 falsy 值', () => {
      const result = cn('foo', false && 'bar', 'baz')
      expect(result).toBe('foo baz')
    })

    it('应该处理条件类名', () => {
      const condition = true
      const result = cn('base', condition && 'active')
      expect(result).toBe('base active')
    })

    it('不应该包含 falsy 条件的类名', () => {
      const condition = false
      const result = cn('base', condition && 'active')
      expect(result).toBe('base')
    })
  })

  describe('formatDate', () => {
    it('应该格式化日期', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toContain('2024')
      expect(result).toContain('15')
    })

    it('应该处理字符串日期', () => {
      const result = formatDate('2024-01-15')
      expect(result).toContain('2024')
    })
  })

  describe('formatDateTime', () => {
    it('应该格式化日期时间', () => {
      const date = new Date('2024-01-15T10:30:00')
      const result = formatDateTime(date)
      expect(result).toContain('2024')
      expect(result).toContain('10')
      expect(result).toContain('30')
    })
  })
})
