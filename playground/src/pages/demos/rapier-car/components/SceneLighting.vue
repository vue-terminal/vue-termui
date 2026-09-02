<script setup lang="ts">
// The lab's night lighting, minus cientos' <Stars> and <Environment>: the HDRI
// only fed reflections (there is no post-processing here), and a starfield reads
// as noise in the terminal — in the 'ascii' mode every lit pixel of empty sky
// fills its cell with a dense glyph.
//
// Intensities run above the original's. The browser demo renders through ACES
// tone mapping at 1.35 exposure, which lifts the night midtones; the terminal
// renderer has no tone mapping, so without the extra light the arena falls into
// the bottom of the glyph ramp and 'ascii' cells come out blank.
</script>

<template>
  <TresHemisphereLight :intensity="0.7" color="#26335e" ground-color="#101c14" />
  <TresAmbientLight :intensity="0.4" color="#3a4a7a" />

  <!-- Moonlight -->
  <TresDirectionalLight
    :position="[6, 14, 10]"
    :intensity="2.4"
    color="#bfd0ff"
    cast-shadow
    :shadow-camera-far="120"
    :shadow-camera-top="50"
    :shadow-camera-bottom="-50"
    :shadow-camera-left="-50"
    :shadow-camera-right="50"
    :shadow-radius="1.5"
  />

  <TresDirectionalLight :position="[-6, 8, -8]" :intensity="0.9" color="#31427a" />
</template>
