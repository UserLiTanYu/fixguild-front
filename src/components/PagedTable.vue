<script setup lang="ts">
import { ChevronLeft, ChevronRight, Inbox } from '@lucide/vue'

defineProps<{
  label: string
  emptyText: string
  loading: boolean
  error: string
  empty: boolean
  pageNum: number
  pageSize: number
  lastPage: number
  total: number
}>()
const emit = defineEmits<{ retry: []; page: [value: number]; size: [value: number] }>()
</script>

<template>
  <div v-if="loading" class="centered-state table-state" role="status"><span class="spinner"></span>正在加载…</div>
  <div v-else-if="error" class="centered-state table-state" role="alert"><p>{{ error }}</p><button class="button button-secondary" type="button" @click="emit('retry')">重新加载</button></div>
  <div v-else-if="empty" class="centered-state table-state"><span class="empty-icon"><Inbox :size="23" /></span><strong>{{ emptyText }}</strong></div>
  <div v-else class="table-scroll" tabindex="0" role="region" :aria-label="label"><slot /></div>
  <div v-if="!error" class="pagination">
    <span class="muted">共 {{ total }} 条</span>
    <div class="pagination-controls">
      <select :value="pageSize" aria-label="每页条数" @change="emit('size', Number(($event.target as HTMLSelectElement).value))">
        <option v-for="size in [10, 20, 50, 100]" :key="size" :value="size">{{ size }} 条 / 页</option>
      </select>
      <button class="icon-button page-button" aria-label="上一页" type="button" :disabled="loading || pageNum <= 1" @click="emit('page', pageNum - 1)"><ChevronLeft :size="17" /></button>
      <span class="page-indicator">{{ pageNum }} / {{ lastPage }}</span>
      <button class="icon-button page-button" aria-label="下一页" type="button" :disabled="loading || pageNum >= lastPage" @click="emit('page', pageNum + 1)"><ChevronRight :size="17" /></button>
    </div>
  </div>
</template>
