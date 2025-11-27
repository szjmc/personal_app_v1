<template>
  <div class="task-board">
    <div class="board-header">
      <div class="header-left">
        <h1>任务看板</h1>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
      </div>
      
      <div class="header-right">
        <el-select v-model="selectedProject" placeholder="选择项目" clearable>
          <el-option
            v-for="project in projects"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          />
        </el-select>
      </div>
    </div>

    <!-- 看板视图 -->
    <div class="board-container" v-loading="loading">
      <div
        v-for="column in boardColumns"
        :key="column.key"
        class="board-column"
        :class="`column-${column.key}`"
      >
        <div class="column-header">
          <h3>{{ column.title }}</h3>
          <el-badge :value="column.tasks.length" class="column-badge" />
        </div>
        
        <div 
          class="column-content"
          :class="{ 'column-empty': column.tasks.length === 0 }"
        >
          <Draggable
            v-model="column.tasks"
            :group="{ name: 'tasks' }"
            item-key="id"
            @end="handleDragEnd"
          >
            <template #item="{ element: task }">
              <div
                class="task-card"
                :class="{ 'task-overdue': task.is_overdue }"
                @click="openTaskDetail(task)"
              >
                <div class="task-header">
                  <el-tag
                    :type="getPriorityType(task.priority)"
                    size="small"
                  >
                    {{ getPriorityText(task.priority) }}
                  </el-tag>
                  <el-dropdown @command="(command) => handleTaskCommand(command, task)">
                    <el-button type="text" class="task-menu">
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                
                <h4 class="task-title">{{ task.title }}</h4>
                
                <p v-if="task.description" class="task-description">
                  {{ task.description.substring(0, 100) }}{{ task.description.length > 100 ? '...' : '' }}
                </p>
                
                <div class="task-meta">
                  <div v-if="task.due_date" class="task-due">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(task.due_date) }}
                  </div>
                  
                  <div class="task-assignee">
                    <el-avatar :size="24" :src="task.assignee_avatar">
                      {{ task.assignee_name?.charAt(0) }}
                    </el-avatar>
                  </div>
                </div>
                
                <!-- 子任务进度 -->
                <div v-if="task.children_count > 0" class="task-progress">
                  <el-progress
                    :percentage="task.completion_rate"
                    :show-text="false"
                    :stroke-width="4"
                  />
                  <span class="progress-text">{{ task.children_count }} 个子任务</span>
                </div>
              </div>
            </template>
          </Draggable>
          
          <!-- 空状态 -->
          <div v-if="column.tasks.length === 0" class="column-empty">
            <el-empty description="暂无任务" :image-size="60" />
          </div>
        </div>
      </div>
    </div>

    <!-- 创建任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建任务"
      width="600px"
      :before-close="handleDialogClose"
    >
      <TaskForm
        v-if="showCreateDialog"
        @submit="handleCreateTask"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="currentTask?.title"
      width="800px"
      destroy-on-close
    >
      <TaskDetail
        v-if="showDetailDialog && currentTask"
        :task="currentTask"
        @update="handleTaskUpdate"
        @close="showDetailDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tasksApi, projectsApi } from '@/api/tasks'
import Draggable from 'vuedraggable'
import {
  Plus,
  Calendar,
  MoreFilled
} from '@element-plus/icons-vue'
import TaskForm from '@/components/tasks/TaskForm.vue'
import TaskDetail from '@/components/tasks/TaskDetail.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

// 响应式数据
const loading = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const selectedProject = ref('')
const currentTask = ref<any>(null)
const projects = ref([])

// 看板列配置
const boardColumns = reactive([
  {
    key: 'todo',
    title: '待办',
    tasks: []
  },
  {
    key: 'in_progress',
    title: '进行中',
    tasks: []
  },
  {
    key: 'blocked',
    title: '阻塞',
    tasks: []
  },
  {
    key: 'completed',
    title: '已完成',
    tasks: []
  }
])

// 方法
const loadBoardData = async () => {
  try {
    loading.value = true
    const data = await tasksApi.getBoard()
    
    // 清空各列任务
    boardColumns.forEach(column => {
      column.tasks = []
    })
    
    // 按状态分配任务到各列
    Object.entries(data).forEach(([status, tasks]) => {
      const column = boardColumns.find(col => col.key === status)
      if (column) {
        column.tasks = tasks
      }
    })
  } catch (error) {
    ElMessage.error('加载任务失败')
  } finally {
    loading.value = false
  }
}

const loadProjects = async () => {
  try {
    projects.value = await projectsApi.getProjects()
  } catch (error) {
    console.error('Load projects error:', error)
  }
}

const handleDragEnd = async (event: any) => {
  const { item, newIndex, oldIndex, from, to } = event
  
  // 如果没有改变位置，不做处理
  if (from === to && newIndex === oldIndex) {
    return
  }
  
  const taskId = item.dataset.taskId
  const newStatus = to.dataset.column
  
  try {
    await tasksApi.updateStatus(taskId, newStatus)
    ElMessage.success('任务状态更新成功')
  } catch (error) {
    // 失败时恢复原位置
    loadBoardData()
    ElMessage.error('状态更新失败')
  }
}

const openTaskDetail = (task: any) => {
  currentTask.value = task
  showDetailDialog.value = true
}

const handleCreateTask = async (taskData: any) => {
  try {
    await tasksApi.createTask(taskData)
    ElMessage.success('任务创建成功')
    showCreateDialog.value = false
    loadBoardData()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const handleTaskUpdate = (updatedTask: any) => {
  // 更新本地数据
  const column = boardColumns.find(col => col.key === updatedTask.status)
  if (column) {
    const index = column.tasks.findIndex(task => task.id === updatedTask.id)
    if (index !== -1) {
      column.tasks[index] = updatedTask
    }
  }
}

const handleTaskCommand = async (command: string, task: any) => {
  switch (command) {
    case 'edit':
      openTaskDetail(task)
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这个任务吗？', '确认删除', {
          type: 'warning'
        })
        await tasksApi.deleteTask(task.id)
        ElMessage.success('删除成功')
        loadBoardData()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
      break
  }
}

const handleDialogClose = () => {
  showCreateDialog.value = false
}

const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
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
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[priority] || '未知'
}

onMounted(() => {
  loadBoardData()
  loadProjects()
})
</script>

<style lang="scss" scoped>
.task-board {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    h1 {
      color: white;
      font-size: $font-size-2xl;
      font-weight: 600;
      @include gradient-text;
    }
  }
  
  .header-right {
    .el-select {
      width: 200px;
    }
  }
}

.board-container {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  min-height: 0;
  
  @include respond-to(lg) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @include respond-to(sm) {
    grid-template-columns: 1fr;
  }
}

.board-column {
  @include glass-effect;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  
  .column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    h3 {
      color: white;
      font-weight: 600;
      margin: 0;
    }
    
    .column-badge {
      :deep(.el-badge__content) {
        background-color: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
      }
    }
  }
  
  .column-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    
    &.column-empty {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }
  }
}

.task-card {
  @include glass-effect;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all $transition-fast ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
  
  &.task-overdue {
    border-left: 3px solid $danger-color;
  }
  
  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .task-menu {
      color: rgba(255, 255, 255, 0.6);
      
      &:hover {
        color: white;
      }
    }
  }
  
  .task-title {
    font-weight: 500;
    color: white;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .task-description {
    color: rgba(255, 255, 255, 0.7);
    font-size: $font-size-sm;
    line-height: 1.4;
    margin-bottom: 12px;
  }
  
  .task-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .task-due {
      display: flex;
      align-items: center;
      gap: 4px;
      color: rgba(255, 255, 255, 0.6);
      font-size: $font-size-sm;
    }
  }
  
  .task-progress {
    .progress-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: $font-size-xs;
      margin-top: 4px;
      display: block;
    }
  }
}

.column-empty {
  .el-empty {
    :deep(.el-empty__description) {
      color: rgba(255, 255, 255, 0.6);
    }
  }
}
</style>