<template>
  <div v-if="tool" class="tool-detail-view">
    <div class="tool-detail-header">
      <button type="button" class="tool-back-button" @click="goBack">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        {{ $t('tools.backToTools') }}
      </button>
    </div>

    <header class="tool-detail-card">
      <div class="tool-detail-icon" aria-hidden="true">{{ tool.icon }}</div>
      <div class="tool-detail-heading">
        <p class="tool-detail-eyebrow">{{ $t('tools.workspaceLabel') }}</p>
        <h1 class="tool-detail-title">{{ tool.name }}</h1>
        <p class="tool-detail-description">{{ tool.description }}</p>
        <div class="tool-detail-tags" aria-label="Tool tags">
          <span v-for="tag in tool.tags" :key="tag" class="tool-detail-tag">{{ tag }}</span>
        </div>
      </div>
    </header>

    <section class="tool-workspace" :aria-label="$t('tools.workspaceLabel')">
      <component :is="currentComponent" />
    </section>
  </div>

  <div v-else class="tool-detail-missing" role="status" aria-live="polite">
    <div class="tool-missing-icon" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </svg>
    </div>
    <h1>{{ $t('tools.notFoundTitle') }}</h1>
    <p>{{ $t('tools.notFoundDescription') }}</p>
    <button type="button" class="tool-back-button tool-back-button--primary" @click="goBackToTools">
      {{ $t('tools.backToTools') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { usePageSeo } from '@/composables/useSeo'
import { toolKeys } from '@/data/tools'

const route = useRoute()
const router = useRouter()
const { t, tm } = useI18n()

interface ToolDetail {
  key: string
  component: string
  icon: string
  name: string
  description: string
  tags: string[]
}

const componentMap = {
  JsonFormatter: defineAsyncComponent(() => import('@/components/tools/JsonFormatterTool.vue')),
  Base64Tool: defineAsyncComponent(() => import('@/components/tools/Base64Tool.vue')),
  RegexTool: defineAsyncComponent(() => import('@/components/tools/RegexTool.vue')),
  ColorConverter: defineAsyncComponent(() => import('@/components/tools/ColorConverterTool.vue')),
  TimestampConverter: defineAsyncComponent(() => import('@/components/tools/TimestampConverterTool.vue')),
  TextCounter: defineAsyncComponent(() => import('@/components/tools/TextCounterTool.vue')),
  RandomGenerator: defineAsyncComponent(() => import('@/components/tools/RandomGeneratorTool.vue')),
  RandomStringGenerator: defineAsyncComponent(() => import('@/components/tools/RandomStringGeneratorTool.vue')),
  HolidayQueryTool: defineAsyncComponent(() => import('@/components/tools/HolidayQueryTool.vue')),
  Md5Tool: defineAsyncComponent(() => import('@/components/tools/Md5Tool.vue')),
  ShaTool: defineAsyncComponent(() => import('@/components/tools/ShaTool.vue')),
  DiffCheckerTool: defineAsyncComponent(() => import('@/components/tools/DiffCheckerTool.vue')),
  CodeRunnerTool: defineAsyncComponent(() => import('@/components/tools/CodeRunnerTool.vue')),
  ApiTestTool: defineAsyncComponent(() => import('@/components/tools/ApiTestTool.vue')),
  SqlFormatterTool: defineAsyncComponent(() => import('@/components/tools/SqlFormatterTool.vue')),
  CronEditorTool: defineAsyncComponent(() => import('@/components/tools/CronEditorTool.vue')),
  TokenUsageChartTool: defineAsyncComponent(() => import('@/components/tools/TokenUsageChartTool.vue')),
  PasswordStrengthTool: defineAsyncComponent(() => import('@/components/tools/PasswordStrengthTool.vue')),
  LoremIpsumTool: defineAsyncComponent(() => import('@/components/tools/LoremIpsumTool.vue')),
  ClineModelsTool: defineAsyncComponent(() => import('@/components/tools/ClineModelsTool.vue')),
  GithubInfoTool: defineAsyncComponent(() => import('@/components/tools/GithubInfoTool.vue')),
} as const

const tool = computed<ToolDetail | null>(() => {
  const id = typeof route.params.id === 'string' ? route.params.id : ''
  const meta = toolKeys.find((item) => item.key === id || item.component === id)
  if (!meta) return null
  return {
    key: meta.key,
    component: meta.component,
    icon: meta.icon,
    name: t(`tools.${meta.key}Name`),
    description: t(`tools.${meta.key}Desc`),
    tags: (tm(`tools.${meta.key}Tags`) as string[]) ?? [],
  }
})

const currentComponent = computed(() => {
  if (!tool.value) return null
  return componentMap[tool.value.component as keyof typeof componentMap] ?? null
})

usePageSeo(
  computed(() => tool.value?.name || t('tools.notFoundTitle')),
  computed(() => tool.value?.description || t('tools.notFoundDescription')),
  computed(() => `#/tools/${route.params.id || ''}`),
)

function goBack() {
  if (window.history.state?.back) router.back()
  else goBackToTools()
}

function goBackToTools() {
  router.push({ name: 'tools' })
}
</script>

<style lang="less" scoped>
.tool-detail-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.tool-detail-header {
  margin-bottom: 20px;
}

.tool-back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.tool-back-button:hover,
.tool-back-button:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--bg-secondary);
}

.tool-back-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.tool-detail-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: 0 4px 16px var(--shadow);
}

.tool-detail-icon {
  display: grid;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 14px;
  background: var(--bg-secondary);
  font-size: 2.2rem;
}

.tool-detail-heading {
  min-width: 0;
}

.tool-detail-eyebrow {
  margin: 0 0 6px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tool-detail-title {
  margin: 0 0 8px;
  color: var(--text-primary);
  font-size: 1.8rem;
  line-height: 1.3;
}

.tool-detail-description {
  max-width: 70ch;
  margin: 0 0 14px;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.65;
}

.tool-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tool-detail-tag {
  padding: 3px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
}

.tool-workspace {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: 0 2px 10px var(--shadow);
}

.tool-detail-missing {
  display: flex;
  min-height: 60vh;
  padding: 32px 24px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.tool-missing-icon {
  display: grid;
  width: 64px;
  height: 64px;
  margin-bottom: 18px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.tool-detail-missing h1 {
  margin: 0 0 8px;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.tool-detail-missing p {
  max-width: 48ch;
  margin: 0 0 22px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.tool-back-button--primary {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}

.tool-back-button--primary:hover,
.tool-back-button--primary:focus-visible {
  border-color: var(--accent-hover);
  background: var(--accent-hover);
  color: #fff;
}

@media (max-width: 600px) {
  .tool-detail-view {
    padding: 20px 12px 32px;
  }

  .tool-detail-card,
  .tool-workspace {
    padding: 16px;
  }

  .tool-detail-card {
    gap: 14px;
  }

  .tool-detail-icon {
    flex-basis: 48px;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    font-size: 1.7rem;
  }

  .tool-detail-title {
    font-size: 1.4rem;
  }
}
</style>
