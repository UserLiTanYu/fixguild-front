<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from 'vue'
import { Plus, RefreshCw, Search, UserRound, UsersRound } from '@lucide/vue'
import { api, errorMessage, type TenantStatus as Status, type TenantUser, type UserCredentials, type UserFilters } from '../api'
import { hasPermission, refreshSession, session, userInfo } from '../session'
import { usePagedList } from '../usePagedList'
import CredentialsDialog from '../components/CredentialsDialog.vue'
import PagedTable from '../components/PagedTable.vue'
import TenantDeleteDialog from '../components/TenantDeleteDialog.vue'
import TenantStatus from '../components/TenantStatus.vue'
import TenantUserActionDialog from '../components/TenantUserActionDialog.vue'
import TenantUserForm from '../components/TenantUserForm.vue'

type Dialog = { kind: 'create' } | { kind: 'edit' | 'reset' | 'status' | 'delete'; user: TenantUser } |
  { kind: 'credentials'; username: string; password: string; reset: boolean }

const filters = reactive({ username: '', nickname: '', status: '' as Status | '' })
const can = (action: 'create' | 'update' | 'reset' | 'status' | 'delete') => hasPermission('tenant', `tenant:user:${action}`)
const hasActions = computed(() => can('update') || can('reset') || can('status') || can('delete'))
const dialog = shallowRef<Dialog | null>(null)
const message = ref('')
const refreshError = ref('')
const { records, pageNum, pageSize, lastPage, total, loading, error, load, goTo, setSize, search } =
  usePagedList<TenantUser, UserFilters>((query) => api.tenantUsers(session.value!, query))

function applyFilters() {
  return search({ username: filters.username.trim() || undefined, nickname: filters.nickname.trim() || undefined, status: filters.status === '' ? undefined : filters.status })
}

function resetFilters() {
  filters.username = ''
  filters.nickname = ''
  filters.status = ''
  return applyFilters()
}

async function saved(credentials?: UserCredentials) {
  if (credentials) {
    dialog.value = { kind: 'credentials', username: credentials.username, password: credentials.initialPassword, reset: false }
    await goTo(1)
    return
  }

  const self = dialog.value?.kind === 'edit' && dialog.value.user.uid === userInfo.value?.uid
  dialog.value = null
  message.value = '用户资料已更新'
  refreshError.value = ''
  if (self) {
    try {
      await refreshSession()
    } catch (problem) {
      refreshError.value = `保存成功，当前账号资料和权限刷新失败。${errorMessage(problem)}`
    }
  }
  if (session.value && hasPermission('tenant', 'tenant:user:page')) await load()
}

function userActionSaved(notice: string) {
  dialog.value = null
  refreshError.value = ''
  message.value = notice
  return load()
}

function passwordReset(username: string, password: string) {
  dialog.value = { kind: 'credentials', username, password, reset: true }
}
</script>

<template>
  <div class="page-content">
    <section class="page-banner"><div class="banner-copy"><h1>用户管理</h1><p>维护当前租户的账号、角色和使用状态。</p></div><UsersRound class="banner-icon" :size="110" :stroke-width=".75" aria-hidden="true" /></section>
    <section class="panel" aria-labelledby="user-list-title">
      <div class="panel-heading tenant-heading">
        <h2 id="user-list-title">用户列表</h2>
        <div class="panel-actions">
          <button class="icon-button refresh-button" type="button" aria-label="刷新列表" :disabled="loading" @click="load"><RefreshCw :size="17" /></button>
          <button v-if="can('create')" class="button button-primary" type="button" @click="dialog = { kind: 'create' }"><Plus :size="18" />新增用户</button>
        </div>
      </div>
      <div v-if="refreshError" class="tenant-notice alert alert-error" role="alert">{{ refreshError }}</div>
      <div v-else-if="message" class="tenant-notice alert alert-success" role="status">{{ message }}<button class="text-button" type="button" @click="message = ''">关闭</button></div>
      <form class="filters" @submit.prevent="applyFilters">
        <label class="field"><span>用户名</span><input v-model="filters.username" maxlength="64" placeholder="输入用户名关键词" /></label>
        <label class="field"><span>昵称</span><input v-model="filters.nickname" maxlength="64" placeholder="输入昵称关键词" /></label>
        <label class="field"><span>用户状态</span><select v-model="filters.status"><option value="">全部状态</option><option :value="1">启用</option><option :value="0">停用</option></select></label>
        <div class="filter-actions"><button class="button button-primary" type="submit"><Search :size="17" />查询</button><button class="button button-secondary" type="button" @click="resetFilters">重置</button></div>
      </form>
      <PagedTable label="租户用户数据表" empty-text="没有符合条件的用户" :loading="loading" :error="error" :empty="!records.length" :page-num="pageNum" :page-size="pageSize" :last-page="lastPage" :total="total" @retry="load" @page="goTo" @size="setSize">
        <table>
          <thead><tr><th scope="col">用户</th><th scope="col">邮箱</th><th scope="col">角色</th><th scope="col">状态</th><th scope="col">最近登录</th><th v-if="hasActions" scope="col">操作</th></tr></thead>
          <tbody>
            <tr v-for="user in records" :key="user.uid">
              <td><div class="tenant-identity"><span class="tenant-icon"><UserRound :size="18" /></span><div><strong>{{ user.nickname || user.username }}</strong><code>{{ user.username }}</code></div></div></td>
              <td class="record-text">{{ user.email || '—' }}</td>
              <td><div v-if="user.roleNames.length" class="table-chips"><span v-for="(name, index) in user.roleNames" :key="user.roleUids[index]" class="menu-type">{{ name }}</span></div><span v-else class="muted">—</span></td>
              <td><TenantStatus :status="user.status" /></td>
              <td class="expiration">{{ user.lastLoginTime || '—' }}</td>
              <td v-if="hasActions" class="row-actions">
                <button v-if="can('update')" class="text-button" type="button" @click="dialog = { kind: 'edit', user }">编辑</button>
                <button v-if="can('reset') && user.uid !== userInfo?.uid" class="text-button" type="button" @click="dialog = { kind: 'reset', user }">重置密码</button>
                <button v-if="can('status') && user.uid !== userInfo?.uid" class="text-button" :class="{ 'text-warn': user.status === 1 }" type="button" @click="dialog = { kind: 'status', user }">{{ user.status === 1 ? '停用' : '启用' }}</button>
                <button v-if="can('delete') && user.uid !== userInfo?.uid" class="text-button text-warn" type="button" @click="dialog = { kind: 'delete', user }">删除</button>
                <span v-if="user.uid === userInfo?.uid && !can('update')" class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </PagedTable>
    </section>
    <TenantUserForm v-if="dialog?.kind === 'create'" key="create" @close="dialog = null" @saved="saved" />
    <TenantUserForm v-else-if="dialog?.kind === 'edit'" key="edit" :user="dialog.user" @close="dialog = null" @saved="saved" />
    <TenantUserActionDialog v-else-if="dialog?.kind === 'reset' || dialog?.kind === 'status'" :action="dialog.kind" :user="dialog.user" @close="dialog = null" @saved="userActionSaved" @reset="passwordReset" />
    <TenantDeleteDialog v-else-if="dialog?.kind === 'delete'" kind="user" :uid="dialog.user.uid" :name="dialog.user.username" @close="dialog = null" @deleted="userActionSaved('用户已删除')" />
    <CredentialsDialog v-else-if="dialog?.kind === 'credentials'" :title="dialog.reset ? '密码重置成功' : '用户创建成功'" :tenant-code="userInfo?.tenantId ?? ''" :username="dialog.username" :password="dialog.password" :password-label="dialog.reset ? '新密码' : '初始密码'" @close="dialog = null" />
  </div>
</template>
