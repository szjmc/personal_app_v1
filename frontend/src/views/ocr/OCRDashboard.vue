<template>
  <div class="ocr-dashboard">
    <!-- 头部操作栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h2>OCR文字识别</h2>
        <p class="subtitle">智能图片文字提取与识别</p>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="showUploadDialog = true"
          icon="Upload"
        >
          上传图片
        </el-button>
        <el-button 
          @click="showBatchDialog = true"
          icon="Operation"
        >
          批量处理
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon primary">
          <el-icon><Picture /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.total }}</h3>
          <p>总识别数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.completed }}</h3>
          <p>成功识别</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <el-icon><Loading /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.processing }}</h3>
          <p>处理中</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.failed }}</h3>
          <p>识别失败</p>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-select 
          v-model="filters.status" 
          placeholder="状态筛选"
          clearable
          @change="loadImages"
        >
          <el-option label="全部" value="" />
          <el-option label="已完成" value="completed" />
          <el-option label="处理中" value="processing" />
          <el-option label="识别失败" value="failed" />
          <el-option label="待识别" value="pending" />
        </el-select>
        
        <el-input
          v-model="filters.keyword"
          placeholder="搜索标题或文本内容"
          prefix-icon="Search"
          @input="debounceSearch"
        />
      </div>
      
      <div class="filter-right">
        <el-button-group>
          <el-button 
            :type="viewMode === 'grid' ? 'primary' : ''"
            @click="viewMode = 'grid'"
            icon="Grid"
          >
            网格
          </el-button>
          <el-button 
            :type="viewMode === 'list' ? 'primary' : ''"
            @click="viewMode = 'list'"
            icon="List"
          >
            列表
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area" v-loading="loading">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="grid-view">
        <div 
          v-for="item in imageList" 
          :key="item.id"
          class="image-card"
          @click="viewImage(item)"
        >
          <div class="card-image">
            <img :src="item.image_url" :alt="item.title" />
            <div class="image-overlay">
              <div class="status-badge" :class="item.status">
                {{ getStatusText(item.status) }}
              </div>
            </div>
          </div>
          
          <div class="card-content">
            <h4 class="card-title" :title="item.title">{{ item.title }}</h4>
            <p class="card-text" :title="item.extracted_text">
              {{ item.extracted_text ? item.extracted_text.substring(0, 50) + '...' : '暂无文本内容' }}
            </p>
            <div class="card-meta">
              <span class="confidence" v-if="item.confidence_score">
                置信度: {{ (item.confidence_score * 100).toFixed(1) }}%
              </span>
              <span class="time">{{ formatTime(item.created_at) }}</span>
            </div>
          </div>
          
          <div class="card-actions">
            <el-button 
              size="small" 
              @click.stop="viewImage(item)"
              icon="View"
            >
              查看
            </el-button>
            <el-button 
              v-if="item.status === 'completed'"
              size="small" 
              @click.stop="exportText(item)"
              icon="Download"
            >
              导出
            </el-button>
            <el-dropdown @command="(cmd) => handleAction(cmd, item)">
              <el-button size="small" icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="reprocess" v-if="item.status === 'failed'">
                    重新识别
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">编辑信息</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-view">
        <el-table :data="imageList" stripe>
          <el-table-column label="预览" width="100">
            <template #default="{ row }">
              <img :src="row.image_url" class="table-image" />
            </template>
          </el-table-column>
          
          <el-table-column prop="title" label="标题" />
          
          <el-table-column label="识别文本" min-width="200">
            <template #default="{ row }">
              <span :title="row.extracted_text">
                {{ row.extracted_text ? row.extracted_text.substring(0, 100) + '...' : '暂无内容' }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="置信度" width="100">
            <template #default="{ row }">
              <span v-if="row.confidence_score">
                {{ (row.confidence_score * 100).toFixed(1) }}%
              </span>
            </template>
          </el-table-column>
          
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button 
                size="small" 
                @click="viewImage(row)"
                icon="View"
              />
              <el-dropdown @command="(cmd) => handleAction(cmd, row)">
                <el-button size="small" icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="reprocess" v-if="row.status === 'failed'">
                      重新识别
                    </el-dropdown-item>
                    <el-dropdown-item command="export" v-if="row.status === 'completed'">
                      导出文本
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 上传对话框 -->
    <OCRUploadDialog 
      v-model="showUploadDialog"
      @success="handleUploadSuccess"
    />

    <!-- 批量处理对话框 -->
    <BatchProcessDialog 
      v-model="showBatchDialog"
      :images="imageList"
      @success="handleBatchSuccess"
    />

    <!-- 图片查看器 -->
    <ImageViewer 
      v-model="showViewer"
      :image="selectedImage"
      @update="handleImageUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ocrApi } from '@/api/ocr'
import { debounce } from 'lodash-es'
import OCRUploadDialog from '@/components/ocr/OCRUploadDialog.vue'
import BatchProcessDialog from '@/components/ocr/BatchProcessDialog.vue'
import ImageViewer from '@/components/ocr/ImageViewer.vue'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const loading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const showUploadDialog = ref(false)
const showBatchDialog = ref(false)
const showViewer = ref(false)
const selectedImage = ref(null)
const imageList = ref([])

const filters = reactive({
  status: '',
  keyword: ''
})

const statistics = computed(() => {
  const total = imageList.value.length
  const completed = imageList.value.filter(item => item.status === 'completed').length
  const processing = imageList.value.filter(item => item.status === 'processing').length
  const failed = imageList.value.filter(item => item.status === 'failed').length
  
  return { total, completed, processing, failed }
})

const loadImages = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.status) params.status = filters.status
    
    const response = await ocrApi.getImages(params)
    imageList.value = response.data.results || response.data
  } catch (error) {
    ElMessage.error('加载图片列表失败')
  } finally {
    loading.value = false
  }
}

const debounceSearch = debounce(() => {
  // 实现搜索逻辑
  loadImages()
}, 300)

const getStatusText = (status: string) => {
  const statusMap = {
    pending: '待识别',
    processing: '识别中',
    completed: '已完成',
    failed: '识别失败'
  }
  return statusMap[status] || status
}

const getStatusType = (status: string) => {
  const typeMap = {
    pending: '',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return typeMap[status] || ''
}

const formatTime = (time: string) => {
  return formatDistanceToNow(new Date(time), { 
    addSuffix: true, 
    locale: zhCN 
  })
}

const viewImage = (image: any) => {
  selectedImage.value = image
  showViewer.value = true
}

const exportText = async (image: any) => {
  try {
    const response = await ocrApi.exportText(image.id, 'txt')
    const blob = new Blob([response.data], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${image.title}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('文本导出成功')
  } catch (error) {
    ElMessage.error('文本导出失败')
  }
}

const handleAction = async (action: string, image: any) => {
  switch (action) {
    case 'reprocess':
      try {
        await ocrApi.processImage(image.id)
        ElMessage.success('重新识别已提交')
        loadImages()
      } catch (error) {
        ElMessage.error('重新识别失败')
      }
      break
    case 'edit':
      // 实现编辑逻辑
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这个识别记录吗？', '确认删除', {
          type: 'warning'
        })
        await ocrApi.deleteImage(image.id)
        ElMessage.success('删除成功')
        loadImages()
      } catch (error) {
        // 用户取消删除
      }
      break
  }
}

const handleUploadSuccess = () => {
  loadImages()
  ElMessage.success('图片上传成功')
}

const handleBatchSuccess = () => {
  loadImages()
  ElMessage.success('批量处理完成')
}

const handleImageUpdate = () => {
  loadImages()
}

onMounted(() => {
  loadImages()
})
</script>

<style scoped>
.ocr-dashboard {
  padding: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.subtitle {
  margin: 4px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.stat-content h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.stat-content p {
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filter-left {
  display: flex;
  gap: 12px;
  flex: 1;
}

.filter-left .el-select {
  width: 150px;
}

.filter-left .el-input {
  max-width: 300px;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.image-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background: #67c23a;
  color: white;
}

.status-badge.processing {
  background: #e6a23c;
  color: white;
}

.status-badge.failed {
  background: #f56c6c;
  color: white;
}

.status-badge.pending {
  background: #909399;
  color: white;
}

.card-content {
  padding: 16px;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-text {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.card-actions {
  display: flex;
  padding: 0 16px 16px;
  gap: 8px;
}

.table-image {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.list-view {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}
</style>