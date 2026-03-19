import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/hooks/useStore'
import { invitationDb, generateId, Invitation } from '@/lib/localDb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, Users, Copy, Trash2, RefreshCw } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { realtimeService } from '@/lib/realtimeService'
import { TeamMembersSkeleton } from '@/components/ui/page-skeleton'

export default function TeamMembers() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser, invitations, setInvitations, addInvitation, revokeInvitation } = useStore()
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ permission_level: 'editor' as const, max_uses: '', expires_at: '' })

  useEffect(() => { if (id) loadInvitations() }, [id])

  const loadInvitations = async () => {
    try {
      // 使用本地存储的邀请码数据
      if (!id) {
        setInvitations([])
        return
      }
      const data = invitationDb.getByProject(id)
      setInvitations(data)
    } catch (e) { 
      console.error('加载邀请码失败:', e)
      toast({ title: "加载失败", description: "请刷新页面重试", variant: "destructive" })
    }
    finally { setLoading(false) }
  }

  const generateInvitation = async () => {
    if (!id) return
    try {
      const code = generateId().slice(0, 8)
      const newInvitation = {
        id: generateId(),
        project_id: id,
        invitation_code: code,
        permission_level: formData.permission_level,
        created_by: currentUser?.id,
        created_at: new Date().toISOString(),
        is_revoked: false,
        used_count: 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at || null,
      }

      invitationDb.create(newInvitation)
      addInvitation(newInvitation)
      
      // 同步到Supabase
      if (realtimeService.isReady()) {
        realtimeService.syncChange('invitations', 'INSERT', newInvitation, id).catch(console.error)
      }
      
      toast({ title: "邀请码已生成", description: `邀请码: ${code}` })
      setDialogOpen(false)
    } catch (e) { 
      console.error('生成邀请码失败:', e)
      toast({ title: "生成失败", variant: "destructive" }) 
    }
  }

  const handleRevoke = async (code: string) => {
    if (!confirm('确定要撤销这个邀请码吗？')) return
    try {
      const invitation = invitationDb.getByCode(code)
      if (invitation) {
        invitationDb.update(invitation.id, { is_revoked: true })
        revokeInvitation(code)
        
        // 同步到Supabase
        if (realtimeService.isReady()) {
          realtimeService.syncChange('invitations', 'UPDATE', { id: invitation.id, is_revoked: true }, id).catch(console.error)
        }
        
        toast({ title: "邀请码已撤销" })
      }
    } catch (e) {
      console.error('撤销邀请码失败:', e)
      toast({ title: "撤销失败", variant: "destructive" })
    }
  }

  const copyLink = async (code: string) => {
    const url = `${window.location.origin}/join/${code}`
    await navigator.clipboard.writeText(url)
    toast({ title: "链接已复制" })
  }

  const activeInvitations = invitations.filter(i => !i.is_revoked)

  if (loading) return <div className="p-6"><TeamMembersSkeleton /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" />返回项目</Button>
          <h2 className="text-xl font-semibold">团队成员</h2>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />生成邀请码</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">有效邀请码</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{activeInvitations.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />邀请码管理</CardTitle></CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>暂无邀请码</p><Button className="mt-4" onClick={() => setDialogOpen(true)}>生成邀请码</Button></div>
          ) : (
            <div className="space-y-3">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-mono font-medium">{inv.invitation_code}</div>
                    <div className="text-sm text-muted-foreground">
                      权限: {inv.permission_level === 'admin' ? '管理员' : inv.permission_level === 'editor' ? '编辑' : '访客'} |
                      已使用: {inv.used_count}次 |
                      创建时间: {formatDateTime(inv.created_at)}
                      {inv.expires_at && ` | 过期: ${formatDateTime(inv.expires_at)}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!inv.is_revoked && <><Button variant="outline" size="sm" onClick={() => copyLink(inv.invitation_code)}><Copy className="h-4 w-4" /></Button><Button variant="outline" size="sm" className="text-destructive" onClick={() => handleRevoke(inv.invitation_code)}><Trash2 className="h-4 w-4" /></Button></>}
                    {inv.is_revoked && <span className="text-sm text-muted-foreground">已撤销</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>生成邀请码</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>权限级别</Label><Select value={formData.permission_level} onValueChange={(v: any) => setFormData({ ...formData, permission_level: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="guest">访客</SelectItem><SelectItem value="editor">编辑</SelectItem><SelectItem value="admin">管理员</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>最大使用次数（留空不限制）</Label><Input type="number" value={formData.max_uses} onChange={e => setFormData({ ...formData, max_uses: e.target.value })} /></div>
            <div className="space-y-2"><Label>过期时间（留空永不过期）</Label><Input type="datetime-local" value={formData.expires_at} onChange={e => setFormData({ ...formData, expires_at: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={generateInvitation}><RefreshCw className="mr-2 h-4 w-4" />生成</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
