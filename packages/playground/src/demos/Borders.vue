<script lang="ts" setup>
import { TuiBox as Box } from 'vue-termui'
</script>

<template>
  <Box flexDirection="column" :padding="2">
    <Box>
      <Box borderStyle="single" :marginRight="2">
        <TuiText>single</TuiText>
      </Box>

      <Box borderStyle="double" :marginRight="2">
        <TuiText>double</TuiText>
      </Box>

      <Box borderStyle="round" :marginRight="2">
        <TuiText>round</TuiText>
      </Box>

      <Box borderStyle="bold">
        <TuiText>bold</TuiText>
      </Box>
    </Box>

    <Box :marginTop="1">
      <Box borderStyle="singleDouble" :marginRight="2">
        <TuiText>singleDouble</TuiText>
      </Box>

      <Box borderStyle="doubleSingle" :marginRight="2">
        <TuiText>doubleSingle</TuiText>
      </Box>

      <Box borderStyle="classic">
        <TuiText>classic</TuiText>
      </Box>
    </Box>
  </Box>
</template>
