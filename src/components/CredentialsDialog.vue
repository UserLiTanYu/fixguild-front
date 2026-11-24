<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy, KeyRound } from '@lucide/vue'
import ModalDialog from './ModalDialog.vue'

const props = withDefaults(defineProps<{
  title: string
  tenantCode: string
  username: string
  password: string
  usernameLabel?: string
  passwordLabel?: string
}>(), { usernameLabel: '用户名', passwordLabel: '初始密码' })
const emit = defineEmits<{ close: [] }>()
const copyState = ref<'ready' | 'copied' | 'failed'>('ready')

async function copyCredentials() {
  const { tenantCode, username, password, usernameLabel, passwordLabel } = props
  try {
    await navigator.clipboard.writeText(`租户编码：${tenantCode}\n${usernameLabel}：${username}\n${passwordLabel}：${password}`)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'failed'
  }
}
</script>

<template>
  <ModalDialog :title="title" compact @close="emit('close')">
    <div class="modal-content">
      <div class="alert alert-note"><KeyRound :size="19" /><span>{{ passwordLabel }}只显示一次，请在关闭窗口前妥善保存。</span></div>
      <dl class="data-list credentials-data">
        <div><dt>租户编码</dt><dd><code>{{ tenantCode }}</code></dd></div>
        <div><dt>{{ usernameLabel }}</dt><dd><code>{{ username }}</code></dd></div>
        <div><dt>{{ passwordLabel }}</dt><dd><code>{{ password }}</code></dd></div>
      </dl>
      <p v-if="copyState === 'failed'" class="muted" role="status">剪贴板不可用，请手动选中上方信息并复制。</p>
      <p v-if="copyState === 'copied'" class="sr-only" role="status">登录信息已复制。</p>
    </div>
    <div class="modal-footer">
      <button class="button button-secondary" type="button" @click="copyCredentials"><Check v-if="copyState === 'copied'" :size="17" /><Copy v-else :size="17" />{{ copyState === 'copied' ? '已复制' : '复制登录信息' }}</button>
      <button class="button button-primary" type="button" @click="emit('close')">完成</button>
    </div>
  </ModalDialog>
</template>
