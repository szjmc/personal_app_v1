<template>
  <el-dialog
    v-model="dialogVisible"
    title="文件上传"
    width="800px"
    @close="handleClose"
  >
    <div class="file-upload-container">
      <!-- 上传区域 -->
      <div class="upload-section">
        <div 
          class="upload-area"
          :class="{ 'drag-over': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
            @change="handleFileSelect"
            style="display: none"
          />
          
          <div class="upload-placeholder">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <p class="upload-text">拖拽文件到此处或点击上传</p>
            <p class="upload-hint">支持图片、文档、表格、演示文稿等多种格式</p>
            <el-button type="primary" @click="$refs.fileInput.click()">
              选择文件
            </el-button>
          </div>
        </div>
      </div>

      <!-- 文件列表 -->
      <div v-if="fileList.length > 0" class="file-list-section">
        <div class="list-header">
          <h3>待上传文件 ({{ fileList.length }})</h3>
          <el-button size="small" @click="clearAllFiles">
            <el-icon><Delete /></el-icon>
            清空列表
          </el-button>
        </div>
        
        <div class="file-list">
          <div
            v-for="(file, index) in fileList"
            :key="index"
            class="file-item"
          >
            <div class="file-icon">
              <el-icon v-if="isImage(file.file)">
                <Picture />
              </el-icon>
              <el-icon v-else-if="isPDF(file.file)">
                <Document />
              </el-icon>
              <el-icon v-else-if="isDocument(file.file)">
                <DocumentCopy />
              </el-icon>
              <el-icon v-else-if="isSpreadsheet(file.file)">
                <Grid />
              </el-icon>
              <el-icon v-else>
                <Files />
              </el-icon>
            </div>
            
            <div class="file-info">
              <div class="file-name">{{ file.file.name }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.file.size) }}</span>
                <span class="file-type">{{ file.file.type || '未知类型' }}</span>
              </div>
              
              <!-- 上传进度 -->
              <div v-if="file.status === 'uploading'" class="upload-progress">
                <el-progress
                  :percentage="file.progress"
                  :stroke-width="4"
                  class="progress-bar"
                />
              </div>
              
              <!-- 上传状态 -->
              <div v-else class="file-status">
                <el-tag
                  v-if="file.status === 'success'"
                  type="success"
                  size="small"
                >
                  <el-icon><Check /></el-icon>
                  上传成功
                </el-tag>
                <el-tag
                  v-else-if="file.status === 'error'"
                  type="danger"
                  size="small"
                >
                  <el-icon><Close /></el-icon>
                  上传失败
                </el-tag>
                <el-tag
                  v-else
                  type="info"
                  size="small"
                >
                  待上传
                </el-tag>
              </div>
            </div>
            
            <div class="file-actions">
              <el-button
                v-if="file.status === 'pending'"
                size="small"
                text
                @click="removeFile(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
              <el-button
                v-if="file.status === 'error'"
                size="small"
                type="primary"
                text
                @click="retryUpload(index)"
              >
                <el-icon><Refresh /></el-icon>
                重试
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 文件分类选择 -->
      <div v-if="fileList.length > 0" class="category-section">
        <h3>文件分类</h3>
        <el-radio-group v-model="selectedCategory" class="category-group">
          <el-radio label="document">文档</el-radio>
          <el-radio label="image">图片</el-radio>
          <el-radio label="video">视频</el-radio>
          <el-radio label="other">其他</el-radio>
        </el-radio-group>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          v-if="fileList.length > 0"
          type="primary" 
          @click="startUpload"
          :loading="uploading"
          :disabled="!canUpload"
        >
          上传文件 ({{ uploadableCount }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UploadFilled, Delete, Picture, Document, DocumentCopy, 
  Grid, Files, Check, Close, Refresh
} from '@element-plus/icons-vue'
import { fileApi } from '@/api/knowledge'

interface FileItem {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  url?: string
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  uploaded: [files: any[]]
}>()

// 响应式数据
const fileInput = ref<HTMLInputElement>()
const fileList = ref<FileItem[]>([])
const selectedCategory = ref('document')
const uploading = ref(false)

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const uploadableCount = computed(() => 
  fileList.value.filter(f => f.status === 'pending').length
)

const canUpload = computed(() => uploadableCount.value > 0 && !uploading.value)

// 文件类型判断
const isImage = (file: File) => file.type.startsWith('image/')
const isPDF = (file: File) => file.type === 'application/pdf'
const isDocument = (file: File) => 
  ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
const isSpreadsheet = (file: File) => 
  ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)

// 方法
const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) {
    addFiles(Array.from(files))
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  
  const files = e.dataTransfer?.files
  if (files) {
    addFiles(Array.from(files))
  }
}

const addFiles = (files: File[]) => {
  for (const file of files) {
    // 文件大小检查 (500MB)
    if (file.size > 500 * 1024 * 1024) {
      ElMessage.error(`文件 ${file.name} 超过500MB限制`)
      continue
    }
    
    // 文件类型检查
    const allowedTypes = [
      ...files.map(f => f.type),
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      ElMessage.error(`文件 ${file.name} 类型不支持`)
      continue
    }
    
    // 检查重复文件
    const isDuplicate = fileList.value.some(item => 
      item.file.name === file.name && item.file.size === file.size
    )
    
    if (isDuplicate) {
      ElMessage.warning(`文件 ${file.name} 已存在`)
      continue
    }
    
    fileList.value.push({
      file,
      status: 'pending',
      progress: 0
    })
  }
  
  // 重置input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removeFile = (index: number) => {
  fileList.value.splice(index, 1)
}

const clearAllFiles = () => {
  ElMessageBox.confirm('确定要清空文件列表吗？', '确认清空', {
    type: 'warning'
  }).then(() => {
    fileList.value = []
  }).catch(() => {})
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const startUpload = async () => {
  const filesToUpload = fileList.value.filter(f => f.status === 'pending')
  if (filesToUpload.length === 0) return
  
  uploading.value = true
  const uploadedFiles: any[] = []
  
  try {
    // 并发上传所有文件
    const uploadPromises = filesToUpload.map(async (fileItem, index) => {
      const fileIndex = fileList.value.indexOf(fileItem)
      
      try {
        // 更新状态为上传中
        fileList.value[fileIndex].status = 'uploading'
        fileList.value[fileIndex].progress = 0
        
        const response = await fileApi.upload(fileItem.file, (progress) => {
          // 更新进度
          if (fileList.value[fileIndex]) {
            fileList.value[fileIndex].progress = progress
          }
        })
        
        // 上传成功
        fileList.value[fileIndex].status = 'success'
        fileList.value[fileIndex].progress = 100
        fileList.value[fileIndex].url = response.data.url
        
        uploadedFiles.push({
          ...response.data,
          category: selectedCategory.value
        })
        
        return response.data
      } catch (error) {
        // 上传失败
        fileList.value[fileIndex].status = 'error'
        fileList.value[fileIndex].error = error as string
        throw error
      }
    })
    
    await Promise.allSettled(uploadPromises)
    
    // 统计结果
    const successCount = uploadedFiles.length
    const failCount = filesToUpload.length - successCount
    
    if (successCount > 0) {
      ElMessage.success(`成功上传 ${successCount} 个文件`)
    }
    
    if (failCount > 0) {
      ElMessage.error(`${failCount} 个文件上传失败`)
    }
    
    // 如果有成功上传的文件，触发事件
    if (uploadedFiles.length > 0) {
      emit('uploaded', uploadedFiles)
    }
    
    // 延迟关闭弹窗
    setTimeout(() => {
      if (uploadedFiles.length > 0) {
        handleClose()
      }
    }, 1500)
    
  } catch (error) {
    ElMessage.error('上传过程中发生错误')
  } finally {
    uploading.value = false
  }
}

const retryUpload = async (index: number) => {
  const fileItem = fileList.value[index]
  if (fileItem.status === 'error') {
    fileItem.status = 'pending'
    fileItem.progress = 0
    fileItem.error = undefined
  }
}

const handleClose = () => {
  fileList.value = []
  selectedCategory.value = 'document'
  uploading.value = false
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.file-upload-container {
  .upload-section {
    margin-bottom: 20px;
  }
  
  .upload-area {
    border: 2px dashed var(--glass-border);
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.02);
    
    &:hover, &.drag-over {
      border-color: var(--primary-color);
      background: rgba(59, 130, 246, 0.05);
    }
    
    .upload-placeholder {
      .upload-icon {
        font-size: 48px;
        color: var(--primary-color);
        margin-bottom: 16px;
      }
      
      .upload-text {
        font-size: 16px;
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }
      
      .upload-hint {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0 0 20px 0;
      }
    }
  }
  
  .file-list-section {
    margin-bottom: 20px;
    
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      h3 {
        margin: 0;
        font-size: 16px;
        color: var(--text-primary);
      }
    }
    
    .file-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      
      .file-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid var(--glass-border);
        gap: 12px;
        transition: background 0.2s ease;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        
        .file-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          color: var(--primary-color);
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .file-info {
          flex: 1;
          min-width: 0;
          
          .file-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .file-meta {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 8px;
            
            .file-size {
              color: var(--primary-color);
            }
          }
          
          .upload-progress {
            .progress-bar {
              :deep(.el-progress-bar__outer) {
                background-color: rgba(255, 255, 255, 0.1);
              }
            }
          }
          
          .file-status {
            .el-tag {
              .el-icon {
                margin-right: 4px;
              }
            }
          }
        }
        
        .file-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
      }
    }
  }
  
  .category-section {
    h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: var(--text-primary);
    }
    
    .category-group {
      display: flex;
      gap: 20px;
      
      :deep(.el-radio) {
        margin-right: 0;
        
        .el-radio__label {
          font-size: 14px;
          color: var(--text-primary);
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

// 滚动条样式
.file-list::-webkit-scrollbar {
  width: 6px;
}

.file-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.file-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>