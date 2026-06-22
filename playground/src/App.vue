<script setup lang="ts">
// App shell: a fixed sidebar on the left and the routed page on the right.
// RouterView is imported locally; RouterLink is never used (it renders a DOM
// <a>, which the terminal renderer can't mount) — the sidebar pushes routes
// imperatively instead.
import { Box } from 'vue-termui'
import { RouterView } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
</script>

<template>
  <Box flexDirection="row" :padding="1" :gap="1">
    <Sidebar />
    <Box :flexGrow="1">
      <RouterView />
    </Box>
  </Box>
</template>
