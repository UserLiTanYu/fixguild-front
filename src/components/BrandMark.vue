<script setup lang="ts">
import { Hexagon, Diamond } from '@lucide/vue'
</script>

<template>
  <div class="brand">
    <span class="brand-mark" aria-hidden="true"><Hexagon :size="27" :stroke-width="1.8" /><Diamond :size="12" :stroke-width="2" /></span>
    <span class="brand-name">Fixguild <span>匠盟</span></span>
  </div>
</template>
