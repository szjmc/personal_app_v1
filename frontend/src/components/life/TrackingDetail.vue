<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${express?.courier} - ${express?.tracking_number}`"
    width="700px"
    top="5vh"
  >
    <div v-if="express" class="tracking-detail">
      <!-- 快递概览 -->
      <div class="express-overview">
        <div class="overview-item">
          <div class="item-label">快递公司</div>
          <div class="item-value">{{ express.courier }}</div>
        </div>
        <div class="overview-item">
          <div class="item-label">快递单号</div>
          <div class="item-value tracking-number">
            {{ express.tracking_number }}
            <el-button
              size="small"
              text
              @click="copyTrackingNumber"
            >
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="overview-item">
          <div class="item-label">当前状态</div>
          <div class="item-value">
            <el-tag
              :type="getStatusType(express.current_status)"
              :icon="getStatusIcon(express.current_status)"
            >
              {{ getStatusText(express.current_status) }}
            </el-tag>
          </div>
        </div>
        <div class="overview-item">
          <div class="item-label">预计送达</div>
          <div class="item-value">
            {{ express.estimated_delivery ? formatTime(express.estimated_delivery) : '暂无信息' }}
          </div>
        </div>
      </div>

      <!-- 物流时间线 -->
      <div class="tracking-timeline">
        <div class="timeline-header">
          <h3>物流信息</h3>
          <el-button
            size="small"
            @click="refreshTracking"
            :loading="refreshing"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        
        <div v-if="loading" class="timeline-loading">
          <el-skeleton :rows="5" animated />
        </div>
        
        <el-timeline
          v-else-if="trackingList.length > 0"
          class="tracking-timeline-list"
        >
          <el-timeline-item
            v-for="(track, index) in trackingList"
            :key="index"
            :type="index === 0 ? 'primary' : 'info'"
            :icon="index === 0 ? FinishedCircle : Clock"
            :size="index === 0 ? 'large' : 'normal'"
            placement="top"
          >
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-time">{{ formatTimeShort(track.time) }}</span>
                <span class="timeline-location">{{ track.location }}</span>
              </div>
              <div class="timeline-description">{{ track.description }}</div>
              <div class="timeline-status">{{ track.status }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
        
        <el-empty
          v-else
          description="暂无物流信息"
          :image-size="100"
        />
      </div>

      <!-- 异常提示 -->
      <el-alert
        v-if="express.current_status === 'exception'"
        title="物流异常"
        type="error"
        :closable="false"
        class="exception-alert"
      >
        <template #default>
          当前快递状态异常，请及时联系快递公司客服处理。
          <el-button type="text" @click="contactCourier">联系客服</el-button>
        </template>
      </el-alert>

      <!-- 预计送达时间提醒 -->
      <el-alert
        v-if="express.estimated_delivery && isExpiringSoon"
        title="即将送达"
        type="success"
        :closable="false"
        class="delivery-alert"
      >
        预计将在 {{ formatTimeShort(express.estimated_delivery) }} 送达，请注意查收。
      </el-alert>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
        <el-button type="primary" @click="shareTracking">
          <el-icon><Share /></el-icon>
          分享物流
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy, Refresh, FinishedCircle, Clock, Share
} from '@element-plus/icons-vue'
import { expressApi, type Express, type TrackingInfo } from '@/api/life'
import { formatTime, formatTimeShort } from '@/utils/format'

const props = defineProps<{
  modelValue: boolean
  express?: Express | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  refresh: [expressId: number]
}>()

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const trackingList = ref<TrackingInfo[]>([])

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isExpiringSoon = computed(() => {
  if (!props.express?.estimated_delivery) return false
  
  const deliveryTime = new Date(props.express.estimated_delivery).getTime()
  const now = new Date().getTime()
  const hoursToDelivery = (deliveryTime - now) / (1000 * 60 * 60)
  
  return hoursToDelivery > 0 && hoursToDelivery <= 24
})

// 方法
const loadTrackingInfo = async () => {
  if (!props.express?.id) return
  
  loading.value = true
  try {
    const response = await expressApi.getTracking(props.express.id)
    trackingList.value = response.data.tracking_info || []
  } catch (error) {
    ElMessage.error('加载物流信息失败')
    trackingList.value = []
  } finally {
    loading.value = false
  }
}

const refreshTracking = async () => {
  if (!props.express?.id) return
  
  refreshing.value = true
  try {
    await expressApi.refreshTracking(props.express.id)
    await loadTrackingInfo()
    emit('refresh', props.express.id)
    ElMessage.success('物流信息已更新')
  } catch (error) {
    ElMessage.error('更新物流信息失败')
  } finally {
    refreshing.value = false
  }
}

const copyTrackingNumber = () => {
  if (props.express?.tracking_number) {
    navigator.clipboard.writeText(props.express.tracking_number).then(() => {
      ElMessage.success('单号已复制到剪贴板')
    })
  }
}

const shareTracking = () => {
  if (!props.express) return
  
  const shareText = `【${props.express.courier}】${props.express.tracking_number}\n${props.express.description || ''}`
  
  if (navigator.share) {
    navigator.share({
      title: '物流信息',
      text: shareText
    }).catch(() => {})
  } else {
    // 复制到剪贴板作为替代
    navigator.clipboard.writeText(shareText).then(() => {
      ElMessage.success('物流信息已复制到剪贴板')
    })
  }
}

const contactCourier = () => {
  // 这里可以根据快递公司提供不同的联系方式
  const courierPhones: Record<string, string> = {
    '顺丰速运': '95338',
    '圆通速递': '95554',
    '中通快递': '95311',
    '韵达速递': '95546',
    '申通快递': '95543'
  }
  
  const phone = courierPhones[props.express?.courier || '']
  if (phone) {
    ElMessage.info(`${props.express?.courier}客服电话：${phone}`)
  } else {
    ElMessage.info('请联系快递公司官方客服')
  }
}

const closeDialog = () => {
  dialogVisible.value = false
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'pending': 'info',
    'in_transit': 'warning',
    'out_for_delivery': 'primary',
    'delivered': 'success',
    'exception': 'danger'
  }
  return types[status] || 'info'
}

const getStatusIcon = (status: string) => {
  // 这里可以根据状态返回不同的图标
  return FinishedCircle
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'pending': '待发货',
    'in_transit': '运输中',
    'out_for_delivery': '派送中',
    'delivered': '已签收',
    'exception': '异常'
  }
  return texts[status] || '未知状态'
}

// 监听弹窗打开，加载物流信息
watch(() => props.modelValue, (visible) => {
  if (visible && props.express) {
    loadTrackingInfo()
  }
})

watch(() => props.express, (newExpress) => {
  if (newExpress && props.modelValue) {
    loadTrackingInfo()
  }
})
</script>

<style lang="scss" scoped>
.tracking-detail {
  .express-overview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    
    .overview-item {
      .item-label {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-bottom: 4px;
      }
      
      .item-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        
        &.tracking-number {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Monaco', 'Menlo', monospace;
        }
      }
    }
  }
  
  .tracking-timeline {
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--text-primary);
      }
    }
    
    .timeline-loading {
      padding: 20px;
    }
    
    .tracking-timeline-list {
      max-height: 400px;
      overflow-y: auto;
      padding-right: 12px;
      
      .timeline-content {
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          
          .timeline-time {
            font-size: 13px;
            color: var(--primary-color);
            font-weight: 600;
          }
          
          .timeline-location {
            font-size: 13px;
            color: var(--text-secondary);
            font-weight: 600;
          }
        }
        
        .timeline-description {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.4;
          margin-bottom: 4px;
        }
        
        .timeline-status {
          font-size: 12px;
          color: var(--text-tertiary);
        }
      }
    }
  }
  
  .exception-alert {
    margin-top: 20px;
    
    .el-button {
      padding: 0;
      height: auto;
      font-size: 14px;
    }
  }
  
  .delivery-alert {
    margin-top: 20px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 时间轴自定义样式
:deep(.el-timeline-item__tail) {
  border-color: var(--glass-border);
}

:deep(.el-timeline-item__node--primary) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-timeline-item__node--info) {
  background: var(--glass-border);
  border-color: var(--glass-border);
}

// 滚动条样式
.tracking-timeline-list::-webkit-scrollbar {
  width: 6px;
}

.tracking-timeline-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.tracking-timeline-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .express-overview {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .timeline-header {
    .timeline-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }
}
</style>