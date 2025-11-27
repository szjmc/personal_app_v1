<template>
  <div class="express-container">
    <!-- 头部工具栏 -->
    <div class="express-header">
      <div class="header-left">
        <h1 class="page-title">快递管理</h1>
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索快递单号或描述..."
            class="search-input"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加快递
        </el-button>
        
        <el-button @click="refreshAllTracking" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新物流
        </el-button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <el-radio-group v-model="statusFilter" @change="handleFilterChange">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="pending">待发货</el-radio-button>
        <el-radio-button label="in_transit">运输中</el-radio-button>
        <el-radio-button label="delivered">已签收</el-radio-button>
        <el-radio-button label="exception">异常</el-radio-button>
      </el-radio-group>
      
      <el-select
        v-model="courierFilter"
        placeholder="选择快递公司"
        clearable
        @change="handleFilterChange"
        class="courier-select"
      >
        <el-option
          v-for="courier in courierList"
          :key="courier"
          :label="courier"
          :value="courier"
        />
      </el-select>
    </div>

    <!-- 快递列表 -->
    <div class="express-list">
      <div
        v-for="express in filteredExpressList"
        :key="express.id"
        class="express-card"
        @click="showTrackingDetail(express)"
      >
        <div class="card-header">
          <div class="express-info">
            <div class="courier-badge" :style="{ backgroundColor: getCourierColor(express.courier) }">
              {{ express.courier }}
            </div>
            <div class="tracking-number">{{ express.tracking_number }}</div>
          </div>
          
          <div class="status-indicator">
            <el-tag
              :type="getStatusType(express.current_status)"
              :icon="getStatusIcon(express.current_status)"
            >
              {{ getStatusText(express.current_status) }}
            </el-tag>
          </div>
        </div>
        
        <div class="express-description">
          {{ express.description || '无描述' }}
        </div>
        
        <div class="tracking-info">
          <div class="latest-location">
            <el-icon><Location /></el-icon>
            <span>{{ express.current_location || '暂无位置信息' }}</span>
          </div>
          
          <div class="delivery-time">
            <el-icon><Clock /></el-icon>
            <span v-if="express.estimated_delivery">
              预计 {{ formatTime(express.estimated_delivery) }}
            </span>
            <span v-else>预计送达时间未知</span>
          </div>
        </div>
        
        <!-- 物流进度条 -->
        <div class="tracking-progress">
          <el-steps :active="getProgressStep(express.current_status)" finish-status="success" size="small">
            <el-step title="已发货" />
            <el-step title="运输中" />
            <el-step title派送中" />
            <el-step title="已签收" />
          </el-steps>
        </div>
        
        <div class="card-actions">
          <el-button
            size="small"
            text
            @click.stop="refreshTracking(express.id)"
            :loading="express.refreshing"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          
          <el-dropdown @command="(command) => handleExpressAction(command, express)" trigger="click">
            <el-button size="small" text @click.stop>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item command="copy">
                  <el-icon><DocumentCopy /></el-icon>
                  复制单号
                </el-dropdown-item>
                <el-dropdown-item command="share">
                  <el-icon><Share /></el-icon>
                  分享
                </el-dropdown-item>
                <el-dropdown-item 
                  command="delete"
                  divided
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 空状态 -->
      <el-empty
        v-if="filteredExpressList.length === 0"
        description="暂无快递记录"
        :image-size="200"
      >
        <el-button type="primary" @click="showAddDialog">
          添加快递
        </el-button>
      </el-empty>
    </div>

    <!-- 添加/编辑快递弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="editingExpress ? '编辑快递' : '添加快递'"
      width="500px"
    >
      <el-form
        ref="expressForm"
        :model="expressForm"
        :rules="expressRules"
        label-width="80px"
      >
        <el-form-item label="快递单号" prop="tracking_number">
          <el-input
            v-model="expressForm.tracking_number"
            placeholder="请输入快递单号"
          />
        </el-form-item>
        
        <el-form-item label="快递公司" prop="courier">
          <el-select
            v-model="expressForm.courier"
            placeholder="选择快递公司"
            filterable
            allow-create
            @filter-method="searchCouriers"
          >
            <el-option
              v-for="courier in courierOptions"
              :key="courier"
              :label="courier"
              :value="courier"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="expressForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入快递描述（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelAdd">取消</el-button>
          <el-button 
            type="primary" 
            @click="saveExpress"
            :loading="saving"
          >
            {{ editingExpress ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 物流详情弹窗 -->
    <TrackingDetail
      v-model="trackingDialogVisible"
      :express="selectedExpress"
      @refresh="refreshTracking"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, Refresh, Location, Clock, MoreFilled,
  Edit, DocumentCopy, Share, Delete, Van, Box, 
  Truck, FinishedCircle, WarningFilled
} from '@element-plus/icons-vue'
import { expressApi, type Express } from '@/api/life'
import { formatTime } from '@/utils/format'
import TrackingDetail from '@/components/life/TrackingDetail.vue'

// 响应式数据
const searchQuery = ref('')
const statusFilter = ref('all')
const courierFilter = ref('')
const expressList = ref<Express[]>([])
const courierList = ref<string[]>([])
const courierOptions = ref<string[]>([])
const refreshing = ref(false)
const addDialogVisible = ref(false)
const trackingDialogVisible = ref(false)
const editingExpress = ref<Express | null>(null)
const selectedExpress = ref<Express | null>(null)
const saving = ref(false)

// 表单数据
const expressForm = ref({
  tracking_number: '',
  courier: '',
  description: ''
})

const expressRules = {
  tracking_number: [
    { required: true, message: '请输入快递单号', trigger: 'blur' }
  ],
  courier: [
    { required: true, message: '请选择快递公司', trigger: 'change' }
  ]
}

// 计算属性
const filteredExpressList = computed(() => {
  let filtered = expressList.value

  // 状态筛选
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(exp => 
      exp.current_status === statusFilter.value
    )
  }

  // 快递公司筛选
  if (courierFilter.value) {
    filtered = filtered.filter(exp => 
      exp.courier === courierFilter.value
    )
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(exp => 
      exp.tracking_number.toLowerCase().includes(query) ||
      (exp.description && exp.description.toLowerCase().includes(query))
    )
  }

  return filtered.sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
})

// 方法
const loadExpressList = async () => {
  try {
    const response = await expressApi.getList()
    expressList.value = response.data.results
    
    // 提取快递公司列表
    const couriers = [...new Set(expressList.value.map(exp => exp.courier))]
    courierList.value = couriers
    courierOptions.value = couriers
  } catch (error) {
    ElMessage.error('加载快递列表失败')
  }
}

const handleSearch = (query: string) => {
  searchQuery.value = query
}

const handleFilterChange = () => {
  // 筛选逻辑已在计算属性中处理
}

const showAddDialog = () => {
  editingExpress.value = null
  expressForm.value = {
    tracking_number: '',
    courier: '',
    description: ''
  }
  addDialogVisible.value = true
}

const showEditDialog = (express: Express) => {
  editingExpress.value = express
  expressForm.value = {
    tracking_number: express.tracking_number,
    courier: express.courier,
    description: express.description
  }
  addDialogVisible.value = true
}

const cancelAdd = () => {
  addDialogVisible.value = false
  editingExpress.value = null
}

const saveExpress = async () => {
  saving.value = true
  try {
    if (editingExpress.value) {
      // 更新快递
      await expressApi.update(editingExpress.value.id, expressForm.value)
      const index = expressList.value.findIndex(e => e.id === editingExpress.value!.id)
      if (index > -1) {
        expressList.value[index] = { ...expressList.value[index], ...expressForm.value }
      }
      ElMessage.success('快递信息更新成功')
    } else {
      // 添加快递
      const response = await expressApi.create(expressForm.value)
      expressList.value.unshift(response.data)
      ElMessage.success('快递添加成功')
    }
    
    addDialogVisible.value = false
  } catch (error) {
    ElMessage.error(editingExpress.value ? '更新失败' : '添加失败')
  } finally {
    saving.value = false
  }
}

const refreshTracking = async (expressId: number) => {
  const express = expressList.value.find(e => e.id === expressId)
  if (express) {
    express.refreshing = true
    try {
      await expressApi.refreshTracking(expressId)
      const response = await expressApi.getTracking(expressId)
      // 更新快递信息
      Object.assign(express, response.data)
      ElMessage.success('物流信息更新成功')
    } catch (error) {
      ElMessage.error('更新物流信息失败')
    } finally {
      express.refreshing = false
    }
  }
}

const refreshAllTracking = async () => {
  refreshing.value = true
  try {
    // 并发刷新所有快递
    const refreshPromises = expressList.value.map(exp => 
      expressApi.refreshTracking(exp.id).catch(() => {})
    )
    await Promise.allSettled(refreshPromises)
    
    // 重新加载列表
    await loadExpressList()
    ElMessage.success('物流信息已更新')
  } catch (error) {
    ElMessage.error('批量更新失败')
  } finally {
    refreshing.value = false
  }
}

const showTrackingDetail = (express: Express) => {
  selectedExpress.value = express
  trackingDialogVisible.value = true
}

const handleExpressAction = async (command: string, express: Express) => {
  switch (command) {
    case 'edit':
      showEditDialog(express)
      break
    case 'copy':
      navigator.clipboard.writeText(express.tracking_number).then(() => {
        ElMessage.success('单号已复制到剪贴板')
      })
      break
    case 'share':
      ElMessage.info('分享功能开发中')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这个快递记录吗？', '确认删除', {
          type: 'warning'
        })
        await expressApi.delete(express.id)
        expressList.value = expressList.value.filter(e => e.id !== express.id)
        ElMessage.success('删除成功')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
      break
  }
}

const searchCouriers = (query: string) => {
  // 模拟搜索快递公司
  if (query) {
    courierOptions.value = ['顺丰速运', '圆通速递', '中通快递', '韵达速递', '申通快递']
      .filter(courier => courier.includes(query))
  } else {
    courierOptions.value = courierList.value
  }
}

const getCourierColor = (courier: string) => {
  const colors: Record<string, string> = {
    '顺丰速运': '#e74c3c',
    '圆通速递': '#3498db',
    '中通快递': '#f39c12',
    '韵达速递': '#9b59b6',
    '申通快递': '#2ecc71'
  }
  return colors[courier] || '#95a5a6'
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
  const icons: Record<string, any> = {
    'pending': Box,
    'in_transit': Truck,
    'out_for_delivery': Van,
    'delivered': FinishedCircle,
    'exception': WarningFilled
  }
  return icons[status] || Box
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

const getProgressStep = (status: string) => {
  const steps: Record<string, number> = {
    'pending': 0,
    'in_transit': 1,
    'out_for_delivery': 2,
    'delivered': 3,
    'exception': 1
  }
  return steps[status] || 0
}

// 生命周期
onMounted(() => {
  loadExpressList()
})
</script>

<style lang="scss" scoped>
.express-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.express-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .search-box {
      flex: 1;
      max-width: 400px;
      
      .search-input {
        .el-input__inner {
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          
          &:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
        }
      }
    }
  }
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  
  .courier-select {
    width: 200px;
  }
}

.express-list {
  flex: 1;
  overflow-y: auto;
  
  .express-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .express-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .courier-badge {
          padding: 4px 8px;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }
        
        .tracking-number {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
      }
    }
    
    .express-description {
      color: var(--text-secondary);
      margin-bottom: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .tracking-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      
      .latest-location, .delivery-time {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-secondary);
        
        .el-icon {
          font-size: 14px;
        }
      }
    }
    
    .tracking-progress {
      margin-bottom: 12px;
      
      :deep(.el-steps) {
        .el-step__title {
          font-size: 12px;
        }
      }
    }
    
    .card-actions {
      display: flex;
      justify-content: flex-end;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &:hover .card-actions {
      opacity: 1;
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
  .express-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    
    .header-left {
      flex-direction: column;
      gap: 12px;
      
      .search-box {
        max-width: none;
      }
    }
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    
    .courier-select {
      width: 100%;
    }
  }
  
  .tracking-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .express-card .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>