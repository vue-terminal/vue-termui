<script setup lang="ts">
// RouterView is imported locally instead of relying on the global components
// registered by `app.use(router)` — RouterLink is never used here since it
// would render a DOM <a>, which the terminal renderer can't mount.
import { RouterView } from 'vue-router'
const n = Math.random().toString(16).slice(2, 6)
</script>

<template>
  <RouterView />
</template>
