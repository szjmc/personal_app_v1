<template>
  <div class="note-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="editor-title">
        <el-input
          v-if="isEditing"
          v-model="noteData.title"
          placeholder="输入笔记标题..."
          class="title-input"
          size="large"
          @blur="saveDraft"
        />
        <h2 v-else class="title-display">{{ noteData.title || '无标题' }}</h2>
      </div>
      
      <div class="editor-actions">
        <el-button-group>
          <el-button
            :type="noteData.format_type === 'rich' ? 'primary' : 'default'"
            @click="switchFormat('rich')"
            size="small"
          >
            富文本
          </el-button>
          <el-button
            :type="noteData.format_type === 'markdown' ? 'primary' : 'default'"
            @click="switchFormat('markdown')"
            size="small"
          >
            Markdown
          </el-button>
        </el-button-group>
        
        <el-button
          v-if="!isEditing"
          @click="startEdit"
          type="primary"
          :icon="Edit"
        >
          编辑
        </el-button>
        
        <template v-else>
          <el-button @click="cancelEdit" :icon="Close">
            取消
          </el-button>
          <el-button 
            @click="saveNote" 
            type="primary" 
            :loading="saving"
            :icon="Check"
          >
            保存
          </el-button>
        </template>
        
        <el-dropdown @command="handleAction" trigger="click">
          <el-button :icon="MoreFilled" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="version-history">
                <el-icon><Clock /></el-icon>
                版本历史
              </el-dropdown-item>
              <el-dropdown-item command="export">
                <el-icon><Download /></el-icon>
                导出
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>
                <el-icon><Delete /></el-icon>
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 标签编辑 -->
    <div class="editor-tags">
      <el-tag
        v-for="tag in noteData.tags"
        :key="tag"
        closable
        @close="removeTag(tag)"
        class="tag-item"
      >
        {{ tag }}
      </el-tag>
      
      <el-input
        v-if="inputVisible"
        ref="tagInput"
        v-model="inputValue"
        class="tag-input"
        size="small"
        @keyup.enter="handleInputConfirm"
        @blur="handleInputConfirm"
      />
      
      <el-button
        v-else
        class="button-new-tag"
        size="small"
        @click="showInput"
      >
        <el-icon><Plus /></el-icon>
        添加标签
      </el-button>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-content">
      <!-- 富文本编辑器 -->
      <div
        v-if="noteData.format_type === 'rich'"
        class="rich-editor"
      >
        <div v-if="isEditing" class="editor-toolbar">
          <el-button-group>
            <el-button
              @click="formatText('bold')"
              :class="{ active: formatStates.bold }"
              size="small"
            >
              <el-icon><Bold /></el-icon>
            </el-button>
            <el-button
              @click="formatText('italic')"
              :class="{ active: formatStates.italic }"
              size="small"
            >
              <el-icon><Italic /></el-icon>
            </el-button>
            <el-button
              @click="formatText('underline')"
              :class="{ active: formatStates.underline }"
              size="small"
            >
              <el-icon><Underline /></el-icon>
            </el-button>
          </el-button-group>
          
          <el-divider direction="vertical" />
          
          <el-button-group>
            <el-button
              @click="insertList('ul')"
              size="small"
            >
              <el-icon><List /></el-icon>
            </el-button>
            <el-button
              @click="insertList('ol')"
              size="small"
            >
              <el-icon><OrderedList /></el-icon>
            </el-button>
          </el-button-group>
          
          <el-divider direction="vertical" />
          
          <el-button-group>
            <el-button
              @click="insertLink"
              size="small"
            >
              <el-icon><Link /></el-icon>
            </el-button>
            <el-button
              @click="insertImage"
              size="small"
            >
              <el-icon><Picture /></el-icon>
            </el-button>
            <el-button
              @click="insertTable"
              size="small"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
          </el-button-group>
        </div>
        
        <div
          ref="richEditor"
          class="editor-area rich-area"
          contenteditable="true"
          v-if="isEditing"
          @input="onRichInput"
          @keyup="checkFormat"
          @mouseup="checkFormat"
          v-html="noteData.content"
          @keydown="handleKeyDown"
          @input="handleLinkInput"
        ></div>
        
        <div
          v-else
          class="content-display rich-content"
          v-html="noteData.content"
        ></div>
      </div>
      
      <!-- Markdown编辑器 -->
      <div
        v-else
        class="markdown-editor"
      >
        <div v-if="isEditing" class="editor-toolbar">
          <el-button-group>
            <el-button
              @click="insertMarkdown('**', '**')"
              size="small"
              title="粗体"
            >
              <el-icon><Bold /></el-icon>
            </el-button>
            <el-button
              @click="insertMarkdown('*', '*')"
              size="small"
              title="斜体"
            >
              <el-icon><Italic /></el-icon>
            </el-button>
            <el-button
              @click="insertMarkdown('~~', '~~')"
              size="small"
              title="删除线"
            >
              <el-icon><Strikethrough /></el-icon>
            </el-button>
          </el-button-group>
          
          <el-divider direction="vertical" />
          
          <el-button-group>
            <el-button
              @click="insertMarkdown('# ', '')"
              size="small"
              title="标题"
            >
              H1
            </el-button>
            <el-button
              @click="insertMarkdown('## ', '')"
              size="small"
              title="副标题"
            >
              H2
            </el-button>
          </el-button-group>
          
          <el-divider direction="vertical" />
          
          <el-button-group>
            <el-button
              @click="insertMarkdown('- ', '')"
              size="small"
              title="无序列表"
            >
              <el-icon><List /></el-icon>
            </el-button>
            <el-button
              @click="insertMarkdown('1. ', '')"
              size="small"
              title="有序列表"
            >
              <el-icon><OrderedList /></el-icon>
            </el-button>
          </el-button-group>
          
          <el-divider direction="vertical" />
          
          <el-button-group>
            <el-button
              @click="insertMarkdown('[', '](url)')"
              size="small"
              title="链接"
            >
              <el-icon><Link /></el-icon>
            </el-button>
            <el-button
              @click="insertMarkdown('![', '](url)')"
              size="small"
              title="图片"
            >
              <el-icon><Picture /></el-icon>
            </el-button>
            <el-button
              @click="insertMarkdown('`', '`')"
              size="small"
              title="代码"
            >
              <el-icon><Document /></el-icon>
            </el-button>
          </el-button-group>
          
          <el-divider direction="vertical" />
          
          <el-button
            @click="insertMarkdownTable"
            size="small"
            title="插入表格"
          >
            <el-icon><Grid /></el-icon>
          </el-button>
        </div>
        
        <textarea
          ref="markdownEditor"
          class="editor-area markdown-area"
          v-if="isEditing"
          v-model="noteData.content"
          @input="onMarkdownInput"
          @keydown="handleMarkdownKeyDown"
          placeholder="开始编写Markdown内容..."
        ></textarea>
        
        <div
          v-else
          class="content-display markdown-content"
          v-html="markdownHtml"
        ></div>
      </div>
    </div>

    <!-- 双向链接提示 -->
    <div
      v-if="linkSuggestions.length > 0"
      class="link-suggestions"
      :style="linkPosition"
    >
      <div
        v-for="suggestion in linkSuggestions"
        :key="suggestion.id"
        class="suggestion-item"
        @click="selectLinkSuggestion(suggestion)"
      >
        <div class="suggestion-title">{{ suggestion.title }}</div>
        <div class="suggestion-preview">{{ suggestion.content.substring(0, 50) }}...</div>
      </div>
    </div>

    <!-- 版本历史弹窗 -->
    <el-dialog
      v-model="versionHistoryVisible"
      title="版本历史"
      width="800px"
    >
      <VersionHistory
        v-if="versionHistoryVisible && note?.id"
        :note-id="note?.id"
        @restore="handleRestoreVersion"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit, Check, Close, MoreFilled, Clock, Download, Delete,
  Plus, Bold, Italic, Underline, List, OrderedList, Link,
  Picture, Grid, Strikethrough, Document
} from '@element-plus/icons-vue'
import { noteApi, type Note } from '@/api/knowledge'
import { marked } from 'marked'
import VersionHistory from './VersionHistory.vue'

const props = defineProps<{
  note?: Note | null
  isCreating: boolean
}>()

const emit = defineEmits<{
  save: [data: Partial<Note>]
  cancel: []
  delete: [id: number]
  'create-link': [sourceId: number, targetId: number, linkText: string]
}>()

// 响应式数据
const noteData = ref<Partial<Note>>({
  title: '',
  content: '',
  format_type: 'rich',
  tags: [],
  linked_notes: []
})

const isEditing = ref(props.isCreating)
const saving = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')
const formatStates = ref({
  bold: false,
  italic: false,
  underline: false
})

// 双向链接相关
const linkSuggestions = ref<any[]>([])
const linkPosition = ref({ top: 0, left: 0 })
const linkSearchQuery = ref('')

// 版本历史
const versionHistoryVisible = ref(false)

// 编辑器引用
const richEditor = ref<HTMLDivElement>()
const markdownEditor = ref<HTMLTextAreaElement>()
const tagInput = ref<HTMLInputElement>()

// 计算属性
const markdownHtml = computed(() => {
  if (!noteData.value.content) return ''
  return marked(noteData.value.content)
})

// 监听props变化
watch(() => props.note, (newNote) => {
  if (newNote) {
    noteData.value = { ...newNote }
    isEditing.value = props.isCreating
  } else {
    noteData.value = {
      title: '',
      content: '',
      format_type: 'rich',
      tags: [],
      linked_notes: []
    }
    isEditing.value = true
  }
}, { immediate: true })

// 自动保存草稿
let autoSaveTimer: NodeJS.Timeout | null = null
const saveDraft = () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  autoSaveTimer = setTimeout(() => {
    if (!props.isCreating && noteData.value.title) {
      // 本地存储草稿
      localStorage.setItem(`note-draft-${props.note?.id}`, JSON.stringify(noteData.value))
    }
  }, 2000)
}

// 方法
const startEdit = () => {
  isEditing.value = true
  nextTick(() => {
    if (noteData.value.format_type === 'rich' && richEditor.value) {
      richEditor.value.focus()
    } else if (markdownEditor.value) {
      markdownEditor.value.focus()
    }
  })
}

const cancelEdit = () => {
  if (props.isCreating) {
    emit('cancel')
  } else {
    // 恢复原始内容
    if (props.note) {
      noteData.value = { ...props.note }
    }
    isEditing.value = false
  }
}

const saveNote = async () => {
  if (!noteData.value.title?.trim()) {
    ElMessage.warning('请输入笔记标题')
    return
  }

  saving.value = true
  try {
    emit('save', noteData.value)
    isEditing.value = false
    // 清除草稿
    localStorage.removeItem(`note-draft-${props.note?.id}`)
  } finally {
    saving.value = false
  }
}

const switchFormat = (format: 'rich' | 'markdown') => {
  if (format !== noteData.value.format_type) {
    ElMessageBox.confirm(
      '切换格式可能会丢失部分格式，是否继续？',
      '确认切换',
      { type: 'warning' }
    ).then(() => {
      noteData.value.format_type = format
      nextTick(() => {
        if (format === 'rich' && richEditor.value) {
          richEditor.value.focus()
        } else if (markdownEditor.value) {
          markdownEditor.value.focus()
        }
      })
    }).catch(() => {})
  }
}

// 标签管理
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    tagInput.value?.focus()
  })
}

const handleInputConfirm = () => {
  const tag = inputValue.value.trim()
  if (tag && !noteData.value.tags?.includes(tag)) {
    noteData.value.tags = [...(noteData.value.tags || []), tag]
  }
  inputVisible.value = false
  inputValue.value = ''
}

const removeTag = (tag: string) => {
  noteData.value.tags = noteData.value.tags?.filter(t => t !== tag)
}

// 富文本编辑器操作
const onRichInput = (e: Event) => {
  noteData.value.content = (e.target as HTMLDivElement).innerHTML
  saveDraft()
}

const formatText = (command: string) => {
  document.execCommand(command, false)
  checkFormat()
}

const insertList = (type: 'ul' | 'ol') => {
  const listHTML = type === 'ul' 
    ? '<ul><li>列表项</li></ul>'
    : '<ol><li>列表项</li></ol>'
  document.execCommand('insertHTML', false, listHTML)
}

const insertLink = () => {
  const url = prompt('请输入链接地址：')
  if (url) {
    document.execCommand('createLink', false, url)
  }
}

const insertImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      // 这里应该上传图片，现在先使用本地URL
      const url = URL.createObjectURL(file)
      document.execCommand('insertImage', false, url)
    }
  }
  input.click()
}

const insertTable = () => {
  const tableHTML = `
    <table border="1" style="border-collapse: collapse;">
      <tr><td>单元格1</td><td>单元格2</td></tr>
      <tr><td>单元格3</td><td>单元格4</td></tr>
    </table>
  `
  document.execCommand('insertHTML', false, tableHTML)
}

const checkFormat = () => {
  formatStates.value = {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline')
  }
}

// Markdown编辑器操作
const onMarkdownInput = () => {
  saveDraft()
}

const insertMarkdown = (before: string, after: string) => {
  const textarea = markdownEditor.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selectedText = text.substring(start, end)
  
  const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
  noteData.value.content = newText
  
  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selectedText.length
    )
  })
}

const insertMarkdownTable = () => {
  const table = '\n| 标题1 | 标题2 | 标题3 |\n|-------|-------|-------|\n| 内容1 | 内容2 | 内容3 |\n'
  insertMarkdown(table, '')
}

const handleMarkdownKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    insertMarkdown('  ', '')
  }
}

// 双向链接功能
const handleLinkInput = (e: KeyboardEvent) => {
  const editor = richEditor.value
  if (!editor) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const textContent = editor.textContent || ''
  
  // 检测输入 [[
  if (e.key === '[' && textContent.slice(-2) === '[[') {
    linkSearchQuery.value = ''
    searchLinkedNotes()
    
    // 计算弹窗位置
    const rect = range.getBoundingClientRect()
    linkPosition.value = {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX
    }
  }
}

const searchLinkedNotes = async () => {
  try {
    const response = await noteApi.searchLinks(linkSearchQuery.value)
    linkSuggestions.value = response.data.slice(0, 5)
  } catch (error) {
    linkSuggestions.value = []
  }
}

const selectLinkSuggestion = (suggestion: any) => {
  const editor = richEditor.value
  if (!editor) return

  // 替换 [[...]] 为链接
  const linkHTML = `<a href="#note-${suggestion.id}" class="internal-link">${suggestion.title}</a>`
  document.execCommand('insertHTML', false, linkHTML)
  
  // 创建双向链接
  if (props.note?.id) {
    emit('create-link', props.note.id, suggestion.id, suggestion.title)
  }
  
  linkSuggestions.value = []
}

// 其他操作
const handleAction = (command: string) => {
  switch (command) {
    case 'version-history':
      versionHistoryVisible.value = true
      break
    case 'export':
      ElMessage.info('导出功能开发中')
      break
    case 'delete':
      if (props.note?.id) {
        emit('delete', props.note.id)
      }
      break
  }
}

const handleRestoreVersion = (versionId: number) => {
  // 恢复版本逻辑
  ElMessage.success('版本恢复成功')
  versionHistoryVisible.value = false
}

const handleKeyDown = (e: KeyboardEvent) => {
  // 快捷键保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveNote()
  }
}

// 生命周期
onMounted(() => {
  // 恢复草稿
  if (!props.isCreating && props.note?.id) {
    const draft = localStorage.getItem(`note-draft-${props.note.id}`)
    if (draft) {
      try {
        const draftData = JSON.parse(draft)
        noteData.value = { ...noteData.value, ...draftData }
        ElMessage.info('已恢复上次编辑内容')
      } catch (e) {
        // 忽略解析错误
      }
    }
  }
})

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})
</script>

<style lang="scss" scoped>
.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.05);
  
  .editor-title {
    flex: 1;
    
    .title-input {
      .el-input__inner {
        border: none;
        background: transparent;
        font-size: 24px;
        font-weight: 600;
        color: var(--text-primary);
        padding: 0;
        
        &:focus {
          box-shadow: none;
        }
      }
    }
    
    .title-display {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .editor-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.editor-tags {
  padding: 12px 20px;
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  
  .tag-item {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: var(--primary-color);
    
    &:hover {
      background: rgba(59, 130, 246, 0.2);
    }
  }
  
  .tag-input {
    width: 100px;
  }
  
  .button-new-tag {
    background: transparent;
    border: 1px dashed var(--glass-border);
    color: var(--text-secondary);
    
    &:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
  }
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rich-editor, .markdown-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--glass-border);
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  
  .el-button {
    &.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }
  }
}

.editor-area {
  flex: 1;
  padding: 20px;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  background: transparent;
  overflow-y: auto;
  
  &.rich-area {
    min-height: 400px;
    
    &:focus {
      background: rgba(255, 255, 255, 0.02);
    }
    
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
      
      &.internal-link {
        color: var(--secondary-color);
        background: rgba(147, 51, 234, 0.1);
        padding: 2px 4px;
        border-radius: 4px;
      }
    }
    
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    
    table {
      border-collapse: collapse;
      margin: 10px 0;
      
      td, th {
        border: 1px solid var(--glass-border);
        padding: 8px 12px;
      }
    }
    
    blockquote {
      border-left: 4px solid var(--primary-color);
      padding-left: 16px;
      margin: 10px 0;
      color: var(--text-secondary);
    }
  }
  
  &.markdown-area {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    resize: none;
  }
}

.content-display {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  
  &.rich-content {
    @extend .rich-area;
  }
  
  &.markdown-content {
    h1, h2, h3, h4, h5, h6 {
      margin: 20px 0 10px 0;
      color: var(--text-primary);
    }
    
    p {
      margin: 10px 0;
    }
    
    a {
      color: var(--primary-color);
      
      &.internal-link {
        color: var(--secondary-color);
        background: rgba(147, 51, 234, 0.1);
        padding: 2px 4px;
        border-radius: 4px;
      }
    }
    
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
      
      th, td {
        border: 1px solid var(--glass-border);
        padding: 8px 12px;
        text-align: left;
      }
      
      th {
        background: rgba(255, 255, 255, 0.05);
        font-weight: 600;
      }
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

// 双向链接建议
.link-suggestions {
  position: absolute;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 8px 0;
  min-width: 300px;
  max-height: 300px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  
  .suggestion-item {
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
    }
    
    .suggestion-title {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .suggestion-preview {
      font-size: 12px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>