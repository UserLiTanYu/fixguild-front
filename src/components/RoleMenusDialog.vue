<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { api, errorMessage, type MenuNode, type TenantRole } from '../api'
import { hasPermission, session } from '../session'
import MenuTree from './MenuTree.vue'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{ role: Pick<TenantRole, 'uid' | 'roleName'> }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const canReadMenus = hasPermission('tenant', 'tenant:menu:tree')
const menus = shallowRef<MenuNode[]>([])
const checked = ref<string[]>([])
const manual = ref('')
const confirmed = ref(false)
const loading = ref(canReadMenus)
const pending = ref(false)
const loadError = ref('')
const error = ref('')
const selection = computed(() => canReadMenus ? checked.value : [...new Set(manual.value.split(/[\s,，]+/).filter(Boolean))])

watch(selection, () => { confirmed.value = false })

function toggle(uid: string) {
  checked.value = checked.value.includes(uid) ? checked.value.filter((id) => id !== uid) : [...checked.value, uid]
}

async function load() {
  const active = session.value
  if (!active || !canReadMenus) return
  loading.value = true
  loadError.value = ''
  try {
    menus.value = await api.tenantMenus(active)
  } catch (problem) {
    loadError.value = errorMessage(problem)
  } finally {
    loading.value = false
  }
}

async function submit() {
  const active = session.value
  if (!active || pending.value || loading.value || loadError.value || !confirmed.value) return
  if (selection.value.length > 500) {
    error.value = '一次最多可分配 500 个菜单项。'
    return
  }

  pending.value = true
  error.value = ''
  try {
    await api.assignRoleMenus(active, props.role.uid, selection.value)
    emit('saved')
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}

onMounted(load)
</script>

<template>
  <ModalDialog title="分配菜单" :subtitle="role.roleName" :busy="pending" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal-content">
        <div class="alert alert-note">保存会覆盖该角色的全部菜单和按钮权限。当前接口无法读取原有勾选，请选择所有需要保留或新增的权限。</div>
        <div v-if="loading" class="muted" role="status">正在读取菜单…</div>
        <div v-else-if="loadError" class="alert alert-error" role="alert">{{ loadError }}<button class="text-button" type="button" @click="load">重试</button></div>
        <fieldset v-else class="form-section" :disabled="pending">
          <legend>已选择 {{ selection.length }} 项</legend>
          <div v-if="canReadMenus" class="selection-panel">
            <MenuTree v-if="menus.length" :nodes="menus" :selection="checked" details @toggle="toggle" />
            <p v-else class="muted">暂无可分配的菜单。</p>
          </div>
          <label v-else class="field"><span>菜单 UID</span><textarea v-model="manual" rows="4" placeholder="用换行或逗号分隔" /><small>当前账号没有菜单树查询权限，可输入已知的菜单 UID。</small></label>
          <label class="check-label confirm-selection"><input v-model="confirmed" type="checkbox" />{{ selection.length ? '确认以本次选择覆盖角色授权' : '确认清空角色的全部菜单权限' }}</label>
        </fieldset>
        <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
      </div>
      <div class="modal-footer">
        <button class="button button-secondary" type="button" :disabled="pending" @click="emit('close')">取消</button>
        <button class="button" :class="selection.length ? 'button-primary' : 'button-danger'" type="submit" :disabled="pending || !confirmed || loading || !!loadError">{{ pending ? '正在保存…' : selection.length ? '保存授权' : '清空授权' }}</button>
      </div>
    </form>
  </ModalDialog>
</template>
