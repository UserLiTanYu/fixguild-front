<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { Building2, Check, ChevronLeft, ChevronRight, CircleCheck, CircleMinus, Plus, RefreshCw, Search } from '@lucide/vue'
import { api, errorMessage, type Tenant, type TenantCredentials, type TenantStatus as Status } from '../api'
import { canManageTenant, session } from '../session'
import CredentialsDialog from '../components/CredentialsDialog.vue'
import TenantDetail from '../components/TenantDetail.vue'
import TenantForm from '../components/TenantForm.vue'
import TenantStatus from '../components/TenantStatus.vue'
import TenantStatusDialog from '../components/TenantStatusDialog.vue'

type Dialog = { kind: 'create' } | { kind: 'detail'; uid: string } |
  { kind: 'edit' | 'status'; tenant: Tenant } | { kind: 'credentials'; credentials: TenantCredentials }

const tenantCode = ref('')
const tenantName = ref('')
const status = ref<Status | ''>('')
const query = shallowRef<{ tenantCode?: string; tenantName?: string; status?: Status }>({})
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const records = shallowRef<Tenant[]>([])
const loading = ref(true)
const loadError = ref('')
const summary = shallowRef<{ enabled: number; disabled: number } | null>(null)
const dialog = shallowRef<Dialog | null>(null)
const message = ref('')
const lastPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const hasActions = computed(() => canManageTenant('detail') || canManageTenant('update') || canManageTenant('status'))
const summaryCards = computed(() => [
  { label: '租户总数', value: summary.value ? summary.value.enabled + summary.value.disabled : null, icon: Building2, tone: 'green' },
  { label: '已启用', value: summary.value?.enabled, icon: CircleCheck, tone: 'lime' },
  { label: '已停用', value: summary.value?.disabled, icon: CircleMinus, tone: 'neutral' },
])
let pageRequest = 0
let summaryRequest = 0

async function loadPage() {
  const active = session.value
  if (!active) return
  const requestId = ++pageRequest
  loading.value = true
  loadError.value = ''

  try {
    const result = await api.tenants(active, { pageNum: pageNum.value, pageSize: pageSize.value, ...query.value })
    if (requestId !== pageRequest) return
    total.value = result.total
    if (pageNum.value > lastPage.value) {
      pageNum.value = lastPage.value
      await loadPage()
      return
    }
    records.value = result.records
  } catch (problem) {
    if (requestId === pageRequest) loadError.value = errorMessage(problem)
  } finally {
    if (requestId === pageRequest) loading.value = false
  }
}

async function loadSummary() {
  const active = session.value
  if (!active) return
  const requestId = ++summaryRequest
  try {
    const [enabled, disabled] = await Promise.all([
      api.tenants(active, { pageNum: 1, pageSize: 1, status: 1 }),
      api.tenants(active, { pageNum: 1, pageSize: 1, status: 0 }),
    ])
    if (requestId === summaryRequest) summary.value = { enabled: enabled.total, disabled: disabled.total }
  } catch {
    if (requestId === summaryRequest) summary.value = null
  }
}

function refresh() {
  void loadPage()
  void loadSummary()
}

function applyFilters() {
  query.value = {
    tenantCode: tenantCode.value.trim() || undefined,
    tenantName: tenantName.value.trim() || undefined,
    status: status.value === '' ? undefined : status.value,
  }
  pageNum.value = 1
  void loadPage()
}

function resetFilters() {
  tenantCode.value = ''
  tenantName.value = ''
  status.value = ''
  applyFilters()
}

function changePage(value: number) {
  pageNum.value = value
  void loadPage()
}

function saved(credentials?: TenantCredentials) {
  if (credentials) {
    dialog.value = { kind: 'credentials', credentials }
    pageNum.value = 1
    refresh()
  } else {
    dialog.value = null
    message.value = '租户资料已更新'
    void loadPage()
  }
}

function statusSaved(notice: string) {
  dialog.value = null
  message.value = notice
  refresh()
}

onMounted(refresh)
</script>

<template>
  <div class="page-content">
    <section class="page-banner">
      <div class="banner-copy"><h1>租户管理</h1><p>开通平台租户，维护联系信息与使用状态。</p></div>
      <div class="banner-art" aria-hidden="true"><div class="banner-orbit orbit-outer"></div><div class="banner-orbit orbit-inner"></div><div class="banner-art-icon"><Building2 :size="44" :stroke-width="1.1" /></div></div>
    </section>

    <section class="summary-grid" aria-label="租户概况">
      <div v-for="card in summaryCards" :key="card.label" class="stat-card">
        <div class="stat-icon" :class="`stat-${card.tone}`"><component :is="card.icon" :size="24" :stroke-width="1.7" /></div>
        <div><div class="stat-label">{{ card.label }}</div><div class="stat-value">{{ card.value ?? '—' }}</div></div>
      </div>
    </section>

    <section class="panel tenant-panel" aria-labelledby="tenant-list-title">
      <div class="panel-heading tenant-heading">
        <div><h2 id="tenant-list-title">租户列表</h2><p class="muted">按租户编码、名称或状态筛选。</p></div>
        <div class="panel-actions">
          <button class="icon-button refresh-button" type="button" aria-label="刷新列表" title="刷新列表" :disabled="loading" @click="refresh"><RefreshCw :size="17" /></button>
          <button v-if="canManageTenant('create')" class="button button-primary" type="button" @click="dialog = { kind: 'create' }"><Plus :size="18" />新增租户</button>
        </div>
      </div>

      <div v-if="message" class="tenant-notice alert alert-success" role="status"><Check :size="17" />{{ message }}<button type="button" class="text-button" @click="message = ''">关闭</button></div>

      <form class="filters" @submit.prevent="applyFilters">
        <label class="field"><span>租户编码</span><input v-model="tenantCode" maxlength="32" placeholder="输入完整编码" /></label>
        <label class="field"><span>租户名称</span><input v-model="tenantName" maxlength="128" placeholder="输入名称关键词" /></label>
        <label class="field"><span>租户状态</span><select v-model="status"><option value="">全部状态</option><option :value="1">启用</option><option :value="0">停用</option></select></label>
        <div class="filter-actions"><button class="button button-primary" type="submit"><Search :size="17" />查询</button><button class="button button-secondary" type="button" @click="resetFilters">重置</button></div>
      </form>

      <div v-if="loading" class="centered-state table-state" role="status"><span class="spinner"></span>正在加载租户…</div>
      <div v-else-if="loadError" class="centered-state table-state" role="alert"><p>{{ loadError }}</p><button class="button button-secondary" type="button" @click="refresh">重新加载</button></div>
      <div v-else-if="!records.length" class="centered-state table-state"><div class="empty-icon"><Building2 :size="25" /></div><strong>暂无租户</strong><span class="muted">{{ Object.values(query).some((value) => value !== undefined) ? '尝试修改筛选条件后重新查询。' : '当前列表还没有租户记录。' }}</span></div>
      <div v-else class="table-scroll" tabindex="0" role="region" aria-label="租户数据表">
        <table>
          <thead><tr><th scope="col">租户</th><th scope="col">联系人</th><th scope="col">租户状态</th><th scope="col">最大用户数</th><th scope="col">到期时间</th><th v-if="hasActions" scope="col">操作</th></tr></thead>
          <tbody>
            <tr v-for="(tenant, index) in records" :key="tenant.uid">
              <td><div class="tenant-identity"><span class="tenant-icon" :class="index % 2 ? 'alternate' : ''"><Building2 :size="19" :stroke-width="1.8" /></span><div><strong>{{ tenant.tenantName }}</strong><code>{{ tenant.tenantCode }}</code></div></div></td>
              <td><span>{{ tenant.contactName || '—' }}</span><small v-if="tenant.contactMobile" class="cell-subline">{{ tenant.contactMobile }}</small></td>
              <td><TenantStatus :status="tenant.status" /></td>
              <td>{{ tenant.maxUserCount ?? '—' }}</td>
              <td class="expiration">{{ tenant.expireTime || '长期有效' }}</td>
              <td v-if="hasActions" class="row-actions">
                <button v-if="canManageTenant('detail')" class="text-button" type="button" @click="dialog = { kind: 'detail', uid: tenant.uid }">详情</button>
                <button v-if="canManageTenant('update')" class="text-button" type="button" @click="dialog = { kind: 'edit', tenant }">编辑</button>
                <button v-if="canManageTenant('status')" class="text-button" :class="{ 'text-warn': tenant.status === 1 }" type="button" @click="dialog = { kind: 'status', tenant }">{{ tenant.status === 1 ? '停用' : '启用' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loadError" class="pagination">
        <span class="muted">共 {{ total }} 条</span>
        <div class="pagination-controls">
          <select v-model.number="pageSize" aria-label="每页条数" @change="changePage(1)"><option :value="10">10 条 / 页</option><option :value="20">20 条 / 页</option><option :value="50">50 条 / 页</option><option :value="100">100 条 / 页</option></select>
          <button class="icon-button page-button" aria-label="上一页" type="button" :disabled="loading || pageNum <= 1" @click="changePage(pageNum - 1)"><ChevronLeft :size="17" /></button>
          <span class="page-indicator">{{ pageNum }} / {{ lastPage }}</span>
          <button class="icon-button page-button" aria-label="下一页" type="button" :disabled="loading || pageNum >= lastPage" @click="changePage(pageNum + 1)"><ChevronRight :size="17" /></button>
        </div>
      </div>
    </section>

    <TenantForm v-if="dialog?.kind === 'create'" key="create" @close="dialog = null" @saved="saved" />
    <TenantForm v-else-if="dialog?.kind === 'edit'" key="edit" :tenant="dialog.tenant" @close="dialog = null" @saved="saved" />
    <TenantDetail v-else-if="dialog?.kind === 'detail'" :uid="dialog.uid" @close="dialog = null" @edit="dialog = { kind: 'edit', tenant: $event }" />
    <TenantStatusDialog v-else-if="dialog?.kind === 'status'" :tenant="dialog.tenant" @close="dialog = null" @saved="statusSaved" />
    <CredentialsDialog v-else-if="dialog?.kind === 'credentials'" :credentials="dialog.credentials" @close="dialog = null" />
  </div>
</template>
