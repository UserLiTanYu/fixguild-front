<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { X } from '@lucide/vue'

defineProps<{ title: string; subtitle?: string; busy?: boolean; compact?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)

onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" class="modal" :class="{ 'modal-compact': compact }" aria-labelledby="dialog-title" @cancel.prevent="!busy && emit('close')">
    <div class="modal-heading">
      <div><h2 id="dialog-title">{{ title }}</h2><p v-if="subtitle">{{ subtitle }}</p></div>
      <button class="icon-button modal-close" type="button" aria-label="关闭" :disabled="busy" @click="emit('close')"><X :size="21" /></button>
    </div>
    <slot />
  </dialog>
</template>
