import { describe, it, expect } from 'vitest'
import { request } from './testSetup.js'

describe('Health Check API', () => {
  it('should return OK status', async () => {
    const response = await request.get('/api/health')
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('version', '1.0.0')
  })

  it('should return valid ISO timestamp', async () => {
    const response = await request.get('/api/health')
    const timestamp = new Date(response.body.timestamp)
    
    expect(timestamp.getTime()).not.toBeNaN()
  })
})
