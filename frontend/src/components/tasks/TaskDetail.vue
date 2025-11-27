<template>
  <div class="task-detail">
    <!-- 任务基本信息 -->
    <div class="task-header">
      <div class="task-title-section">
        <h2>{{ task.title }}</h2>
        <div class="task-meta">
          <el-tag :type="getPriorityType(task.priority)">
            {{ getPriorityText(task.priority) }}
          </el-tag>
          <el-tag :type="getStatusType(task.status)">
            {{ getStatusText(task.status) }}
          </el-tag>
        </div>
      </div>
      
      <div class="task-actions">
        <el-button @click="editMode = !editMode">
          <el-icon><Edit /></el-icon>
          {{ editMode ? '取消编辑' : '编辑' }}
        </el-button>
      </div>
    </div>

    <!-- 编辑模式 -->
    <div v-if="editMode" class="edit-form">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="任务描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="优先级">
              <el-select v-model="editForm.priority">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="editForm.status">
                <el-option label="待办" value="todo" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="阻塞" value="blocked" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="截止时间">
              <el-date-picker
                v-model="editForm.due_date"
                type="datetime"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" @click="saveChanges">保存修改</el-button>
          <el-button @click="editMode = false">取消</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 查看模式 -->
    <div v-else class="task-content">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="创建者">
          {{ task.creator_name }}
        </el-descriptions-item>
        <el-descriptions-item label="指派给">
          {{ task.assignee_name || '未指派' }}
        </el-descriptions-item>
        <el-descriptions-item label="截止时间">
          {{ task.due_date ? formatDate(task.due_date) : '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(task.created_at) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <div v-if="task.description" class="task-description">
        <h3>任务描述</h3>
        <div class="description-content" v-html="task.description"></div>
      </div>
    </div>

    <!-- 子任务 -->
    <div v-if="subtasks.length > 0" class="subtasks-section">
      <h3>子任务</h3>
      <div class="subtasks">
        <div
          v-for="subtask in subtasks"
          :key="subtask.id"
          class="subtask-item"
        >
          <el-checkbox
            :model-value="subtask.status === 'completed'"
            @change="toggleSubtask(subtask)"
          />
          <span class="subtask-title">{{ subtask.title }}</span>
          <el-tag size="small" :type="getStatusType(subtask.status)">
            {{ getStatusText(subtask.status) }}
          </el-tag>
        </div>
      </div>
      
      <!-- 子任务进度 -->
      <div class="subtask-progress">
        <el-progress
          :percentage="task.completion_rate"
          :format="(percentage) => `完成率 ${percentage}%`"
        />
      </div>
    </div>

    <!-- 评论区 -->
    <div class="comments-section">
      <h3>评论</h3>
      
      <!-- 添加评论 -->
      <div class="add-comment">
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="2"
          placeholder="添加评论..."
          @keyup.ctrl.enter="addComment"
        />
        <el-button type="primary" @click="addComment" :loading="commentLoading">
          发送评论 (Ctrl+Enter)
        </el-button>
      </div>
      
      <!-- 评论列表 -->
      <div v-if="comments.length > 0" class="comments-list">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
        >
          <el-avatar :size="32">{{ comment.author_name?.charAt(0) }}</el-avatar>
          <div class="comment-content">
            <div class="comment-header">
              <span class="author">{{ comment.author_name }}</span>
              <span class="time">{{ formatDate(comment.created_at) }}</span>
            </div>
            <div class="comment-text">{{ comment.content }}</div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-comments">
        <el-empty description="暂无评论" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { tasksApi } from '@/api/tasks'
import dayjs from 'dayjs'

interface Props {
  task: any
}

const props = defineProps<Props>()
const emit = defineEmits(['update', 'close'])

// 响应式数据
const editMode = ref(false)
const commentLoading = ref(false)
const newComment = ref('')
const subtasks = ref([])
const comments = ref([])

const editForm = reactive({
  description: '',
  priority: '',
  status: '',
  due_date: ''
})

// 监听任务变化，更新编辑表单
watch(() => props.task, (newTask) => {
  if (newTask) {
    Object.assign(editForm, {
      description: newTask.description,
      priority: newTask.priority,
      status: newTask.status,
      due_date: newTask.due_date
    })
    loadSubtasks()
    loadComments()
  }
}, { immediate: true })

// 方法
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getPriorityType = (priority: string) => {
  const types: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[priority] || 'info'
}

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return texts[priority] || '未知'
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    todo: 'info',
    in_progress: 'warning',
    blocked: 'danger',
    completed: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    blocked: '阻塞',
    completed: '已完成'
  }
  return texts[status] || '未知'
}

const saveChanges = async () => {
  try {
    await tasksApi.updateTask(props.task.id, editForm)
    ElMessage.success('保存成功')
    editMode.value = false
    emit('update', { ...props.task, ...editForm })
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const loadSubtasks = async () => {
  try {
    // 这里应该加载子任务数据
    // subtasks.value = await tasksApi.getSubtasks(props.task.id)
    subtasks.value = []
  } catch (error) {
    console.error('Load subtasks error:', error)
  }
}

const loadComments = async () => {
  try {
    // 这里应该加载评论数据
    // comments.value = await tasksApi.getComments(props.task.id)
    comments.value = []
  } catch (error) {
    console.error('Load comments error:', error)
  }
}

const toggleSubtask = async (subtask: any) => {
  try {
    const newStatus = subtask.status === 'completed' ? 'todo' : 'completed'
    await tasksApi.updateTask(subtask.id, { status: newStatus })
    subtask.status = newStatus
    ElMessage.success('子任务状态更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const addComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    commentLoading.value = true
    await tasksApi.addComment(props.task.id, newComment.value)
    newComment.value = ''
    loadComments()
    ElMessage.success('评论添加成功')
  } catch (error) {
    ElMessage.error('评论添加失败')
  } finally {
    commentLoading.value = false
  }
}

onMounted(() => {
  loadSubtasks()
  loadComments()
})
</script>

<style lang="scss" scoped>
.task-detail {
  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .task-title-section {
      h2 {
        color: white;
        margin-bottom: 12px;
      }
      
      .task-meta {
        display: flex;
        gap: 8px;
      }
    }
  }
  
  .edit-form {
    @include glass-effect;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  .task-content {
    margin-bottom: 32px;
    
    :deep(.el-descriptions__label) {
      color: rgba(255, 255, 255, 0.7);
    }
    
    :deep(.el-descriptions__content) {
      color: white;
    }
  }
  
  .task-description {
    margin-top: 24px;
    
    h3 {
      color: white;
      margin-bottom: 12px;
    }
    
    .description-content {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      background: rgba(255, 255, 255, 0.05);
      padding: 16px;
      border-radius: 8px;
    }
  }
  
  .subtasks-section {
    margin-bottom: 32px;
    
    h3 {
      color: white;
      margin-bottom: 16px;
    }
    
    .subtasks {
      @include glass-effect;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .subtask-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      
      &:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .subtask-title {
        flex: 1;
        color: white;
      }
    }
    
    .subtask-progress {
      :deep(.el-progress-bar__outer) {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
  
  .comments-section {
    h3 {
      color: white;
      margin-bottom: 16px;
    }
    
    .add-comment {
      @include glass-effect;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      
      .el-textarea {
        margin-bottom: 12px;
      }
    }
    
    .comments-list {
      .comment-item {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        
        .comment-content {
          flex: 1;
          
          .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            
            .author {
              color: white;
              font-weight: 500;
            }
            
            .time {
              color: rgba(255, 255, 255, 0.6);
              font-size: $font-size-sm;
            }
          }
          
          .comment-text {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.5;
            background: rgba(255, 255, 255, 0.05);
            padding: 12px;
            border-radius: 8px;
          }
        }
      }
    }
    
    .no-comments {
      text-align: center;
      padding: 32px 0;
      
      :deep(.el-empty__description) {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}
</style>