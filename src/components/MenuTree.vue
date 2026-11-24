<script setup lang="ts">
import { FileText, Folder, KeyRound } from '@lucide/vue'
import type { MenuNode } from '../api'

defineProps<{ nodes: MenuNode[]; details?: boolean; selection?: string[] }>()
const emit = defineEmits<{ toggle: [uid: string] }>()
const typeLabels = { M: '目录', C: '菜单', F: '按钮' }
</script>

<template>
  <ul class="menu-tree">
    <li v-for="node in nodes" :key="node.uid">
      <component :is="selection ? 'label' : 'div'" class="tree-item" :class="{ 'tree-selectable': selection }">
        <input v-if="selection" type="checkbox" :checked="selection.includes(node.uid)" @change="emit('toggle', node.uid)" />
        <Folder v-if="node.menuType === 'M'" :size="17" />
        <KeyRound v-else-if="node.menuType === 'F'" :size="16" />
        <FileText v-else :size="17" />
        <span>{{ node.menuName }}</span>
        <span v-if="details" class="menu-type">{{ typeLabels[node.menuType] }}</span>
        <code v-if="node.path">{{ node.path }}</code><code v-if="details && node.perms">{{ node.perms }}</code>
      </component>
      <MenuTree v-if="node.children.length" :nodes="node.children" :details="details" :selection="selection" @toggle="emit('toggle', $event)" />
    </li>
  </ul>
</template>
