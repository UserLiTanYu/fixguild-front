<script setup lang="ts">
import { computed, ref } from 'vue'
import { api, errorMessage, type TenantUser } from '../api'
import { session } from '../session'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{ user: TenantUser; action: 'status' | 'reset' }>()
const emit = defineEmits<{ close: []; saved: [message: string]; reset: [username: string, password: string] }>()
const nextStatus = computed(() => props.user.status === 1 ? 0 : 1)
const title = computed(() => props.action === 'reset' ? '重置密码' : nextStatus.value === 1 ? '启用用户' : '停用用户')
const pending = ref(false)
const error = ref('')

async function confirm() {
  const active = session.value
  if (!active || pending.value) return
  pending.value = true
  error.value = ''
  try {
    if (props.action === 'reset') {
      const result = await api.resetUserPassword(active, props.user.uid)
      emit('reset', result.username, result.newPassword)
    } else {
      await api.setUserStatus(active, props.user.uid, nextStatus.value)
      emit('saved', nextStatus.value === 1 ? '用户已启用' : '用户已停用')
    }
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ModalDialog :title="title" :busy="pending" compact @close="emit('close')">
    <div class="modal-content">
      <p class="confirmation-text">确认对账号「{{ user.username }}」执行{{ title }}？</p>
      <p v-if="action === 'reset'" class="muted">该用户的当前会话将退出，新密码仅显示一次。</p>
      <p v-else-if="nextStatus === 0" class="muted">该用户的当前会话将退出，重新启用后才能登录。</p>
      <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
    </div>
    <div class="modal-footer">
      <button class="button button-secondary" type="button" :disabled="pending" @click="emit('close')">取消</button>
      <button class="button" :class="action === 'status' && nextStatus === 1 ? 'button-primary' : 'button-danger'" type="button" :disabled="pending" @click="confirm">{{ pending ? '正在提交…' : `确认${title}` }}</button>
    </div>
  </ModalDialog>
</template>
