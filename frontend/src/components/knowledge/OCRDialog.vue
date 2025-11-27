<template>
  <el-dialog
    v-model="dialogVisible"
    title="图片文字识别"
    width="600px"
    @close="handleClose"
  >
    <div class="ocr-container">
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
            accept="image/*"
            @change="handleFileSelect"
            style="display: none"
          />
          
          <div v-if="!imagePreview" class="upload-placeholder">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <p class="upload-text">拖拽图片到此处或点击上传</p>
            <p class="upload-hint">支持 JPG、PNG、BMP 等常见图片格式</p>
            <el-button type="primary" @click="$refs.fileInput.click()">
              选择图片
            </el-button>
            <el-button @click="openCamera">
              <el-icon><Camera /></el-icon>
              拍照识别
            </el-button>
          </div>
          
          <div v-else class="image-preview">
            <img :src="imagePreview" alt="预览图片" />
            <div class="preview-actions">
              <el-button size="small" @click="clearImage">
                <el-icon><Delete /></el-icon>
                重新选择
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click="startOCR"
                :loading="ocrLoading"
              >
                <el-icon><View /></el-icon>
                开始识别
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 识别结果 -->
      <div v-if="ocrResult" class="result-section">
        <div class="result-header">
          <h3>识别结果</h3>
          <div class="result-actions">
            <el-button
              size="small"
              @click="copyResult"
              :icon="DocumentCopy"
            >
              复制文本
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="createNoteFromResult"
              :icon="Plus"
            >
              创建笔记
            </el-button>
          </div>
        </div>
        
        <div class="result-content">
          <el-input
            v-model="ocrResult"
            type="textarea"
            :rows="8"
            placeholder="识别的文本内容..."
            class="result-textarea"
          />
        </div>
        
        <!-- 识别置信度 -->
        <div v-if="ocrConfidence" class="confidence-info">
          <span class="confidence-label">识别置信度：</span>
          <el-progress
            :percentage="ocrConfidence"
            :color="getConfidenceColor(ocrConfidence)"
            :stroke-width="8"
            class="confidence-progress"
          />
          <span class="confidence-value">{{ ocrConfidence }}%</span>
        </div>
      </div>

      <!-- 识别历史 -->
      <div v-if="ocrHistory.length > 0" class="history-section">
        <h3>最近识别记录</h3>
        <div class="history-list">
          <div
            v-for="(item, index) in ocrHistory"
            :key="index"
            class="history-item"
            @click="selectHistoryItem(item)"
          >
            <div class="history-image">
              <img :src="item.imagePreview" alt="历史图片" />
            </div>
            <div class="history-content">
              <div class="history-text">{{ item.text.substring(0, 50) }}...</div>
              <div class="history-time">{{ formatTime(item.time) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button 
          v-if="ocrResult"
          type="primary" 
          @click="confirmResult"
        >
          确认使用
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UploadFilled, Camera, Delete, View, DocumentCopy, Plus
} from '@element-plus/icons-vue'
import { ocrApi } from '@/api/knowledge'
import { formatTime } from '@/utils/format'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  recognized: [text: string]
}>()

// 响应式数据
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const imagePreview = ref<string>('')
const isDragOver = ref(false)
const ocrLoading = ref(false)
const ocrResult = ref('')
const ocrConfidence = ref(0)
const ocrHistory = ref<Array<{
  text: string
  imagePreview: string
  time: Date
  confidence: number
}>>([])

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) {
    processFile(files[0])
  }
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files[0]) {
    processFile(files[0])
  }
}

const processFile = (file: File) => {
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片文件不能超过5MB')
    return
  }
  
  selectedFile.value = file
  
  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const openCamera = () => {
  // 创建隐藏的input来调用相机
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment' // 优先使用后置摄像头
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files && files[0]) {
      processFile(files[0])
    }
  }
  input.click()
}

const clearImage = () => {
  selectedFile.value = null
  imagePreview.value = ''
  ocrResult.value = ''
  ocrConfidence.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const startOCR = async () => {
  if (!selectedFile.value) {
    ElMessage.error('请先选择图片')
    return
  }
  
  ocrLoading.value = true
  try {
    const response = await ocrApi.recognize(selectedFile.value)
    const { text, confidence } = response.data
    
    ocrResult.value = text
    ocrConfidence.value = Math.round(confidence * 100)
    
    // 添加到历史记录
    ocrHistory.value.unshift({
      text,
      imagePreview: imagePreview.value,
      time: new Date(),
      confidence: ocrConfidence.value
    })
    
    // 只保留最近10条记录
    if (ocrHistory.value.length > 10) {
      ocrHistory.value = ocrHistory.value.slice(0, 10)
    }
    
    // 保存到本地存储
    localStorage.setItem('ocr-history', JSON.stringify(ocrHistory.value))
    
    ElMessage.success('文字识别完成')
  } catch (error) {
    ElMessage.error('文字识别失败，请重试')
  } finally {
    ocrLoading.value = false
  }
}

const copyResult = () => {
  if (ocrResult.value) {
    navigator.clipboard.writeText(ocrResult.value).then(() => {
      ElMessage.success('文本已复制到剪贴板')
    })
  }
}

const createNoteFromResult = () => {
  if (ocrResult.value) {
    emit('recognized', ocrResult.value)
    handleClose()
  }
}

const selectHistoryItem = (item: any) => {
  ocrResult.value = item.text
  ocrConfidence.value = item.confidence
  imagePreview.value = item.imagePreview
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return '#67c23a'
  if (confidence >= 60) return '#e6a23c'
  return '#f56c6c'
}

const confirmResult = () => {
  if (ocrResult.value) {
    emit('recognized', ocrResult.value)
    handleClose()
  }
}

const handleClose = () => {
  clearImage()
  dialogVisible.value = false
}

// 加载历史记录
const loadHistory = () => {
  const saved = localStorage.getItem('ocr-history')
  if (saved) {
    try {
      ocrHistory.value = JSON.parse(saved).map((item: any) => ({
        ...item,
        time: new Date(item.time)
      }))
    } catch (e) {
      ocrHistory.value = []
    }
  }
}

// 监听弹窗打开
watch(dialogVisible, (visible) => {
  if (visible) {
    loadHistory()
  }
})
</script>

<style lang="scss" scoped>
.ocr-container {
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
      
      .el-button {
        margin: 0 8px;
      }
    }
    
    .image-preview {
      position: relative;
      
      img {
        max-width: 100%;
        max-height: 300px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .preview-actions {
        position: absolute;
        bottom: 16px;
        right: 16px;
        display: flex;
        gap: 8px;
        
        .el-button {
          background: rgba(0, 0, 0, 0.7);
          border: none;
          color: white;
          
          &:hover {
            background: rgba(0, 0, 0, 0.8);
          }
        }
      }
    }
  }
  
  .result-section {
    margin-bottom: 20px;
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--text-primary);
      }
      
      .result-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .result-content {
      margin-bottom: 16px;
      
      .result-textarea {
        .el-textarea__inner {
          border: 1px solid var(--glass-border);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          border-radius: 8px;
          
          &:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
          }
        }
      }
    }
    
    .confidence-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .confidence-label {
        font-size: 14px;
        color: var(--text-secondary);
        min-width: 80px;
      }
      
      .confidence-progress {
        flex: 1;
      }
      
      .confidence-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        min-width: 40px;
      }
    }
  }
  
  .history-section {
    h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: var(--text-primary);
    }
    
    .history-list {
      max-height: 200px;
      overflow-y: auto;
      
      .history-item {
        display: flex;
        gap: 12px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .history-image {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
          }
        }
        
        .history-content {
          flex: 1;
          min-width: 0;
          
          .history-text {
            font-size: 14px;
            color: var(--text-primary);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .history-time {
            font-size: 12px;
            color: var(--text-tertiary);
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

// 滚动条样式
.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>