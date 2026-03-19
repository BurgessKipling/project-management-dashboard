import { describe, it, expect, vi, beforeEach } from 'vitest'
import { request } from './testSetup.js'

// Mock SupabaseService
vi.mock('../services/supabaseService.js', () => ({
  SupabaseService: vi.fn().mockImplementation(() => ({
    getProjects: vi.fn().mockResolvedValue([
      { id: '1', name: 'Project A', description: 'Test project', version: 1 }
    ]),
    getProject: vi.fn().mockImplementation((id: string) => {
      if (id === '1') {
        return Promise.resolve({ id: '1', name: 'Project A', description: 'Test project', version: 1 })
      }
      return Promise.resolve(null)
    }),
    createProject: vi.fn().mockImplementation((data: any) => 
      Promise.resolve({ id: 'new-id', ...data, version: 1 })
    ),
    updateProject: vi.fn().mockImplementation((id: string, data: any) =>
      Promise.resolve({ id, ...data, version: 2 })
    ),
    deleteProject: vi.fn().mockResolvedValue({ success: true }),
  }))
}))

describe('Projects API', () => {
  describe('GET /api/projects', () => {
    it('should return list of projects', async () => {
      const response = await request.get('/api/projects')
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should return projects with required fields', async () => {
      const response = await request.get('/api/projects')
      
      expect(response.body.data[0]).toHaveProperty('id')
      expect(response.body.data[0]).toHaveProperty('name')
    })
  })

  describe('GET /api/projects/:id', () => {
    it('should return a project by id', async () => {
      const response = await request.get('/api/projects/1')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id', '1')
    })

    it('should return 404 for non-existent project', async () => {
      const response = await request.get('/api/projects/999')
      
      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const newProject = {
        name: 'New Project',
        description: 'A new test project'
      }
      
      const response = await request.post('/api/projects').send(newProject)
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
    })

    it('should reject project without name', async () => {
      const newProject = {
        description: 'Missing name'
      }
      
      const response = await request.post('/api/projects').send(newProject)
      
      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const updateData = {
        name: 'Updated Project Name'
      }
      
      const response = await request.put('/api/projects/1').send(updateData)
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      const response = await request.delete('/api/projects/1')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })
})
