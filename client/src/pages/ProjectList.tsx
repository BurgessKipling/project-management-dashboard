import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Plus, FolderKanban, Calendar, Users, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { projectDb, memberDb, generateId } from '@/lib/localDb'
import { ProjectListSkeleton } from '@/components/ui/page-skeleton'

export default function ProjectList() {
  const { projects, setProjects, currentUser } = useStore()
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = () => {
    try {
      const data = projectDb.getAll()
      // 按创建时间倒序排列
      const sorted = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setProjects(sorted)
    } catch (error) {
      console.error('加载项目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "请输入项目名称",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const newProject = {
        id: generateId(),
        name: newProjectName,
        description: newProjectDesc,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 保存到本地存储
      projectDb.create(newProject)

      // 添加创建者为项目成员
      if (currentUser) {
        memberDb.create({
          id: generateId(),
          project_id: newProject.id,
          user_id: currentUser.id,
          role: 'admin',
          joined_at: new Date().toISOString(),
        })
      }

      setProjects([newProject, ...projects])
      setDialogOpen(false)
      setNewProjectName('')
      setNewProjectDesc('')

      toast({
        title: "项目创建成功",
        description: `项目 "${newProject.name}" 已创建`,
      })
    } catch (error) {
      console.error('创建项目失败:', error)
      toast({
        title: "创建失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <ProjectListSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">我的项目</h2>
          <p className="text-muted-foreground">管理和查看所有项目</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建项目
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新项目</DialogTitle>
              <DialogDescription>
                创建一个新的项目管理空间
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">项目名称</Label>
                <Input
                  id="name"
                  placeholder="输入项目名称"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">项目描述</Label>
                <Input
                  id="description"
                  placeholder="输入项目描述（可选）"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={createProject} disabled={creating}>
                {creating ? '创建中...' : '创建项目'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent className="pt-6">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无项目</h3>
            <p className="text-muted-foreground mb-4">创建您的第一个项目开始管理</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建项目
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(project.created_at)}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm">
                      进入项目
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
