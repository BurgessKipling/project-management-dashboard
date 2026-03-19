import { describe, it, expect, vi } from 'vitest'
import { request } from './testSetup.js'

// Mock SupabaseService
vi.mock('../services/supabaseService.js', () => ({
  SupabaseService: vi.fn().mockImplementation(() => ({
    getTasks: vi.fn().mockResolvedValue([
      { id: '1', project_id: 'p1', name: 'Task 1', status: 'pending', version: 1 }
    ]),
    getTask: vi.fn().mockImplementation((id: string) => {
      if (id === '1') {
        return Promise.resolve({ id: '1', project_id: 'p1', name: 'Task 1', status: 'pending', version: 1 })
      }
      return Promise.resolve(null)
    }),
    getTasksByProject: vi.fn().mockResolvedValue([
      { id: '1', project_id: 'p1', name: 'Task 1', status: 'pending', version: 1 }
    ]),
    createTask: vi.fn().mockImplementation((data: any) => 
      Promise.resolve({ id: 'new-task-id', ...data, version: 1 })
    ),
    updateTask: vi.fn().mockImplementation((id: string, data: any) =>
      Promise.resolve({ id, ...data, version: 2 })
    ),
    deleteTask: vi.fn().mockResolvedValue({ success: true }),
  }))
}))

describe('Tasks API', () => {
  describe('GET /api/tasks', () => {
    it('should return list of tasks', async () => {
      const response = await request.get('/api/tasks')
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter tasks by project_id', async () => {
      const response = await request.get('/api/tasks?project_id=p1')
      
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/tasks/:id', () => {
    it('should return a task by id', async () => {
      const response = await request.get('/api/tasks/1')
      
      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('id', '1')
    })

    it('should return 404 for non-existent task', async () => {
      const response = await request.get('/api/tasks/999')
      
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const newTask = {
        project_id: 'p1',
        name: 'New Task',
        status: 'pending'
      }
      
      const response = await request.post('/api/tasks').send(newTask)
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
    })

    it('should reject task without required fields', async () => {
      const newTask = {
        project_id: 'p1'
        // missing name
      }
      
      const response = await request.post('/api/tasks').send(newTask)
      
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const updateData = {
        name: 'Updated Task Name',
        status: 'completed'
      }
      
      const response = await request.put('/api/tasks/1').send(updateData)
      
      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const response = await request.delete('/api/tasks/1')
      
      expect(response.status).toBe(200)
    })
  })
})
