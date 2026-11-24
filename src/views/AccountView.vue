<script setup lang="ts">
import { computed, ref } from 'vue'
import { KeyRound, ListTree, ShieldCheck, UserRound } from '@lucide/vue'
import MenuTree from '../components/MenuTree.vue'
import { userAuth, userInfo } from '../session'

const authView = ref<'permissions' | 'menus'>('permissions')
const displayName = computed(() => userInfo.value?.nickname || userInfo.value?.username || '当前用户')
</script>

<template>
  <div v-if="userInfo && userAuth" class="page-content">
    <section class="page-banner account-banner">
      <div><h1>我的账号</h1><p>查看账号资料，以及当前会话的角色、权限和菜单。</p></div>
      <ShieldCheck class="banner-icon" :size="110" :stroke-width="0.75" aria-hidden="true" />
    </section>
    <div class="account-grid">
      <section class="panel profile-panel">
        <div class="panel-heading"><h2><UserRound :size="20" /> 账号资料</h2></div>
        <div class="profile-content">
          <div class="profile-identity"><span class="avatar avatar-large">{{ Array.from(displayName)[0] }}</span><div><strong>{{ displayName }}</strong><div class="muted">{{ userInfo.clientCode === 'platform' ? '平台端' : '租户端' }}</div></div></div>
          <dl class="data-list profile-data">
            <div><dt>用户名</dt><dd>{{ userInfo.username }}</dd></div>
            <div><dt>用户编码</dt><dd><code>{{ userInfo.userCode }}</code></dd></div>
            <div v-if="userInfo.clientCode === 'tenant'"><dt>租户编码</dt><dd><code>{{ userInfo.tenantId }}</code></dd></div>
            <div><dt>邮箱</dt><dd>{{ userInfo.email || '—' }}</dd></div>
            <div><dt>用户 UID</dt><dd><code>{{ userInfo.uid }}</code></dd></div>
          </dl>
        </div>
      </section>
      <section class="panel access-panel">
        <div class="panel-heading"><h2><ShieldCheck :size="20" /> 角色与权限</h2></div>
        <div class="access-content">
          <h3>角色</h3>
          <div v-if="userAuth.roles.length" class="code-chips"><code v-for="role in userAuth.roles" :key="role">{{ role }}</code></div>
          <p v-else class="muted">当前账号没有已分配角色。</p>
          <div class="access-switch" aria-label="授权信息">
            <button type="button" :aria-pressed="authView === 'permissions'" @click="authView = 'permissions'"><KeyRound :size="16" />权限列表 <span>{{ userAuth.permissions.length }}</span></button>
            <button type="button" :aria-pressed="authView === 'menus'" @click="authView = 'menus'"><ListTree :size="16" />菜单树</button>
          </div>
          <div v-if="authView === 'permissions'">
            <ul v-if="userAuth.permissions.length" class="permission-list"><li v-for="permission in userAuth.permissions" :key="permission"><code>{{ permission }}</code></li></ul>
            <p v-else class="muted">当前账号没有已分配权限。</p>
          </div>
          <div v-else>
            <MenuTree v-if="userAuth.menus.length" :nodes="userAuth.menus" />
            <p v-else class="muted">当前账号没有已分配菜单。</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
