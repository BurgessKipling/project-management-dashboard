import supertest from 'supertest'
import app from '../index.js'

// 设置测试环境变量（必须在导入app之前）
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-key'
process.env.NODE_ENV = 'test'

// 创建supertest请求对象
const request = supertest(app)

// 导出用于测试的app和request
export { app, request }
