<script setup lang="ts">
import { ref } from 'vue'

// re-mounting the tree restarts every CSS animation
const run = ref(0)
</script>

<template>
  <div
    :key="run"
    class="animated-logo"
    title="Replay the animation"
    role="img"
    aria-label="Vue TermUI logo"
    @click="run++"
  >
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id="tui-frame-stroke"
          gradientUnits="userSpaceOnUse"
          x1="256"
          x2="256"
          y1="0"
          y2="512"
        >
          <stop offset="0" stop-color="#e9eaea" />
          <stop offset="1" stop-color="#98a8a9" />
        </linearGradient>

        <!-- the full ⊥ mark from logo-big.svg (top faces pink, edges green) -->
        <g id="tui-mark">
          <path
            fill="#ff6af0"
            d="m116.016 125.297v-5.719h-24.3285v5.719zm29.672 0v-5.719h-24.329v5.719zm29.671 0v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.329v5.719zm-244.711 53.859h6.422l-15.9145-44.133h-6.5859zm37.008 3.141v-5.719h-24.329v5.719zm29.671 0v-5.719h-24.328v5.719zm22.336-3.141h6.422l-15.914-44.133h-6.586zm37.008 3.141v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.328v5.719zm22.336-3.141h6.422l-15.914-44.133h-6.586zm37.008 3.141v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.329v5.719zm22.336-3.141h6.421l-15.914-44.133h-6.586zm-148.36 57h6.422l-15.914-44.133h-6.586zm37.008 3.141v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.328v5.719zm22.336-3.141h6.422l-15.914-44.133h-6.586z"
          />
          <path
            fill="#42b883"
            d="m69.3516 179.156 16.0781-44.133h-6.5859l-15.9141 44.133zm9.6562 57h6.4219l-15.9141-44.133h-6.5859zm20.0156 0 16.0786-44.133h-6.586l-15.9144 44.133zm46.6646 3.141v-5.719h-24.329v5.719zm29.671 0v-5.719h-24.328v5.719zm12.68-3.141 16.078-44.133h-6.586l-15.914 44.133zm165.352 3.141v-5.719h-24.329v5.719zm12.679-3.141 16.078-44.133h-6.586l-15.914 44.133zm-168.375 57h6.422l-15.914-44.133h-6.586zm20.016 0 16.078-44.133h-6.586l-15.914 44.133zm46.664 3.141v-5.719h-24.328v5.719zm29.672 0v-5.719h-24.328v5.719zm12.68-3.141 16.078-44.133h-6.586l-15.914 44.133z"
          />
        </g>

        <!-- [V]ue / [T]ermUI; fills as custom properties so the glint copy can recolor them -->
        <g id="tui-labels">
          <path
            style="fill: var(--tui-label-fill, #e4e6e6)"
            d="m305.156 307.43v41.32h13.125v-3.75h-8.508v-33.82h8.438v-3.75zm72.469 0h-13.031v3.75h8.414v33.82h-8.508v3.75h13.125zm33.68 12.023h-4.688v14.977c0 4.125-2.625 6.867-6.539 6.867-3.773 0-5.531-2.063-5.531-6.422v-15.422h-4.711v16.57c0 6.141 3 9.469 8.555 9.469 3.82 0 6.703-1.781 8.039-4.922h.328v4.43h4.547zm25.429 18.797c-.632 2.086-2.906 3.375-5.929 3.375-4.032 0-6.633-2.766-6.633-7.078v-1.149h17.133v-2.765c0-7.266-4.055-11.672-10.735-11.672-6.632 0-11.015 4.43-11.015 11.156v3.891c0 7.265 4.101 11.484 11.273 11.484 5.508 0 9.727-2.953 10.406-7.242zm-6.211-15.445c3.868 0 6.165 2.742 6.165 7.289h-12.516c0-4.571 2.39-7.289 6.351-7.289zm-214.382 41.625v41.32h13.125v-3.75h-8.508v-33.82h8.437v-3.75zm72.468 0h-13.031v3.75h8.414v33.82h-8.508v3.75h13.125zm29.438 30.82c-.633 2.086-2.906 3.375-5.93 3.375-4.031 0-6.633-2.766-6.633-7.078v-1.149h17.133v-2.765c0-7.266-4.055-11.672-10.734-11.672-6.633 0-11.016 4.43-11.016 11.156v3.891c0 7.265 4.102 11.484 11.274 11.484 5.507 0 9.726-2.953 10.406-7.242zm-6.211-15.445c3.867 0 6.164 2.742 6.164 7.289h-12.516c0-4.571 2.391-7.289 6.352-7.289zm28.547 10.804c0-6.257 3.211-9.843 8.976-9.843 1.407 0 3.071.304 4.219.726v-5.156c-.844-.352-2.226-.539-3.68-.539-4.898 0-7.875 2.367-8.882 7.172h-.657v-6.516h-10.101v3.609h5.554v18.329h-5.062v3.609h17.391v-3.609h-7.758zm43.008-7.711c0-4.523-1.805-6.937-5.25-6.937-2.532 0-4.5 1.57-5.11 4.101h-.515c-.539-2.601-2.204-4.101-4.594-4.101-2.438 0-4.242 1.547-4.852 4.195h-.515v-3.703h-4.149v25.547h4.125v-17.32c0-2.813 1.289-4.547 3.352-4.547 1.945 0 3 1.453 3 4.195v17.672h4.101v-17.32c0-2.813 1.266-4.547 3.282-4.547 1.922 0 3 1.476 3 4.219v17.648h4.125zm17.179 15.329c-4.593 0-7.242-3.047-7.242-8.321v-21.726h-4.875v22.031c0 7.828 4.524 12.492 12.117 12.492 7.594 0 12.118-4.664 12.118-12.492v-22.031h-4.876v21.726c0 5.274-2.648 8.321-7.242 8.321zm39 3.773v-4.242h-6.89v-25.336h6.89v-4.242h-18.656v4.242h6.891v25.336h-6.891v4.242z"
          />
          <path
            style="fill: var(--tui-v-fill, #42b883)"
            d="m341.602 338.367h-.305l-6.961-27.187h-7.195l10.148 33.82h7.875l10.148-33.82h-6.656z"
          />
          <path
            style="fill: var(--tui-t-fill, #ff6af0)"
            d="m255.539 402v-28.078h9.68v-5.742h-26.016v5.742h9.68v28.078z"
          />
        </g>

        <!-- the mark glyphs sit on a character grid (col 29.672 × row 57 starting at
             62.02,68.30); each cube owns a disjoint set of cells of the fused art -->
        <clipPath id="tui-cube-left">
          <rect x="90.69" y="60" width="89.01" height="66.3" />
          <rect x="40" y="126.3" width="169.38" height="114" />
        </clipPath>
        <clipPath id="tui-cube-middle">
          <rect x="179.7" y="60" width="89.02" height="66.3" />
          <rect x="209.38" y="126.3" width="89.01" height="57" />
        </clipPath>
        <clipPath id="tui-cube-right">
          <rect x="268.72" y="60" width="89.02" height="66.3" />
          <rect x="298.39" y="126.3" width="101.61" height="57" />
          <rect x="328.06" y="183.3" width="71.94" height="57" />
        </clipPath>
        <clipPath id="tui-cube-stem">
          <rect x="209.38" y="183.3" width="118.68" height="57" />
          <rect x="179.7" y="240.3" width="148.36" height="65" />
        </clipPath>

        <!-- interior of the terminal frame: flying cubes emerge from behind its edge -->
        <clipPath id="tui-frame-inside">
          <rect x="31" y="31" width="450" height="450" rx="48" />
        </clipPath>
        <clipPath id="tui-line-1">
          <rect x="200" y="300" width="275" height="54" />
        </clipPath>
        <clipPath id="tui-line-2">
          <rect x="200" y="356" width="275" height="56" />
        </clipPath>
      </defs>

      <rect
        fill="#353535"
        x="15.5"
        y="15.5"
        width="481"
        height="481"
        rx="63.5"
        stroke="url(#tui-frame-stroke)"
        stroke-width="31"
      />

      <!-- back-to-front: the left cube is frontmost while flying -->
      <g class="mark" clip-path="url(#tui-frame-inside)">
        <g class="cube cube--right"><use href="#tui-mark" clip-path="url(#tui-cube-right)" /></g>
        <g class="cube cube--middle"><use href="#tui-mark" clip-path="url(#tui-cube-middle)" /></g>
        <g class="cube cube--stem"><use href="#tui-mark" clip-path="url(#tui-cube-stem)" /></g>
        <g class="cube cube--left"><use href="#tui-mark" clip-path="url(#tui-cube-left)" /></g>
      </g>

      <g class="type type--1"><use href="#tui-labels" clip-path="url(#tui-line-1)" /></g>
      <g class="type type--2"><use href="#tui-labels" clip-path="url(#tui-line-2)" /></g>
      <g class="glint"><use href="#tui-labels" /></g>
    </svg>
  </div>
</template>

<style scoped>
/* Timeline (80ms terminal frames): flights 0–1440ms, blink ×3 1440–1920ms,
   labels type in 1920–2240ms, hold, glint sweep 2560–3200ms. */

.animated-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 192px;
  height: 192px;
  translate: -50% -50%;
  cursor: pointer;
}

@media (min-width: 640px) {
  .animated-logo {
    width: 256px;
    height: 256px;
  }
}

@media (min-width: 960px) {
  .animated-logo {
    width: 320px;
    height: 320px;
  }
}

/* ease-out-quad, same as the terminal animation */
.cube {
  animation: 960ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.cube--left {
  animation-name: fly-left;
}
.cube--middle {
  animation-name: fly-middle;
  animation-delay: 160ms;
}
.cube--right {
  animation-name: fly-right;
  animation-delay: 320ms;
}
.cube--stem {
  animation-name: fly-stem;
  animation-delay: 480ms;
}

@keyframes fly-left {
  from {
    translate: -240px 420px;
  }
}

/* swings to one row above its slot, then descends (never hovers the left cube) */
@keyframes fly-middle {
  from {
    translate: -300px -280px;
    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  50% {
    translate: 0px -57px;
    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
}

@keyframes fly-right {
  from {
    translate: 240px -280px;
  }
}

@keyframes fly-stem {
  from {
    translate: 280px 340px;
  }
}

.mark {
  animation: blink 160ms linear 1440ms 3;
}

@keyframes blink {
  0%,
  49.9% {
    filter: brightness(0) invert(1);
  }
  50%,
  100% {
    filter: none;
  }
}

/* typewriter: reveal left→right, 2 characters per step; percentages are
   relative to the labels bounding box (x 216.1–441.3) */
/* jump-end keeps them fully hidden through the delay; first chunk lands at 1920ms */
.type--1 {
  animation: type-1 240ms steps(3, jump-end) 1840ms both;
}
.type--2 {
  animation: type-2 320ms steps(4, jump-end) 1840ms both;
}

@keyframes type-1 {
  from {
    clip-path: inset(0 61% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes type-2 {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

/* pink glint: a char-wide band sweeping the labels, bottom row one column behind */
.glint {
  --tui-label-fill: #ff6af0;
  --tui-v-fill: #ff6af0;
  --tui-t-fill: #ff6af0;
  clip-path: polygon(-14% 0, -1% 0, -14.2% 100%, -27.2% 100%);
  animation: glint 640ms linear 2560ms both;
}

@keyframes glint {
  from {
    clip-path: polygon(-14% 0, -1% 0, -14.2% 100%, -27.2% 100%);
  }
  to {
    clip-path: polygon(114% 0, 127% 0, 113.8% 100%, 100.8% 100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cube,
  .mark,
  .type,
  .glint {
    animation: none;
  }
}
</style>
