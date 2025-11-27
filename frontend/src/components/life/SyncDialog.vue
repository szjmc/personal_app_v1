<template>
  <el-dialog
    v-model="dialogVisible"
    title="同步账单"
    width="500px"
  >
    <div class="sync-container">
      <!-- 平台选择 -->
      <div class="platform-section">
        <h3>选择同步平台</h3>
        <div class="platform-cards">
          <div
            v-for="platform in platforms"
            :key="platform.key"
            class="platform-card"
            :class="{ active: selectedPlatform === platform.key }"
            @click="selectPlatform(platform.key)"
          >
            <div class="platform-icon" :style="{ color: platform.color }">
              <component :is="platform.icon" />
            </div>
            <div class="platform-info">
              <div class="platform-name">{{ platform.name }}</div>
              <div class="platform-desc">{{ platform.description }}</div>
            </div>
            <div class="platform-status">
              <el-tag
                :type="getStatusType(platform.status)"
                size="small"
              >
                {{ getStatusText(platform.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 同步设置 -->
      <div class="sync-settings">
        <h3>同步设置</h3>
        
        <el-form :model="syncSettings" label-width="100px">
          <el-form-item label="同步范围">
            <el-checkbox-group v-model="syncSettings.dateRange">
              <el-checkbox label="current_month">本月</el-checkbox>
              <el-checkbox label="last_month">上月</el-checkbox>
              <el-checkbox label="last_quarter">近3个月</el-checkbox>
              <el-checkbox label="custom">自定义</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item v-if="syncSettings.dateRange.includes('custom')" label="自定义时间">
            <el-date-picker
              v-model="syncSettings.customRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>
          
          <el-form-item label="数据类型">
            <el-checkbox-group v-model="syncSettings.dataTypes">
              <el-checkbox label="payments">支付记录</el-checkbox>
              <el-checkbox label="transfers">转账记录</el-checkbox>
              <el-checkbox label="refunds">退款记录</el-checkbox>
              <el-checkbox label="recharges">充值记录</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item label="重复处理">
            <el-radio-group v-model="syncSettings.duplicateHandling">
              <el-radio label="skip">跳过重复</el-radio>
              <el-radio label="update">更新已有</el-radio>
              <el-radio label="create">创建新记录</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <!-- 同步历史 -->
      <div class="sync-history">
        <h3>最近同步</h3>
        <div class="history-list">
          <div
            v-for="(record, index) in syncHistory"
            :key="index"
            class="history-item"
          >
            <div class="history-info">
              <div class="history-platform">{{ record.platform }}</div>
              <div class="history-time">{{ formatTimeShort(record.syncTime) }}</div>
              <div class="history-count">{{ record.recordCount }}条记录</div>
            </div>
            <div class="history-status">
              <el-tag
                :type="record.success ? 'success' : 'danger'"
                size="small"
              >
                {{ record.success ? '成功' : '失败' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button 
          type="primary" 
          @click="startSync"
          :loading="syncing"
          :disabled="!selectedPlatform"
        >
          开始同步
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CreditCard, Wallet, Iphone, Qq
} from '@element-plus/icons-vue'
import { financeApi } from '@/api/life'
import { formatTimeShort } from '@/utils/format'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  synced: [platform: string]
}>()

// 响应式数据
const selectedPlatform = ref('')
const syncing = ref(false)
const syncSettings = ref({
  dateRange: ['current_month'],
  customRange: null as [Date, Date] | null,
  dataTypes: ['payments'],
  duplicateHandling: 'skip'
})

// 平台配置
const platforms = ref([
  {
    key: 'alipay',
    name: '支付宝',
    description: '同步支付宝账单数据',
    icon: Wallet,
    color: '#1678FF',
    status: 'available'
  },
  {
    key: 'wechat',
    name: '微信支付',
    description: '同步微信支付账单',
    icon: Qq,
    color: '#07C160',
    status: 'available'
  },
  {
    key: 'bank',
    name: '银行卡',
    description: '同步银行账户流水',
    icon: CreditCard,
    color: '#FF6B6B',
    status: 'unavailable'
  },
  {
    key: 'apple',
    name: 'Apple Pay',
    description: '同步Apple Pay消费记录',
    icon: Iphone,
    color: '#000000',
    status: 'coming_soon'
  }
])

// 同步历史
const syncHistory = ref([
  {
    platform: '支付宝',
    syncTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    recordCount: 156,
    success: true
  },
  {
    platform: '微信支付',
    syncTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    recordCount: 89,
    success: false
  }
])

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const selectPlatform = (platform: string) => {
  const platformConfig = platforms.value.find(p => p.key === platform)
  if (platformConfig) {
    if (platformConfig.status === 'unavailable') {
      ElMessage.warning('该平台暂不支持同步')
      return
    }
    
    if (platformConfig.status === 'coming_soon') {
      ElMessage.info('该平台即将支持，敬请期待')
      return
    }
    
    selectedPlatform.value = platform
  }
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'available': 'success',
    'unavailable': 'danger',
    'coming_soon': 'warning'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'available': '支持',
    'unavailable': '不支持',
    'coming_soon': '即将支持'
  }
  return texts[status] || '未知'
}

const startSync = async () => {
  if (!selectedPlatform.value) {
    ElMessage.warning('请选择同步平台')
    return
  }

  // 验证同步设置
  if (syncSettings.value.dateRange.length === 0) {
    ElMessage.warning('请选择同步时间范围')
    return
  }

  if (syncSettings.value.dataTypes.length === 0) {
    ElMessage.warning('请选择要同步的数据类型')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要同步${getPlatformName(selectedPlatform.value)}账单吗？\n同步过程可能需要几分钟时间。`,
      '确认同步',
      {
        type: 'warning',
        confirmButtonText: '开始同步',
        cancelButtonText: '取消'
      }
    )

    syncing.value = true
    
    // 调用同步API
    await financeApi.syncBills(selectedPlatform.value as 'alipay' | 'wechat')
    
    // 模拟同步过程
    await simulateSyncProcess()
    
    ElMessage.success('账单同步成功')
    emit('synced', selectedPlatform.value)
    closeDialog()
    
  } catch (error) {
    ElMessage.error('同步失败，请重试')
  } finally {
    syncing.value = false
  }
}

const simulateSyncProcess = async () => {
  // 模拟同步进度
  const steps = ['连接平台...', '获取授权...', '下载账单...', '解析数据...', '保存记录...']
  
  for (const step of steps) {
    ElMessage.info(step)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

const getPlatformName = (key: string) => {
  const platform = platforms.value.find(p => p.key === key)
  return platform?.name || key
}

const closeDialog = () => {
  dialogVisible.value = false
  selectedPlatform.value = ''
  syncSettings.value = {
    dateRange: ['current_month'],
    customRange: null,
    dataTypes: ['payments'],
    duplicateHandling: 'skip'
  }
}
</script>

<style lang="scss" scoped>
.sync-container {
  .platform-section {
    margin-bottom: 24px;
    
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: var(--text-primary);
    }
    
    .platform-cards {
      .platform-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.05);
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        &.active {
          border-color: var(--primary-color);
          background: rgba(59, 130, 246, 0.1);
        }
        
        .platform-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .platform-info {
          flex: 1;
          
          .platform-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
          }
          
          .platform-desc {
            font-size: 14px;
            color: var(--text-secondary);
          }
        }
        
        .platform-status {
          .el-tag {
            border-radius: 12px;
          }
        }
      }
    }
  }
  
  .sync-settings {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: var(--text-primary);
    }
    
    :deep(.el-form-item__label) {
      color: var(--text-secondary);
      font-weight: 500;
    }
  }
  
  .sync-history {
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: var(--text-primary);
    }
    
    .history-list {
      .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--glass-border);
        
        &:last-child {
          border-bottom: none;
        }
        
        .history-info {
          display: flex;
          gap: 16px;
          align-items: center;
          
          .history-platform {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
          }
          
          .history-time {
            font-size: 12px;
            color: var(--text-secondary);
          }
          
          .history-count {
            font-size: 12px;
            color: var(--text-tertiary);
          }
        }
        
        .history-status {
          .el-tag {
            border-radius: 12px;
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .platform-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
    
    .platform-info {
      text-align: center;
    }
  }
  
  .history-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    
    .history-info {
      justify-content: space-between;
    }
  }
}
</style>