<template>
  <div class="skeleton-screen" :class="themeClass">
    <!-- 卡片骨架屏 -->
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-avatar" :class="avatarClass"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-description"></div>
        <div class="skeleton-meta">
          <div class="skeleton-tag"></div>
          <div class="skeleton-tag"></div>
        </div>
      </div>
    </div>

    <!-- 列表骨架屏 -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="i in count" :key="i" class="skeleton-list-item">
        <div class="skeleton-list-avatar" :class="avatarClass"></div>
        <div class="skeleton-list-content">
          <div class="skeleton-list-title"></div>
          <div class="skeleton-list-description"></div>
        </div>
      </div>
    </div>

    <!-- 表格骨架屏 -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="i in columns" :key="i" class="skeleton-table-th"></div>
      </div>
      <div v-for="row in rows" :key="row" class="skeleton-table-row">
        <div v-for="i in columns" :key="i" class="skeleton-table-td"></div>
      </div>
    </div>

    <!-- 仪表盘骨架屏 -->
    <div v-else-if="type === 'dashboard'" class="skeleton-dashboard">
      <div class="skeleton-stats-grid">
        <div v-for="i in 4" :key="i" class="skeleton-stat-card">
          <div class="skeleton-stat-icon"></div>
          <div class="skeleton-stat-content">
            <div class="skeleton-stat-value"></div>
            <div class="skeleton-stat-title"></div>
          </div>
        </div>
      </div>
      
      <div class="skeleton-content-grid">
        <div class="skeleton-card-large">
          <div class="skeleton-card-header"></div>
          <div class="skeleton-card-items">
            <div v-for="i in 3" :key="i" class="skeleton-list-item-small"></div>
          </div>
        </div>
        <div class="skeleton-card-large">
          <div class="skeleton-card-header"></div>
          <div class="skeleton-card-items">
            <div v-for="i in 2" :key="i" class="skeleton-list-item-small"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表单骨架屏 -->
    <div v-else-if="type === 'form'" class="skeleton-form">
      <div v-for="i in fieldCount" :key="i" class="skeleton-form-field">
        <div class="skeleton-form-label"></div>
        <div class="skeleton-form-input"></div>
      </div>
      <div class="skeleton-form-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button secondary"></div>
      </div>
    </div>

    <!-- 图表骨架屏 -->
    <div v-else-if="type === 'chart'" class="skeleton-chart">
      <div class="skeleton-chart-header">
        <div class="skeleton-chart-title"></div>
        <div class="skeleton-chart-legend">
          <div v-for="i in 3" :key="i" class="skeleton-chart-legend-item"></div>
        </div>
      </div>
      <div class="skeleton-chart-content">
        <div class="skeleton-chart-bars">
          <div v-for="i in 8" :key="i" 
               class="skeleton-chart-bar" 
               :style="{ height: Math.random() * 80 + 20 + '%' }">
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义骨架屏 -->
    <div v-else class="skeleton-custom">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'card' | 'list' | 'table' | 'dashboard' | 'form' | 'chart' | 'custom'
  theme?: 'light' | 'dark' | 'glass'
  count?: number
  rows?: number
  columns?: number
  fieldCount?: number
  avatar?: boolean
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card',
  theme: 'glass',
  count: 3,
  rows: 5,
  columns: 4,
  fieldCount: 5,
  avatar: true,
  animated: true
})

const themeClass = computed(() => `skeleton-${props.theme}`)
const avatarClass = computed(() => !props.avatar ? 'hidden' : '')
</script>

<style lang="scss" scoped>
@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-screen {
  width: 100%;
  
  .skeleton-light {
    --skeleton-bg: #f5f5f5;
    --skeleton-shimmer: linear-gradient(90deg, #f5f5f5 25%, #e0e0e0 50%, #f5f5f5 75%);
  }

  .skeleton-dark {
    --skeleton-bg: rgba(255, 255, 255, 0.05);
    --skeleton-shimmer: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
  }

  .skeleton-glass {
    --skeleton-bg: rgba(255, 255, 255, 0.08);
    --skeleton-shimmer: linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 75%);
  }

  .skeleton-element {
    background: var(--skeleton-bg);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--skeleton-shimmer);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
    }
  }

  // 卡片骨架屏
  .skeleton-card {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;

    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      flex-shrink: 0;
      @extend .skeleton-element;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .skeleton-title {
        height: 20px;
        width: 60%;
        @extend .skeleton-element;
      }

      .skeleton-description {
        height: 16px;
        width: 80%;
        @extend .skeleton-element;
      }

      .skeleton-meta {
        display: flex;
        gap: 8px;

        .skeleton-tag {
          height: 20px;
          width: 60px;
          border-radius: 10px;
          @extend .skeleton-element;
        }
      }
    }
  }

  // 列表骨架屏
  .skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;

      .skeleton-list-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
        @extend .skeleton-element;
      }

      .skeleton-list-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .skeleton-list-title {
          height: 16px;
          width: 70%;
          @extend .skeleton-element;
        }

        .skeleton-list-description {
          height: 14px;
          width: 50%;
          @extend .skeleton-element;
        }
      }
    }
  }

  // 表格骨架屏
  .skeleton-table {
    .skeleton-table-header {
      display: grid;
      grid-template-columns: repeat(var(--columns, 4), 1fr);
      gap: 16px;
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .skeleton-table-th {
        height: 16px;
        @extend .skeleton-element;
      }
    }

    .skeleton-table-row {
      display: grid;
      grid-template-columns: repeat(var(--columns, 4), 1fr);
      gap: 16px;
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);

      .skeleton-table-td {
        height: 14px;
        @extend .skeleton-element;
      }
    }
  }

  // 仪表盘骨架屏
  .skeleton-dashboard {
    .skeleton-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;

      .skeleton-stat-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;

        .skeleton-stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          @extend .skeleton-element;
        }

        .skeleton-stat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .skeleton-stat-value {
            height: 24px;
            width: 40%;
            @extend .skeleton-element;
          }

          .skeleton-stat-title {
            height: 14px;
            width: 60%;
            @extend .skeleton-element;
          }
        }
      }
    }

    .skeleton-content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @include respond-to(md) {
        grid-template-columns: 1fr;
      }

      .skeleton-card-large {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 20px;

        .skeleton-card-header {
          height: 20px;
          width: 30%;
          margin-bottom: 16px;
          @extend .skeleton-element;
        }

        .skeleton-card-items {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .skeleton-list-item-small {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;

            .skeleton-small-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              @extend .skeleton-element;
            }

            .skeleton-small-line {
              flex: 1;
              height: 14px;
              @extend .skeleton-element;
            }
          }
        }
      }
    }
  }

  // 表单骨架屏
  .skeleton-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;

    .skeleton-form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .skeleton-form-label {
        height: 14px;
        width: 20%;
        @extend .skeleton-element;
      }

      .skeleton-form-input {
        height: 40px;
        width: 100%;
        @extend .skeleton-element;
      }
    }

    .skeleton-form-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;

      .skeleton-button {
        height: 36px;
        width: 80px;
        border-radius: 6px;
        @extend .skeleton-element;

        &.secondary {
          width: 100px;
        }
      }
    }
  }

  // 图表骨架屏
  .skeleton-chart {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;

    .skeleton-chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .skeleton-chart-title {
        height: 20px;
        width: 150px;
        @extend .skeleton-element;
      }

      .skeleton-chart-legend {
        display: flex;
        gap: 16px;

        .skeleton-chart-legend-item {
          height: 12px;
          width: 40px;
          @extend .skeleton-element;
        }
      }
    }

    .skeleton-chart-content {
      height: 200px;

      .skeleton-chart-bars {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 100%;
        gap: 8px;

        .skeleton-chart-bar {
          flex: 1;
          min-height: 20px;
          border-radius: 4px 4px 0 0;
          @extend .skeleton-element;
        }
      }
    }
  }
}

// 响应式设计
@include respond-to(sm) {
  .skeleton-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .skeleton-content-grid {
    grid-template-columns: 1fr;
  }
}

// 动画控制
.skeleton-screen {
  &:not(.animated) {
    .skeleton-element::after {
      animation: none;
    }
  }
}

// 隐藏元素
.hidden {
  display: none !important;
}
</style>