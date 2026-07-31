<template>
  <BlogDialog
    :modelValue="true"
    :closeOnClickOverlay="false"
    :showClose="true"
    :title="$t('secretKey.title')"
    width="400px"
    @update:modelValue="handleClose"
  >
    <div class="secret-key-content">
      <p class="secret-key-desc">{{ $t('secretKey.description') }}</p>
      <BlogInput
        v-model="secretKey"
        type="password"
        :placeholder="$t('secretKey.placeholder')"
        @keyup.enter="handleConfirm"
      />
    </div>

    <template #footer>
      <div class="secret-key-footer">
        <Button size="small" @click="handleCancel">
          {{ $t('common.cancel') }}
        </Button>
        <Button type="primary" size="small" :disabled="!secretKey.trim()" @click="handleConfirm">
          {{ $t('common.confirm') }}
        </Button>
      </div>
    </template>
  </BlogDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'animal-island-vue'
import BlogDialog from './BlogDialog.vue'
import BlogInput from './BlogInput.vue'

interface Props {
  onConfirm: (secretKey: string) => void
  onCancel: () => void
}

const props = defineProps<Props>()

const secretKey = ref('')

function handleConfirm() {
  if (!secretKey.value.trim()) return
  props.onConfirm(secretKey.value.trim())
}

function handleCancel() {
  props.onCancel()
}

function handleClose() {
  // 点击关闭按钮或 ESC 时触发取消
  props.onCancel()
}
</script>

<style lang="less" scoped>
.secret-key-content {
  padding: 8px 0;
}

.secret-key-desc {
  margin: 0 0 16px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.secret-key-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
