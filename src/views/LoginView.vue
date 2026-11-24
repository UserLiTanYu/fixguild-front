<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Building2, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound, UsersRound, Wrench } from '@lucide/vue'
import BrandMark from '../components/BrandMark.vue'
import ServiceStatus from '../components/ServiceStatus.vue'
import { clientNames, errorMessage, type Client } from '../api'
import { homeRoute, sessionNotice, signIn } from '../session'

const router = useRouter()
const client = ref<Client>('platform')
const username = ref('')
const password = ref('')
const tenantCode = ref('')
const showPassword = ref(false)
const pending = ref(false)
const error = ref('')
const clients = { platform: Building2, tenant: UsersRound, technician: Wrench }

function selectClient(value: Client) {
  if (value === client.value) return
  client.value = value
  password.value = ''
  showPassword.value = false
  error.value = ''
}

async function submit() {
  if (pending.value) return
  error.value = ''
  sessionNotice.value = ''
  if (!username.value.trim() || !password.value.trim() || (client.value !== 'platform' && !tenantCode.value.trim())) {
    error.value = '请填写所有登录信息。'
    return
  }

  pending.value = true
  try {
    await signIn(client.value, username.value.trim(), password.value, client.value === 'platform' ? undefined : tenantCode.value.trim())
    password.value = ''
    await router.replace(homeRoute())
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-visual">
      <BrandMark />
      <div class="login-visual-copy">
        <p class="eyebrow"><span></span>维保管理平台</p>
        <h1>匠盟维保<br />管理控制台</h1>
        <p>平台、租户与技师统一登录，按账号权限进入对应控制台。</p>
      </div>
    </section>
    <section class="login-body" aria-labelledby="login-title">
      <div class="login-top"><div class="login-mobile-brand"><BrandMark /></div><ServiceStatus /></div>
      <div class="login-card">
        <span class="login-icon" aria-hidden="true"><ShieldCheck :size="25" :stroke-width="1.7" /></span>
        <h2 id="login-title">登录控制台</h2>
        <p class="login-subtitle">选择登录端，输入对应的账号信息。</p>
        <div class="login-switch" aria-label="登录端">
          <button v-for="(icon, code) in clients" :key="code" type="button" :aria-pressed="client === code" :disabled="pending" @click="selectClient(code)"><component :is="icon" :size="17" />{{ clientNames[code] }}端</button>
        </div>
        <form class="login-form" @submit.prevent="submit">
          <label v-if="client !== 'platform'" class="field">
            <span>租户编码</span>
            <span class="input-icon"><Building2 :size="17" /><input v-model="tenantCode" name="tenantCode" placeholder="请输入租户编码" maxlength="32" autocomplete="off" required :disabled="pending" /></span>
          </label>
          <label class="field">
            <span>用户名</span>
            <span class="input-icon"><UserRound :size="17" /><input v-model="username" name="username" placeholder="请输入用户名" maxlength="64" autocomplete="username" required :disabled="pending" /></span>
          </label>
          <div class="field">
            <label for="login-password">密码</label>
            <div class="input-icon input-password">
              <LockKeyhole :size="17" />
              <input id="login-password" v-model="password" name="password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" maxlength="64" autocomplete="current-password" required :disabled="pending" />
              <button class="icon-button password-toggle" type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="17" /><Eye v-else :size="17" /></button>
            </div>
          </div>
          <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
          <div v-else-if="sessionNotice" class="alert alert-note" role="status">{{ sessionNotice }}</div>
          <button class="button button-primary login-submit" type="submit" :disabled="pending">{{ pending ? '正在登录…' : '登 录' }}<ArrowRight :size="18" /></button>
        </form>
        <p class="login-help">需要账号或忘记密码？请联系对应的管理员。</p>
      </div>
    </section>
  </main>
</template>
