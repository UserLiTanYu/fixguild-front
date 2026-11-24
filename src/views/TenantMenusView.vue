<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import { ListTree, RefreshCw } from '@lucide/vue'
import { api, errorMessage, type MenuNode } from '../api'
import { session } from '../session'
import MenuTree from '../components/MenuTree.vue'

const menus = shallowRef<MenuNode[]>([])
const loading = ref(true)
const error = ref('')

async function loadMenus() {
  const active = session.value
  if (!active) return
  loading.value = true
  error.value = ''
  try {
    menus.value = await api.tenantMenus(active)
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    loading.value = false
  }
}

onMounted(loadMenus)
</script>

<template>
  <div class="page-content">
    <section class="page-banner"><div class="banner-copy"><h1>菜单管理</h1><p>查看租户端目录、菜单和按钮权限。</p></div><ListTree class="banner-icon" :size="110" :stroke-width=".75" aria-hidden="true" /></section>
    <section class="panel" aria-labelledby="menu-list-title">
      <div class="panel-heading">
        <h2 id="menu-list-title"><ListTree :size="20" />租户菜单树</h2>
        <button class="icon-button refresh-button" type="button" aria-label="刷新菜单" :disabled="loading" @click="loadMenus"><RefreshCw :size="17" /></button>
      </div>
      <div v-if="loading" class="centered-state" role="status">正在加载菜单…</div>
      <div v-else-if="error" class="centered-state" role="alert"><p>{{ error }}</p><button class="button button-secondary" type="button" @click="loadMenus">重新加载</button></div>
      <div v-else-if="!menus.length" class="centered-state">暂无启用的租户菜单。</div>
      <div v-else class="menu-panel-content"><MenuTree :nodes="menus" details /></div>
    </section>
  </div>
</template>
