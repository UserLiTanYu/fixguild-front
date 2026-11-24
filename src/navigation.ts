import { Building2, ListTree, Shield, UsersRound } from '@lucide/vue'
import type { Client } from './api'

export const workspacePages = [
  { path: '/platform/tenant', title: '租户管理', client: 'platform', permission: 'platform:tenant:page', icon: Building2, component: () => import('./views/TenantsView.vue') },
  { path: '/tenant/user', title: '用户管理', client: 'tenant', permission: 'tenant:user:page', icon: UsersRound, component: () => import('./views/TenantUsersView.vue') },
  { path: '/tenant/role', title: '角色管理', client: 'tenant', permission: 'tenant:role:page', icon: Shield, component: () => import('./views/TenantRolesView.vue') },
  { path: '/tenant/menu', title: '菜单管理', client: 'tenant', permission: 'tenant:menu:tree', icon: ListTree, component: () => import('./views/TenantMenusView.vue') },
] satisfies { path: string; title: string; client: Client; permission: string; icon: typeof Building2; component: () => Promise<unknown> }[]
