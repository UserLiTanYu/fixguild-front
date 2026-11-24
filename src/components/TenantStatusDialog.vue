<script setup lang="ts">
import { computed, ref } from 'vue'
import { api, errorMessage, type Tenant } from '../api'
import { session } from '../session'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{ tenant: Tenant }>()
const emit = defineEmits<{ close: []; saved: [message: string] }>()
const next = computed(() => props.tenant.status === 1 ? 0 : 1)
const action = computed(() => next.value === 1 ? '启用' : '停用')
const pending = ref(false)
const error = ref('')

async function confirm() {
  const active = session.value
  if (!active || pending.value) return
  pending.value = true
  error.value = ''
  try {
    await api.setTenantStatus(active, props.tenant.uid, next.value)
    emit('saved', `租户已${action.value}`)
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ModalDialog :title="`${action}租户`" :busy="pending" compact @close="emit('close')">
    <div class="modal-content">
      <p class="confirmation-text">确认{{ action }}「{{ tenant.tenantName }}」？</p>
      <p v-if="next === 0" class="muted">停用后，该租户的账号将无法重新登录。</p>
      <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
    </div>
    <div class="modal-footer">
      <button class="button button-secondary" type="button" :disabled="pending" @click="emit('close')">取消</button>
      <button class="button" :class="next === 1 ? 'button-primary' : 'button-danger'" type="button" :disabled="pending" @click="confirm">{{ pending ? '正在提交…' : `确认${action}` }}</button>
    </div>
  </ModalDialog>
</template>
