// 键盘快捷键 Hook
import { useEffect, useCallback } from 'react'

interface Shortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // 如果用户正在输入，不触发快捷键
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable) {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// 常用快捷键配置
export const DEFAULT_SHORTCUTS = [
  { key: 'n', action: () => {}, description: '新建任务' },
  { key: 's', ctrlKey: true, action: () => {}, description: '保存' },
  { key: 'Escape', action: () => {}, description: '关闭对话框' },
  { key: '?', shiftKey: true, action: () => {}, description: '显示快捷键帮助' },
]

// 快捷键帮助对话框
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'

interface ShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  const shortcuts = [
    { key: 'Ctrl + N', description: '新建任务' },
    { key: 'Ctrl + S', description: '保存当前内容' },
    { key: 'Ctrl + F', description: '搜索' },
    { key: 'Escape', description: '关闭对话框/取消' },
    { key: '?', description: '显示快捷键帮助' },
    { key: '← / →', description: '导航切换' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>键盘快捷键</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                  <span className="text-muted-foreground">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
