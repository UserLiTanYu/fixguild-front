<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, ExternalLink, LogOut, Menu, UserRound, X } from '@lucide/vue'
import BrandMark from './components/BrandMark.vue'
import ServiceStatus from './components/ServiceStatus.vue'
import { api, clientNames, errorMessage } from './api'
import { workspacePages } from './navigation'
import { canOpenPage, clearSession, hasPermission, homeRoute, refreshSession, session, userAuth, userInfo } from './session'

const route = useRoute()
const router = useRouter()
const bootstrapError = ref('')
const menuOpen = ref(false)
const signingOut = ref(false)
const logoutError = ref('')
const clientLabel = computed(() => session.value ? `${clientNames[session.value.client]}控制台` : '')
const visiblePages = computed(() => workspacePages.filter((page) => hasPermission(page.client, page.permission)))
const displayName = computed(() => userInfo.value?.nickname || userInfo.value?.username || '当前用户')

async function loadSession() {
  bootstrapError.value = ''
  try {
    await refreshSession()
  } catch (error) {
    if (session.value) bootstrapError.value = errorMessage(error)
  }
}

async function logout() {
  const active = session.value
  if (!active || signingOut.value) return
  signingOut.value = true
  logoutError.value = ''
  try {
    await api.logout(active)
    if (session.value === active) clearSession()
  } catch (error) {
    if (session.value === active) {
      logoutError.value = errorMessage(error)
      menuOpen.value = false
    }
  } finally {
    signingOut.value = false
  }
}

onMounted(loadSession)
watch(session, (value) => {
  if (!value) {
    logoutError.value = ''
    void router.replace('/login')
  }
})
watch([userAuth, () => route.path], ([auth, path]) => {
  if (auth && !canOpenPage(path)) void router.replace(homeRoute())
})
watch(() => route.path, () => { menuOpen.value = false })
</script>

<template>
  <RouterView v-if="route.path === '/login'" />
  <div v-else-if="session" class="app-shell" @keydown.esc="menuOpen = false">
    <button v-if="menuOpen" class="mobile-overlay" type="button" aria-label="关闭导航" @click="menuOpen = false"></button>
    <aside class="sidebar" :class="{ 'sidebar-open': menuOpen }" id="app-navigation">
      <div class="sidebar-heading">
        <BrandMark />
        <button class="sidebar-close icon-button" type="button" aria-label="关闭导航" @click="menuOpen = false"><X :size="20" /></button>
      </div>
      <div class="sidebar-section">
        <p class="sidebar-label">{{ clientLabel }}</p>
        <nav aria-label="主导航">
          <RouterLink v-for="page in visiblePages" :key="page.path" :to="page.path" class="nav-link"><component :is="page.icon" :size="19" />{{ page.title }}</RouterLink>
          <RouterLink to="/account" class="nav-link"><UserRound :size="19" />我的账号</RouterLink>
        </nav>
      </div>
      <div class="sidebar-footer">
        <a class="sidebar-doc" href="/doc.html" target="_blank" rel="noopener">接口文档 <ExternalLink :size="14" /></a>
        <button class="sidebar-doc" type="button" :disabled="signingOut" @click="logout">{{ signingOut ? '正在退出…' : '退出登录' }} <LogOut :size="16" /></button>
      </div>
    </aside>

    <div class="app-body">
      <header class="topbar">
        <div class="breadcrumb">
          <button class="mobile-menu icon-button" type="button" aria-label="打开导航" aria-controls="app-navigation" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><Menu :size="22" /></button>
          <span class="breadcrumb-root">{{ clientLabel }}</span><ChevronRight class="breadcrumb-divider" :size="14" /><span>{{ route.meta.title }}</span>
        </div>
        <div class="topbar-actions">
          <ServiceStatus />
          <RouterLink class="header-user" to="/account" aria-label="查看我的账号">
            <span class="avatar">{{ Array.from(displayName)[0] }}</span><span class="header-name">{{ displayName }}</span>
          </RouterLink>
        </div>
      </header>

      <main class="page-main">
        <div v-if="logoutError" class="alert alert-error session-error" role="alert">退出登录失败。{{ logoutError }}<button type="button" class="text-button" @click="logout">重试退出</button></div>
        <div v-if="bootstrapError" class="panel centered-state" role="alert">
          <p>{{ bootstrapError }}</p><button class="button button-secondary" type="button" @click="loadSession">重试</button>
        </div>
        <RouterView v-else-if="userAuth && canOpenPage(route.path)" />
        <div v-else class="panel centered-state" role="status">正在读取账号与权限…</div>
      </main>
    </div>
  </div>
</template>
