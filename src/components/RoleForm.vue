<script setup lang="ts">
import { reactive, ref } from 'vue'
import { api, errorMessage, type RoleFields, type TenantRole, type TenantStatus } from '../api'
import { session } from '../session'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{ role?: TenantRole }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const form = reactive({
  roleCode: props.role?.roleCode ?? '',
  roleName: props.role?.roleName ?? '',
  status: props.role?.status ?? (1 as TenantStatus),
  remark: props.role?.remark ?? '',
})
const pending = ref(false)
const error = ref('')

async function submit() {
  const active = session.value
  if (!active || pending.value) return
  const fields: RoleFields = { roleName: form.roleName.trim(), status: form.status, remark: form.remark.trim() }
  if (!fields.roleName || (!props.role && !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(form.roleCode.trim()))) {
    error.value = '请填写角色名称。角色编码须以字母开头，可包含字母、数字和下划线。'
    return
  }

  pending.value = true
  error.value = ''
  try {
    if (props.role) {
      const updates: Partial<RoleFields> = {}
      if (fields.roleName !== props.role.roleName) updates.roleName = fields.roleName
      if (fields.status !== props.role.status) updates.status = fields.status
      if (fields.remark !== (props.role.remark ?? '')) updates.remark = fields.remark
      if (!Object.keys(updates).length) {
        emit('close')
        return
      }
      await api.updateRole(active, { ...updates, uid: props.role.uid })
    } else {
      await api.createRole(active, { ...fields, roleCode: form.roleCode.trim() })
    }
    emit('saved')
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ModalDialog :title="role ? '编辑角色' : '新增角色'" :busy="pending" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal-content">
        <fieldset class="form-section" :disabled="pending">
          <div class="form-grid">
            <label class="field"><span>角色编码</span><input v-model="form.roleCode" maxlength="64" :readonly="!!role" required :placeholder="role ? undefined : '例如 repair_operator'" /><small v-if="!role">以字母开头，可包含数字和下划线</small></label>
            <label class="field"><span>角色名称</span><input v-model="form.roleName" maxlength="64" required /></label>
            <label class="field"><span>状态</span><select v-model="form.status"><option :value="1">启用</option><option :value="0">停用</option></select></label>
            <div class="field"><span>数据范围</span><span class="field-static">本租户</span></div>
            <label class="field form-span"><span>备注</span><textarea v-model="form.remark" rows="3" maxlength="500" /></label>
          </div>
        </fieldset>
        <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
      </div>
      <div class="modal-footer">
        <button class="button button-secondary" type="button" :disabled="pending" @click="emit('close')">取消</button>
        <button class="button button-primary" type="submit" :disabled="pending">{{ pending ? '正在保存…' : role ? '保存修改' : '创建角色' }}</button>
      </div>
    </form>
  </ModalDialog>
</template>
