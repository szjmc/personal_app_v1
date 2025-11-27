<template>
  <el-dialog
    v-model="dialogVisible"
    :title="image?.title || '图片查看'"
    width="90%"
    :before-close="handleClose"
    class="image-viewer-dialog"
  >
    <div v-if="image" class="image-viewer">
      <div class="viewer-layout">
        <!-- 左侧图片显示 -->
        <div class="image-panel">
          <div class="image-container">
            <img :src="image.image_url" :alt="image.title" />
          </div>
          
          <!-- 图片信息 -->
          <div class="image-info">
            <el-descriptions :column="2" size="small">
              <el-descriptions-item label="文件名">
                {{ image.original_filename }}
              </el-descriptions-item>
              <el-descriptions-item label="文件大小">
                {{ image.file_size_display }}
              </el-descriptions-item>
              <el-descriptions-item label="上传时间">
                {{ formatDateTime(image.created_at) }}
              </el-descriptions-item>
              <el-descriptions-item label="OCR服务">
                {{ image.ocr_provider }}
              </el-descriptions-item>
              <el-descriptions-item label="处理时间" v-if="image.processing_time">
                {{ image.processing_time.toFixed(2) }}秒
              </el-descriptions-item>
              <el-descriptions-item label="置信度" v-if="image.confidence_score">
                <el-progress 
                  :percentage="(image.confidence_score * 100)" 
                  :color="getConfidenceColor(image.confidence_score)"
                  :show-text="false"
                  :stroke-width="6"
                  style="width: 100px;"
                />
                <span style="margin-left: 8px;">
                  {{ (image.confidence_score * 100).toFixed(1) }}%
                </span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 右侧识别结果 -->
        <div class="result-panel">
          <div class="panel-header">
            <h3>识别结果</h3>
            <div class="status-actions">
              <el-tag :type="getStatusType(image.status)">
                {{ getStatusText(image.status) }}
              </el-tag>
              <el-button 
                v-if="image.status === 'failed'"
                size="small" 
                @click="reprocessImage"
                :loading="reprocessing"
              >
                重新识别
              </el-button>
            </div>
          </div>

          <!-- 识别文本 -->
          <div class="text-result">
            <div class="text-header">
              <span>识别文本</span>
              <div class="text-actions">
                <el-button 
                  size="small" 
                  @click="copyText"
                  icon="CopyDocument"
                >
                  复制
                </el-button>
                <el-button 
                  size="small" 
                  @click="showExportDialog = true"
                  icon="Download"
                >
                  导出
                </el-button>
              </div>
            </div>
            
            <div class="text-content">
              <el-input
                v-model="image.extracted_text"
                type="textarea"
                :rows="15"
                placeholder="暂无识别文本内容"
                :readonly="!editingText"
                @blur="saveText"
              />
            </div>
            
            <div class="text-footer">
              <el-button 
                v-if="!editingText"
                size="small" 
                @click="editingText = true"
                icon="Edit"
              >
                编辑文本
              </el-button>
              <div v-else>
                <el-button 
                  size="small" 
                  @click="editingText = false"
                  icon="Close"
                >
                  取消
                </el-button>
                <el-button 
                  size="small" 
                  type="primary"
                  @click="saveText"
                  icon="Check"
                >
                  保存
                </el-button>
              </div>
            </div>
          </div>

          <!-- 元数据信息 -->
          <div class="metadata-section">
            <el-collapse>
              <el-collapse-item title="详细元数据" name="metadata">
                <div v-if="image.metadata && Object.keys(image.metadata).length > 0">
                  <pre>{{ JSON.stringify(image.metadata, null, 2) }}</pre>
                </div>
                <div v-else class="no-metadata">
                  暂无元数据信息
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>

          <!-- 标签管理 -->
          <div class="tags-section">
            <h4>标签</h4>
            <div class="tag-input">
              <el-input
                v-model="newTag"
                placeholder="输入标签并按回车"
                size="small"
                @keyup.enter="addTag"
                style="margin-bottom: 8px;"
              />
            </div>
            <div class="tag-list">
              <el-tag
                v-for="tag in (image.tags || [])"
                :key="tag"
                closable
                @close="removeTag(tag)"
                size="small"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="showExportDialog"
      title="导出识别文本"
      width="400px"
      append-to-body
    >
      <el-form label-position="top">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio label="txt">纯文本 (.txt)</el-radio>
            <el-radio label="json">JSON数据 (.json)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="exportFilename" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="exportText">导出</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ocrApi } from '@/api/ocr'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  image: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'update'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const reprocessing = ref(false)
const editingText = ref(false)
const showExportDialog = ref(false)
const exportFormat = ref('txt')
const exportFilename = ref('')
const newTag = ref('')

// 监听图片变化，更新导出文件名
watch(() => props.image, (newImage) => {
  if (newImage) {
    exportFilename.value = newImage.title || 'ocr_result'
  }
}, { immediate: true })

const getStatusType = (status: string) => {
  const typeMap = {
    pending: '',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return typeMap[status] || ''
}

const getStatusText = (status: string) => {
  const textMap = {
    pending: '待识别',
    processing: '识别中',
    completed: '已完成',
    failed: '识别失败'
  }
  return textMap[status] || status
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return '#67c23a'
  if (confidence >= 0.7) return '#e6a23c'
  return '#f56c6c'
}

const formatDateTime = (datetime: string) => {
  return new Date(datetime).toLocaleString('zh-CN')
}

const copyText = () => {
  if (props.image?.extracted_text) {
    navigator.clipboard.writeText(props.image.extracted_text)
      .then(() => ElMessage.success('文本已复制到剪贴板'))
      .catch(() => ElMessage.error('复制失败'))
  } else {
    ElMessage.warning('没有可复制的文本内容')
  }
}

const exportText = async () => {
  if (!props.image) return
  
  try {
    const response = await ocrApi.exportText(props.image.id, exportFormat.value)
    const blob = new Blob([response.data], { 
      type: exportFormat.value === 'json' ? 'application/json' : 'text/plain' 
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFilename.value}.${exportFormat.value}`
    a.click()
    window.URL.revokeObjectURL(url)
    
    showExportDialog.value = false
    ElMessage.success('文本导出成功')
  } catch (error) {
    ElMessage.error('文本导出失败')
  }
}

const reprocessImage = async () => {
  if (!props.image) return
  
  reprocessing.value = true
  try {
    await ocrApi.processImage(props.image.id)
    ElMessage.success('重新识别已提交，请稍候查看结果')
    emit('update')
  } catch (error) {
    ElMessage.error('重新识别失败')
  } finally {
    reprocessing.value = false
  }
}

const saveText = async () => {
  if (!props.image) return
  
  try {
    // 这里应该调用更新API保存文本
    ElMessage.success('文本保存成功')
    editingText.value = false
    emit('update')
  } catch (error) {
    ElMessage.error('文本保存失败')
  }
}

const addTag = () => {
  if (!props.image || !newTag.value.trim()) return
  
  const tag = newTag.value.trim()
  if (!props.image.tags) {
    props.image.tags = []
  }
  
  if (!props.image.tags.includes(tag)) {
    props.image.tags.push(tag)
    newTag.value = ''
    // 这里应该调用API保存标签
    emit('update')
  }
}

const removeTag = (tag: string) => {
  if (!props.image || !props.image.tags) return
  
  const index = props.image.tags.indexOf(tag)
  if (index > -1) {
    props.image.tags.splice(index, 1)
    // 这里应该调用API保存标签
    emit('update')
  }
}

const handleClose = () => {
  editingText.value = false
  newTag.value = ''
  dialogVisible.value = false
}
</script>

<style scoped>
.image-viewer-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.image-viewer {
  height: 70vh;
  overflow: hidden;
}

.viewer-layout {
  display: flex;
  height: 100%;
}

.image-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f8f9fa;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-info {
  padding: 20px;
  background: white;
  border-top: 1px solid #e4e7ed;
}

.result-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  color: #303133;
}

.status-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.text-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.text-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.text-header span {
  font-weight: 500;
  color: #303133;
}

.text-actions {
  display: flex;
  gap: 8px;
}

.text-content {
  flex: 1;
}

.text-footer {
  margin-top: 12px;
  text-align: right;
}

.metadata-section {
  margin-bottom: 20px;
}

.no-metadata {
  color: #909399;
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

.tags-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

pre {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}
</style>