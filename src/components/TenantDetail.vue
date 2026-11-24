<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage, type Tenant } from '../api'
import { canManageTenant, session } from '../session'
import ModalDialog from './ModalDialog.vue'
import TenantStatus from './TenantStatus.vue'

const props = defineProps<{ uid: string }>()
const emit = defineEmits<{ close: []; edit: [tenant: Tenant] }>()
const tenant = ref<Tenant | null>(null)
const error = ref('')

async function load() {
  const active = session.value
  if (!active) return
  error.value = ''
  try {
    tenant.value = await api.tenantDetail(active, props.uid)
  } catch (problem) {
    error.value = errorMessage(problem)
  }
}

onMounted(load)
</script>

<template>
  <ModalDialog title="租户详情" :subtitle="tenant?.tenantName" @close="emit('close')">
    <div class="modal-content">
      <div v-if="error" class="alert alert-error" role="alert">{{ error }} <button class="text-button" type="button" @click="load">重试</button></div>
      <p v-else-if="!tenant" class="muted" role="status">正在加载租户详情…</p>
      <dl v-else class="data-list detail-data">
        <div><dt>租户编码</dt><dd><code>{{ tenant.tenantCode }}</code></dd></div>
        <div><dt>状态</dt><dd><TenantStatus :status="tenant.status" /></dd></div>
        <div><dt>联系人</dt><dd>{{ tenant.contactName || '—' }}</dd></div>
        <div><dt>联系手机号</dt><dd>{{ tenant.contactMobile || '—' }}</dd></div>
        <div><dt>最大用户数</dt><dd>{{ tenant.maxUserCount ?? '—' }}</dd></div>
        <div><dt>到期时间</dt><dd>{{ tenant.expireTime || '长期有效' }}</dd></div>
        <div><dt>创建时间</dt><dd>{{ tenant.createTime || '—' }}</dd></div>
        <div><dt>更新时间</dt><dd>{{ tenant.updateTime || '—' }}</dd></div>
        <div class="form-span"><dt>租户 UID</dt><dd><code>{{ tenant.uid }}</code></dd></div>
        <div class="form-span"><dt>备注</dt><dd class="preserve-lines">{{ tenant.remark || '—' }}</dd></div>
      </dl>
    </div>
    <div class="modal-footer">
      <button class="button button-secondary" type="button" @click="emit('close')">关闭</button>
      <button v-if="tenant && canManageTenant('update')" class="button button-primary" type="button" @click="emit('edit', tenant)">编辑租户</button>
    </div>
  </ModalDialog>
</template>
