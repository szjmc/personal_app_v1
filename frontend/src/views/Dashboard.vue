<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <div>
          <h1 class="dashboard-title">仪表盘</h1>
          <p class="dashboard-subtitle">欢迎回来，{{ userStore.user?.username }}！</p>
        </div>
        <div class="header-actions">
          <el-button 
            type="primary" 
            :icon="Timer" 
            @click="refreshData"
            :loading="loading"
            size="small"
          >
            刷新数据
          </el-button>
        </div>
      </div>
      
      <!-- 错误提示 -->
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        class="dashboard-error"
      />
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <template v-if="statsLoading">
        <SkeletonScreen type="card" :count="4" theme="glass" />
      </template>
      <el-card class="stat-card" v-else v-for="stat in stats" :key="stat.title">
        <div class="stat-content">
          <div class="stat-icon" :style="{ backgroundColor: stat.color + '20', color: stat.color }">
            <component :is="stat.icon" :size="24" />
          </div>
          <div class="stat-info">
            <h3 class="stat-value">{{ stat.value }}</h3>
            <p class="stat-title">{{ stat.title }}</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主要内容区 -->
    <div class="dashboard-content">
      <!-- 今日任务 -->
      <el-card class="dashboard-card">
        <template #header>
          <div class="card-header">
            <h3>今日任务</h3>
            <el-button type="text" @click="$router.push({ name: 'Tasks' })">
              查看全部
            </el-button>
          </div>
        </template>
        <div class="task-list">
          <template v-if="tasksLoading">
            <SkeletonScreen type="list" :count="3" theme="glass" />
          </template>
          <template v-else>
            <div
              v-for="task in todayTasks"
              :key="task.id"
              class="task-item"
              :class="{ 'task-overdue': task.is_overdue }"
            >
              <div class="task-checkbox">
                <el-checkbox
                  :model-value="task.status === 'completed'"
                  @change="toggleTaskComplete(task)"
                />
              </div>
              <div class="task-content">
                <h4 class="task-title">{{ task.title }}</h4>
                <div class="task-meta">
                  <el-tag :type="getPriorityType(task.priority)" size="small">
                    {{ getPriorityText(task.priority) }}
                  </el-tag>
                  <span v-if="task.due_date" class="task-due">
                    {{ formatTime(task.due_date) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="todayTasks.length === 0" class="empty-state">
              <el-empty description="暂无任务" />
            </div>
          </template>
        </div>
      </el-card>

      <!-- 今日日程 -->
      <el-card class="dashboard-card">
        <template #header>
          <div class="card-header">
            <h3>今日日程</h3>
            <el-button type="text" @click="$router.push({ name: 'Calendar' })">
              查看日历
            </el-button>
          </div>
        </template>
        <div class="event-list">
          <div
            v-for="event in todayEvents"
            :key="event.id"
            class="event-item"
            :style="{ borderLeftColor: getEventTypeColor(event.event_type) }"
          >
            <div class="event-time">
              {{ formatEventTime(event.start_time) }}
            </div>
            <div class="event-content">
              <h4 class="event-title">{{ event.title }}</h4>
              <p v-if="event.location" class="event-location">
                <el-icon><Location /></el-icon>
                {{ event.location }}
              </p>
            </div>
          </div>
          <div v-if="todayEvents.length === 0" class="empty-state">
            <el-empty description="暂无日程" />
          </div>
        </div>
      </el-card>

      <!-- 习惯打卡 -->
      <el-card class="dashboard-card">
        <template #header>
          <div class="card-header">
            <h3>习惯打卡</h3>
            <el-button type="text" @click="$router.push({ name: 'Habits' })">
              管理习惯
            </el-button>
          </div>
        </template>
        <div class="habit-grid">
          <div
            v-for="habit in habits"
            :key="habit.id"
            class="habit-item"
            :class="{ 'habit-completed': habit.is_checked_today }"
            @click="checkHabit(habit)"
          >
            <div class="habit-icon">
              <el-icon :size="20">
                <CircleCheck v-if="habit.is_checked_today" />
                <Circle v-else />
              </el-icon>
            </div>
            <div class="habit-info">
              <h4 class="habit-name">{{ habit.name }}</h4>
              <p class="habit-streak">连续 {{ habit.current_streak }} 天</p>
            </div>
          </div>
          <div v-if="habits.length === 0" class="empty-state">
            <el-empty description="暂无习惯" />
          </div>
        </div>
      </el-card>

      <!-- 最近笔记 -->
      <el-card class="dashboard-card">
        <template #header>
          <div class="card-header">
            <h3>最近笔记</h3>
            <el-button type="text" @click="$router.push({ name: 'Notes' })">
              查看全部
            </el-button>
          </div>
        </template>
        <div class="note-list">
          <div
            v-for="note in recentNotes"
            :key="note.id"
            class="note-item"
            @click="$router.push({ name: 'NoteEditor', params: { id: note.id } })"
          >
            <div class="note-content">
              <h4 class="note-title">{{ note.title }}</h4>
              <p class="note-excerpt">{{ getNoteExcerpt(note.content) }}</p>
            </div>
            <div class="note-time">
              {{ formatTime(note.updated_at) }}
            </div>
          </div>
          <div v-if="recentNotes.length === 0" class="empty-state">
            <el-empty description="暂无笔记" />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import {
  Document,
  Calendar,
  CircleCheck,
  Circle,
  Location,
  Timer,
  Reading,
  TrendCharts
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 导入优化模块
import { optimizedRequest } from '@/utils/api-optimizer'
import { dataPreloader } from '@/utils/data-preloader'
import { imageLazyLoader } from '@/utils/image-lazy-load'
import { loadingManager } from '@/utils/loading-manager'
import { performanceMonitor } from '@/utils/performance-monitor'
import SkeletonScreen from '@/components/common/SkeletonScreen.vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const userStore = useUserStore()

// 加载状态
const loading = ref(true)
const statsLoading = ref(true)
const tasksLoading = ref(true)
const eventsLoading = ref(true)
const habitsLoading = ref(true)
const notesLoading = ref(true)

// 数据状态
const stats = ref([])
const todayTasks = ref([])
const todayEvents = ref([])
const habits = ref([])
const recentNotes = ref([])

// 错误状态
const error = ref<string | null>(null)

// 方法
const formatTime = (date: Date) => {
  return dayjs(date).format('HH:mm')
}

const formatEventTime = (date: Date) => {
  return dayjs(date).format('HH:mm')
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

const getEventTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    work: '#667eea',
    life: '#10b981',
    health: '#ef4444'
  }
  return colors[type] || '#666'
}

const getNoteExcerpt = (content: string) => {
  return content.length > 50 ? content.substring(0, 50) + '...' : content
}

const toggleTaskComplete = async (task: any) => {
  try {
    // 这里调用API更新任务状态
    task.status = task.status === 'completed' ? 'todo' : 'completed'
    ElMessage.success('任务状态已更新')
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const checkHabit = async (habit: any) => {
  try {
    // 这里调用API打卡
    habit.is_checked_today = !habit.is_checked_today
    if (habit.is_checked_today) {
      habit.current_streak++
    }
    ElMessage.success('打卡成功')
  } catch (error) {
    ElMessage.error('打卡失败')
  }
}

// 加载统计数据
const loadStats = async () => {
  const startTime = performance.now()
  
  try {
    // 先检查缓存
    const cachedStats = dataPreloader.getPreloadedData('dashboard-stats')
    if (cachedStats) {
      stats.value = cachedStats
      statsLoading.value = false
      return
    }

    // 从API加载
    const response = await optimizedRequest({
      url: '/api/dashboard/stats/',
      cache: true,
      cacheTime: 10 * 60 * 1000 // 10分钟
    })
    
    stats.value = response
    dataPreloader.setPreloadedData('dashboard-stats', response, 10 * 60 * 1000)
    
    performanceMonitor.recordCustomEvent('load-stats', startTime, performance.now())
  } catch (err) {
    console.error('Failed to load stats:', err)
    error.value = '统计数据加载失败'
  } finally {
    statsLoading.value = false
  }
}

// 加载今日任务
const loadTodayTasks = async () => {
  const startTime = performance.now()
  
  try {
    const cached = dataPreloader.getPreloadedData('today-tasks')
    if (cached) {
      todayTasks.value = cached
      tasksLoading.value = false
      return
    }

    const response = await optimizedRequest({
      url: '/api/tasks/today/',
      cache: true,
      cacheTime: 5 * 60 * 1000 // 5分钟
    })
    
    todayTasks.value = response
    dataPreloader.setPreloadedData('today-tasks', response, 5 * 60 * 1000)
    
    performanceMonitor.recordCustomEvent('load-tasks', startTime, performance.now())
  } catch (err) {
    console.error('Failed to load tasks:', err)
    // 使用模拟数据作为fallback
    todayTasks.value = [
      {
        id: '1',
        title: '完成项目文档',
        priority: 'high',
        status: 'todo',
        due_date: new Date(),
        is_overdue: false
      },
      {
        id: '2',
        title: '团队会议',
        priority: 'medium',
        status: 'completed',
        due_date: new Date(),
        is_overdue: false
      }
    ]
  } finally {
    tasksLoading.value = false
  }
}

// 加载今日事件
const loadTodayEvents = async () => {
  const startTime = performance.now()
  
  try {
    const cached = dataPreloader.getPreloadedData('today-events')
    if (cached) {
      todayEvents.value = cached
      eventsLoading.value = false
      return
    }

    const response = await optimizedRequest({
      url: '/api/calendar/today/',
      cache: true,
      cacheTime: 5 * 60 * 1000
    })
    
    todayEvents.value = response
    dataPreloader.setPreloadedData('today-events', response, 5 * 60 * 1000)
    
    performanceMonitor.recordCustomEvent('load-events', startTime, performance.now())
  } catch (err) {
    console.error('Failed to load events:', err)
    todayEvents.value = [
      {
        id: '1',
        title: '项目评审会议',
        start_time: new Date(2024, 0, 20, 10, 0),
        location: '会议室A',
        event_type: 'work'
      },
      {
        id: '2',
        title: '健身',
        start_time: new Date(2024, 0, 20, 18, 0),
        location: '健身房',
        event_type: 'health'
      }
    ]
  } finally {
    eventsLoading.value = false
  }
}

// 加载习惯数据
const loadHabits = async () => {
  const startTime = performance.now()
  
  try {
    const cached = dataPreloader.getPreloadedData('today-habits')
    if (cached) {
      habits.value = cached
      habitsLoading.value = false
      return
    }

    const response = await optimizedRequest({
      url: '/api/habits/today/',
      cache: true,
      cacheTime: 30 * 60 * 1000 // 30分钟
    })
    
    habits.value = response
    dataPreloader.setPreloadedData('today-habits', response, 30 * 60 * 1000)
    
    performanceMonitor.recordCustomEvent('load-habits', startTime, performance.now())
  } catch (err) {
    console.error('Failed to load habits:', err)
    habits.value = [
      {
        id: '1',
        name: '早起',
        current_streak: 7,
        is_checked_today: true
      },
      {
        id: '2',
        name: '阅读',
        current_streak: 3,
        is_checked_today: false
      }
    ]
  } finally {
    habitsLoading.value = false
  }
}

// 加载最近笔记
const loadRecentNotes = async () => {
  const startTime = performance.now()
  
  try {
    const cached = dataPreloader.getPreloadedData('recent-notes')
    if (cached) {
      recentNotes.value = cached
      notesLoading.value = false
      return
    }

    const response = await optimizedRequest({
      url: '/api/notes/recent/',
      cache: true,
      cacheTime: 15 * 60 * 1000 // 15分钟
    })
    
    recentNotes.value = response
    dataPreloader.setPreloadedData('recent-notes', response, 15 * 60 * 1000)
    
    performanceMonitor.recordCustomEvent('load-notes', startTime, performance.now())
  } catch (err) {
    console.error('Failed to load notes:', err)
    recentNotes.value = [
      {
        id: '1',
        title: 'Vue 3 学习笔记',
        content: 'Vue 3 引入了 Composition API，让我们能够更好地组织代码...',
        updated_at: new Date()
      },
      {
        id: '2',
        title: '项目规划',
        content: '下一阶段的项目目标包括：1. 完善用户界面 2. 优化性能...',
        updated_at: new Date(Date.now() - 86400000)
      }
    ]
  } finally {
    notesLoading.value = false
  }
}

// 统一加载函数
const loadDashboardData = async () => {
  const startTime = performance.now()
  
  try {
    await loadingManager.wrapAsync(async () => {
      // 并行加载数据
      await Promise.allSettled([
        loadStats(),
        loadTodayTasks(),
        loadTodayEvents(),
        loadHabits(),
        loadRecentNotes()
      ])
    }, {
      text: '加载仪表盘数据...'
    })
    
    performanceMonitor.recordCustomEvent('dashboard-load', startTime, performance.now())
  } catch (err) {
    error.value = '仪表盘数据加载失败'
    console.error('Dashboard load failed:', err)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  error.value = null
  
  // 清除缓存
  dataPreloader.cleanup()
  
  await loadDashboardData()
}

onMounted(async () => {
  await nextTick()
  
  // 初始化图片懒加载
  setTimeout(() => {
    const images = document.querySelectorAll('img[data-src]')
    images.forEach(img => {
      imageLazyLoader.observe(img as HTMLImageElement)
    })
  }, 100)
  
  // 加载数据
  await loadDashboardData()
  
  // 启动智能预加载
  dataPreloader.smartPreload()
})
</script>

<style lang="scss" scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 32px;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    .dashboard-title {
      font-size: $font-size-3xl;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
      @include gradient-text;
    }
    
    .dashboard-subtitle {
      color: rgba(255, 255, 255, 0.7);
      font-size: $font-size-base;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .dashboard-error {
    margin-top: 16px;
    
    :deep(.el-alert__content) {
      color: white;
    }
    
    :deep(.el-alert__title) {
      color: white;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  
  .stat-card {
    @include hover-card;
    
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .stat-info {
        .stat-value {
          font-size: $font-size-2xl;
          font-weight: 600;
          color: white;
          margin-bottom: 4px;
        }
        
        .stat-title {
          color: rgba(255, 255, 255, 0.7);
          font-size: $font-size-sm;
        }
      }
    }
  }
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @include respond-to(md) {
    grid-template-columns: 1fr;
  }
  
  .dashboard-card {
    @include glass-effect;
    border: none;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        color: white;
        font-weight: 600;
      }
      
      .el-button {
        color: rgba(255, 255, 255, 0.7);
        
        &:hover {
          color: white;
        }
      }
    }
  }
}

.task-list,
.event-list,
.habit-grid,
.note-list {
  .task-item,
  .event-item,
  .habit-item,
  .note-item {
    &:not(:last-child) {
      margin-bottom: 16px;
    }
  }
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  
  &.task-overdue {
    border-left: 3px solid $danger-color;
  }
  
  .task-content {
    flex: 1;
    
    .task-title {
      font-weight: 500;
      color: white;
      margin-bottom: 4px;
    }
    
    .task-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .task-due {
        color: rgba(255, 255, 255, 0.6);
        font-size: $font-size-sm;
      }
    }
  }
}

.event-item {
  padding-left: 12px;
  border-left: 3px solid;
  
  .event-time {
    color: rgba(255, 255, 255, 0.7);
    font-size: $font-size-sm;
    margin-bottom: 4px;
  }
  
  .event-content {
    .event-title {
      font-weight: 500;
      color: white;
      margin-bottom: 4px;
    }
    
    .event-location {
      display: flex;
      align-items: center;
      gap: 4px;
      color: rgba(255, 255, 255, 0.6);
      font-size: $font-size-sm;
    }
  }
}

.habit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  
  .habit-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    transition: all $transition-fast ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    &.habit-completed {
      background: rgba(16, 185, 129, 0.1);
    }
    
    .habit-icon {
      margin-bottom: 8px;
      color: rgba(255, 255, 255, 0.7);
      
      .habit-completed & {
        color: $success-color;
      }
    }
    
    .habit-info {
      text-align: center;
      
      .habit-name {
        font-weight: 500;
        color: white;
        margin-bottom: 4px;
      }
      
      .habit-streak {
        color: rgba(255, 255, 255, 0.6);
        font-size: $font-size-sm;
      }
    }
  }
}

.note-list .note-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all $transition-fast ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .note-content {
    flex: 1;
    margin-right: 12px;
    
    .note-title {
      font-weight: 500;
      color: white;
      margin-bottom: 4px;
    }
    
    .note-excerpt {
      color: rgba(255, 255, 255, 0.6);
      font-size: $font-size-sm;
      line-height: 1.4;
    }
  }
  
  .note-time {
    color: rgba(255, 255, 255, 0.5);
    font-size: $font-size-xs;
    white-space: nowrap;
  }
}

.empty-state {
  text-align: center;
  padding: 32px 0;
  
  :deep(.el-empty__description) {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>