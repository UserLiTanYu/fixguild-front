<script setup lang="ts">
import type { TenantStatus } from '../api'

defineProps<{ status: TenantStatus }>()
</script>

<template>
  <span class="tenant-status" :class="status === 1 ? 'tenant-enabled' : 'tenant-disabled'"><span class="status-dot"></span>{{ status === 1 ? '启用' : '停用' }}</span>
</template>
