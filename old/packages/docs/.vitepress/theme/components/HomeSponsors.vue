<script setup lang="ts">
import { VPHomeSponsors } from 'vitepress/theme'
import { useSponsor } from '../composables/sponsor'

const { data } = useSponsor()
</script>

<template>
  <VPHomeSponsors
    v-if="data"
    message="Vue TermUI is free and open source, made possible by wonderful sponsors."
    action-text="Become a sponsor"
    action-link="https://github.com/sponsors/posva"
    :data="data"
  />
</template>
