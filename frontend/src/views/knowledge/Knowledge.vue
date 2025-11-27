<template>
  <div class="knowledge-container">
    <!-- 头部工具栏 -->
    <div class="knowledge-header">
      <div class="header-left">
        <h1 class="page-title">知识库</h1>
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索笔记或OCR识别..."
            class="search-input"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button 
                type="primary" 
                @click="showOCRDialog"
                :icon="Camera"
              >
                图片识别
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="createNote">
          <el-icon><Plus /></el-icon>
          新建笔记
        </el-button>
        
        <el-button @click="showUploadDialog">
          <el-icon><Upload /></el-icon>
          上传文件
        </el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="knowledge-content">
      <!-- 左侧笔记列表 -->
      <div class="notes-sidebar">
        <div class="sidebar-header">
          <h3>笔记列表</h3>
          <div class="view-toggle">
            <el-button-group>
              <el-button 
                :type="viewMode === 'list' ? 'primary' : 'default'"
                @click="viewMode = 'list'"
                size="small"
              >
                <el-icon><List /></el-icon>
              </el-button>
              <el-button 
                :type="viewMode === 'grid' ? 'primary' : 'default'"
                @click="viewMode = 'grid'"
                size="small"
              >
                <el-icon><Grid /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>
        
        <!-- 标签筛选 -->
        <div class="tags-filter">
          <el-tag
            v-for="tag in availableTags"
            :key="tag"
            :class="{ active: selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
        
        <!-- 笔记列表 -->
        <div 
          v-if="viewMode === 'list'"
          class="notes-list"
        >
          <div
            v-for="note in filteredNotes"
            :key="note.id"
            class="note-item"
            :class="{ active: selectedNote?.id === note.id }"
            @click="selectNote(note)"
          >
            <div class="note-header">
              <h4>{{ note.title }}</h4>
              <div class="note-actions">
                <el-button
                  size="small"
                  text
                  @click.stop="editNote(note)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-dropdown @command="handleNoteAction" trigger="click">
                  <el-button size="small" text>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ action: 'duplicate', note }">
                        <el-icon><DocumentCopy /></el-icon>
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item :command="{ action: 'export', note }">
                        <el-icon><Download /></el-icon>
                        导出
                      </el-dropdown-item>
                      <el-dropdown-item 
                        :command="{ action: 'delete', note }"
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
            
            <div class="note-preview">
              {{ note.content.substring(0, 100) }}...
            </div>
            
            <div class="note-meta">
              <div class="note-tags">
                <el-tag
                  v-for="tag in note.tags"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <span class="note-time">
                {{ formatTime(note.updated_at) }}
              </span>
            </div>
            
            <div v-if="note.linked_notes.length > 0" class="note-links">
              <el-icon><Link /></el-icon>
              <span>{{ note.linked_notes.length }} 个链接</span>
            </div>
          </div>
        </div>
        
        <!-- 网格视图 -->
        <div 
          v-else
          class="notes-grid"
        >
          <div
            v-for="note in filteredNotes"
            :key="note.id"
            class="note-card"
            @click="selectNote(note)"
          >
            <div class="note-card-header">
              <h4>{{ note.title }}</h4>
              <el-dropdown @command="handleNoteAction" trigger="click">
                <el-button size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'edit', note }">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'duplicate', note }">
                      <el-icon><DocumentCopy /></el-icon>
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', note }">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="note-card-content">
              {{ note.content.substring(0, 200) }}...
            </div>
            
            <div class="note-card-footer">
              <div class="note-tags">
                <el-tag
                  v-for="tag in note.tags.slice(0, 2)"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="note.tags.length > 2" class="more-tags">
                  +{{ note.tags.length - 2 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧笔记编辑器 -->
      <div class="note-editor">
        <NoteEditor
          v-if="selectedNote || isCreating"
          :note="selectedNote"
          :is-creating="isCreating"
          @save="handleSaveNote"
          @cancel="handleCancelEdit"
          @delete="handleDeleteNote"
          @create-link="handleCreateLink"
        />
        
        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="选择一个笔记开始编辑" />
        </div>
      </div>
    </div>

    <!-- OCR识别弹窗 -->
    <OCRDialog 
      v-model="ocrDialogVisible"
      @recognized="handleOCRRecognized"
    />

    <!-- 文件上传弹窗 -->
    <FileUploadDialog
      v-model="uploadDialogVisible"
      @uploaded="handleFileUploaded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Plus, Upload, Camera, List, Grid, Edit, 
  MoreFilled, DocumentCopy, Download, Delete, Link 
} from '@element-plus/icons-vue'
import { noteApi, type Note } from '@/api/knowledge'
import NoteEditor from '@/components/knowledge/NoteEditor.vue'
import OCRDialog from '@/components/knowledge/OCRDialog.vue'
import FileUploadDialog from '@/components/knowledge/FileUploadDialog.vue'
import { formatTime } from '@/utils/format'

// 响应式数据
const searchQuery = ref('')
const notes = ref<Note[]>([])
const selectedNote = ref<Note | null>(null)
const isCreating = ref(false)
const viewMode = ref<'list' | 'grid'>('list')
const selectedTags = ref<string[]>([])
const availableTags = ref<string[]>([])
const ocrDialogVisible = ref(false)
const uploadDialogVisible = ref(false)

// 计算属性
const filteredNotes = computed(() => {
  let filtered = notes.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    )
  }

  // 标签过滤
  if (selectedTags.value.length > 0) {
    filtered = filtered.filter(note =>
      selectedTags.value.every(tag => note.tags.includes(tag))
    )
  }

  return filtered.sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
})

// 方法
const loadNotes = async () => {
  try {
    const response = await noteApi.getList()
    notes.value = response.data.results
    
    // 提取所有标签
    const tagSet = new Set<string>()
    notes.value.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag))
    })
    availableTags.value = Array.from(tagSet)
  } catch (error) {
    ElMessage.error('加载笔记失败')
  }
}

const handleSearch = (query: string) => {
  searchQuery.value = query
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const selectNote = (note: Note) => {
  selectedNote.value = note
  isCreating.value = false
}

const createNote = () => {
  selectedNote.value = null
  isCreating.value = true
}

const editNote = (note: Note) => {
  selectedNote.value = note
  isCreating.value = false
}

const handleSaveNote = async (noteData: Partial<Note>) => {
  try {
    if (isCreating.value) {
      // 创建笔记
      const response = await noteApi.create(noteData)
      notes.value.unshift(response.data)
      ElMessage.success('笔记创建成功')
      selectedNote.value = response.data
      isCreating.value = false
    } else if (selectedNote.value) {
      // 更新笔记
      const response = await noteApi.update(selectedNote.value.id, noteData)
      const index = notes.value.findIndex(n => n.id === selectedNote.value!.id)
      if (index > -1) {
        notes.value[index] = response.data
      }
      selectedNote.value = response.data
      ElMessage.success('笔记更新成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleCancelEdit = () => {
  selectedNote.value = null
  isCreating.value = false
}

const handleDeleteNote = async (noteId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇笔记吗？', '确认删除', {
      type: 'warning'
    })
    
    await noteApi.delete(noteId)
    notes.value = notes.value.filter(n => n.id !== noteId)
    
    if (selectedNote.value?.id === noteId) {
      selectedNote.value = null
      isCreating.value = false
    }
    
    ElMessage.success('笔记删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleCreateLink = (sourceId: number, targetId: number, linkText: string) => {
  // 创建双向链接逻辑
  noteApi.createLink(sourceId, targetId, linkText)
    .then(() => {
      ElMessage.success('链接创建成功')
    })
    .catch(() => {
      ElMessage.error('链接创建失败')
    })
}

const handleNoteAction = async ({ action, note }: { action: string, note: Note }) => {
  switch (action) {
    case 'edit':
      editNote(note)
      break
    case 'duplicate':
      // 复制笔记逻辑
      const duplicatedNote = {
        ...note,
        title: `${note.title} (副本)`,
        id: undefined
      }
      delete duplicatedNote.id
      await noteApi.create(duplicatedNote)
      loadNotes()
      ElMessage.success('笔记复制成功')
      break
    case 'export':
      // 导出笔记逻辑
      ElMessage.info('导出功能开发中')
      break
    case 'delete':
      handleDeleteNote(note.id)
      break
  }
}

const showOCRDialog = () => {
  ocrDialogVisible.value = true
}

const handleOCRRecognized = (text: string) => {
  searchQuery.value = text
  // 可以选择自动创建笔记或直接搜索
}

const showUploadDialog = () => {
  uploadDialogVisible.value = true
}

const handleFileUploaded = (file: any) => {
  ElMessage.success('文件上传成功')
}

// 生命周期
onMounted(() => {
  loadNotes()
})
</script>

<style lang="scss" scoped>
.knowledge-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.knowledge-header {
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

.knowledge-content {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
}

.notes-sidebar {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .tags-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    
    .tag-item {
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      &.active {
        background: var(--primary-color);
        color: white;
      }
    }
  }
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  
  .note-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color);
    }
    
    &.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      
      .note-header h4,
      .note-preview,
      .note-meta {
        color: white;
      }
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        flex: 1;
      }
      
      .note-actions {
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
    }
    
    &:hover .note-actions {
      opacity: 1;
    }
    
    .note-preview {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .note-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .note-tags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      
      .note-time {
        font-size: 12px;
        color: var(--text-tertiary);
      }
    }
    
    .note-links {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--primary-color);
    }
  }
}

.notes-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  overflow-y: auto;
  
  .note-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
      border-color: var(--primary-color);
    }
    
    .note-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .note-card-content {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .note-card-footer {
      .note-tags {
        display: flex;
        gap: 4px;
        align-items: center;
        
        .more-tags {
          font-size: 12px;
          color: var(--text-tertiary);
        }
      }
    }
  }
}

.note-editor {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 响应式设计
@media (max-width: 1200px) {
  .notes-sidebar {
    width: 350px;
  }
}

@media (max-width: 1024px) {
  .knowledge-content {
    flex-direction: column;
  }
  
  .notes-sidebar {
    width: 100%;
    height: 300px;
  }
  
  .note-editor {
    height: calc(100% - 320px);
  }
}
</style>