<template>
  <div class="tool-form cline-models">
    <!-- 工具介绍 -->
    <p class="cline-intro">{{ $t('tools.clineModels.intro') }}</p>

    <!-- 三态：加载中 / 错误 / 内容 -->
    <div v-if="loading" class="cline-loading">
      <span class="loading-spinner" />
      <span>{{ $t('tools.clineModels.loading') }}</span>
    </div>

    <div v-else-if="error" class="cline-error">
      <span class="empty-icon">⚠️</span>
      <span class="empty-text">{{ $t('tools.clineModels.loadFailed') }}</span>
      <Button size="small" @click="fetchClineModels">{{ $t('tools.clineModels.retry') }}</Button>
    </div>

    <template v-else>
      <!-- 免费模型 -->
      <div class="cline-section">
        <label class="tool-label">{{ $t('tools.clineModels.freeSectionTitle') }}</label>
        <div v-if="freeModels.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <span class="empty-text">{{ $t('tools.clineModels.empty') }}</span>
        </div>
        <div v-else class="model-tags">
          <span
            v-for="model in freeModels"
            :key="model.id"
            class="model-tag"
            :title="tooltip(model)"
            @click="copyId(model)"
          >{{ model.name }}</span>
        </div>
      </div>

      <!-- 推荐模型 -->
      <div class="cline-section">
        <label class="tool-label">{{ $t('tools.clineModels.recommendedSectionTitle') }}</label>
        <div v-if="recommendedModels.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <span class="empty-text">{{ $t('tools.clineModels.empty') }}</span>
        </div>
        <div v-else class="model-tags">
          <span
            v-for="model in recommendedModels"
            :key="model.id"
            class="model-tag"
            :title="tooltip(model)"
            @click="copyId(model)"
          >{{ model.name }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from 'animal-island-vue'
import { useClineModels } from '@/composables/useClineModels'
import { copyText } from '@/utils/copyText'
import type { ClineModel } from '@/composables/useClineModels'

const { t } = useI18n()
const { loading, error, freeModels, recommendedModels, fetchClineModels } = useClineModels()

onMounted(() => {
  fetchClineModels()
})

// 空描述回退到「点击复制」提示，保证每个标签都有有意义的 tooltip
function tooltip(model: ClineModel): string {
  return model.description || t('tools.clineModels.clickToCopy')
}

function copyId(model: ClineModel) {
  copyText(model.id, t('tools.clineModels.copied'))
}
</script>

<style scoped>
.cline-models {
  gap: 16px;
}

.cline-intro {
  margin: 0;
  padding: 10px 14px;
  border-left: 3px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border-radius: 6px;
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.cline-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.cline-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
}

.empty-icon {
  font-size: 1.5rem;
}

.empty-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.cline-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 镜像 ToolsView 的 .tool-tag 外观，但 cursor: pointer + 点击复制 */
.model-tag {
  background: var(--bg-secondary);
  color: var(--accent);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid var(--border);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
}

.model-tag:hover {
  background: var(--accent);
  color: var(--bg-card);
  border-color: var(--accent);
  transform: scale(1.08);
}

.model-tag:active {
  transform: scale(0.96);
}
</style>
