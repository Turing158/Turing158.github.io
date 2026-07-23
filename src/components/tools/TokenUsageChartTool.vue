/**
 * Token 用量图工具
 *
 * 上传 Token 日志文件（文件仅留在浏览器中，不上传到服务器），
 * 解析后生成可视化的 SVG 用量图表。
 *
 * 布局分为 3 个部分：
 *   1. 文件上传区（支持拖拽 + 点击选择）
 *   2. 操作按钮（生成 / 自定义样式 / 重置 / 下载）
 *   3. 预览区（展示生成的 SVG）
 *
 * 注：本次仅实现布局与样式，文件解析 / SVG 生成 / 下载逻辑以空桩函数占位。
 */
<template>
  <div class="tool-form token-usage-chart">
    <!-- 支持格式提示 -->
    <div class="tool-info-banner">
      <svg class="tool-info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6" />
        <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
      </svg>
      <span class="tool-info-text">{{ $t('tools.tokenUsageChart.formatHint') }}</span>
      <span class="tool-info-spacer" />
      <span class="tool-info-download-label">{{ $t('tools.tokenUsageChart.downloadScript') }}</span>
      <button type="button" class="tool-info-btn" @click="downloadScript('py')">py</button>
      <button type="button" class="tool-info-btn" @click="downloadScript('js')">js</button>
    </div>

    <!-- ── Part 1: 文件上传区 ── -->
    <label class="tool-label">{{ $t('tools.tokenUsageChart.uploadLabel') }}</label>
    <div
      class="upload-zone"
      :class="{ 'is-dragover': isDragover, 'has-files': files.length > 0 }"
      @click="triggerFileInput"
      @dragenter.prevent="isDragover = true"
      @dragover.prevent="isDragover = true"
      @dragleave.prevent="isDragover = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept=".json,.sql"
        class="upload-input"
        @change="handleFileSelect"
      />

      <!-- 空态占位 -->
      <div v-if="files.length === 0" class="upload-placeholder">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            points="17 8 12 3 7 8"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line
            x1="12"
            y1="3"
            x2="12"
            y2="15"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="upload-title">{{ $t('tools.tokenUsageChart.uploadTitle') }}</p>
        <p class="upload-hint">{{ $t('tools.tokenUsageChart.uploadHint') }}</p>
      </div>

      <!-- 文件列表 -->
      <div v-else class="file-list">
        <div v-for="file in files" :key="file.name" class="file-item">
          <svg class="file-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="14 2 14 8 20 8"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatSize(file.size) }}</span>
          <button
            class="file-remove"
            :aria-label="$t('tools.tokenUsageChart.removeFile')"
            @click.stop="removeFile(file)"
          >
            <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Part 2: 操作按钮 ── -->
    <div class="tool-actions">
      <Button type="primary" size="small" :loading="isGenerating" @click="generate">
        {{ $t('tools.tokenUsageChart.generate') }}
      </Button>
      <Button size="small" @click="openStyleDialog">
        {{ $t('tools.tokenUsageChart.customStyle') }}
      </Button>
      <Button danger size="small" @click="reset">
        {{ $t('tools.tokenUsageChart.reset') }}
      </Button>
      <Button v-if="hasPreview" type="primary" size="small" @click="download">
        {{ $t('tools.tokenUsageChart.download') }}
      </Button>
    </div>

    <!-- ── Part 3: 预览区 ── -->
    <label class="tool-label">{{ $t('tools.tokenUsageChart.previewLabel') }}</label>
    <div class="preview-zone">
      <div v-if="!hasPreview" class="preview-empty">
        <svg class="preview-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <p>{{ $t('tools.tokenUsageChart.previewEmpty') }}</p>
      </div>
      <div v-else class="preview-svg">
        <TokenUsageChartSvg ref="previewComponentRef" :rows="parsedRows" :style-options="styleOptions" />
      </div>
    </div>
    <p v-if="hasPreview" class="preview-status">
      {{ $t('tools.tokenUsageChart.parsedCount', { count: parsedRows.length }) }}
    </p>
  </div>

  <!-- ── 自定义样式弹窗 ── -->
  <BlogDialog
    v-model="showStyleDialog"
    width="480px"
    max-width="90vw"
    :title="$t('tools.tokenUsageChart.styleDialogTitle')"
  >
    <div class="style-form">

      <!-- ════ 主要设置 ════ -->
      <fieldset class="style-section">
        <legend>{{ $t('tools.tokenUsageChart.mainSection') }}</legend>
        <div class="style-row">
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.primaryColor') }}</label>
            <input type="color" v-model="styleOptions.primaryColor" class="color-input" />
          </div>
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.bgColor') }}</label>
            <input type="color" v-model="styleOptions.bgColor" class="color-input" />
          </div>
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.fontColor') }}</label>
            <input type="color" v-model="styleOptions.fontColor" class="color-input" />
          </div>
        </div>
        <div class="style-row style-row--2">
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.cardBgColor') }}</label>
            <input type="color" v-model="styleOptions.cardBgColor" class="color-input" />
          </div>
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.cardOpacity') }}</label>
            <BlogInput
              v-model="styleCardOpacity"
              type="number"
              :min="0"
              :max="100"
              :step="1"
            />
          </div>
        </div>

        <!-- 画布宽度 -->
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.orientation') }}</label>
          <div class="style-orientation">
            <button
              type="button"
              class="style-orientation-btn"
              :class="{ active: styleOptions.orientation === 'landscape' }"
              @click="styleOptions.orientation = 'landscape'"
            >
              <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                <rect x="1" y="2" width="18" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
                <rect x="5" y="4.5" width="7" height="5" rx="1" fill="currentColor" opacity="0.7" />
              </svg>
              <span>{{ $t('tools.tokenUsageChart.orientationLandscape') }}</span>
            </button>
            <button
              type="button"
              class="style-orientation-btn"
              :class="{ active: styleOptions.orientation === 'portrait' }"
              @click="styleOptions.orientation = 'portrait'"
            >
              <svg viewBox="0 0 14 20" width="14" height="20" aria-hidden="true">
                <rect x="2" y="1" width="10" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
                <rect x="4.5" y="5" width="5" height="7" rx="1" fill="currentColor" opacity="0.7" />
              </svg>
              <span>{{ $t('tools.tokenUsageChart.orientationPortrait') }}</span>
            </button>
            <button
              type="button"
              class="style-orientation-btn style-orientation-btn--custom"
              :class="{ active: styleOptions.orientation === 'custom' }"
              @click="styleOptions.orientation = 'custom'"
            >
              <span class="style-orientation-btn-content">
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <rect x="1" y="2" width="18" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
                  <path d="M5 7h10M5 5v4M15 5v4" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.orientationCustom') }}</span>
              </span>
              <div v-if="styleOptions.orientation === 'custom'" class="style-orientation-btn-overlay">
                <BlogInput
                  v-model="styleOptions.width"
                  type="number"
                  :min="320"
                  :max="3840"
                  :step="10"
                />
              </div>
            </button>
          </div>
        </div>

        <!-- 三模块互斥开关 -->
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.moduleSection') }}</label>
          <div class="style-module-toggles">
            <button
              type="button"
              class="style-module-btn"
              :class="{ active: styleOptions.showUsageModule }"
              @click="toggleModule('usage', !styleOptions.showUsageModule)"
            >{{ $t('tools.tokenUsageChart.moduleUsage') }}</button>
            <button
              type="button"
              class="style-module-btn"
              :class="{ active: styleOptions.showContributionModule }"
              @click="toggleModule('contribution', !styleOptions.showContributionModule)"
            >{{ $t('tools.tokenUsageChart.moduleContribution') }}</button>
            <button
              type="button"
              class="style-module-btn"
              :class="{ active: styleOptions.showChartModule }"
              @click="toggleModule('chart', !styleOptions.showChartModule)"
            >{{ $t('tools.tokenUsageChart.moduleChart') }}</button>
          </div>
        </div>
      </fieldset>

      <!-- ════ 用量数据设置 ════ -->
      <fieldset v-if="styleOptions.showUsageModule" class="style-section">
        <legend>{{ $t('tools.tokenUsageChart.usageSection') }}</legend>

        <!-- 标题设置 -->
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.usageCardTitle') }}</label>
          <div class="style-row style-row--title">
            <div class="style-field style-field--grow">
              <BlogInput
                v-model="styleOptions.usageCardTitleText"
                type="text"
                :placeholder="$t('tools.tokenUsageChart.usageCardTitleText')"
              />
            </div>
            <div class="style-align-toggles">
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageCardTitleAlign === 'left' }"
                @click="styleOptions.usageCardTitleAlign = 'left'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="2" y1="7" x2="10" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignLeft') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageCardTitleAlign === 'center' }"
                @click="styleOptions.usageCardTitleAlign = 'center'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="3" y1="3" x2="17" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="4" y1="11" x2="16" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignCenter') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageCardTitleAlign === 'right' }"
                @click="styleOptions.usageCardTitleAlign = 'right'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="6" y1="3" x2="18" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="10" y1="7" x2="18" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="8" y1="11" x2="18" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignRight') }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="style-row style-row--2">
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.usageTitleAlign') }}</label>
            <div class="style-align-toggles">
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageTitleAlign === 'left' }"
                @click="styleOptions.usageTitleAlign = 'left'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="2" y1="7" x2="10" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignLeft') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageTitleAlign === 'center' }"
                @click="styleOptions.usageTitleAlign = 'center'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="3" y1="3" x2="17" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="4" y1="11" x2="16" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignCenter') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageTitleAlign === 'right' }"
                @click="styleOptions.usageTitleAlign = 'right'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="6" y1="3" x2="18" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="10" y1="7" x2="18" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="8" y1="11" x2="18" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignRight') }}</span>
              </button>
            </div>
            <BlogInput
              v-model="styleOptions.widthLargeTotal"
              type="number"
              :min="0"
              :step="10"
              :placeholder="$t('tools.tokenUsageChart.badgeWidthLargeTotal')"
              class="badge-width-input"
            />
          </div>
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.usageDataAlign') }}</label>
            <div class="style-align-toggles">
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageDataAlign === 'left' }"
                @click="styleOptions.usageDataAlign = 'left'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <rect x="2" y="2" width="16" height="3" rx="1" fill="currentColor" opacity="0.85" />
                  <rect x="2" y="7" width="11" height="3" rx="1" fill="currentColor" opacity="0.85" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignLeft') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageDataAlign === 'center' }"
                @click="styleOptions.usageDataAlign = 'center'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <rect x="3" y="2" width="14" height="3" rx="1" fill="currentColor" opacity="0.85" />
                  <rect x="5.5" y="7" width="9" height="3" rx="1" fill="currentColor" opacity="0.85" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignCenter') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.usageDataAlign === 'right' }"
                @click="styleOptions.usageDataAlign = 'right'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <rect x="2" y="2" width="16" height="3" rx="1" fill="currentColor" opacity="0.85" />
                  <rect x="7" y="7" width="11" height="3" rx="1" fill="currentColor" opacity="0.85" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignRight') }}</span>
              </button>
            </div>
            <BlogInput
              v-model="styleOptions.widthLargeVibe"
              type="number"
              :min="0"
              :step="10"
              :placeholder="$t('tools.tokenUsageChart.badgeWidthLargeVibe')"
              class="badge-width-input"
            />
          </div>
        </div>
        <div class="style-badge-fields">
          <div class="style-badge-field">
            <label class="style-checkbox">
              <input type="checkbox" v-model="styleOptions.showTotal" />
              <span>{{ $t('tools.tokenUsageChart.showTotal') }}</span>
            </label>
            <BlogInput
              v-model="styleOptions.widthTotal"
              type="number"
              :min="0"
              :step="10"
              :placeholder="$t('tools.tokenUsageChart.badgeWidth')"
            />
          </div>
          <div class="style-badge-field">
            <label class="style-checkbox">
              <input type="checkbox" v-model="styleOptions.showInput" />
              <span>{{ $t('tools.tokenUsageChart.showInput') }}</span>
            </label>
            <BlogInput
              v-model="styleOptions.widthInput"
              type="number"
              :min="0"
              :step="10"
              :placeholder="$t('tools.tokenUsageChart.badgeWidth')"
            />
          </div>
          <div class="style-badge-field">
            <label class="style-checkbox">
              <input type="checkbox" v-model="styleOptions.showOutput" />
              <span>{{ $t('tools.tokenUsageChart.showOutput') }}</span>
            </label>
            <BlogInput
              v-model="styleOptions.widthOutput"
              type="number"
              :min="0"
              :step="10"
              :placeholder="$t('tools.tokenUsageChart.badgeWidth')"
            />
          </div>
          <div class="style-badge-field">
            <label class="style-checkbox">
              <input type="checkbox" v-model="styleOptions.showTotalCost" />
              <span>{{ $t('tools.tokenUsageChart.showTotalCost') }}</span>
            </label>
            <BlogInput
              v-model="styleOptions.widthTotalCost"
              type="number"
              :min="0"
              :step="10"
              :placeholder="$t('tools.tokenUsageChart.badgeWidth')"
            />
          </div>
          <div class="style-badge-field">
            <label class="style-checkbox">
              <input type="checkbox" v-model="styleOptions.showCacheInput" />
              <span>{{ $t('tools.tokenUsageChart.showCacheInput') }}</span>
            </label>
            <BlogInput
              v-model="styleOptions.widthCacheInput"
              type="number"
              :min="0"
              :step="10"
              :placeholder="$t('tools.tokenUsageChart.badgeWidth')"
            />
          </div>
          <div class="style-badge-field">
            <label class="style-checkbox">
              <input type="checkbox" v-model="styleOptions.showCacheCreation" />
              <span>{{ $t('tools.tokenUsageChart.showCacheCreation') }}</span>
            </label>
            <BlogInput
              v-model="styleOptions.widthCacheCreation"
              type="number"
              :min="0"
              :step="10"
              :placeholder="$t('tools.tokenUsageChart.badgeWidth')"
            />
          </div>
        </div>
      </fieldset>

      <!-- ════ 贡献图设置 ════ -->
      <fieldset v-if="styleOptions.showContributionModule" class="style-section">
        <legend>{{ $t('tools.tokenUsageChart.contributionSection') }}</legend>

        <!-- 标题设置 -->
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.contributionTitle') }}</label>
          <div class="style-row style-row--title">
            <div class="style-field style-field--grow">
              <BlogInput
                v-model="styleOptions.contributionCardTitleText"
                type="text"
                :placeholder="$t('tools.tokenUsageChart.contributionTitleText')"
              />
            </div>
            <div class="style-align-toggles">
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.contributionCardTitleAlign === 'left' }"
                @click="styleOptions.contributionCardTitleAlign = 'left'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="2" y1="7" x2="10" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignLeft') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.contributionCardTitleAlign === 'center' }"
                @click="styleOptions.contributionCardTitleAlign = 'center'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="3" y1="3" x2="17" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="4" y1="11" x2="16" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignCenter') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.contributionCardTitleAlign === 'right' }"
                @click="styleOptions.contributionCardTitleAlign = 'right'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="6" y1="3" x2="18" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="10" y1="7" x2="18" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="8" y1="11" x2="18" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignRight') }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="style-row">
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.monthLabelColor') }}</label>
            <input type="color" v-model="styleOptions.monthLabelColor" class="color-input" />
          </div>
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.weekdayLabelColor') }}</label>
            <input type="color" v-model="styleOptions.weekdayLabelColor" class="color-input" />
          </div>
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.gridEmptyColor') }}</label>
            <input type="color" v-model="styleOptions.gridEmptyColor" class="color-input" />
          </div>
        </div>
        <div class="style-field style-field--row">
          <label class="style-checkbox style-checkbox--inline">
            <input type="checkbox" v-model="styleOptions.showDateRange" />
            <span>{{ $t('tools.tokenUsageChart.showDateRange') }}</span>
          </label>
          <template v-if="styleOptions.showDateRange">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.dateRangeFontColor') }}</label>
            <input type="color" v-model="styleOptions.dateRangeFontColor" class="color-input color-input--inline-row" />
          </template>
        </div>
        <div class="style-field style-field--row">
          <label class="style-checkbox style-checkbox--inline">
            <input type="checkbox" v-model="styleOptions.showContributionLegend" />
            <span>{{ $t('tools.tokenUsageChart.showContributionLegend') }}</span>
          </label>
        </div>
      </fieldset>

      <!-- ════ 图表设置 ════ -->
      <fieldset v-if="styleOptions.showChartModule" class="style-section">
        <legend>{{ $t('tools.tokenUsageChart.chartSection') }}</legend>

        <!-- 标题设置 -->
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.chartTitle') }}</label>
          <div class="style-row style-row--title">
            <div class="style-field style-field--grow">
              <BlogInput
                v-model="styleOptions.chartCardTitleText"
                type="text"
                :placeholder="$t('tools.tokenUsageChart.chartTitleText')"
              />
            </div>
            <div class="style-align-toggles">
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.chartCardTitleAlign === 'left' }"
                @click="styleOptions.chartCardTitleAlign = 'left'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="2" y1="7" x2="10" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignLeft') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.chartCardTitleAlign === 'center' }"
                @click="styleOptions.chartCardTitleAlign = 'center'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="3" y1="3" x2="17" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="4" y1="11" x2="16" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignCenter') }}</span>
              </button>
              <button
                type="button"
                class="style-align-btn"
                :class="{ active: styleOptions.chartCardTitleAlign === 'right' }"
                @click="styleOptions.chartCardTitleAlign = 'right'"
              >
                <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
                  <line x1="6" y1="3" x2="18" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="10" y1="7" x2="18" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <line x1="8" y1="11" x2="18" y2="11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <span>{{ $t('tools.tokenUsageChart.alignRight') }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.statsChartType') }}</label>
          <BlogSelect
            v-model="statsChartTypeOption"
            :options="statsChartTypeOptions"
            :placeholder="$t('tools.tokenUsageChart.statsChartType')"
            :clearable="false"
          />
        </div>
        <div class="style-switches">
          <label
            class="style-switch"
            :style="{ '--swatch': styleOptions.colorTotal }"
            @mousedown="startLongPress('colorTotal', $event)"
            @touchstart.prevent="startLongPress('colorTotal', $event)"
            @mouseup="endLongPress($event)"
            @mouseleave="endLongPress()"
            @touchend.prevent="endLongPress($event)"
            @click.prevent="onSwitchClick($event, 'chartShowTotal')"
          >
            <span class="style-switch-control">
              <input
                type="checkbox"
                :checked="styleOptions.chartShowTotal"
                :class="{ 'is-pressed': pressedColorKey === 'colorTotal' }"
                @click.stop
              />
              <input
                ref="colorTotalRef"
                type="color"
                v-model="styleOptions.colorTotal"
                class="color-input-hidden"
                :class="{ 'is-visible': styleOptions.chartShowTotal && visibleColorPickerKey === 'colorTotal' }"
                :disabled="!styleOptions.chartShowTotal"
                tabindex="-1"
                aria-hidden="true"
                @click.stop
                @input="hideColorPicker"
                @change="hideColorPicker"
                @blur="hideColorPicker"
              />
            </span>
            <span>{{ $t('tools.tokenUsageChart.showTotal') }}</span>
          </label>
          <label
            class="style-switch"
            :style="{ '--swatch': styleOptions.colorInput }"
            @mousedown="startLongPress('colorInput', $event)"
            @touchstart.prevent="startLongPress('colorInput', $event)"
            @mouseup="endLongPress($event)"
            @mouseleave="endLongPress()"
            @touchend.prevent="endLongPress($event)"
            @click.prevent="onSwitchClick($event, 'chartShowInput')"
          >
            <span class="style-switch-control">
              <input
                type="checkbox"
                :checked="styleOptions.chartShowInput"
                :class="{ 'is-pressed': pressedColorKey === 'colorInput' }"
                @click.stop
              />
              <input
                ref="colorInputRef"
                type="color"
                v-model="styleOptions.colorInput"
                class="color-input-hidden"
                :class="{ 'is-visible': styleOptions.chartShowInput && visibleColorPickerKey === 'colorInput' }"
                :disabled="!styleOptions.chartShowInput"
                tabindex="-1"
                aria-hidden="true"
                @click.stop
                @input="hideColorPicker"
                @change="hideColorPicker"
                @blur="hideColorPicker"
              />
            </span>
            <span>{{ $t('tools.tokenUsageChart.showInput') }}</span>
          </label>
          <label
            class="style-switch"
            :style="{ '--swatch': styleOptions.colorOutput }"
            @mousedown="startLongPress('colorOutput', $event)"
            @touchstart.prevent="startLongPress('colorOutput', $event)"
            @mouseup="endLongPress($event)"
            @mouseleave="endLongPress()"
            @touchend.prevent="endLongPress($event)"
            @click.prevent="onSwitchClick($event, 'chartShowOutput')"
          >
            <span class="style-switch-control">
              <input
                type="checkbox"
                :checked="styleOptions.chartShowOutput"
                :class="{ 'is-pressed': pressedColorKey === 'colorOutput' }"
                @click.stop
              />
              <input
                ref="colorOutputRef"
                type="color"
                v-model="styleOptions.colorOutput"
                class="color-input-hidden"
                :class="{ 'is-visible': styleOptions.chartShowOutput && visibleColorPickerKey === 'colorOutput' }"
                :disabled="!styleOptions.chartShowOutput"
                tabindex="-1"
                aria-hidden="true"
                @click.stop
                @input="hideColorPicker"
                @change="hideColorPicker"
                @blur="hideColorPicker"
              />
            </span>
            <span>{{ $t('tools.tokenUsageChart.showOutput') }}</span>
          </label>
          <label
            class="style-switch"
            :style="{ '--swatch': styleOptions.colorTotalCost }"
            @mousedown="startLongPress('colorTotalCost', $event)"
            @touchstart.prevent="startLongPress('colorTotalCost', $event)"
            @mouseup="endLongPress($event)"
            @mouseleave="endLongPress()"
            @touchend.prevent="endLongPress($event)"
            @click.prevent="onSwitchClick($event, 'chartShowTotalCost')"
          >
            <span class="style-switch-control">
              <input
                type="checkbox"
                :checked="styleOptions.chartShowTotalCost"
                :class="{ 'is-pressed': pressedColorKey === 'colorTotalCost' }"
                @click.stop
              />
              <input
                ref="colorTotalCostRef"
                type="color"
                v-model="styleOptions.colorTotalCost"
                class="color-input-hidden"
                :class="{ 'is-visible': styleOptions.chartShowTotalCost && visibleColorPickerKey === 'colorTotalCost' }"
                :disabled="!styleOptions.chartShowTotalCost"
                tabindex="-1"
                aria-hidden="true"
                @click.stop
                @input="hideColorPicker"
                @change="hideColorPicker"
                @blur="hideColorPicker"
              />
            </span>
            <span>{{ $t('tools.tokenUsageChart.showTotalCost') }}</span>
          </label>
          <label
            class="style-switch"
            :style="{ '--swatch': styleOptions.colorCacheInput }"
            @mousedown="startLongPress('colorCacheInput', $event)"
            @touchstart.prevent="startLongPress('colorCacheInput', $event)"
            @mouseup="endLongPress($event)"
            @mouseleave="endLongPress()"
            @touchend.prevent="endLongPress($event)"
            @click.prevent="onSwitchClick($event, 'chartShowCacheInput')"
          >
            <span class="style-switch-control">
              <input
                type="checkbox"
                :checked="styleOptions.chartShowCacheInput"
                :class="{ 'is-pressed': pressedColorKey === 'colorCacheInput' }"
                @click.stop
              />
              <input
                ref="colorCacheInputRef"
                type="color"
                v-model="styleOptions.colorCacheInput"
                class="color-input-hidden"
                :class="{ 'is-visible': styleOptions.chartShowCacheInput && visibleColorPickerKey === 'colorCacheInput' }"
                :disabled="!styleOptions.chartShowCacheInput"
                tabindex="-1"
                aria-hidden="true"
                @click.stop
                @input="hideColorPicker"
                @change="hideColorPicker"
                @blur="hideColorPicker"
              />
            </span>
            <span>{{ $t('tools.tokenUsageChart.showCacheInput') }}</span>
          </label>
          <label
            class="style-switch"
            :style="{ '--swatch': styleOptions.colorCacheCreation }"
            @mousedown="startLongPress('colorCacheCreation', $event)"
            @touchstart.prevent="startLongPress('colorCacheCreation', $event)"
            @mouseup="endLongPress($event)"
            @mouseleave="endLongPress()"
            @touchend.prevent="endLongPress($event)"
            @click.prevent="onSwitchClick($event, 'chartShowCacheCreation')"
          >
            <span class="style-switch-control">
              <input
                type="checkbox"
                :checked="styleOptions.chartShowCacheCreation"
                :class="{ 'is-pressed': pressedColorKey === 'colorCacheCreation' }"
                @click.stop
              />
              <input
                ref="colorCacheCreationRef"
                type="color"
                v-model="styleOptions.colorCacheCreation"
                class="color-input-hidden"
                :class="{ 'is-visible': styleOptions.chartShowCacheCreation && visibleColorPickerKey === 'colorCacheCreation' }"
                :disabled="!styleOptions.chartShowCacheCreation"
                tabindex="-1"
                aria-hidden="true"
                @click.stop
                @input="hideColorPicker"
                @change="hideColorPicker"
                @blur="hideColorPicker"
              />
            </span>
            <span>{{ $t('tools.tokenUsageChart.showCacheCreation') }}</span>
          </label>
        </div>
        <div class="style-row style-row--2">
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.chartDateFontColor') }}</label>
            <input type="color" v-model="styleOptions.chartDateFontColor" class="color-input" />
          </div>
          <div class="style-field">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.chartValueFontColor') }}</label>
            <input type="color" v-model="styleOptions.chartValueFontColor" class="color-input" />
          </div>
        </div>
        <div class="style-field style-field--row">
          <label class="style-checkbox style-checkbox--inline">
            <input type="checkbox" v-model="styleOptions.showLegend" />
            <span>{{ $t('tools.tokenUsageChart.showLegend') }}</span>
          </label>
          <template v-if="styleOptions.showLegend">
            <label class="tool-label">{{ $t('tools.tokenUsageChart.legendFontColor') }}</label>
            <input type="color" v-model="styleOptions.legendFontColor" class="color-input color-input--inline-row" />
          </template>
        </div>
      </fieldset>

    </div>

    <template #footer>
      <div class="dialog-actions">
        <Button size="small" @click="showStyleDialog = false">
          {{ $t('tools.tokenUsageChart.cancel') }}
        </Button>
        <Button type="primary" size="small" @click="applyStyle">
          {{ $t('tools.tokenUsageChart.confirm') }}
        </Button>
      </div>
    </template>
  </BlogDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch, onMounted } from 'vue'
import { Button } from 'animal-island-vue'
import BlogDialog from '@/components/common/BlogDialog.vue'
import BlogInput from '@/components/common/BlogInput.vue'
import BlogSelect from '@/components/common/BlogSelect.vue'
import { parseSqlFile, type TokenUsageRow } from '@/utils/sqlLogParser'
import TokenUsageChartSvg from './TokenUsageChartSvg.vue'
import { deriveThemeBgColor, type StatsChartType, type TokenUsageStyleOptions } from './tokenUsageSvg'
import { useI18n } from 'vue-i18n'
import { useTheme, type ThemeName } from '@/composables/useTheme'

interface UploadFile {
  name: string
  size: number
  raw: File
}

// ── 状态 ──
const files = ref<UploadFile[]>([])
const isDragover = ref(false)
const hasPreview = ref(false)
const showStyleDialog = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewComponentRef = ref<InstanceType<typeof TokenUsageChartSvg> | null>(null)
const isGenerating = ref(false)
const parsedRows = ref<TokenUsageRow[]>([])

const { t } = useI18n()
const { theme, systemMode, systemLightTheme, systemDarkTheme, isSystemDark } = useTheme()

/** 与 useTheme / variables.css 保持一致的主题主色 */
const THEME_ACCENT: Record<ThemeName, string> = {
  forest: '#4a7c59',
  ocean: '#2a6f97',
  sunset: '#c05533',
  dark: '#2eaadc',
}

function resolveActiveTheme(): ThemeName {
  if (systemMode.value) {
    return isSystemDark.value ? systemDarkTheme.value : systemLightTheme.value
  }
  return theme.value
}

function applyThemeColors(themeName: ThemeName) {
  const accent = THEME_ACCENT[themeName] || THEME_ACCENT.forest
  styleOptions.primaryColor = accent
  styleOptions.bgColor = deriveThemeBgColor(accent)
  // 总用量系列默认跟随主色
  styleOptions.colorTotal = accent
}

const styleOptions = reactive<TokenUsageStyleOptions>({
  primaryColor: '#4a7c59',
  bgColor: '#d6e6da',
  fontColor: '#2c2c2c',
  cardBgColor: '#ffffff',
  cardOpacity: '48',
  width: '1280',
  height: '720',
  padding: '40',
  showTotal: true,
  showInput: true,
  showOutput: true,
  showCacheInput: true,
  showCacheCreation: true,
  showTotalCost: true,
  widthTotal: '180',
  widthInput: '180',
  widthOutput: '180',
  widthTotalCost: '180',
  widthCacheInput: '180',
  widthCacheCreation: '180',
  widthLargeTotal: '276',
  widthLargeVibe: '276',
  chartShowTotal: true,
  chartShowInput: true,
  chartShowOutput: true,
  chartShowCacheInput: true,
  chartShowCacheCreation: true,
  chartShowTotalCost: true,
  statsChartType: 'line',
  colorTotal: '#4a7c59',
  colorInput: '#3b82f6',
  colorOutput: '#f59e0b',
  colorTotalCost: '#ef4444',
  colorCacheInput: '#8b5cf6',
  colorCacheCreation: '#14b8a6',
  axisLabelColor: '#9ca3af',
  gridEmptyColor: '#f3f4f6',
  orientation: 'portrait',
  showUsageModule: true,
  showContributionModule: true,
  showChartModule: true,
  usageCardTitleText: 'Token用量',
  usageCardTitleAlign: 'left',
  contributionCardTitleText: 'Token 贡献图',
  contributionCardTitleAlign: 'left',
  chartCardTitleText: 'Token 图表',
  chartCardTitleAlign: 'left',
  usageTitleAlign: 'left',
  usageDataAlign: 'right',
  monthLabelColor: '#6b7280',
  weekdayLabelColor: '#9ca3af',
  showDateRange: true,
  showContributionLegend: true,
  dateRangeFontColor: '#6b7280',
  chartDateFontColor: '#9ca3af',
  chartValueFontColor: '#6b7280',
  showLegend: true,
  legendFontColor: '#2c2c2c',
})

// 主题变化时同步主色与按比例生成的背景色
watch(
  [theme, systemMode, systemLightTheme, systemDarkTheme, isSystemDark],
  () => {
    applyThemeColors(resolveActiveTheme())
  },
  { immediate: true },
)

// 用户手动改主色时，背景色按同一比例跟随
watch(
  () => styleOptions.primaryColor,
  (primary) => {
    styleOptions.bgColor = deriveThemeBgColor(primary)
  },
)

// 横/竖版仅表示布局方向偏好；实际宽高由内容 + 边距自适应，不再强制固定尺寸
// styleOptions.width / height 仅作兜底，真正尺寸以 SVG 组件计算结果为准

// 三模块互斥：始终至少一个开启
function toggleModule(key: 'usage' | 'contribution' | 'chart', value: boolean) {
  if (!value) {
    const others: Record<string, boolean> = {
      usage: styleOptions.showContributionModule || styleOptions.showChartModule,
      contribution: styleOptions.showUsageModule || styleOptions.showChartModule,
      chart: styleOptions.showUsageModule || styleOptions.showContributionModule,
    }
    if (!others[key]) return
  }
  if (key === 'usage') styleOptions.showUsageModule = value
  if (key === 'contribution') styleOptions.showContributionModule = value
  if (key === 'chart') styleOptions.showChartModule = value
}

// 图表设置：长按打开颜色选择器
const colorTotalRef = ref<HTMLInputElement | null>(null)
const colorInputRef = ref<HTMLInputElement | null>(null)
const colorOutputRef = ref<HTMLInputElement | null>(null)
const colorTotalCostRef = ref<HTMLInputElement | null>(null)
const colorCacheInputRef = ref<HTMLInputElement | null>(null)
const colorCacheCreationRef = ref<HTMLInputElement | null>(null)

const colorInputMap: Record<string, HTMLInputElement | null> = {
  get colorTotal() { return colorTotalRef.value },
  get colorInput() { return colorInputRef.value },
  get colorOutput() { return colorOutputRef.value },
  get colorTotalCost() { return colorTotalCostRef.value },
  get colorCacheInput() { return colorCacheInputRef.value },
  get colorCacheCreation() { return colorCacheCreationRef.value },
}

const colorEnabledMap: Record<string, () => boolean> = {
  colorTotal: () => styleOptions.chartShowTotal,
  colorInput: () => styleOptions.chartShowInput,
  colorOutput: () => styleOptions.chartShowOutput,
  colorTotalCost: () => styleOptions.chartShowTotalCost,
  colorCacheInput: () => styleOptions.chartShowCacheInput,
  colorCacheCreation: () => styleOptions.chartShowCacheCreation,
}

const colorKeyByShowKey: Record<string, string> = {
  chartShowTotal: 'colorTotal',
  chartShowInput: 'colorInput',
  chartShowOutput: 'colorOutput',
  chartShowTotalCost: 'colorTotalCost',
  chartShowCacheInput: 'colorCacheInput',
  chartShowCacheCreation: 'colorCacheCreation',
}

let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressFired = false
const visibleColorPickerKey = ref<string | null>(null)
// 当前被按住的选项：用于按下时放大 checkbox 内颜色块
const pressedColorKey = ref<string | null>(null)

function isColorPickerEnabled(colorKey: string): boolean {
  return !!colorEnabledMap[colorKey]?.()
}

function hideColorPicker() {
  visibleColorPickerKey.value = null
}

async function openColorPicker(colorKey: string) {
  // 未勾选时不允许打开颜色选择框
  if (!isColorPickerEnabled(colorKey)) {
    hideColorPicker()
    return
  }

  visibleColorPickerKey.value = colorKey
  await nextTick()

  // nextTick 后再确认一次，避免异步期间被取消勾选
  if (!isColorPickerEnabled(colorKey)) {
    hideColorPicker()
    return
  }

  const input = colorInputMap[colorKey]
  if (!input) return

  try {
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.click()
    }
  } catch {
    try {
      input.click()
    } catch {
      // 打开失败时仍保留可见的颜色框，供用户直接点击
    }
  }
}

function startLongPress(colorKey: string, _e: Event) {
  // 按下即放大 checkbox 内颜色块（无论是否勾选）
  pressedColorKey.value = colorKey

  // 未勾选时直接跳过长按
  if (!isColorPickerEnabled(colorKey)) {
    longPressFired = false
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    hideColorPicker()
    return
  }

  // 按住达到阈值时直接打开，不依赖松开
  longPressFired = false
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  longPressTimer = setTimeout(() => {
    longPressTimer = null
    // 定时器触发时再检查一次，防止长按期间被取消勾选
    if (!isColorPickerEnabled(colorKey)) {
      hideColorPicker()
      return
    }
    longPressFired = true
    void openColorPicker(colorKey)
  }, 400)
}

function endLongPress(e?: Event) {
  // 松开 / 移出：清除按下放大状态，颜色块自然落到切换后（或还原）的状态
  pressedColorKey.value = null
  // 松开 / 移出：若尚未触发长按则取消；若已触发则阻止后续 click 切换
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  if (longPressFired && e) {
    e.preventDefault()
  }
}

function onSwitchClick(e: MouseEvent, key: 'chartShowTotal' | 'chartShowInput' | 'chartShowOutput' | 'chartShowTotalCost' | 'chartShowCacheInput' | 'chartShowCacheCreation') {
  // 长按触发颜色选择器后，本次点击不切换 checkbox
  if (longPressFired) {
    longPressFired = false
    e.preventDefault()
    return
  }

  const nextValue = !styleOptions[key]
  styleOptions[key] = nextValue

  // 取消勾选时立刻关闭对应颜色框，防止残留可点
  if (!nextValue) {
    const colorKey = colorKeyByShowKey[key]
    if (visibleColorPickerKey.value === colorKey) {
      hideColorPicker()
    }
  }
}

// 图表系列开关变化时：关闭对应颜色框
watch(
  () => [
    styleOptions.chartShowTotal,
    styleOptions.chartShowInput,
    styleOptions.chartShowOutput,
    styleOptions.chartShowTotalCost,
    styleOptions.chartShowCacheInput,
    styleOptions.chartShowCacheCreation,
  ],
  () => {
    const key = visibleColorPickerKey.value
    if (key && !isColorPickerEnabled(key)) {
      hideColorPicker()
    }
  },
)

onMounted(() => {
  applyThemeColors(resolveActiveTheme())
})

const statsChartTypeOptions = computed(() => [
  { label: t('tools.tokenUsageChart.chartTypeLine'), value: 'line' },
  { label: t('tools.tokenUsageChart.chartTypeArea'), value: 'area' },
  { label: t('tools.tokenUsageChart.chartTypeBar'), value: 'bar' },
  { label: t('tools.tokenUsageChart.chartTypeStacked'), value: 'stacked' },
])

const statsChartTypeOption = computed<{ label: string; value: string } | undefined>({
  get: () => statsChartTypeOptions.value.find((o) => o.value === styleOptions.statsChartType),
  set: (opt) => {
    if (!opt) return
    styleOptions.statsChartType = opt.value as StatsChartType
  },
})

const styleCardOpacity = computed<string>({
  get: () => styleOptions.cardOpacity,
  set: (value) => {
    const n = Number(value)
    if (!Number.isFinite(n)) {
      styleOptions.cardOpacity = '0'
      return
    }
    styleOptions.cardOpacity = String(Math.min(100, Math.max(0, Math.round(n))))
  },
})

// ── UI 交互（实现） ──
function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(input.files)
  // 清空 input 的值，保证同一文件再次选择仍能触发 change
  input.value = ''
}

function handleDrop(e: DragEvent) {
  isDragover.value = false
  addFiles(e.dataTransfer?.files ?? null)
}

function addFiles(fileList: FileList | null) {
  if (!fileList || fileList.length === 0) return
  // 单文件模式：新文件覆盖之前上传的文件
  const f = fileList[0]
  files.value = [{ name: f.name, size: f.size, raw: f }]
}

function removeFile(file: UploadFile) {
  files.value = files.value.filter((f) => f !== file)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── 业务逻辑（空桩 / stub） ──

/**
 * 生成流程：
 *   1. 按文件后缀分流：.sql 走 parseSqlFile → .json 直接 JSON.parse
 *   2. 汇总后交给 generateSvg 生成预览（generateSvg 保留为 TODO）
 */
async function generate() {
  if (files.value.length === 0) return
  isGenerating.value = true
  try {
    const rows: TokenUsageRow[] = []
    for (const f of files.value) {
      const lower = f.name.toLowerCase()
      if (lower.endsWith('.sql')) {
        rows.push(...await parseSqlFile(f.raw))
      } else if (lower.endsWith('.json')) {
        const text = await f.raw.text()
        const data = await new Promise((resolve) => { setTimeout(() => resolve(JSON.parse(text)), 0) })
        if (Array.isArray(data)) {
          rows.push(...data)
        }
      }
    }
    parsedRows.value = rows
    hasPreview.value = true
  } finally {
    isGenerating.value = false
  }
}

function reset() {
  files.value = []
  parsedRows.value = []
  hasPreview.value = false
  isDragover.value = false
}

async function download() {
  await nextTick()
  const svgEl = previewComponentRef.value?.getSvgElement?.()
  if (!svgEl) return
  const serializer = new XMLSerializer()
  const svgText = serializer.serializeToString(svgEl)
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = 'token-usage-chart.svg'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

const SCRIPT_FILES: Record<string, string> = {
  py: '/scripts/format_token_usage.py',
  js: '/scripts/format_token_usage.js',
}

function downloadScript(lang: 'py' | 'js') {
  const url = SCRIPT_FILES[lang]
  if (!url) {
    return
  }
  // 用 fetch + blob 触发浏览器下载，避免直接打开文件
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = url.split('/').pop()!
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    })
    .catch(() => {
      // 下载失败时回退为直接打开
      window.open(url, '_blank')
    })
}

function openStyleDialog() {
  showStyleDialog.value = true
}

function applyStyle() {
  // TODO: 应用样式并重绘
  showStyleDialog.value = false
}
</script>

<style lang="less" scoped>
.token-usage-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// ── 支持格式提示 ──
.tool-info-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 8px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
}

.tool-info-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--accent);
}

.tool-info-text {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.tool-info-spacer {
  flex: 1;
}

.tool-info-download-label {
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.tool-info-btn {
  flex-shrink: 0;
  padding: 3px 12px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-weight: 600;
  color: var(--accent);
  background: var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--border));
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--accent);
    color: var(--bg-card);
    border-color: var(--accent);
  }

  &:active {
    transform: scale(0.95);
  }
}

// ── 上传区 ──
.upload-zone {
  position: relative;
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 48px 24px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;

  &:hover {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 6%, var(--bg-secondary));
  }

  &.is-dragover {
    border-color: var(--accent);
    border-style: solid;
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
    transform: scale(1.01);
  }

  &.has-files {
    padding: 16px;
    min-height: 0;
  }
}

.upload-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  pointer-events: none;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--text-secondary);
}

.upload-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.upload-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

// ── 文件列表 ──
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
  }
}

.file-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.file-name {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.file-remove {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: color-mix(in srgb, #e05a5a 15%, transparent);
    color: #e05a5a;
  }
}

// ── 预览区 ──
.preview-zone {
  border: 1px solid var(--border);
  border-radius: 12px;
  min-height: 240px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  color: var(--text-secondary);

  p {
    margin: 0;
    font-size: 0.85rem;
  }
}

.preview-icon {
  width: 64px;
  height: 64px;
  color: var(--text-secondary);
  opacity: 0.5;
}

.preview-svg {
  width: 100%;
  padding: 16px;

  :deep(svg) {
    width: 100%;
    height: auto;
    display: block;
  }
}

.preview-status {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: right;
}

// ── 自定义样式弹窗 ──
.style-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.style-section {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  legend {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    padding: 0 6px;
  }

  &[disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
}

.style-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &--indent {
    margin-left: 12px;
    max-width: calc(100% - 12px);
  }

  &--grow {
    flex: 1;
    min-width: 0;

    :deep(.blog-input),
    :deep(input) {
      width: 100%;
    }
  }

  &--row {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    .tool-label {
      margin: 0;
      flex-shrink: 0;
    }

    .style-checkbox--inline {
      margin-top: 0;
      flex-shrink: 0;
    }
  }
}

.style-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  &--2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &--title {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
}

.style-switches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 12px;
}

.style-checkboxes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 12px;
}

.style-badge-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.style-badge-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  :deep(.blog-input),
  :deep(input) {
    height: 30px;
    font-size: 0.8rem;
  }
}

.badge-width-input {
  margin-top: 6px;

  :deep(.blog-input),
  :deep(input) {
    height: 30px;
    font-size: 0.8rem;
  }
}

.style-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-primary);
  cursor: pointer;

  &--inline {
    margin-top: 4px;
  }

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    cursor: pointer;
  }
}

.style-orientation {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.style-orientation-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  height: 72px; // 固定高度，确保嵌入输入框时不变形
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
  overflow: hidden;

  svg {
    opacity: 0.7;
    flex-shrink: 0;
  }

  span {
    font-size: 0.82rem;
    font-weight: 500;
  }

  small {
    font-size: 0.68rem;
    opacity: 0.6;
  }

  &.active {
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
    border-color: var(--accent);
    color: var(--accent);

    svg {
      opacity: 1;
    }
  }

  &:hover:not(.active) {
    border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
    color: var(--text-primary);
  }
}

.style-orientation-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: opacity 0.2s;
  flex-shrink: 0;

  .style-orientation-btn--custom.active & {
    opacity: 0;
  }
}

.style-orientation-btn-overlay {
  position: absolute;
  inset: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: fadeIn 0.2s forwards;

  :deep(.blog-input),
  :deep(input) {
    width: 100%;
    height: 32px;
    font-size: 0.85rem;
    text-align: center;
    padding: 0 6px;
    border-radius: 6px;
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.style-module-toggles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.style-align-toggles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.style-align-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  svg {
    opacity: 0.75;
  }

  span {
    font-size: 0.72rem;
    font-weight: 500;
  }

  &.active {
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
    border-color: var(--accent);
    color: var(--accent);

    svg {
      opacity: 1;
    }
  }

  &:hover:not(.active) {
    border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
    color: var(--text-primary);
  }
}

.style-module-btn {
  padding: 8px 6px;
  font-size: 0.82rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-secondary));
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 600;
  }
}

.color-input {
  width: 100%;
  height: 38px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  cursor: pointer;

  &:hover {
    border-color: var(--accent);
  }

  &--inline {
    width: 22px;
    height: 22px;
    margin-left: auto;
    border-radius: 4px;
    flex-shrink: 0;
  }

  &--inline-row {
    width: 56px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 6px;
  }
}

.style-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0;
  border-radius: 8px;
  background: transparent;
  transition: all 0.2s;
  position: relative;
}

.style-switch-control {
  position: relative;
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  input[type='checkbox'] {
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    margin: 0;
    border: 2px solid var(--border);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    box-sizing: border-box;
    transition: all 0.15s;
    /* 纯视觉指示器：所有点击都交给 label 的 onSwitchClick 统一处理，
       避免直接点 checkbox 时原生 toggle 与 styleOptions 状态脱钩 */
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      inset: 2px;
      border-radius: 2px;
      background: var(--swatch, var(--accent));
      transform: scale(0);
      transition: transform 0.15s ease;
    }

    &:checked::after {
      transform: scale(1);
    }

    /* 按住时颜色块放大（不超过 checkbox 框内边界，内部可用区约 1.4 倍） */
    &.is-pressed::after {
      transform: scale(0.5);
    }

    &.is-pressed:checked::after {
      transform: scale(1.3);
    }
  }
}

.color-input-hidden {
  /* 与 checkbox 内部颜色块对齐：边框 2px + ::after inset 2px = 4px 偏移，颜色块 10×10 */
  position: absolute;
  left: 4px;
  top: 4px;
  width: 10px;
  height: 10px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 2px;
  background: var(--swatch, var(--accent));
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
  cursor: pointer;

  &.is-visible {
    opacity: 1;
    pointer-events: auto;
    z-index: 2;
  }

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }

  &::-moz-color-swatch {
    border: none;
    border-radius: 2px;
  }
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

// ── 响应式 ──
@media (max-width: 640px) {
  .style-row,
  .style-switches,
  .style-checkboxes,
  .style-badge-fields {
    grid-template-columns: 1fr;
  }

  .style-module-toggles {
    grid-template-columns: 1fr;
  }

  .style-orientation {
    grid-template-columns: 1fr;
  }

  .upload-zone {
    padding: 32px 16px;
  }
}
</style>
