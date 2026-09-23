<template>
  <div ref="container" class="glowberry-vine">
    <svg
      class="gb-art"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="`0 0 64 ${height}`"
      role="group"
      :aria-label="label"
    >
      <!-- Only the bundled, trusted artwork is inserted as SVG markup. -->
      <defs v-html="definitions" />
      <defs>
        <pattern :id="`${prefix}-continuation`" width="64" height="90" patternUnits="userSpaceOnUse">
          <use :href="`#${prefix}-foliage`" />
        </pattern>
      </defs>

      <use class="gb-base" :href="`#${prefix}-vine-base`" />
      <g class="gb-decoration" v-html="growthVariants[variant % growthVariants.length]" />
      <g class="gb-berry" tabindex="0" focusable="true" role="img" :aria-label="label">
        <g class="gb-halo">
          <ellipse cx="32" cy="44" rx="27" ry="28" :fill="`url(#${prefix}-light)`" />
          <ellipse cx="32" cy="44" rx="16" ry="18" :fill="`url(#${prefix}-light)`" />
        </g>
        <use class="gb-berry-shape" :href="`#${prefix}-berries`" />
        <rect class="gb-hit" x="15" y="35" width="34" height="25" rx="3" />
        <rect class="gb-hit gb-touch-hit" x="10" y="25" width="44" height="44" rx="4" />
        <rect class="gb-focus" x="13" y="33" width="38" height="29" rx="3" />
      </g>

      <!-- Keep full slices and fill the remainder with fixed-size, alternating leaves. -->
      <g class="gb-base" shape-rendering="crispEdges">
        <rect x="0" y="90" width="64" :height="continuationHeight" :fill="`url(#${prefix}-continuation)`" />
        <rect x="30" :y="90 + continuationHeight" width="4" :height="stemHeight" fill="#3e5935" />
        <rect x="31" :y="90 + continuationHeight" width="2" :height="stemHeight" fill="#7f9950" />
        <rect x="31" :y="90 + continuationHeight" width="1" :height="stemHeight" fill="#afbb70" />
        <use
          v-for="(leaf, index) in stemLeaves"
          :key="index"
          :href="`#${prefix}-extra-${leaf.kind}`"
          :transform="`translate(32 ${leaf.y}) scale(${leaf.side} 1)`"
        />
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import vineSvg from '@/assets/glowberry-vine.svg?raw'

// Artwork from the referenced task, including its seven fixed random growth variants.
// Parse once; each instance namespaces definitions so routes and rows cannot share IDs.
const artwork = new DOMParser().parseFromString(vineSvg, 'image/svg+xml')
const foliage = artwork.querySelector('#gb-vine-base')!.cloneNode(true) as Element
foliage.id = 'gb-foliage'
// The last two paths are the stalks that hold the berries, absent from continuation slices.
foliage.lastElementChild!.remove()
foliage.lastElementChild!.remove()
const sourceDefinitions = artwork.querySelector('defs')!.innerHTML + foliage.outerHTML
const growthVariants = Array.from(artwork.querySelectorAll('.gb-segment'), segment =>
  Array.from(segment.querySelectorAll('.gb-decoration'), decoration => decoration.outerHTML).join(''),
)
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'

const props = defineProps<{ variant: number; label: string }>()

const container = ref<HTMLElement | null>(null)
const height = ref(90)
const prefix = `commit-vine-${useId()}`
const definitions = sourceDefinitions.replace(/gb-/g, `${prefix}-`)
const continuationHeight = computed(() => Math.floor(Math.max(0, height.value - 90) / 90) * 90)
const stemHeight = computed(() => Math.max(0, height.value - 90 - continuationHeight.value))
const stemLeaves = computed(() => {
  const count = Math.floor(stemHeight.value / 22)
  return Array.from({ length: count }, (_, index) => ({
    // These source sprites span y=-1..9; center them with room at both seams.
    y: 90 + continuationHeight.value + Math.round((index + .5) * stemHeight.value / count) - 4,
    side: (props.variant + index) % 2 === 0 ? 1 : -1,
    kind: (props.variant + index) % 3 === 1 ? 'shoot' : 'leaf',
  }))
})
let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    const { width, height: measuredHeight } = entry.contentRect
    if (width > 0) height.value = measuredHeight * 64 / width
  })
  observer.observe(container.value!)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.glowberry-vine {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.gb-art {
  display: block;
  width: 100%;
  height: 100%;
}

.gb-base,
.gb-decoration,
.gb-berry-shape {
  pointer-events: none;
}

.gb-berry {
  cursor: pointer;
  outline: none;
}

.gb-halo {
  opacity: .35;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
}

.gb-hit {
  fill: transparent;
  pointer-events: all;
}

.gb-touch-hit {
  display: none;
}

.gb-focus {
  fill: none;
  stroke: #a9bb72;
  stroke-width: 1;
  stroke-dasharray: 2 2;
  opacity: 0;
  pointer-events: none;
}

.gb-berry:focus-visible .gb-halo,
.gb-berry:active .gb-halo {
  opacity: .85;
}

.gb-berry:focus-visible .gb-focus {
  opacity: 1;
}

@media (hover: hover) {
  .gb-berry:hover .gb-halo { opacity: .85; }
}

@media (pointer: coarse) {
  .gb-touch-hit { display: block; }
}
</style>
