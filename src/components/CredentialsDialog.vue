<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy, KeyRound } from '@lucide/vue'
import type { TenantCredentials } from '../api'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{ credentials: TenantCredentials }>()
const emit = defineEmits<{ close: [] }>()
const copyState = ref<'ready' | 'copied' | 'failed'>('ready')

async function copyCredentials() {
  const { tenantCode, adminUsername, initialPassword } = props.credentials
  try {
    await navigator.clipboard.writeText(`租户编码：${tenantCode}\n管理员用户名：${adminUsername}\n初始密码：${initialPassword}`)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'failed'
  }
}
</script>

<template>
  <ModalDialog title="租户创建成功" compact @close="emit('close')">
    <div class="modal-content">
      <div class="alert alert-note"><KeyRound :size="19" /><span>初始密码只显示一次，请在关闭窗口前妥善保存，并将登录信息交给租户管理员。</span></div>
      <dl class="data-list credentials-data">
        <div><dt>租户编码</dt><dd><code>{{ credentials.tenantCode }}</code></dd></div>
        <div><dt>管理员用户名</dt><dd><code>{{ credentials.adminUsername }}</code></dd></div>
        <div><dt>初始密码</dt><dd><code>{{ credentials.initialPassword }}</code></dd></div>
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
