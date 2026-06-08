<!-- 该组件为重写animal-island-vue的Time组件，为了能自适应卡片 -->
<template>
  <div class="responsive-time">
    <div class="responsive-time__date">
      <span class="responsive-time__weekday">{{ weekday }}</span>
      <span class="responsive-time__month-day">{{ monthDay }}</span>
    </div>
    <div class="responsive-time__clock">
      <span>{{ formattedHours }}</span>
      <span class="responsive-time__colon">:</span>
      <span>{{ formattedMinutes }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const currentTime = ref(new Date())
let intervalId: number | null = null

onMounted(() => {
  intervalId = window.setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})

const padZero = (num: number): string => {
  return num.toString().padStart(2, '0')
}

const weekday = computed(() => weekdays[currentTime.value.getDay()])
const monthDay = computed(() => `${months[currentTime.value.getMonth()]} ${currentTime.value.getDate()}`)
const formattedHours = computed(() => padZero(currentTime.value.getHours()))
const formattedMinutes = computed(() => padZero(currentTime.value.getMinutes()))
</script>

<style lang="less" scoped>
.responsive-time {
  display: inline-flex;
  gap: 20px;
  align-items: center;
  align-self: flex-start;
  width: fit-content;
  max-width: max-content;
  padding: 16px 36px;
  border: 3px solid #d4cfc3;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff, #f8f8f0);
  animation: time-fade-up 0.5s ease-out;
  transition: padding 0.2s;

  // 适应主题色
  background: linear-gradient(180deg, var(--bg-primary, #fff), var(--bg-secondary, #f8f8f0));
  border-color: var(--border, #d4cfc3);
}

.responsive-time__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 24px;
  border-right: 3px solid rgba(159, 146, 125, 0.35);
  transition: all 0.2;
}

.responsive-time__weekday {
  color: #6fba2c;
  font-weight: 900;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  transition: all 0.2;

  // 适应主题色
  color: var(--accent, #6fba2c);
}

.responsive-time__month-day {
  color: #8b7355;
  font-weight: 800;
  font-size: 22px;
  transition: all 0.2;

  // 适应主题色
  color: var(--text-secondary, #8b7355);
}

.responsive-time__clock {
  display: flex;
  align-items: center;
  color: #8b7355;
  font-weight: 900;
  font-size: 48px;
  letter-spacing: 2px;
  transition: all 0.2;

  // 适应主题色
  color: var(--text-secondary, #8b7355);
}

.responsive-time__colon {
  position: relative;
  top: -0.08em;
  margin: 0 1px;
  color: #8b7355;
  font-size: 48px;
  animation: time-blink 1s step-end infinite;
  transition: all 0.2;

  // 适应主题色
  color: var(--text-secondary, #8b7355);
}

@keyframes time-fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes time-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

// 响应式布局：宽度小于 1120px 时改为竖向布局
@media (max-width: 1120px) {
  .responsive-time {
    flex-direction: column;
    gap: 12px;
    padding: 20px 24px;
  }

  .responsive-time__date {
    padding-right: 0;
    padding-bottom: 12px;
    border-right: none;
    border-bottom: 3px solid rgba(159, 146, 125, 0.35);
  }

  .responsive-time__clock {
    font-size: 40px;
  }

  .responsive-time__colon {
    font-size: 40px;
  }
}
// 又改回原始布局
@media (max-width: 768px) {
  .responsive-time {
    flex-direction: row;
    gap: 20px;
    padding: 16px 36px;
  }

  .responsive-time__date {
    padding-right: 24px;
    padding-bottom: 0;
    border-right: 3px solid rgba(159, 146, 125, 0.35);
    border-bottom: none;
  }

  .responsive-time__clock {
    font-size: 48px;
  }

  .responsive-time__colon {
    font-size: 48px;
  }
}

// 更小的屏幕优化
@media (max-width: 464px) {
  .responsive-time {
    flex-direction: column;
    gap: 12px;
    padding: 20px 24px;
  }

  .responsive-time__date {
    padding-right: 0;
    padding-bottom: 12px;
    border-right: none;
    border-bottom: 3px solid rgba(159, 146, 125, 0.35);
  }

  .responsive-time {
    padding: 16px 20px;
  }

  .responsive-time__weekday {
    font-size: 12px;
    letter-spacing: 1px;
  }

  .responsive-time__month-day {
    font-size: 18px;
  }

  .responsive-time__clock {
    font-size: 36px;
    letter-spacing: 1px;
  }

  .responsive-time__colon {
    font-size: 36px;
  }
}
// 更小的屏幕优化
@media (max-width: 250px) {
  .responsive-time {
    padding: 8px 10px;
  }

  .responsive-time__date {
    padding-bottom: 6px;
  }

  .responsive-time__weekday {
    font-size: 10px;
    letter-spacing: 1px;
  }

  .responsive-time__month-day {
    font-size: 12px;
  }

  .responsive-time__clock {
    font-size: 20px;
    letter-spacing: 1px;
  }

  .responsive-time__colon {
    font-size: 20px;
  }
}

@media (max-width: 190px) {
  .responsive-time {
    padding: 4px 5px;
  }

  .responsive-time__date {
    padding-bottom: 4px;
  }
  
  .responsive-time__weekday {
    font-size: 6px;
    letter-spacing: 1px;
  }

  .responsive-time__month-day {
    font-size: 10px;
  }

  .responsive-time__clock {
    font-size: 10px;
    letter-spacing: 1px;
  }

  .responsive-time__colon {
    font-size: 10px;
  }
}
</style>
