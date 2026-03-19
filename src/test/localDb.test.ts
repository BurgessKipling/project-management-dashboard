// 本地数据库模块测试
import { describe, it, expect } from 'vitest'
import { generateId } from '../lib/localDb'

describe('本地数据库模块', () => {
  describe('generateId', () => {
    it('应该生成唯一 ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('生成的 ID 应该是字符串', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('生成的 ID 应该有合理的长度', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(10)
    })

    it('生成的 ID 应该包含数字和字母', () => {
      const id = generateId()
      expect(id).toMatch(/[0-9a-zA-Z]/)
    })
  })
})
