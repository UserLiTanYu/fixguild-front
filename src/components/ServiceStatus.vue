<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '../api'

const status = ref<'checking' | 'up' | 'down'>('checking')
const labels = { checking: '服务检测中', up: '服务在线', down: '服务不可用' }

async function check() {
  if (status.value !== 'checking') status.value = 'checking'
  try {
    status.value = await api.health() === 'UP' ? 'up' : 'down'
  } catch {
    status.value = 'down'
  }
}

onMounted(check)
</script>

<template>
  <button class="service-status" :class="`service-${status}`" type="button" title="重新检查后端服务" :disabled="status === 'checking'" @click="check">
    <span class="status-dot"></span>{{ labels[status] }}
  </button>
</template>
