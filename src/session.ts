import { ref, shallowRef } from 'vue'
import { api, clientNames, setSessionExpiredHandler, type Client, type Session, type UserAuth, type UserInfo } from './api'
import { workspacePages } from './navigation'

const storageKey = 'fixguild.session'

function readSession(): Session | null {
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
    if (typeof stored?.client === 'string' && Object.hasOwn(clientNames, stored.client) &&
        typeof stored.tokenName === 'string' && typeof stored.tokenValue === 'string') return stored
  } catch {
    // The app also works in memory if session storage is unavailable.
  }
  return null
}

export const session = shallowRef<Session | null>(readSession())
export const userInfo = shallowRef<UserInfo | null>(null)
export const userAuth = shallowRef<UserAuth | null>(null)
export const sessionNotice = ref('')

function saveSession(value: Session | null) {
  session.value = value
  try {
    if (value) sessionStorage.setItem(storageKey, JSON.stringify(value))
    else sessionStorage.removeItem(storageKey)
  } catch {
    // A reload will require signing in again if storage is unavailable.
  }
}

export function clearSession(notice = '') {
  userInfo.value = null
  userAuth.value = null
  sessionNotice.value = notice
  saveSession(null)
}

setSessionExpiredHandler((expired) => {
  if (session.value === expired) clearSession('登录已失效，请重新登录。')
})

export async function signIn(client: Client, username: string, password: string, tenantCode?: string) {
  const result = await api.login(client, { username, password, tenantCode })
  const next = { client, tokenName: result.tokenName, tokenValue: result.tokenValue }
  const [info, auth] = await Promise.all([api.userInfo(next), api.userAuth(next)])
  userInfo.value = info
  userAuth.value = auth
  saveSession(next)
  sessionNotice.value = ''
}

export async function refreshSession() {
  const current = session.value
  if (!current) return
  const [info, auth] = await Promise.all([api.userInfo(current), api.userAuth(current)])
  if (session.value === current) {
    userInfo.value = info
    userAuth.value = auth
  }
}

export function hasPermission(client: Client, permission: string) {
  return session.value?.client === client && !!userAuth.value?.permissions.includes(permission)
}

export function canManageTenant(action: 'page' | 'create' | 'detail' | 'update' | 'status') {
  return hasPermission('platform', `platform:tenant:${action}`)
}

export function canOpenPage(path: string) {
  const normalized = path.replace(/\/+$/, '').toLowerCase()
  const page = workspacePages.find((entry) => entry.path === normalized)
  if (!page) return true
  if (!userAuth.value) return session.value?.client === page.client
  return hasPermission(page.client, page.permission)
}

export function homeRoute() {
  return workspacePages.find((page) => canOpenPage(page.path))?.path ?? '/account'
}
