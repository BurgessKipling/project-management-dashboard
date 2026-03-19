// 权限类型定义
// 第三阶段：安全与测试 - 权限体系完善

export type PermissionLevel = 'guest' | 'editor' | 'admin'

export type PermissionAction = 
  | 'view:project'
  | 'edit:project'
  | 'delete:project'
  | 'view:task'
  | 'create:task'
  | 'edit:task'
  | 'delete:task'
  | 'view:risk'
  | 'create:risk'
  | 'edit:risk'
  | 'delete:risk'
  | 'view:milestone'
  | 'create:milestone'
  | 'edit:milestone'
  | 'delete:milestone'
  | 'view:team'
  | 'invite:member'
  | 'remove:member'
  | 'view:reports'
  | 'export:data'
  | 'view:audit'
  | 'manage:settings'

// 角色权限映射
export const ROLE_PERMISSIONS: Record<PermissionLevel, PermissionAction[]> = {
  guest: [
    'view:project',
    'view:task',
    'view:risk',
    'view:milestone',
    'view:team',
    'view:reports',
  ],
  editor: [
    'view:project',
    'edit:project',
    'view:task',
    'create:task',
    'edit:task',
    'view:risk',
    'create:risk',
    'edit:risk',
    'view:milestone',
    'create:milestone',
    'edit:milestone',
    'view:team',
    'view:reports',
    'export:data',
  ],
  admin: [
    'view:project',
    'edit:project',
    'delete:project',
    'view:task',
    'create:task',
    'edit:task',
    'delete:task',
    'view:risk',
    'create:risk',
    'edit:risk',
    'delete:risk',
    'view:milestone',
    'create:milestone',
    'edit:milestone',
    'delete:milestone',
    'view:team',
    'invite:member',
    'remove:member',
    'view:reports',
    'export:data',
    'view:audit',
    'manage:settings',
  ],
}

// 检查权限的辅助函数
export function hasPermission(
  role: PermissionLevel,
  action: PermissionAction
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false
}

// 检查是否具有任意一项权限
export function hasAnyPermission(
  role: PermissionLevel,
  actions: PermissionAction[]
): boolean {
  return actions.some(action => hasPermission(role, action))
}

// 检查是否具有所有权限
export function hasAllPermissions(
  role: PermissionLevel,
  actions: PermissionAction[]
): boolean {
  return actions.every(action => hasPermission(role, action))
}

// 获取角色的显示名称
export function getRoleDisplayName(role: PermissionLevel): string {
  const names: Record<PermissionLevel, string> = {
    guest: '访客',
    editor: '编辑者',
    admin: '管理员',
  }
  return names[role] || role
}

// 获取角色的描述
export function getRoleDescription(role: PermissionLevel): string {
  const descriptions: Record<PermissionLevel, string> = {
    guest: '只能查看项目信息，无法编辑',
    editor: '可以编辑任务、风险、里程碑等，不能管理成员',
    admin: '完全访问权限，可以管理项目所有内容',
  }
  return descriptions[role] || ''
}
