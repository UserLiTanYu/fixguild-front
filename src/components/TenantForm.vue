<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { api, errorMessage, type CreateTenant, type Tenant, type TenantCredentials, type TenantFields, type TenantStatus } from '../api'
import { session } from '../session'
import ModalDialog from './ModalDialog.vue'

const props = defineProps<{ tenant?: Tenant }>()
const emit = defineEmits<{ close: []; saved: [credentials?: TenantCredentials] }>()
const editing = computed(() => !!props.tenant)
const fields = reactive({
  tenantCode: props.tenant?.tenantCode || '',
  tenantName: props.tenant?.tenantName || '',
  contactName: props.tenant?.contactName || '',
  contactMobile: '',
  status: props.tenant?.status ?? 1 as TenantStatus,
  expireTime: props.tenant?.expireTime?.replace(' ', 'T') || '',
  maxUserCount: props.tenant?.maxUserCount ?? (props.tenant ? '' : 50) as number | '',
  remark: props.tenant?.remark || '',
  adminUsername: '',
  adminNickname: '',
})
const clearMobile = ref(false)
const pending = ref(false)
const error = ref('')

function formatExpireTime(value: string) {
  if (!value) return undefined
  return (value.length === 16 ? `${value}:00` : value).replace('T', ' ')
}

function buildFields(): TenantFields {
  const existing = props.tenant
  const tenantName = fields.tenantName.trim()
  const contactName = fields.contactName.trim()
  const contactMobile = fields.contactMobile.trim()
  const expireTime = formatExpireTime(fields.expireTime)
  const maxUserCount = fields.maxUserCount === '' ? undefined : fields.maxUserCount
  const remark = fields.remark.trim()

  if (!existing) return { tenantName, contactName, contactMobile, expireTime, maxUserCount, remark }

  const updates: TenantFields = {}
  if (tenantName !== existing.tenantName) updates.tenantName = tenantName
  if (contactName !== (existing.contactName || '')) updates.contactName = contactName
  if (clearMobile.value) updates.contactMobile = ''
  else if (contactMobile) updates.contactMobile = contactMobile
  if (expireTime && expireTime !== existing.expireTime) updates.expireTime = expireTime
  if (maxUserCount !== undefined && maxUserCount !== existing.maxUserCount) updates.maxUserCount = maxUserCount
  if (remark !== (existing.remark || '')) updates.remark = remark
  return updates
}

async function submit() {
  const active = session.value
  if (!active || pending.value) return
  error.value = ''
  if (!fields.tenantName.trim() || (!editing.value && (!fields.tenantCode.trim() || !fields.adminUsername.trim()))) {
    error.value = '请填写所有必填项。'
    return
  }

  const payload = buildFields()
  pending.value = true
  try {
    if (props.tenant) {
      if (!Object.keys(payload).length) {
        emit('close')
        return
      }
      await api.updateTenant(active, { ...payload, uid: props.tenant.uid })
      emit('saved')
    } else {
      const creation: CreateTenant = {
        ...payload,
        tenantCode: fields.tenantCode.trim(),
        tenantName: fields.tenantName.trim(),
        status: fields.status,
        adminUsername: fields.adminUsername.trim(),
        adminNickname: fields.adminNickname.trim() || undefined,
      }
      emit('saved', await api.createTenant(active, creation))
    }
  } catch (problem) {
    error.value = errorMessage(problem)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ModalDialog :title="editing ? '编辑租户' : '新增租户'" :subtitle="editing ? tenant?.tenantCode : '开通租户并同步创建初始管理员。'" :busy="pending" @close="emit('close')">
    <form @submit.prevent="submit">
      <div class="modal-content">
        <fieldset class="form-section" :disabled="pending">
          <legend>租户资料</legend>
          <div class="form-grid">
            <label class="field"><span>租户编码 <span v-if="!editing" class="required">*</span></span><input v-model="fields.tenantCode" name="tenantCode" maxlength="32" placeholder="请输入租户编码" :readonly="editing" required /></label>
            <label class="field"><span>租户名称 <span class="required">*</span></span><input v-model="fields.tenantName" name="tenantName" maxlength="128" placeholder="请输入租户名称" required /></label>
            <label class="field"><span>联系人</span><input v-model="fields.contactName" name="contactName" maxlength="64" placeholder="请输入联系人姓名" /></label>
            <div class="field">
              <label for="tenant-mobile">联系手机号</label>
              <input id="tenant-mobile" v-model="fields.contactMobile" name="contactMobile" type="tel" maxlength="128" :placeholder="editing ? (tenant?.contactMobile || '填写新手机号') : '请输入联系手机号'" :disabled="clearMobile" />
              <label v-if="editing && tenant?.contactMobile" class="check-label"><input v-model="clearMobile" type="checkbox" />清空原手机号</label>
            </div>
            <label class="field"><span>最大用户数</span><input v-model.number="fields.maxUserCount" name="maxUserCount" type="number" min="1" max="2147483647" placeholder="50" /></label>
            <label class="field">
              <span>到期时间</span><input v-model="fields.expireTime" name="expireTime" type="datetime-local" step="1" />
              <small v-if="editing && tenant?.expireTime">留空时保留现有到期时间</small>
            </label>
            <label v-if="!editing" class="field"><span>初始状态</span><select v-model="fields.status" name="status"><option :value="1">启用</option><option :value="0">停用</option></select></label>
            <label class="field form-span"><span>备注</span><textarea v-model="fields.remark" name="remark" maxlength="500" rows="2" placeholder="填写租户备注" /></label>
          </div>
        </fieldset>
        <fieldset v-if="!editing" class="form-section admin-section" :disabled="pending">
          <legend>初始管理员</legend>
          <div class="form-grid">
            <label class="field"><span>管理员用户名 <span class="required">*</span></span><input v-model="fields.adminUsername" name="adminUsername" maxlength="64" placeholder="请输入管理员用户名" required /></label>
            <label class="field"><span>管理员昵称</span><input v-model="fields.adminNickname" name="adminNickname" maxlength="64" placeholder="默认租户管理员" /></label>
          </div>
        </fieldset>
        <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
      </div>
      <div class="modal-footer">
        <button class="button button-secondary" type="button" :disabled="pending" @click="emit('close')">取消</button>
        <button class="button button-primary" type="submit" :disabled="pending">{{ pending ? '正在保存…' : editing ? '保存修改' : '创建租户' }}</button>
      </div>
    </form>
  </ModalDialog>
</template>
