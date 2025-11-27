<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="formRules"
    label-position="top"
  >
    <el-form-item label="任务标题" prop="title">
      <el-input
        v-model="form.title"
        placeholder="请输入任务标题"
        @input="validateTitle"
      />
    </el-form-item>

    <el-form-item label="任务描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="请输入任务描述"
      />
    </el-form-item>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="form.priority" placeholder="选择优先级">
            <el-option label="高优先级" value="high" />
            <el-option label="中优先级" value="medium" />
            <el-option label="低优先级" value="low" />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="截止时间" prop="due_date">
          <el-date-picker
            v-model="form.due_date"
            type="datetime"
            placeholder="选择截止时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="所属项目" prop="project">
          <el-select v-model="form.project" placeholder="选择项目" clearable>
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="指派给" prop="assignee">
          <el-select v-model="form.assignee" placeholder="选择指派人" clearable>
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 子任务 -->
    <el-form-item label="子任务">
      <div class="subtasks">
        <div
          v-for="(subtask, index) in form.subtasks"
          :key="index"
          class="subtask-item"
        >
          <el-input
            v-model="subtask.title"
            placeholder="输入子任务标题"
            class="subtask-input"
          />
          <el-button
            type="text"
            @click="removeSubtask(index)"
            class="remove-btn"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <el-button type="text" @click="addSubtask" class="add-subtask-btn">
          <el-icon><Plus /></el-icon>
          添加子任务
        </el-button>
      </div>
    </el-form-item>

    <!-- 标签 -->
    <el-form-item label="标签">
      <div class="tags">
        <el-tag
          v-for="tag in form.tags"
          :key="tag"
          closable
          @close="removeTag(tag)"
          class="tag-item"
        >
          {{ tag }}
        </el-tag>
        <el-input
          v-if="tagInputVisible"
          ref="tagInputRef"
          v-model="tagInputValue"
          size="small"
          class="tag-input"
          @keyup.enter="addTag"
          @blur="addTag"
        />
        <el-button
          v-else
          size="small"
          @click="showTagInput"
        >
          <el-icon><Plus /></el-icon>
          添加标签
        </el-button>
      </div>
    </el-form-item>

    <el-form-item>
      <div class="form-actions">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          创建任务
        </el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { projectsApi } from '@/api/tasks'
import type { FormInstance, FormRules } from 'element-plus'

const emit = defineEmits(['submit', 'cancel'])

const formRef = ref<FormInstance>()
const tagInputRef = ref()
const submitting = ref(false)
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const projects = ref([])
const users = ref([])

// 最近使用的标签（从本地存储获取）
const recentTags = ref<string[]>(JSON.parse(localStorage.getItem('recentTags') || '[]'))

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  due_date: '',
  project: '',
  assignee: '',
  subtasks: [{ title: '' }],
  tags: []
})

const formRules: FormRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, message: '标题至少2个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

// 方法
const validateTitle = () => {
  if (formRef.value) {
    formRef.value.validateField('title')
  }
}

const addSubtask = () => {
  form.subtasks.push({ title: '' })
}

const removeSubtask = (index: number) => {
  form.subtasks.splice(index, 1)
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    updateRecentTags(tag)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  }
}

const updateRecentTags = (tag: string) => {
  // 更新最近使用的标签
  const index = recentTags.value.indexOf(tag)
  if (index > -1) {
    recentTags.value.splice(index, 1)
  }
  recentTags.value.unshift(tag)
  if (recentTags.value.length > 10) {
    recentTags.value = recentTags.value.slice(0, 10)
  }
  localStorage.setItem('recentTags', JSON.stringify(recentTags.value))
}

const loadProjects = async () => {
  try {
    projects.value = await projectsApi.getProjects()
  } catch (error) {
    console.error('Load projects error:', error)
  }
}

const loadUsers = async () => {
  // 这里应该从API获取用户列表
  // 暂时使用模拟数据
  users.value = [
    { id: '1', username: '张三' },
    { id: '2', username: '李四' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true
        
        // 处理子任务数据
        const filteredSubtasks = form.subtasks
          .filter(subtask => subtask.title.trim())
          .map(subtask => subtask.title)

        const taskData = {
          ...form,
          subtasks: filteredSubtasks
        }

        emit('submit', taskData)
      } catch (error) {
        ElMessage.error('提交失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadProjects()
  loadUsers()
  
  // 如果有最近使用的标签，优先显示
  if (recentTags.value.length > 0) {
    form.tags = recentTags.value.slice(0, 3)
  }
})
</script>

<style lang="scss" scoped>
:deep(.el-form-item__label) {
  color: white;
}

.subtasks {
  width: 100%;
  
  .subtask-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    .subtask-input {
      flex: 1;
    }
    
    .remove-btn {
      color: $danger-color;
      
      &:hover {
        background: rgba($danger-color, 0.1);
      }
    }
  }
  
  .add-subtask-btn {
    color: var(--el-color-primary);
    
    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.1);
    }
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  
  .tag-item {
    margin-right: 8px;
    margin-bottom: 8px;
  }
  
  .tag-input {
    width: 90px;
    margin-right: 8px;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>