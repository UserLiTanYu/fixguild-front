<script setup lang="ts">
import { computed, ref } from 'vue'
import { api, errorMessage } from '../api'
import { session } from '../session'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{ kind: 'user' | 'role'; uid: string; name: string }>()
const emit = defineEmits<{ close: []; deleted: [] }>()
const label = computed(() => props.kind === 'user' ? '用户' : '角色')
const pending = ref(false)
const error = ref('')

async function confirm() {
  const active = session.value
  if (!active || pending.value) return
  pending.value = true
  error.value = ''
  try {
    const remove = props.kind === 'user' ? api.deleteUser : api.deleteRole
    await remove(active, props.uid)
    emit('deleted')
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ModalDialog :title="`删除${label}`" :busy="pending" compact @close="emit('close')">
    <div class="modal-content">
      <p class="confirmation-text">确认删除{{ label }}「{{ name }}」？</p>
      <p v-if="kind === 'user'" class="muted">删除会解除该用户的角色绑定，并使其登录会话失效。</p>
      <p v-else class="muted">删除会移除该角色的菜单授权。已分配给用户的角色须先解除绑定。</p>
      <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
    </div>
    <div class="modal-footer">
      <button class="button button-secondary" type="button" :disabled="pending" @click="emit('close')">取消</button>
      <button class="button button-danger" type="button" :disabled="pending" @click="confirm">{{ pending ? '正在删除…' : '确认删除' }}</button>
    </div>
  </ModalDialog>
</template>
