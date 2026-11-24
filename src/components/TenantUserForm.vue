<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { api, errorMessage, type TenantRole, type TenantUser, type UserCredentials, type UserFields } from '../api'
import { hasPermission, session } from '../session'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{ user?: TenantUser }>()
const emit = defineEmits<{ close: []; saved: [credentials?: UserCredentials] }>()
const canReadRoles = hasPermission('tenant', 'tenant:role:page')
const fields = reactive({
  username: props.user?.username ?? '',
  nickname: props.user?.nickname ?? '',
  email: props.user?.email ?? '',
})
const roles = shallowRef<TenantRole[]>([])
const checked = ref<string[]>([])
const initialChecked = shallowRef<string[]>([])
const manual = ref(props.user?.roleUids.join('\n') ?? '')
const loading = ref(canReadRoles)
const rolesError = ref('')
const pending = ref(false)
const error = ref('')
const selection = computed(() => canReadRoles ? checked.value : [...new Set(manual.value.split(/[\s,，]+/).filter(Boolean))])
const unavailableCount = computed(() => (props.user?.roleUids.length ?? 0) - initialChecked.value.length)
const rolePickerBlocked = computed(() => canReadRoles && (loading.value || !!rolesError.value || !roles.value.length))

async function loadRoles() {
  const active = session.value
  if (!active || !canReadRoles) return
  loading.value = true
  rolesError.value = ''
  const activeRoles: TenantRole[] = []
  const pageSize = 200
  try {
    for (let pageNum = 1; ; pageNum++) {
      const page = await api.tenantRoles(active, { pageNum, pageSize, status: 1 })
      activeRoles.push(...page.records)
      if (!page.records.length || page.pageNum * page.pageSize >= page.total) break
    }
    roles.value = activeRoles
    initialChecked.value = activeRoles.filter((role) => props.user?.roleUids.includes(role.uid)).map((role) => role.uid)
    checked.value = [...initialChecked.value]
  } catch (problem) {
    rolesError.value = errorMessage(problem)
  } finally {
    loading.value = false
  }
}

function hasRoleChanges() {
  if (canReadRoles && rolePickerBlocked.value) return false
  const initial = canReadRoles ? initialChecked.value : props.user?.roleUids ?? []
  return initial.length !== selection.value.length || initial.some((uid) => !selection.value.includes(uid))
}

async function submit() {
  const active = session.value
  if (!active || pending.value) return
  const nickname = fields.nickname.trim()
  const email = fields.email.trim()
  const username = fields.username.trim()
  const changesRoles = !props.user || hasRoleChanges()
  const changesNickname = !props.user || nickname !== (props.user.nickname ?? '')
  if ((!props.user && !username) || (changesNickname && !nickname)) {
    error.value = '请填写用户名和昵称。'
    return
  }
  if (changesRoles && !selection.value.length) {
    error.value = '至少选择一个角色。'
    return
  }

  pending.value = true
  error.value = ''
  try {
    if (props.user) {
      const updates: UserFields = {}
      if (changesNickname) updates.nickname = nickname
      if (email !== (props.user.email ?? '')) updates.email = email
      if (changesRoles) updates.roleUids = selection.value
      if (!Object.keys(updates).length) {
        emit('close')
        return
      }
      await api.updateUser(active, { ...updates, uid: props.user.uid })
      emit('saved')
    } else {
      emit('saved', await api.createUser(active, { username, nickname, email: email || undefined, roleUids: selection.value }))
    }
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}

onMounted(loadRoles)
</script>

<template>
  <ModalDialog :title="user ? '编辑用户' : '新增用户'" :subtitle="user ? undefined : '创建账号后，系统将生成一次性初始密码。'" :busy="pending" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal-content">
        <fieldset class="form-section" :disabled="pending">
          <legend>账号资料</legend>
          <div class="form-grid">
            <label class="field"><span>用户名</span><input v-model="fields.username" :readonly="!!user" autocomplete="off" maxlength="64" required /></label>
            <label class="field"><span>昵称</span><input v-model="fields.nickname" maxlength="64" :required="!user || !!user.nickname" /></label>
            <label class="field form-span"><span>邮箱</span><input v-model="fields.email" type="email" maxlength="128" placeholder="可选" /></label>
          </div>
        </fieldset>
        <fieldset class="form-section" :disabled="pending">
          <legend>分配角色</legend>
          <div v-if="loading" class="muted" role="status">正在读取可用角色…</div>
          <div v-else-if="rolesError" class="alert alert-error" role="alert">{{ rolesError }}<button type="button" class="text-button" @click="loadRoles">重试</button></div>
          <template v-else-if="canReadRoles">
            <div v-if="roles.length" class="selection-panel role-options">
              <label v-for="role in roles" :key="role.uid" class="role-option"><input v-model="checked" type="checkbox" :value="role.uid" /><span>{{ role.roleName }}</span><code>{{ role.roleCode }}</code></label>
            </div>
            <p v-else class="muted">没有启用的角色。</p>
            <p v-if="user && unavailableCount" class="muted form-hint">原有角色中有 {{ unavailableCount }} 个不可选。仅修改账号资料会保留原分配，修改角色后将按本次选择保存。</p>
          </template>
          <label v-else class="field"><span>角色 UID</span><textarea v-model="manual" rows="3" placeholder="用换行或逗号分隔" /><small>当前账号没有角色查询权限，可输入已知的启用角色 UID。</small></label>
        </fieldset>
        <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
      </div>
      <div class="modal-footer">
        <button class="button button-secondary" type="button" :disabled="pending" @click="emit('close')">取消</button>
        <button class="button button-primary" type="submit" :disabled="pending || (!user && rolePickerBlocked)">{{ pending ? '正在保存…' : user ? '保存修改' : '创建用户' }}</button>
      </div>
    </form>
  </ModalDialog>
</template>
