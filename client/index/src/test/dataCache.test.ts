// 数据缓存模块测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dataCache } from '../lib/dataCache'

describe('数据缓存模块', () => {
  beforeEach(() => {
    // 每个测试前清空缓存
    dataCache.clear()
  })

  describe('基本操作', () => {
    it('应该正确设置和获取缓存', () => {
      dataCache.set('test-key', { name: 'test' })
      const result = dataCache.get<{ name: string }>('test-key')
      expect(result).toEqual({ name: 'test' })
    })

    it('应该返回未命中的缓存为 null', () => {
      const result = dataCache.get('non-existent')
      expect(result).toBeNull()
    })

    it('应该正确删除缓存', () => {
      dataCache.set('delete-me', 'value')
      dataCache.delete('delete-me')
      expect(dataCache.get('delete-me')).toBeNull()
    })

    it('应该清空所有缓存', () => {
      dataCache.set('key1', 'value1')
      dataCache.set('key2', 'value2')
      dataCache.clear()
      expect(dataCache.get('key1')).toBeNull()
      expect(dataCache.get('key2')).toBeNull()
    })
  })

  describe('TTL 过期', () => {
    it('应该根据 TTL 过期缓存', async () => {
      // 设置 100ms 过期的缓存
      dataCache.set('expire-key', 'value', { ttl: 100 })
      
      // 立即获取应该存在
      expect(dataCache.get('expire-key')).toBe('value')
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // 过期后应该返回 null
      expect(dataCache.get('expire-key')).toBeNull()
    })

    it('应该支持不带 TTL 的永久缓存', () => {
      dataCache.set('permanent', 'value')
      expect(dataCache.get('permanent')).toBe('value')
    })
  })

  describe('has 方法', () => {
    it('应该正确检查缓存是否存在', () => {
      dataCache.set('exists', 'value')
      expect(dataCache.has('exists')).toBe(true)
      expect(dataCache.has('not-exists')).toBe(false)
    })

    it('过期的缓存应该返回 false', async () => {
      dataCache.set('expire', 'value', { ttl: 50 })
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(dataCache.has('expire')).toBe(false)
    })
  })

  describe('缓存清理', () => {
    it('应该清理过期缓存', async () => {
      dataCache.set('expire1', 'value1', { ttl: 50 })
      dataCache.set('expire2', 'value2', { ttl: 50 })
      dataCache.set('permanent', 'value3')
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 过期缓存应该被清理
      expect(dataCache.get('expire1')).toBeNull()
      expect(dataCache.get('expire2')).toBeNull()
      // 永久缓存仍然存在
      expect(dataCache.get('permanent')).toBe('value3')
    })
  })
})
