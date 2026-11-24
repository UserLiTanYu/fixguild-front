<script setup lang="ts">
import { Folder, FileText } from '@lucide/vue'
import type { MenuNode } from '../api'

defineProps<{ nodes: MenuNode[] }>()
</script>

<template>
  <ul class="menu-tree">
    <li v-for="node in nodes" :key="node.uid">
      <div class="tree-item"><Folder v-if="node.children.length" :size="17" /><FileText v-else :size="17" /><span>{{ node.menuName }}</span><code v-if="node.path">{{ node.path }}</code></div>
      <MenuTree v-if="node.children.length" :nodes="node.children" />
    </li>
  </ul>
</template>
