<template>
  <el-dialog
    v-model="dialogVisible"
    title="上传图片进行OCR识别"
    width="600px"
    :before-close="handleClose"
  >
    <div class="upload-container">
      <!-- 拖拽上传区域 -->
      <el-upload
        ref="uploadRef"
        class="upload-dragger"
        drag
        :action="uploadUrl"
        :headers="uploadHeaders"
        :data="uploadData"
        :before-upload="beforeUpload"
        :on-success="handleSuccess"
        :on-error="handleError"
        :on-progress="handleProgress"
        :file-list="fileList"
        :auto-upload="false"
        multiple
      >
        <div class="upload-content">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">
            <p>将图片拖拽到此处，或<em>点击上传</em></p>
            <p class="upload-hint">支持 JPG、PNG、BMP、TIFF、WebP 格式，单个文件不超过 10MB</p>
          </div>
        </div>
      </el-upload>

      <!-- 文件列表 -->
      <div v-if="fileList.length > 0" class="file-list">
        <h4>待上传文件</h4>
        <div class="file-items">
          <div 
            v-for="(file, index) in fileList" 
            :key="index"
            class="file-item"
          >
            <div class="file-preview">
              <img v-if="file.url" :src="file.url" :alt="file.name" />
              <div v-else class="file-icon">
                <el-icon><Picture /></el-icon>
              </div>
            </div>
            
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                <span>{{ formatFileSize(file.size) }}</span>
                <span>{{ file.type || 'image/jpeg' }}</span>
              </div>
              
              <!-- OCR设置 -->
              <div class="ocr-settings" v-if="showSettings">
                <el-input
                  v-model="file.title"
                  placeholder="输入标题（可选）"
                  size="small"
                  style="margin-top: 8px;"
                />
                <el-select
                  v-model="file.ocrProvider"
                  placeholder="OCR服务"
                  size="small"
                  style="margin-top: 8px; width: 100%;"
                >
                  <el-option label="默认OCR" value="tesseract" />
                  <el-option label="百度OCR" value="baidu" />
                  <el-option label="腾讯OCR" value="tencent" />
                </el-select>
                
                <el-input
                  v-model="file.tagInput"
                  placeholder="输入标签，用逗号分隔"
                  size="small"
                  style="margin-top: 8px;"
                  @keyup.enter="addTags(file)"
                />
                
                <div class="tag-list" v-if="file.tags && file.tags.length > 0">
                  <el-tag
                    v-for="tag in file.tags"
                    :key="tag"
                    closable
                    size="small"
                    @close="removeTag(file, tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <div class="file-actions">
              <el-button 
                size="small" 
                @click="showFileSettings(file)"
                :icon="showSettings && currentFile === file ? 'ArrowUp' : 'Setting'"
              >
                {{ showSettings && currentFile === file ? '收起' : '设置' }}
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="removeFile(index)"
                icon="Delete"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 进度显示 -->
      <div v-if="uploading" class="upload-progress">
        <h4>上传进度</h4>
        <el-progress 
          :percentage="uploadProgress" 
          :status="uploadStatus"
        />
        <p class="progress-text">{{ progressText }}</p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="startUpload"
          :disabled="fileList.length === 0 || uploading"
          :loading="uploading"
        >
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ocrApi } from '@/api/ocr'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const authStore = useAuthStore()
const uploadRef = ref()
const fileList = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const progressText = ref('')
const showSettings = ref(false)
const currentFile = ref(null)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const uploadUrl = computed(() => {
  return import.meta.env.VITE_API_BASE_URL + '/api/ocr/'
})

const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${authStore.token}`
  }
})

const uploadData = computed(() => {
  return {}
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const beforeUpload = (file: File) => {
  // 检查文件格式
  const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp']
  if (!validFormats.includes(file.type)) {
    ElMessage.error('不支持的文件格式，请上传图片文件')
    return false
  }
  
  // 检查文件大小
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  
  return true
}

const handleSuccess = (response: any, file: any, fileList: any[]) => {
  uploadProgress.value = 100
  uploadStatus.value = 'success'
  progressText.value = '上传完成'
  
  setTimeout(() => {
    uploading.value = false
    uploadProgress.value = 0
    uploadStatus.value = ''
    progressText.value = ''
    emit('success', response)
    handleClose()
  }, 1000)
}

const handleError = (error: any, file: any, fileList: any[]) => {
  uploadStatus.value = 'exception'
  progressText.value = '上传失败'
  
  ElMessage.error('文件上传失败')
  
  setTimeout(() => {
    uploading.value = false
    uploadProgress.value = 0
    uploadStatus.value = ''
    progressText.value = ''
  }, 2000)
}

const handleProgress = (event: any, file: any, fileList: any[]) => {
  uploadProgress.value = Math.round(event.percent)
  progressText.value = `正在上传 ${file.name}...`
}

const startUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  uploading.value = true
  uploadProgress.value = 0
  progressText.value = '准备上传...'
  
  try {
    // 处理每个文件的额外数据
    const processedFiles = fileList.value.map(file => {
      const formData = new FormData()
      formData.append('image', file.raw)
      formData.append('title', file.title || file.name.replace(/\.[^/.]+$/, ''))
      
      if (file.tags && file.tags.length > 0) {
        formData.append('tags', JSON.stringify(file.tags))
      }
      
      if (file.ocrProvider) {
        formData.append('metadata', JSON.stringify({ ocr_provider: file.ocrProvider }))
      }
      
      return formData
    })
    
    // 逐个上传文件
    for (let i = 0; i < processedFiles.length; i++) {
      progressText.value = `上传第 ${i + 1}/${processedFiles.length} 个文件...`
      await ocrApi.uploadImage(processedFiles[i])
      uploadProgress.value = ((i + 1) / processedFiles.length) * 100
    }
    
    handleSuccess({}, null, [])
  } catch (error) {
    handleError(error, null, [])
  }
}

const showFileSettings = (file: any) => {
  if (currentFile.value === file) {
    showSettings.value = !showSettings.value
  } else {
    currentFile.value = file
    showSettings.value = true
  }
}

const addTags = (file: any) => {
  if (file.tagInput && file.tagInput.trim()) {
    const tags = file.tagInput.split(',').map(tag => tag.trim()).filter(tag => tag)
    if (!file.tags) file.tags = []
    file.tags.push(...tags)
    file.tagInput = ''
  }
}

const removeTag = (file: any, tag: string) => {
  if (file.tags) {
    file.tags = file.tags.filter(t => t !== tag)
  }
}

const removeFile = (index: number) => {
  fileList.value.splice(index, 1)
}

const handleClose = () => {
  if (uploading.value) {
    ElMessage.warning('正在上传中，请稍候')
    return
  }
  
  fileList.value = []
  showSettings.value = false
  currentFile.value = null
  dialogVisible.value = false
}

// 监听对话框关闭，重置状态
watch(dialogVisible, (newVal) => {
  if (!newVal) {
    fileList.value = []
    showSettings.value = false
    currentFile.value = null
  }
})
</script>

<style scoped>
.upload-container {
  padding: 20px 0;
}

.upload-dragger {
  width: 100%;
}

.upload-content {
  text-align: center;
  padding: 40px 20px;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
  color: #606266;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.file-list {
  margin-top: 20px;
}

.file-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.file-items {
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.file-preview {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4e7ed;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.file-meta {
  font-size: 12px;
  color: #909399;
}

.file-meta span {
  margin-right: 12px;
}

.ocr-settings {
  margin-top: 8px;
}

.tag-list {
  margin-top: 8px;
}

.tag-list .el-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.file-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-progress {
  margin-top: 20px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.upload-progress h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #0369a1;
}

.progress-text {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.dialog-footer {
  text-align: right;
}
</style>