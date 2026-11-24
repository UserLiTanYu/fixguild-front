import { ref, shallowRef } from 'vue'
import { api, setSessionExpiredHandler, type Client, type Session, type UserAuth, type UserInfo } from './api'

const storageKey = 'fixguild.session'

function readSession(): Session | null {
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
    if ((stored?.client === 'platform' || stored?.client === 'tenant') &&
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

export function signOut(notice = '') {
  userInfo.value = null
  userAuth.value = null
  sessionNotice.value = notice
  saveSession(null)
}

setSessionExpiredHandler((expired) => {
  if (session.value === expired) signOut('登录已失效，请重新登录。')
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

export async function restoreSession() {
  const current = session.value
  if (!current || userAuth.value) return
  const [info, auth] = await Promise.all([api.userInfo(current), api.userAuth(current)])
  if (session.value === current) {
    userInfo.value = info
    userAuth.value = auth
  }
}

export function canManageTenant(action: 'page' | 'create' | 'detail' | 'update' | 'status') {
  return session.value?.client === 'platform' && !!userAuth.value?.permissions.includes(`platform:tenant:${action}`)
}

export function homeRoute() {
  return session.value?.client === 'platform' && (!userAuth.value || canManageTenant('page'))
    ? '/platform/tenant'
    : '/account'
}
