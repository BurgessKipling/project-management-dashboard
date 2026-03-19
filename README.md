# 项目管理系统 (Project Management Dashboard)

一个轻量级、专业的项目管理系统，支持多人实时协作。

## 功能特点

- 关键路径分析 (CPM)
- 风险预警系统
- 甘特图展示
- 里程碑管理
- Excel 数据导入
- 基础报表统计
- 实时协作（WebSocket）
- 邀请码机制（无需注册）

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui
- Zustand (状态管理)
- Frappe Gantt (甘特图)
- Recharts (图表)

### 后端
- Express.js 4.19.2 + TypeScript
- Supabase (数据库 + Realtime)
- Zod (数据验证)
- Vitest (测试框架)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `client/.env.example` 为 `client/.env`，填入 Supabase 配置：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

后端配置 (复制 `server/.env.example` 为 `server/.env`)：

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 初始化数据库

在 Supabase SQL Editor 中执行 `server/migrations/001_initial_schema.sql`

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## API 文档

### 基础信息

| 项目 | 值 |
|------|-----|
| 基础URL | http://localhost:3001 |
| 健康检查 | GET /api/health |
| 日志查询 | GET /api/logs |

### 项目接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/projects | 获取所有项目 |
| GET | /api/projects/:id | 获取单个项目 |
| POST | /api/projects | 创建项目 |
| PUT | /api/projects/:id | 更新项目 |
| DELETE | /api/projects/:id | 删除项目 |

### 任务接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/tasks | 获取所有任务 |
| GET | /api/tasks/:id | 获取单个任务 |
| GET | /api/tasks?project_id=:id | 按项目获取任务 |
| POST | /api/tasks | 创建任务 |
| PUT | /api/tasks/:id | 更新任务 |
| DELETE | /api/tasks/:id | 删除任务 |

### 风险接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/risks | 获取所有风险 |
| GET | /api/risks/:id | 获取单个风险 |
| POST | /api/risks | 创建风险 |
| PUT | /api/risks/:id | 更新风险 |
| DELETE | /api/risks/:id | 删除风险 |

### 里程碑接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/milestones | 获取所有里程碑 |
| GET | /api/milestones/:id | 获取单个里程碑 |
| POST | /api/milestones | 创建里程碑 |
| PUT | /api/milestones/:id | 更新里程碑 |
| DELETE | /api/milestones/:id | 删除里程碑 |

### 成员接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/members | 获取所有成员 |
| GET | /api/members/:id | 获取单个成员 |
| POST | /api/members | 添加成员 |
| PUT | /api/members/:id | 更新成员 |
| DELETE | /api/members/:id | 删除成员 |

### 邀请接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/invitations | 获取所有邀请 |
| POST | /api/invitations | 创建邀请 |
| PUT | /api/invitations/:code/accept | 接受邀请 |

### 响应格式

所有API响应遵循统一格式：

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

错误响应：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 测试

### 运行测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch
```

### 测试文件结构

```
server/src/__tests__/
├── health.test.ts     # 健康检查测试
├── projects.test.ts   # 项目API测试
├── tasks.test.ts      # 任务API测试
└── logs.test.ts       # 日志API测试
```

## 部署

### Vercel + Supabase

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署完成

## 许可证

MIT
