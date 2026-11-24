<script setup lang="ts">
import { ref } from 'vue'
import { api, errorMessage } from '../api'
import { clearSession, session } from '../session'
import ModalDialog from './ModalDialog.vue'

const emit = defineEmits<{ close: [] }>()
const oldPassword = ref('')
const newPassword = ref('')
const confirmation = ref('')
const pending = ref(false)
const error = ref('')

async function submit() {
  const active = session.value
  if (!active || pending.value) return
  if (!oldPassword.value.trim() || !newPassword.value.trim() || newPassword.value.length < 8) {
    error.value = '请填写旧密码和至少 8 个字符的新密码。'
    return
  }
  if (confirmation.value !== newPassword.value) {
    error.value = '两次输入的新密码不一致。'
    return
  }

  error.value = ''
  pending.value = true
  try {
    await api.changePassword(active, { oldPassword: oldPassword.value, newPassword: newPassword.value })
    if (session.value === active) clearSession('密码已修改，请使用新密码重新登录。')
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ModalDialog title="修改密码" subtitle="保存后，当前会话将退出。" compact :busy="pending" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal-content">
        <label class="field"><span>旧密码</span><input v-model="oldPassword" type="password" maxlength="64" autocomplete="current-password" required :disabled="pending" /></label>
        <label class="field"><span>新密码</span><input v-model="newPassword" type="password" minlength="8" maxlength="64" autocomplete="new-password" placeholder="8 至 64 个字符" required :disabled="pending" /></label>
        <label class="field"><span>确认新密码</span><input v-model="confirmation" type="password" maxlength="64" autocomplete="new-password" required :disabled="pending" /></label>
        <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
      </div>
      <div class="modal-footer">
        <button class="button button-secondary" type="button" :disabled="pending" @click="emit('close')">取消</button>
        <button class="button button-primary" type="submit" :disabled="pending">{{ pending ? '正在保存…' : '保存新密码' }}</button>
      </div>
    </form>
  </ModalDialog>
</template>
