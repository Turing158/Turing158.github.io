<template>
  <div class="camp-art" aria-hidden="true">
    <svg viewBox="0 0 400 116" fill="none" shape-rendering="crispEdges" focusable="false">
      <!-- A small overworld campsite; item sprites keep their vanilla colors. -->
      <path class="camp-clouds" fill="var(--camp-haze)" d="M30 24h12v-4h20v4h12v4H30zM196 18h12v-4h16v4h12v4h-40z" />
      <path class="camp-sun" fill="var(--journal-sun)" d="M318 8h16v4h4v16h-4v4h-16v-4h-4V12h4z" />
      <path class="camp-moon" fill="var(--journal-sun)" d="M318 8h16v4h-8v12h12v4h-4v4h-16v-4h-4V12h4z" />
      <path class="camp-stars" fill="var(--journal-sun)" d="M104 13h2v2h-2zM162 28h2v2h-2zM278 10h2v2h-2zM364 28h2v2h-2zM240 5h2v6h-2zM238 7h6v2h-6z" />
      <path fill="var(--camp-haze)" d="M0 76h16V64h20V56h16v8h16v12h20v8h36V72h20V60h16v-8h20v8h20v12h24v12h20V68h24V56h20v-8h20v8h20v12h24v8h24V64h20v-8h20v12h24v48H0z" />
      <path fill="var(--camp-distance)" d="M0 92h28v-8h32v-8h20v8h40v12h44v-8h28v-8h36v8h52v-8h36v-8h28v12h32v-8h24v40H0z" />

      <!-- Oak and birch trees frame the clearing. -->
      <path fill="var(--camp-trunk)" d="M28 58h8v44h-8z" />
      <path fill="var(--camp-leaf-shadow)" d="M8 38h12V26h28v12h12v28H48v8H20v-8H8z" />
      <path fill="var(--camp-leaf)" d="M12 38h12v-8h20v8h12v16H44v8H24v-8H12z" />
      <path fill="var(--camp-leaf-light)" d="M24 34h12v4H24zM16 42h8v4h-8zM40 42h12v4H40zM28 50h8v4h-8z" />
      <path fill="var(--camp-birch)" d="M75 68h6v32h-6z" />
      <path fill="var(--camp-trunk)" d="M75 72h4v3h-4zM78 82h3v3h-3zM75 92h3v3h-3z" />
      <path fill="var(--camp-leaf-shadow)" d="M60 60h8V48h20v12h8v16H84v4H72v-4H60z" />
      <path fill="var(--camp-leaf-light)" d="M68 52h16v8h8v8H80v4H64V60h4z" />
      <path fill="var(--camp-leaf)" d="M72 56h8v4h-8zM64 64h8v4h-8zM84 68h8v4h-8z" />

      <!-- A tiny oak-plank cabin, with a lit window and open doorway. -->
      <path fill="var(--camp-timber)" d="M240 54h52v44h-52z" />
      <path fill="var(--camp-trunk)" d="M238 54h4v44h-4zM290 54h4v44h-4zM242 62h48v2h-48zM242 74h48v2h-48zM242 86h48v2h-48z" />
      <path fill="var(--camp-roof)" d="M230 50h8v-8h8v-8h8v-8h24v8h8v8h8v8h8v8h-72z" />
      <path fill="var(--camp-trunk)" d="M238 48h56v4h-56zM246 40h40v4h-40zM254 32h24v4h-24z" />
      <path fill="var(--camp-window)" d="M247 66h12v12h-12z" />
      <path fill="var(--camp-roof)" d="M252 66h2v12h-2zM247 71h12v2h-12zM269 70h14v28h-14z" />
      <path fill="var(--camp-timber)" d="M278 83h2v3h-2z" />
      <path fill="var(--camp-stone)" d="M236 96h62v4h-62zM266 100h24v4h-24z" />
      <path fill="var(--camp-trunk)" d="M312 58h4v44h-4zM312 58h20v4h-20z" />
      <image :href="minecraftLantern" x="320" y="60" width="16" height="16" class="camp-item" />

      <!-- Spruce trees and a grass / dirt cross-section. -->
      <path fill="var(--camp-trunk)" d="M360 78h8v26h-8zM390 82h6v22h-6z" />
      <path fill="var(--camp-leaf-shadow)" d="M360 26h8v12h8v12h8v14h8v20h-20v8h-28v-8h-8V64h8V50h8V38h8zM388 58h8v12h4v28h-24V82h6V70h6z" />
      <path fill="var(--camp-leaf)" d="M360 30h4v16h8v12h8v10h-16v8h-20V64h8V50h8zM388 66h4v12h8v12h-16V78h4z" />
      <path fill="var(--camp-leaf-light)" d="M360 42h4v4h-4zM356 56h8v4h-8zM344 70h8v4h-8zM372 66h8v4h-8z" />
      <path fill="var(--camp-soil)" d="M0 104h400v12H0z" />
      <path fill="var(--camp-soil-deep)" d="M0 112h400v4H0zM8 106h12v4H8zM42 110h8v4h-8zM76 106h16v4H76zM118 108h8v4h-8zM158 106h12v4h-12zM208 110h16v4h-16zM254 106h8v4h-8zM300 110h12v4h-12zM344 106h16v4h-16zM384 108h8v4h-8z" />
      <path fill="var(--camp-leaf)" d="M0 98h112v4h36v-4h120v4h24v-4h108v8h-20v4h-8v-4h-28v2h-16v-2h-28v4h-8v-4h-56v2h-12v-2h-28v4h-8v-4h-36v2h-12v-2h-40v4h-8v-4H52v2H40v-2H16v4H8v-4H0z" />
      <path fill="var(--camp-leaf-light)" d="M0 98h112v2H0zM148 98h120v2H148zM292 98h108v2H292z" />
      <path fill="var(--camp-water)" d="M106 100h44v4h-44zM116 104h24v2h-24z" />
      <path fill="var(--camp-water-light)" d="M114 100h16v2h-16zM140 102h8v2h-8z" />
      <path fill="var(--camp-stone)" d="M268 102h18v4h-18zM258 108h20v4h-20zM246 114h24v2h-24zM164 100h8v3h-8zM211 101h9v3h-9z" />
      <path fill="var(--camp-leaf)" d="M16 90h2v8h-2zM12 92h4v2h-4zM56 88h2v10h-2zM58 92h4v2h-4zM98 94h2v6h-2zM340 92h2v6h-2z" />
      <path fill="var(--camp-flower)" d="M14 88h6v4h-6zM54 86h6v4h-6zM338 90h6v4h-6z" />
      <image :href="minecraftCampfire" x="180" y="72" width="32" height="32" class="camp-item" />
      <g class="camp-smoke" fill="var(--camp-smoke)">
        <path d="M194 61h4v4h-4zM198 51h4v4h-4z" opacity=".6" />
        <path d="M194 40h4v4h-4z" opacity=".35" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import minecraftCampfire from '@/assets/minecraft-items/campfire.png'
import minecraftLantern from '@/assets/minecraft-items/lantern.png'
</script>

<style scoped lang="less">
.camp-art {
  --camp-haze: color-mix(in srgb, var(--journal-accent) 8%, var(--bg-card));
  --camp-distance: color-mix(in srgb, var(--journal-accent) 16%, var(--bg-card));
  --camp-leaf: #658654;
  --camp-leaf-shadow: #496647;
  --camp-leaf-light: #95ae6e;
  --camp-timber: #ba9769;
  --camp-trunk: #826647;
  --camp-roof: #635343;
  --camp-birch: #d8d4b5;
  --camp-soil: #b09372;
  --camp-soil-deep: #957a5b;
  --camp-window: #f9ce79;
  --camp-stone: #b3ae94;
  --camp-water: #88b4b2;
  --camp-water-light: #bfdbcc;
  --camp-flower: #d6a66b;
  --camp-smoke: #96958b;
  overflow: hidden;
  pointer-events: none;
  background: linear-gradient(transparent 50%, var(--camp-haze));
  border-bottom: 2px solid var(--camp-soil-deep);
  svg { display: block; width: 100%; height: auto; }
}
.camp-item { image-rendering: pixelated; }
.camp-moon, .camp-stars { display: none; }
.camp-smoke { animation: camp-smoke-rise 5s steps(5, end) infinite; }
@keyframes camp-smoke-rise {
  0% { transform: translateY(3px); opacity: 0; }
  30%, 70% { opacity: 1; }
  100% { transform: translateY(-7px); opacity: 0; }
}

[data-theme='ocean'] .camp-art {
  --camp-leaf: #5b8a80;
  --camp-leaf-shadow: #436c69;
  --camp-leaf-light: #96b9a0;
  --camp-soil: #a39c88;
  --camp-soil-deep: #898574;
  --camp-water: #69abc0;
  --camp-water-light: #b7dfeb;
}
[data-theme='sunset'] .camp-art {
  --camp-leaf: #967f51;
  --camp-leaf-shadow: #766044;
  --camp-leaf-light: #c0a468;
  --camp-timber: #c6986b;
  --camp-soil: #b58b70;
  --camp-soil-deep: #957159;
  --camp-water: #9ba8ac;
  --camp-water-light: #d2ccbc;
  --camp-flower: #dc8f67;
}
[data-theme='dark'] .camp-art {
  --camp-haze: #243440;
  --camp-distance: #2c4148;
  --camp-leaf: #486b61;
  --camp-leaf-shadow: #314d48;
  --camp-leaf-light: #6b9580;
  --camp-timber: #8a7258;
  --camp-trunk: #5b4e43;
  --camp-roof: #3d4142;
  --camp-birch: #979f95;
  --camp-soil: #665b4c;
  --camp-soil-deep: #504a42;
  --camp-stone: #8f8971;
  --camp-water: #3d6874;
  --camp-water-light: #6e96a0;
  --camp-flower: #c4a373;
  --camp-smoke: #91a1ac;
  .camp-sun { display: none; }
  .camp-moon, .camp-stars { display: block; }
  .camp-clouds { opacity: .6; }
}

</style>
