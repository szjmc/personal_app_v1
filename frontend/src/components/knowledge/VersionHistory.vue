<template>
  <div class="version-history">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="versions.length === 0" class="empty-container">
      <el-empty description="暂无版本历史" />
    </div>
    
    <div v-else class="versions-list">
      <div
        v-for="version in versions"
        :key="version.id"
        class="version-item"
        :class="{ active: selectedVersion?.id === version.id }"
        @click="selectVersion(version)"
      >
        <div class="version-header">
          <div class="version-info">
            <span class="version-number">v{{ version.version_number }}</span>
            <span class="version-time">{{ formatTime(version.modified_at) }}</span>
            <span class="version-author">{{ version.modified_by_name }}</span>
          </div>
          
          <div class="version-actions">
            <el-button
              size="small"
              text
              @click.stop="previewVersion(version)"
              :icon="View"
            >
              预览
            </el-button>
            <el-button
              size="small"
              type="primary"
              text
              @click.stop="restoreVersion(version)"
              :icon="RefreshLeft"
            >
              恢复
            </el-button>
          </div>
        </div>
        
        <div class="version-summary">
          {{ version.change_summary || '无修改说明' }}
        </div>
        
        <div class="version-stats">
          <span class="stat-item">
            <el-icon><Document /></el-icon>
            {{ version.content_length }} 字符
          </span>
          <span class="stat-item">
            <el-icon><Timer /></el-icon>
            {{ getTimeFromNow(version.modified_at) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 版本对比弹窗 -->
    <el-dialog
      v-model="compareDialogVisible"
      title="版本对比"
      width="900px"
      top="5vh"
    >
      <div v-if="compareVersions.length === 2" class="compare-container">
        <div class="compare-header">
          <div class="compare-info">
            <h3>当前版本 vs v{{ compareVersions[1].version_number }}</h3>
            <p>修改时间：{{ formatTime(compareVersions[1].modified_at) }}</p>
          </div>
          <div class="compare-actions">
            <el-button @click="toggleCompareMode">
              {{ showSideBySide ? '并排对比' : '差异高亮' }}
            </el-button>
          </div>
        </div>
        
        <!-- 并排对比模式 -->
        <div v-if="showSideBySide" class="compare-side-by-side">
          <div class="compare-column current">
            <h4>当前版本</h4>
            <div class="compare-content current-content">
              {{ compareVersions[0].content }}
            </div>
          </div>
          
          <div class="compare-divider"></div>
          
          <div class="compare-column old">
            <h4>历史版本 (v{{ compareVersions[1].version_number }})</h4>
            <div class="compare-content old-content">
              {{ compareVersions[1].content }}
            </div>
          </div>
        </div>
        
        <!-- 差异高亮模式 -->
        <div v-else class="compare-diff">
          <div class="diff-content" v-html="diffHtml"></div>
        </div>
      </div>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="`版本 v${previewVersion?.version_number} 预览`"
      width="800px"
    >
      <div v-if="previewVersion" class="preview-container">
        <div class="preview-header">
          <div class="preview-meta">
            <span>修改者：{{ previewVersion.modified_by_name }}</span>
            <span>修改时间：{{ formatTime(previewVersion.modified_at) }}</span>
          </div>
          <div class="preview-summary">
            修改说明：{{ previewVersion.change_summary || '无' }}
          </div>
        </div>
        
        <div class="preview-content">
          <div
            v-if="previewVersion.format_type === 'rich'"
            class="rich-content"
            v-html="previewVersion.content"
          ></div>
          <div
            v-else
            class="markdown-content"
            v-html="markdownHtml"
          ></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  View, RefreshLeft, Document, Timer
} from '@element-plus/icons-vue'
import { versionApi, type NoteVersion } from '@/api/knowledge'
import { formatTime, getTimeFromNow } from '@/utils/format'
import { marked } from 'marked'

const props = defineProps<{
  noteId: number
}>()

const emit = defineEmits<{
  restore: [versionId: number]
}>()

// 响应式数据
const loading = ref(false)
const versions = ref<NoteVersion[]>([])
const selectedVersion = ref<NoteVersion | null>(null)
const compareVersions = ref<NoteVersion[]>([])
const compareDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const previewVersion = ref<NoteVersion | null>(null)
const showSideBySide = ref(false)

// 计算属性
const markdownHtml = computed(() => {
  if (!previewVersion.value?.content) return ''
  return marked(previewVersion.value.content)
})

const diffHtml = computed(() => {
  if (compareVersions.value.length !== 2) return ''
  
  const current = compareVersions.value[0].content
  const old = compareVersions.value[1].content
  
  // 简单的差异对比实现
  const currentLines = current.split('\n')
  const oldLines = old.split('\n')
  const maxLines = Math.max(currentLines.length, oldLines.length)
  
  let html = ''
  
  for (let i = 0; i < maxLines; i++) {
    const currentLine = currentLines[i] || ''
    const oldLine = oldLines[i] || ''
    
    if (currentLine === oldLine) {
      html += `<div class="diff-line unchanged">${escapeHtml(currentLine)}</div>`
    } else {
      if (currentLine && !oldLine) {
        html += `<div class="diff-line added">+ ${escapeHtml(currentLine)}</div>`
      } else if (!currentLine && oldLine) {
        html += `<div class="diff-line removed">- ${escapeHtml(oldLine)}</div>`
      } else {
        html += `<div class="diff-line changed">
          <div class="removed-line">- ${escapeHtml(oldLine)}</div>
          <div class="added-line">+ ${escapeHtml(currentLine)}</div>
        </div>`
      }
    }
  }
  
  return html
})

// 方法
const loadVersions = async () => {
  loading.value = true
  try {
    const response = await versionApi.getHistory(props.noteId)
    versions.value = response.data
  } catch (error) {
    ElMessage.error('加载版本历史失败')
  } finally {
    loading.value = false
  }
}

const selectVersion = (version: NoteVersion) => {
  selectedVersion.value = version
}

const previewVersion = async (version: NoteVersion) => {
  try {
    const response = await versionApi.getVersion(props.noteId, version.id)
    previewVersion.value = response.data
    previewDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载版本详情失败')
  }
}

const restoreVersion = async (version: NoteVersion) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复到版本 v${version.version_number} 吗？当前版本将被替换。`,
      '确认恢复',
      {
        type: 'warning',
        confirmButtonText: '确认恢复',
        cancelButtonText: '取消'
      }
    )
    
    await versionApi.restore(props.noteId, version.id)
    emit('restore', version.id)
    ElMessage.success('版本恢复成功')
    
    // 重新加载版本列表
    loadVersions()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('版本恢复失败')
    }
  }
}

const toggleCompareMode = () => {
  showSideBySide.value = !showSideBySide.value
}

const escapeHtml = (text: string) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 监听版本变化，自动进行对比
watch([versions, selectedVersion], () => {
  if (versions.value.length > 0 && selectedVersion.value) {
    // 假设当前版本是第一个（最新版本）
    const currentVersion = versions.value[0]
    if (currentVersion.id !== selectedVersion.value.id) {
      compareVersions.value = [currentVersion, selectedVersion.value]
    }
  }
})

// 生命周期
onMounted(() => {
  loadVersions()
})
</script>

<style lang="scss" scoped>
.version-history {
  .loading-container, .empty-container {
    padding: 40px 20px;
    text-align: center;
  }
  
  .versions-list {
    max-height: 500px;
    overflow-y: auto;
    
    .version-item {
      padding: 16px;
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.05);
      
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--primary-color);
      }
      
      &.active {
        background: rgba(59, 130, 246, 0.1);
        border-color: var(--primary-color);
      }
      
      .version-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .version-info {
          display: flex;
          align-items: center;
          gap: 12px;
          
          .version-number {
            font-weight: 600;
            color: var(--primary-color);
            background: rgba(59, 130, 246, 0.1);
            padding: 2px 8px;
            border-radius: 4px;
          }
          
          .version-time {
            font-size: 14px;
            color: var(--text-secondary);
          }
          
          .version-author {
            font-size: 14px;
            color: var(--text-tertiary);
          }
        }
        
        .version-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }
      
      &:hover .version-actions {
        opacity: 1;
      }
      
      .version-summary {
        font-size: 14px;
        color: var(--text-primary);
        margin-bottom: 8px;
        line-height: 1.4;
      }
      
      .version-stats {
        display: flex;
        gap: 16px;
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--text-tertiary);
          
          .el-icon {
            font-size: 14px;
          }
        }
      }
    }
  }
}

// 对比弹窗样式
.compare-container {
  .compare-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--glass-border);
    
    .compare-info h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: var(--text-primary);
    }
    
    .compare-info p {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
  
  .compare-side-by-side {
    display: flex;
    gap: 20px;
    height: 500px;
    
    .compare-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: var(--text-primary);
        padding-bottom: 8px;
        border-bottom: 1px solid var(--glass-border);
      }
      
      .compare-content {
        flex: 1;
        padding: 16px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        overflow-y: auto;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
    }
    
    .compare-divider {
      width: 1px;
      background: var(--glass-border);
      margin: 0 10px;
    }
  }
  
  .compare-diff {
    height: 500px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    padding: 16px;
    
    .diff-content {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
      
      :deep(.diff-line) {
        margin: 2px 0;
        padding: 4px 8px;
        border-radius: 4px;
        
        &.unchanged {
          background: transparent;
        }
        
        &.added {
          background: rgba(34, 197, 94, 0.1);
          border-left: 3px solid #22c55e;
          color: #22c55e;
        }
        
        &.removed {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          color: #ef4444;
        }
        
        &.changed {
          margin: 8px 0;
          
          .added-line {
            background: rgba(34, 197, 94, 0.1);
            border-left: 3px solid #22c55e;
            color: #22c55e;
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 2px;
          }
          
          .removed-line {
            background: rgba(239, 68, 68, 0.1);
            border-left: 3px solid #ef4444;
            color: #ef4444;
            padding: 4px 8px;
            border-radius: 4px;
          }
        }
      }
    }
  }
}

// 预览弹窗样式
.preview-container {
  .preview-header {
    padding-bottom: 16px;
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: 20px;
    
    .preview-meta {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .preview-summary {
      font-size: 14px;
      color: var(--text-primary);
    }
  }
  
  .preview-content {
    max-height: 500px;
    overflow-y: auto;
    padding: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    
    .rich-content {
      line-height: 1.6;
      
      h1, h2, h3, h4, h5, h6 {
        margin: 20px 0 10px 0;
        color: var(--text-primary);
      }
      
      p {
        margin: 10px 0;
      }
      
      a {
        color: var(--primary-color);
        text-decoration: underline;
      }
      
      ul, ol {
        margin: 10px 0;
        padding-left: 30px;
      }
    }
    
    .markdown-content {
      line-height: 1.6;
      
      h1, h2, h3, h4, h5, h6 {
        margin: 20px 0 10px 0;
        color: var(--text-primary);
      }
      
      p {
        margin: 10px 0;
      }
      
      a {
        color: var(--primary-color);
      }
      
      blockquote {
        border-left: 4px solid var(--primary-color);
        padding-left: 16px;
        margin: 10px 0;
        color: var(--text-secondary);
      }
      
      code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }
      
      pre {
        background: rgba(255, 255, 255, 0.05);
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 10px 0;
        
        code {
          background: none;
          padding: 0;
        }
      }
    }
  }
}

// 滚动条样式
.versions-list::-webkit-scrollbar,
.compare-content::-webkit-scrollbar,
.preview-content::-webkit-scrollbar {
  width: 6px;
}

.versions-list::-webkit-scrollbar-track,
.compare-content::-webkit-scrollbar-track,
.preview-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.versions-list::-webkit-scrollbar-thumb,
.compare-content::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
</style>