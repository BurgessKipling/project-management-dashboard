import { describe, it, expect } from 'vitest'
import { request } from './testSetup.js'

describe('Logs API', () => {
  describe('GET /api/logs', () => {
    it('should return logs list', async () => {
      const response = await request.get('/api/logs')
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter logs by level', async () => {
      const response = await request.get('/api/logs?level=info')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
