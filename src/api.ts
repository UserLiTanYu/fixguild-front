export type Client = 'platform' | 'tenant'
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
  path: string | null
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

interface TenantPage {
  records: Tenant[]
  total: number
  pageNum: number
  pageSize: number
}

interface PageQuery {
  pageNum: number
  pageSize: number
  tenantCode?: string
  tenantName?: string
  status?: TenantStatus
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

export const api = {
  health: () => request<string>('/api/health'),
  login: (client: Client, body: { username: string; password: string; tenantCode?: string }) =>
    request<Omit<Session, 'client'> & { userInfo: UserInfo }>(`/account/api/${client}/login`, body),
  userInfo: (session: Session) => request<UserInfo>(`/account/api/${session.client}/user/info`, null, session),
  userAuth: (session: Session) => request<UserAuth>(`/account/api/${session.client}/user/auth`, null, session),
  tenants: (session: Session, query: PageQuery) => request<TenantPage>(`${tenantEndpoint}/page`, query, session),
  tenantDetail: (session: Session, uid: string) => request<Tenant>(`${tenantEndpoint}/detail`, { uid }, session),
  createTenant: (session: Session, body: CreateTenant) => request<TenantCredentials>(`${tenantEndpoint}/create`, body, session),
  updateTenant: (session: Session, body: TenantFields & { uid: string }) => request<void>(`${tenantEndpoint}/update`, body, session),
  setTenantStatus: (session: Session, uid: string, status: TenantStatus) =>
    request<void>(`${tenantEndpoint}/status`, { uid, status }, session),
}
