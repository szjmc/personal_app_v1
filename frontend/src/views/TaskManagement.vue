<template>
  <div style="padding: 20px; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 1200px; margin: 0 auto;">
      <!-- 头部 -->
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="color: #333; margin-bottom: 5px;">📋 任务管理</h1>
          <p style="color: #666; margin: 0;">管理您的日常任务和待办事项</p>
        </div>
        <button @click="showAddTask = true" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          + 添加任务
        </button>
      </div>

      <!-- 任务统计 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #667eea; margin: 0 0 10px 0;">{{ totalTasks }}</h3>
          <p style="color: #666; margin: 0;">总任务数</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #10b981; margin: 0 0 10px 0;">{{ completedTasks }}</h3>
          <p style="color: #666; margin: 0;">已完成</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #f59e0b; margin: 0 0 10px 0;">{{ pendingTasks }}</h3>
          <p style="color: #666; margin: 0;">进行中</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #ef4444; margin: 0 0 10px 0;">{{ urgentTasks }}</h3>
          <p style="color: #666; margin: 0;">紧急任务</p>
        </div>
      </div>

      <!-- 筛选和排序 -->
      <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <select v-model="filterStatus" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="all">全部状态</option>
          <option value="pending">进行中</option>
          <option value="completed">已完成</option>
        </select>
        
        <select v-model="filterPriority" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="all">全部优先级</option>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="urgent">紧急</option>
        </select>
        
        <input v-model="searchText" placeholder="搜索任务..." style="padding: 8px; border: 1px solid #ddd; border-radius: 6px; flex: 1; min-width: 200px;">
        
        <button @click="backToDashboard" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
          返回仪表盘
        </button>
      </div>

      <!-- 任务列表 -->
      <div style="display: grid; gap: 15px;">
        <div v-for="task in filteredTasks" :key="task.id" style="background: white; padding: 20px; border-radius: 12px; border-left: 4px solid; border-left-color: getPriorityColor(task.priority);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div style="flex: 1;">
              <h3 style="color: #333; margin: 0 0 5px 0;">{{ task.title }}</h3>
              <p style="color: #666; margin: 0; font-size: 14px;">{{ task.description }}</p>
            </div>
            <div style="display: flex; gap: 5px; align-items: center;">
              <span :style="getPriorityStyle(task.priority)" style="padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                {{ getPriorityText(task.priority) }}
              </span>
              <span :style="getStatusStyle(task.status)" style="padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                {{ getStatusText(task.status) }}
              </span>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #666; font-size: 12px;">
              📅 {{ task.dueDate }} | 🏷️ {{ task.category }}
            </div>
            <div style="display: flex; gap: 10px;">
              <button @click="editTask(task)" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                编辑
              </button>
              <button @click="toggleTaskStatus(task)" :style="task.status === 'completed' ? 'background: #ef4444;' : 'background: #10b981;'" style="padding: 6px 12px; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                {{ task.status === 'completed' ? '重新开始' : '标记完成' }}
              </button>
              <button @click="deleteTask(task)" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredTasks.length === 0" style="background: white; padding: 40px; border-radius: 12px; text-align: center;">
        <p style="color: #666; font-size: 16px;">📝 暂无任务，点击上方按钮添加您的第一个任务</p>
      </div>
    </div>

    <!-- 添加任务弹窗 -->
    <div v-if="showAddTask" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 500px;">
        <h2 style="color: #333; margin-top: 0;">{{ editingTask ? '编辑任务' : '添加新任务' }}</h2>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">任务标题</label>
          <input v-model="newTask.title" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入任务标题">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">任务描述</label>
          <textarea v-model="newTask.description" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 80px;" placeholder="输入任务描述"></textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">优先级</label>
            <select v-model="newTask.priority" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">分类</label>
            <select v-model="newTask.category" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="工作">工作</option>
              <option value="学习">学习</option>
              <option value="生活">生活</option>
              <option value="娱乐">娱乐</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">截止日期</label>
          <input v-model="newTask.dueDate" type="date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button @click="closeTaskModal" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
            取消
          </button>
          <button @click="saveTask" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            {{ editingTask ? '更新任务' : '添加任务' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showAddTask: false,
      editingTask: null,
      filterStatus: 'all',
      filterPriority: 'all',
      searchText: '',
      newTask: {
        title: '',
        description: '',
        priority: 'medium',
        category: '工作',
        dueDate: ''
      },
      tasks: [
        {
          id: 1,
          title: '完成项目文档',
          description: '编写项目的技术文档和用户手册',
          priority: 'high',
          status: 'pending',
          category: '工作',
          dueDate: '2024-12-25'
        },
        {
          id: 2,
          title: '学习Vue.js',
          description: '完成Vue.js在线课程',
          priority: 'medium',
          status: 'pending',
          category: '学习',
          dueDate: '2024-12-30'
        },
        {
          id: 3,
          title: '健身计划',
          description: '每周三次健身房锻炼',
          priority: 'low',
          status: 'completed',
          category: '生活',
          dueDate: '2024-12-20'
        },
        {
          id: 4,
          title: '紧急Bug修复',
          description: '修复生产环境的关键bug',
          priority: 'urgent',
          status: 'pending',
          category: '工作',
          dueDate: '2024-12-18'
        }
      ]
    }
  },
  computed: {
    filteredTasks() {
      let filtered = this.tasks
      
      if (this.filterStatus !== 'all') {
        filtered = filtered.filter(task => task.status === this.filterStatus)
      }
      
      if (this.filterPriority !== 'all') {
        filtered = filtered.filter(task => task.priority === this.filterPriority)
      }
      
      if (this.searchText) {
        filtered = filtered.filter(task => 
          task.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
          task.description.toLowerCase().includes(this.searchText.toLowerCase())
        )
      }
      
      return filtered
    },
    totalTasks() {
      return this.tasks.length
    },
    completedTasks() {
      return this.tasks.filter(task => task.status === 'completed').length
    },
    pendingTasks() {
      return this.tasks.filter(task => task.status === 'pending').length
    },
    urgentTasks() {
      return this.tasks.filter(task => task.priority === 'urgent').length
    }
  },
  methods: {
    saveTask() {
      if (!this.newTask.title) {
        alert('请输入任务标题')
        return
      }
      
      if (this.editingTask) {
        // 更新现有任务
        const index = this.tasks.findIndex(t => t.id === this.editingTask.id)
        if (index !== -1) {
          this.tasks[index] = {
            ...this.tasks[index],
            ...this.newTask
          }
        }
      } else {
        // 添加新任务
        const task = {
          id: Date.now(),
          ...this.newTask,
          status: 'pending'
        }
        this.tasks.unshift(task)
      }
      
      this.showAddTask = false
      this.resetNewTask()
    },
    editTask(task) {
      this.editingTask = task
      this.newTask = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate
      }
      this.showAddTask = true
    },
    closeTaskModal() {
      this.showAddTask = false
      this.editingTask = null
      this.resetNewTask()
    },
    resetNewTask() {
      this.newTask = {
        title: '',
        description: '',
        priority: 'medium',
        category: '工作',
        dueDate: ''
      }
    },
    deleteTask(task) {
      if (confirm(`确定要删除任务"${task.title}"吗？`)) {
        this.tasks = this.tasks.filter(t => t.id !== task.id)
      }
    },
    toggleTaskStatus(task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed'
    },
    backToDashboard() {
      this.$router.push('/dashboard')
    },
    getPriorityColor(priority) {
      const colors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444',
        urgent: '#dc2626'
      }
      return colors[priority] || '#667eea'
    },
    getPriorityStyle(priority) {
      const colors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444',
        urgent: '#dc2626'
      }
      return {
        background: colors[priority] + '20',
        color: colors[priority],
        border: `1px solid ${colors[priority] + '40'}`
      }
    },
    getPriorityText(priority) {
      const texts = {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '紧急'
      }
      return texts[priority] || priority
    },
    getStatusStyle(status) {
      if (status === 'completed') {
        return {
          background: '#10b98120',
          color: '#10b981',
          border: '1px solid #10b98140'
        }
      }
      return {
        background: '#f59e0b20',
        color: '#f59e0b',
        border: '1px solid #f59e0b40'
      }
    },
    getStatusText(status) {
      return status === 'completed' ? '已完成' : '进行中'
    }
  }
}
</script>