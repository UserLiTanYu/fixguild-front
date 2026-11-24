export const clientNames = { platform: '平台', tenant: '租户', technician: '技师' } as const
export type Client = keyof typeof clientNames
export type TenantStatus = 0 | 1

export interface Session {
  client: Client
  tokenName: string
  tokenValue: string
}

export interface UserInfo {
  uid: string
  userCode: string
  username: string
  nickname: string | null
  tenantId: string
  clientCode: Client
  email: string | null
  avatar: string | null
}

export interface MenuNode {
  uid: string
  menuName: string
  menuType: 'M' | 'C' | 'F'
  path: string | null
  perms: string | null
  children: MenuNode[]
}

export interface UserAuth {
  roles: string[]
  permissions: string[]
  menus: MenuNode[]
}

export interface Tenant {
  uid: string
  tenantCode: string
  tenantName: string
  contactName: string | null
  contactMobile: string | null
  status: TenantStatus
  expireTime: string | null
  maxUserCount: number | null
  remark: string | null
  createTime: string | null
  updateTime: string | null
}

export interface TenantFields {
  tenantName?: string
  contactName?: string
  contactMobile?: string
  expireTime?: string
  maxUserCount?: number
  remark?: string
}

export interface CreateTenant extends TenantFields {
  tenantCode: string
  tenantName: string
  status: TenantStatus
  adminUsername: string
  adminNickname?: string
}

export interface TenantCredentials {
  uid: string
  tenantCode: string
  adminUsername: string
  adminUserUid: string
  initialPassword: string
}

interface Envelope<T> {
  code: number
  msg: string
  data: T
  traceId?: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
}

export interface PageQuery {
  pageNum: number
  pageSize: number
}

interface TenantQuery extends PageQuery {
  tenantCode?: string
  tenantName?: string
  status?: TenantStatus
}

export interface TenantRole {
  uid: string
  roleCode: string
  roleName: string
  dataScope: number
  status: TenantStatus
  isSystem: 0 | 1
  remark: string | null
}

export interface RoleFilters {
  roleCode?: string
  roleName?: string
  status?: TenantStatus
}

export interface RoleFields {
  roleName: string
  status: TenantStatus
  remark: string
}

export interface TenantUser {
  uid: string
  userCode: string
  username: string
  nickname: string | null
  email: string | null
  status: TenantStatus
  lastLoginTime: string | null
  createTime: string | null
  roleUids: string[]
  roleNames: string[]
}

export interface UserFilters {
  username?: string
  nickname?: string
  status?: TenantStatus
}

export interface UserFields {
  nickname?: string
  email?: string
  roleUids?: string[]
}

export interface UserCredentials {
  uid: string
  username: string
  initialPassword: string
}

export class ApiError extends Error {
  constructor(message: string, readonly code: number, readonly traceId?: string) {
    super(message)
  }
}

export function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return '请求失败，请重试。'
  if (error instanceof ApiError && error.traceId) return `${error.message}（追踪 ID ${error.traceId}）`
  return error.message
}

let onSessionExpired: (session: Session) => void = () => {}

export function setSessionExpiredHandler(handler: typeof onSessionExpired) {
  onSessionExpired = handler
}

async function request<T>(path: string, body?: object | null, session?: Session): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  if (body) headers.set('Content-Type', 'application/json')
  if (session) {
    headers.set(session.tokenName, session.tokenValue)
    headers.set('client-code', session.client)
  }

  let response: Response
  try {
    response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    throw new ApiError(timedOut ? '请求超时，请检查后端服务。' : '无法连接后端服务，请稍后重试。', 0)
  }

  const result: Envelope<T> | null = await response.json().catch(() => null)
  if (!response.ok || !result || result.code !== 0) {
    const code = result?.code || response.status
    const authExpired = response.status === 401 || result?.code === 401 || result?.code === 501
    if (session && authExpired) onSessionExpired(session)
    const message = result?.msg || (authExpired ? '登录已失效' : '后端服务响应异常，请检查接口配置。')
    throw new ApiError(message, code, result?.traceId || response.headers.get('X-Trace-Id') || undefined)
  }

  return result.data
}

const tenantEndpoint = '/platform/api/tenant'
const tenantAdmin = '/tenant/api'

export const api = {
  health: () => request<string>('/api/health'),
  login: (client: Client, body: { username: string; password: string; tenantCode?: string }) =>
    request<Omit<Session, 'client'> & { userInfo: UserInfo }>(`/account/api/${client}/login`, body),
  userInfo: (session: Session) => request<UserInfo>(`/account/api/${session.client}/user/info`, null, session),
  userAuth: (session: Session) => request<UserAuth>(`/account/api/${session.client}/user/auth`, null, session),
  logout: (session: Session) => request<void>(`/account/api/${session.client}/logout`, null, session),
  changePassword: (session: Session, body: { oldPassword: string; newPassword: string }) =>
    request<void>(`/account/api/${session.client}/password/change`, body, session),
  tenants: (session: Session, query: TenantQuery) => request<PageResult<Tenant>>(`${tenantEndpoint}/page`, query, session),
  tenantDetail: (session: Session, uid: string) => request<Tenant>(`${tenantEndpoint}/detail`, { uid }, session),
  createTenant: (session: Session, body: CreateTenant) => request<TenantCredentials>(`${tenantEndpoint}/create`, body, session),
  updateTenant: (session: Session, body: TenantFields & { uid: string }) => request<void>(`${tenantEndpoint}/update`, body, session),
  setTenantStatus: (session: Session, uid: string, status: TenantStatus) =>
    request<void>(`${tenantEndpoint}/status`, { uid, status }, session),
  tenantMenus: (session: Session) => request<MenuNode[]>(`${tenantAdmin}/menu/tree`, null, session),
  tenantRoles: (session: Session, query: PageQuery & RoleFilters) =>
    request<PageResult<TenantRole>>(`${tenantAdmin}/role/page`, query, session),
  createRole: (session: Session, body: RoleFields & { roleCode: string }) =>
    request<string>(`${tenantAdmin}/role/create`, body, session),
  updateRole: (session: Session, body: Partial<RoleFields> & { uid: string }) =>
    request<void>(`${tenantAdmin}/role/update`, body, session),
  assignRoleMenus: (session: Session, uid: string, menuUids: string[]) =>
    request<void>(`${tenantAdmin}/role/menus`, { uid, menuUids }, session),
  tenantUsers: (session: Session, query: PageQuery & UserFilters) =>
    request<PageResult<TenantUser>>(`${tenantAdmin}/user/page`, query, session),
  createUser: (session: Session, body: UserFields & { username: string; nickname: string; roleUids: string[] }) =>
    request<UserCredentials>(`${tenantAdmin}/user/create`, body, session),
  updateUser: (session: Session, body: UserFields & { uid: string }) =>
    request<void>(`${tenantAdmin}/user/update`, body, session),
  resetUserPassword: (session: Session, uid: string) =>
    request<{ uid: string; username: string; newPassword: string }>(`${tenantAdmin}/user/reset-password`, { uid }, session),
  setUserStatus: (session: Session, uid: string, status: TenantStatus) =>
    request<void>(`${tenantAdmin}/user/status`, { uid, status }, session),
}
