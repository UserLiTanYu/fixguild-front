<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from 'vue'
import { Plus, RefreshCw, Search, Shield } from '@lucide/vue'
import { api, errorMessage, type RoleFilters, type TenantRole, type TenantStatus as Status } from '../api'
import { hasPermission, refreshSession, session } from '../session'
import { usePagedList } from '../usePagedList'
import PagedTable from '../components/PagedTable.vue'
import RoleForm from '../components/RoleForm.vue'
import RoleMenusDialog from '../components/RoleMenusDialog.vue'
import TenantStatus from '../components/TenantStatus.vue'

const filters = reactive({ roleCode: '', roleName: '', status: '' as Status | '' })
const can = (action: 'create' | 'update' | 'menus') => hasPermission('tenant', `tenant:role:${action}`)
const hasActions = computed(() => can('update') || can('menus'))
const dialog = shallowRef<{ kind: 'create' } | { kind: 'edit' | 'menus'; role: TenantRole } | null>(null)
const message = ref('')
const refreshError = ref('')
const dataScopes: Record<number, string> = { 1: '全部', 2: '本租户', 3: '本人', 4: '本客户' }
const { records, pageNum, pageSize, lastPage, total, loading, error, load, goTo, setSize, search } =
  usePagedList<TenantRole, RoleFilters>((query) => api.tenantRoles(session.value!, query))

function applyFilters() {
  return search({ roleCode: filters.roleCode.trim() || undefined, roleName: filters.roleName.trim() || undefined, status: filters.status === '' ? undefined : filters.status })
}

function resetFilters() {
  filters.roleCode = ''
  filters.roleName = ''
  filters.status = ''
  return applyFilters()
}

async function saved() {
  const change = dialog.value
  dialog.value = null
  message.value = change?.kind === 'menus' ? '菜单授权已更新' : change?.kind === 'create' ? '角色已创建' : '角色已更新'
  refreshError.value = ''
  if (change && change.kind !== 'create') {
    try {
      await refreshSession()
    } catch (problem) {
      refreshError.value = `保存成功，当前账号权限刷新失败。${errorMessage(problem)}`
    }
  }
  if (!session.value || !hasPermission('tenant', 'tenant:role:page')) return
  if (change?.kind === 'create') await goTo(1)
  else await load()
}
</script>

<template>
  <div class="page-content">
    <section class="page-banner"><div class="banner-copy"><h1>角色管理</h1><p>管理租户角色和菜单授权。</p></div><Shield class="banner-icon" :size="110" :stroke-width=".75" aria-hidden="true" /></section>
    <section class="panel" aria-labelledby="role-list-title">
      <div class="panel-heading tenant-heading">
        <h2 id="role-list-title">角色列表</h2>
        <div class="panel-actions">
          <button class="icon-button refresh-button" type="button" aria-label="刷新列表" :disabled="loading" @click="load"><RefreshCw :size="17" /></button>
          <button v-if="can('create')" class="button button-primary" type="button" @click="dialog = { kind: 'create' }"><Plus :size="18" />新增角色</button>
        </div>
      </div>
      <div v-if="refreshError" class="tenant-notice alert alert-error" role="alert">{{ refreshError }}</div>
      <div v-else-if="message" class="tenant-notice alert alert-success" role="status">{{ message }}<button class="text-button" type="button" @click="message = ''">关闭</button></div>
      <form class="filters" @submit.prevent="applyFilters">
        <label class="field"><span>角色编码</span><input v-model="filters.roleCode" maxlength="64" placeholder="输入完整编码" /></label>
        <label class="field"><span>角色名称</span><input v-model="filters.roleName" maxlength="64" placeholder="输入名称关键词" /></label>
        <label class="field"><span>角色状态</span><select v-model="filters.status"><option value="">全部状态</option><option :value="1">启用</option><option :value="0">停用</option></select></label>
        <div class="filter-actions"><button class="button button-primary" type="submit"><Search :size="17" />查询</button><button class="button button-secondary" type="button" @click="resetFilters">重置</button></div>
      </form>
      <PagedTable label="租户角色数据表" empty-text="没有符合条件的角色" :loading="loading" :error="error" :empty="!records.length" :page-num="pageNum" :page-size="pageSize" :last-page="lastPage" :total="total" @retry="load" @page="goTo" @size="setSize">
        <table>
          <thead><tr><th scope="col">角色</th><th scope="col">类型</th><th scope="col">数据范围</th><th scope="col">状态</th><th scope="col">备注</th><th v-if="hasActions" scope="col">操作</th></tr></thead>
          <tbody>
            <tr v-for="role in records" :key="role.uid">
              <td><div class="tenant-identity"><span class="tenant-icon"><Shield :size="18" /></span><div><strong>{{ role.roleName }}</strong><code>{{ role.roleCode }}</code></div></div></td>
              <td><span class="menu-type">{{ role.isSystem === 1 ? '系统内置' : '自定义' }}</span></td>
              <td>{{ dataScopes[role.dataScope] || '—' }}</td>
              <td><TenantStatus :status="role.status" /></td>
              <td class="record-text">{{ role.remark || '—' }}</td>
              <td v-if="hasActions" class="row-actions">
                <template v-if="role.isSystem !== 1">
                  <button v-if="can('update')" class="text-button" type="button" @click="dialog = { kind: 'edit', role }">编辑</button>
                  <button v-if="can('menus')" class="text-button" type="button" @click="dialog = { kind: 'menus', role }">分配菜单</button>
                </template>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </PagedTable>
    </section>
    <RoleForm v-if="dialog?.kind === 'create'" key="create" @close="dialog = null" @saved="saved" />
    <RoleForm v-else-if="dialog?.kind === 'edit'" key="edit" :role="dialog.role" @close="dialog = null" @saved="saved" />
    <RoleMenusDialog v-else-if="dialog?.kind === 'menus'" :role="dialog.role" @close="dialog = null" @saved="saved" />
  </div>
</template>
