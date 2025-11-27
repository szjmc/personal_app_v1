<template>
  <div class="dashboard-container">
    <!-- 顶部固定栏 -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo">📊</div>
        <div class="header-title">
          <h1>个人管理应用仪表盘</h1>
        </div>
      </div>
      
      <div class="header-center">
        <div class="today-overview">
          <div class="overview-item">
            <span class="overview-label">今日任务</span>
            <span class="overview-value">3</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">今日事件</span>
            <span class="overview-value">2</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">健康评分</span>
            <span class="overview-value score">85</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">本月预算剩余</span>
            <span class="overview-value">60%</span>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <div class="header-actions">
          <el-button circle @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
          <el-button circle @click="handleQuickAdd">
            <el-icon><Plus /></el-icon>
          </el-button>
          <el-button circle @click="handleNotifications">
            <el-icon><Bell /></el-icon>
          </el-button>
          <el-button circle @click="handleSettings">
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>
      </div>
    </header>

    <!-- 中部核心数据区 -->
    <main class="dashboard-main">
      <!-- 任务管理卡片 -->
      <el-card class="dashboard-card task-card" @click="$router.push('/tasks')">
        <template #header>
          <div class="card-header">
            <h3>📋 任务管理</h3>
            <el-button type="text" @click.stop="handleQuickAddTask">快速添加</el-button>
          </div>
        </template>
        
        <div class="task-stats">
          <div class="stat-item">
            <span class="stat-label">今日待办</span>
            <div class="stat-value">
              <span class="priority-high">3🔥</span>
              <span class="priority-medium">2🔵</span>
              <span class="priority-low">1⚫</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-label">逾期任务</span>
            <span class="stat-value overdue">2</span>
          </div>
        </div>
        
        <div class="progress-section">
          <div class="progress-label">
            <span>任务完成进度</span>
            <span>5/8</span>
          </div>
          <el-progress :percentage="62.5" :stroke-width="8" />
        </div>
        
        <div class="task-list">
          <div 
            v-for="task in todayTasks" 
            :key="task.id" 
            class="task-item"
            @click.stop="goToTaskDetail(task.id)"
          >
            <el-checkbox 
              :model-value="task.completed" 
              @change.stop="toggleTaskComplete(task)"
              :class="getPriorityClass(task.priority)"
            />
            <span class="task-title">{{ task.title }}</span>
            <span class="task-due" v-if="task.due">
              {{ task.due }}
            </span>
          </div>
        </div>
      </el-card>

      <!-- 日历管理卡片 -->
      <el-card class="dashboard-card calendar-card" @click="$router.push('/calendar')">
        <template #header>
          <div class="card-header">
            <h3>📅 日历管理</h3>
            <el-button type="text" @click.stop="handleQuickAddEvent">快速添加</el-button>
          </div>
        </template>
        
        <div class="today-events">
          <h4>今日事件</h4>
          <div 
            v-for="event in todayEvents" 
            :key="event.id" 
            class="event-item"
            @click.stop="goToEventDetail(event.id)"
          >
            <div class="event-time">{{ event.time }}</div>
            <div class="event-content">
              <span class="event-title">{{ event.title }}</span>
              <span class="event-location" v-if="event.location">{{ event.location }}</span>
            </div>
            <el-button 
              size="small" 
              type="text" 
              @click.stop="handlePostponeEvent(event)"
            >
              延期
            </el-button>
          </div>
        </div>
        
        <div class="upcoming-events">
          <h4>未来3天重要事件</h4>
          <div 
            v-for="event in upcomingEvents" 
            :key="event.id" 
            class="event-item upcoming"
            @click.stop="goToEventDetail(event.id)"
          >
            <div class="event-date">{{ event.date }}</div>
            <div class="event-content">
              <span class="event-title">{{ event.title }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 知识库卡片 -->
      <el-card class="dashboard-card knowledge-card" @click="$router.push('/knowledge')">
        <template #header>
          <div class="card-header">
            <h3>📚 知识库</h3>
            <el-button type="text" @click.stop="handleQuickAddNote">快速新建</el-button>
          </div>
        </template>
        
        <div class="knowledge-stats">
          <div class="stat-item">
            <span class="stat-label">总文档数</span>
            <span class="stat-value">42</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">收藏文档</span>
            <span class="stat-value">8</span>
          </div>
        </div>
        
        <div class="recent-notes">
          <h4>最近更新</h4>
          <div 
            v-for="note in recentNotes" 
            :key="note.id" 
            class="note-item"
            @click.stop="goToNoteDetail(note.id)"
          >
            <h5 class="note-title">{{ note.title }}</h5>
            <p class="note-excerpt">{{ note.excerpt }}</p>
            <span class="note-date">{{ note.date }}</span>
          </div>
        </div>
        
        <el-button type="text" class="view-all" @click.stop="$router.push('/knowledge')">
          查看全部
        </el-button>
      </el-card>

      <!-- 财务管理卡片 -->
      <el-card class="dashboard-card finance-card" @click="$router.push('/finance')">
        <template #header>
          <div class="card-header">
            <h3>💰 财务管理</h3>
            <el-button type="text" @click.stop="handleQuickAddTransaction">快速记账</el-button>
          </div>
        </template>
        
        <div class="finance-overview">
          <div class="finance-item income">
            <span class="finance-label">收入</span>
            <span class="finance-value">¥12,500</span>
          </div>
          <div class="finance-item expense">
            <span class="finance-label">支出</span>
            <span class="finance-value">¥5,000</span>
          </div>
          <div class="finance-item balance">
            <span class="finance-label">结余</span>
            <span class="finance-value">¥7,500</span>
          </div>
        </div>
        
        <div class="budget-progress">
          <h4>预算使用情况</h4>
          <div class="budget-item" v-for="budget in budgetItems" :key="budget.category">
            <div class="budget-label">
              <span>{{ budget.category }}</span>
              <span>{{ budget.used }}/{{ budget.total }}</span>
            </div>
            <el-progress 
              :percentage="budget.percentage" 
              :stroke-width="6" 
              :color="budget.color"
            />
          </div>
        </div>
        
        <div class="recent-transactions">
          <h4>最近交易</h4>
          <div 
            v-for="transaction in recentTransactions" 
            :key="transaction.id" 
            class="transaction-item"
          >
            <span class="transaction-category">{{ transaction.category }}</span>
            <span class="transaction-amount" :class="transaction.type">
              {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount }}
            </span>
          </div>
        </div>
      </el-card>

      <!-- 健康管理卡片 -->
      <el-card class="dashboard-card health-card" @click="$router.push('/health')">
        <template #header>
          <div class="card-header">
            <h3>🏃‍♂️ 健康管理</h3>
            <el-button type="text" @click.stop="handleQuickAddHealth">快速记录</el-button>
          </div>
        </template>
        
        <div class="health-score">
          <div class="score-circle">
            <span class="score-value">85</span>
            <span class="score-label">健康评分</span>
          </div>
        </div>
        
        <div class="health-stats">
          <div class="health-item">
            <span class="health-label">步数</span>
            <div class="health-progress">
              <span class="health-value">7,500/10,000</span>
              <el-progress :percentage="75" :stroke-width="6" />
            </div>
          </div>
          <div class="health-item">
            <span class="health-label">饮水</span>
            <div class="health-progress">
              <span class="health-value">1,500/2,000ml</span>
              <el-progress :percentage="75" :stroke-width="6" />
            </div>
          </div>
          <div class="health-item">
            <span class="health-label">睡眠</span>
            <div class="health-progress">
              <span class="health-value">6.5/8h</span>
              <el-progress :percentage="81.25" :stroke-width="6" />
            </div>
          </div>
        </div>
      </el-card>
    </main>

    <!-- 底部扩展区域 -->
    <footer class="dashboard-footer">
      <div class="footer-content">
        <!-- 个人数据统计 -->
        <div class="stats-card">
          <h3>📊 个人数据统计</h3>
          <div class="usage-stats">
            <h4>近7天使用频率</h4>
            <div class="usage-items">
              <div class="usage-item">
                <span class="usage-label">任务管理</span>
                <el-progress :percentage="85" :stroke-width="6" />
              </div>
              <div class="usage-item">
                <span class="usage-label">日历管理</span>
                <el-progress :percentage="65" :stroke-width="6" />
              </div>
              <div class="usage-item">
                <span class="usage-label">知识库</span>
                <el-progress :percentage="45" :stroke-width="6" />
              </div>
            </div>
          </div>
          
          <div class="achievements">
            <h4>累计成就</h4>
            <div class="achievement-items">
              <div class="achievement-item">
                <span class="achievement-icon">🏆</span>
                <span class="achievement-text">完成任务 500+</span>
              </div>
              <div class="achievement-item">
                <span class="achievement-icon">🔥</span>
                <span class="achievement-text">健康打卡 30天</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 快捷设置入口 -->
        <div class="quick-settings">
          <h3>⚙️ 快捷设置</h3>
          <div class="settings-grid">
            <el-button @click="$router.push('/profile')">
              <el-icon><User /></el-icon>
              个人设置
            </el-button>
            <el-button @click="handleDataBackup">
              <el-icon><Download /></el-icon>
              数据备份
            </el-button>
            <el-button @click="handleHelp">
              <el-icon><QuestionFilled /></el-icon>
              帮助中心
            </el-button>
            <el-button @click="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, Plus, Bell, Setting, User, Download, QuestionFilled, SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()

// 模拟数据
const todayTasks = ref([
  { id: 1, title: '完成项目文档', priority: 'high', due: '14:00', completed: false },
  { id: 2, title: '团队会议', priority: 'medium', due: '16:30', completed: false },
  { id: 3, title: '代码审查', priority: 'high', due: '15:00', completed: true }
])

const todayEvents = ref([
  { id: 1, title: '项目评审会议', time: '10:00', location: '会议室A' },
  { id: 2, title: '健身', time: '18:00', location: '健身房' }
])

const upcomingEvents = ref([
  { id: 3, title: '产品发布会', date: '明天 14:00' },
  { id: 4, title: '技术分享', date: '后天 15:30' }
])

const recentNotes = ref([
  { id: 1, title: 'Vue 3 学习笔记', excerpt: 'Vue 3 引入了 Composition API...', date: '今天' },
  { id: 2, title: '项目规划', excerpt: '下一阶段的项目目标包括...', date: '昨天' }
])

const budgetItems = ref([
  { category: '餐饮', used: '¥2,500', total: '¥4,000', percentage: 62.5, color: '#f56c6c' },
  { category: '交通', used: '¥800', total: '¥1,500', percentage: 53.3, color: '#409eff' },
  { category: '娱乐', used: '¥1,200', total: '¥2,000', percentage: 60, color: '#67c23a' }
])

const recentTransactions = ref([
  { id: 1, category: '午餐', type: 'expense', amount: 50 },
  { id: 2, category: '交通', type: 'expense', amount: 20 },
  { id: 3, category: '工资', type: 'income', amount: 12500 }
])

// 方法
const logout = () => {
  router.push('/login')
}

const getPriorityClass = (priority: string) => {
  return `priority-${priority}`
}

const toggleTaskComplete = (task: any) => {
  task.completed = !task.completed
}

const goToTaskDetail = (id: number) => {
  router.push(`/tasks/${id}`)
}

const goToEventDetail = (id: number) => {
  router.push(`/calendar/${id}`)
}

const goToNoteDetail = (id: number) => {
  router.push(`/knowledge/${id}`)
}

// 顶部操作
const handleSearch = () => {
  console.log('搜索')
}

const handleQuickAdd = () => {
  console.log('快速添加')
}

const handleNotifications = () => {
  console.log('通知')
}

const handleSettings = () => {
  router.push('/profile')
}

// 卡片快捷操作
const handleQuickAddTask = () => {
  console.log('快速添加任务')
}

const handleQuickAddEvent = () => {
  console.log('快速添加事件')
}

const handleQuickAddNote = () => {
  console.log('快速添加笔记')
}

const handleQuickAddTransaction = () => {
  console.log('快速记账')
}

const handleQuickAddHealth = () => {
  console.log('快速记录健康')
}

const handlePostponeEvent = (event: any) => {
  console.log('延期事件', event)
}

const handleDataBackup = () => {
  console.log('数据备份')
}

const handleHelp = () => {
  console.log('帮助中心')
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 20px 20px;
}

/* 顶部固定栏 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px 24px;
  margin: 20px auto;
  max-width: 1400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .logo {
    font-size: 28px;
  }
  
  .header-title h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  
  .today-overview {
    display: flex;
    gap: 32px;
    
    .overview-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .overview-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .overview-value {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        
        &.score {
          color: #67c23a;
        }
      }
    }
  }
}

.header-right {
  .header-actions {
    display: flex;
    gap: 8px;
    
    .el-button {
      border-color: #e0e0e0;
      color: #666;
      
      &:hover {
        border-color: #667eea;
        color: #667eea;
      }
    }
  }
}

/* 中部核心数据区 */
.dashboard-main {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    
    .el-button {
      color: #667eea;
      
      &:hover {
        color: #536dfe;
      }
    }
  }
}

/* 任务管理卡片 */
.task-card {
  .task-stats {
    display: flex;
    justify-content: space-between;
    margin: 16px 0;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      
      .stat-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 16px;
        font-weight: 600;
        
        .priority-high {
          color: #f56c6c;
        }
        
        .priority-medium {
          color: #409eff;
        }
        
        .priority-low {
          color: #909399;
        }
        
        .overdue {
          color: #f56c6c;
        }
      }
    }
  }
  
  .progress-section {
    margin: 16px 0;
    
    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
  }
  
  .task-list {
    .task-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .task-title {
        flex: 1;
        font-size: 14px;
        color: #333;
      }
      
      .task-due {
        font-size: 12px;
        color: #909399;
      }
      
      .priority-high {
        .el-checkbox__inner {
          border-color: #f56c6c;
          
          &:checked {
            background-color: #f56c6c;
            border-color: #f56c6c;
          }
        }
      }
      
      .priority-medium {
        .el-checkbox__inner {
          border-color: #409eff;
          
          &:checked {
            background-color: #409eff;
            border-color: #409eff;
          }
        }
      }
    }
  }
}

/* 日历管理卡片 */
.calendar-card {
  .today-events,
  .upcoming-events {
    margin: 16px 0;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .event-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.upcoming {
        gap: 16px;
      }
      
      .event-time,
      .event-date {
        font-size: 12px;
        color: #666;
        min-width: 60px;
      }
      
      .event-content {
        flex: 1;
        
        .event-title {
          font-size: 14px;
          color: #333;
          margin-right: 8px;
        }
        
        .event-location {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .el-button {
        padding: 4px 8px;
        font-size: 12px;
        color: #667eea;
      }
    }
  }
}

/* 知识库卡片 */
.knowledge-card {
  .knowledge-stats {
    display: flex;
    justify-content: space-between;
    margin: 16px 0;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      
      .stat-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
  }
  
  .recent-notes {
    margin: 16px 0;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .note-item {
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .note-title {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
      
      .note-excerpt {
        margin: 0 0 4px 0;
        font-size: 12px;
        color: #666;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .note-date {
        font-size: 11px;
        color: #909399;
      }
    }
  }
  
  .view-all {
    width: 100%;
    color: #667eea;
  }
}

/* 财务管理卡片 */
.finance-card {
  .finance-overview {
    display: flex;
    justify-content: space-around;
    margin: 16px 0;
    
    .finance-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .finance-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .finance-value {
        font-size: 18px;
        font-weight: 600;
        
        &.income {
          color: #67c23a;
        }
        
        &.expense {
          color: #f56c6c;
        }
        
        &.balance {
          color: #409eff;
        }
      }
    }
  }
  
  .budget-progress {
    margin: 16px 0;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .budget-item {
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .budget-label {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
    }
  }
  
  .recent-transactions {
    margin: 16px 0;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .transaction-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .transaction-category {
        font-size: 14px;
        color: #333;
      }
      
      .transaction-amount {
        font-size: 14px;
        font-weight: 600;
        
        &.income {
          color: #67c23a;
        }
        
        &.expense {
          color: #f56c6c;
        }
      }
    }
  }
}

/* 健康管理卡片 */
.health-card {
  .health-score {
    display: flex;
    justify-content: center;
    margin: 24px 0;
    
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 16px rgba(103, 194, 58, 0.3);
      
      .score-value {
        font-size: 32px;
        font-weight: 700;
      }
      
      .score-label {
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }
  
  .health-stats {
    .health-item {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .health-label {
        font-size: 14px;
        color: #333;
        margin-bottom: 8px;
      }
      
      .health-progress {
        .health-value {
          display: block;
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
      }
    }
  }
}

/* 底部扩展区域 */
.dashboard-footer {
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.stats-card {
  h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .usage-stats,
  .achievements {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #666;
    }
  }
  
  .usage-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .usage-item {
      .usage-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        display: block;
      }
    }
  }
  
  .achievements {
    .achievement-items {
      display: flex;
      gap: 24px;
      
      .achievement-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        
        .achievement-icon {
          font-size: 24px;
        }
        
        .achievement-text {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}

.quick-settings {
  h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    
    .el-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-color: #e0e0e0;
      color: #666;
      
      &:hover {
        border-color: #667eea;
        color: #667eea;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    
    .header-center {
      display: none;
    }
    
    .header-right {
      justify-content: center;
    }
  }
  
  .dashboard-main {
    grid-template-columns: 1fr;
  }
  
  .dashboard-card {
    margin: 0 16px;
  }
  
  .dashboard-footer {
    margin: 0 16px;
    
    .footer-content {
      grid-template-columns: 1fr;
    }
  }
}
</style>