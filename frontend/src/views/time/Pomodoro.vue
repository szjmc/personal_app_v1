<template>
  <div class="pomodoro-view">
    <div class="pomodoro-header">
      <h1>番茄钟</h1>
      <div class="header-actions">
        <el-button @click="showSettings = true">
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
        <el-button @click="showStats = true">
          <el-icon><TrendCharts /></el-icon>
          统计
        </el-button>
      </div>
    </div>

    <div class="pomodoro-content">
      <!-- 番茄钟主体 -->
      <div class="pomodoro-main">
        <div class="pomodoro-timer">
          <div class="timer-circle">
            <svg width="300" height="300" viewBox="0 0 300 300">
              <!-- 背景圆环 -->
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                stroke-width="8"
              />
              <!-- 进度圆环 -->
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                :stroke="progressColor"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="progressOffset"
                class="progress-circle"
                transform="rotate(-90 150 150)"
              />
            </svg>
            
            <div class="timer-display">
              <div class="time-text">{{ formatTime(remainingTime) }}</div>
              <div class="session-type">{{ getSessionTypeText(currentSessionType) }}</div>
              <div class="session-info">
                第 {{ currentSession }} 轮，已完成 {{ completedSessions }} 轮
              </div>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="timer-controls">
          <el-button
            v-if="!isRunning"
            type="primary"
            size="large"
            @click="startTimer"
          >
            <el-icon><VideoPlay /></el-icon>
            开始
          </el-button>
          
          <el-button
            v-else
            size="large"
            @click="pauseTimer"
          >
            <el-icon><VideoPause /></el-icon>
            暂停
          </el-button>
          
          <el-button
            size="large"
            @click="resetTimer"
            :disabled="!isRunning && remainingTime === sessionDuration"
          >
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
          
          <el-button
            size="large"
            @click="skipSession"
            :disabled="!isRunning && remainingTime === sessionDuration"
          >
            <el-icon><SkipForward /></el-icon>
            跳过
          </el-button>
        </div>

        <!-- 任务选择 -->
        <div class="task-selector">
          <el-select
            v-model="selectedTask"
            placeholder="选择关联任务"
            clearable
            filterable
            style="width: 300px"
          >
            <el-option
              v-for="task in availableTasks"
              :key="task.id"
              :label="task.title"
              :value="task.id"
            />
          </el-select>
        </div>
      </div>

      <!-- 侧边统计 -->
      <div class="pomodoro-sidebar">
        <div class="today-stats">
          <h3>今日统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ todayStats.totalMinutes }}</div>
              <div class="stat-label">专注分钟</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ todayStats.completedSessions }}</div>
              <div class="stat-label">完成轮数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ todayStats.focusHours }}</div>
              <div class="stat-label">专注小时</div>
            </div>
          </div>
        </div>

        <!-- 最近会话 -->
        <div class="recent-sessions">
          <h3>最近会话</h3>
          <div class="session-list">
            <div
              v-for="session in recentSessions"
              :key="session.id"
              class="session-item"
            >
              <div class="session-info">
                <div class="session-task">{{ session.task_title || '无任务' }}</div>
                <div class="session-time">{{ formatSessionTime(session.start_time) }}</div>
              </div>
              <div class="session-duration">
                {{ formatDuration(session.duration_minutes) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="番茄钟设置"
      width="500px"
    >
      <div class="pomodoro-settings">
        <el-form label-position="top">
          <el-form-item label="工作时长（分钟）">
            <el-input-number
              v-model="settings.workDuration"
              :min="1"
              :max="60"
              controls-position="right"
            />
          </el-form-item>
          
          <el-form-item label="短休息时长（分钟）">
            <el-input-number
              v-model="settings.shortBreakDuration"
              :min="1"
              :max="30"
              controls-position="right"
            />
          </el-form-item>
          
          <el-form-item label="长休息时长（分钟）">
            <el-input-number
              v-model="settings.longBreakDuration"
              :min="1"
              :max="60"
              controls-position="right"
            />
          </el-form-item>
          
          <el-form-item label="长休息间隔（轮）">
            <el-input-number
              v-model="settings.longBreakInterval"
              :min="2"
              :max="10"
              controls-position="right"
            />
          </el-form-item>
          
          <el-form-item label="提示音">
            <el-switch v-model="settings.enableSound" />
          </el-form-item>
        </el-form>
        
        <div class="settings-actions">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 统计对话框 -->
    <el-dialog
      v-model="showStats"
      title="番茄钟统计"
      width="800px"
    >
      <PomodoroStats />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Setting,
  TrendCharts,
  VideoPlay,
  VideoPause,
  RefreshRight,
  SkipForward
} from '@element-plus/icons-vue'
import { timeApi } from '@/api/time'
import { tasksApi } from '@/api/tasks'
import PomodoroStats from '@/components/time/PomodoroStats.vue'
import dayjs from 'dayjs'

// 响应式数据
const remainingTime = ref(25 * 60) // 秒
const isRunning = ref(false)
const currentSessionType = ref<'work' | 'break' | 'long_break'>('work')
const currentSession = ref(1)
const completedSessions = ref(0)
const selectedTask = ref('')
const availableTasks = ref([])
const recentSessions = ref([])
const showSettings = ref(false)
const showStats = ref(false)

let timer: number | null = null
let audioContext: AudioContext | null = null

// 设置
const settings = reactive({
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  enableSound: true
})

const todayStats = reactive({
  totalMinutes: 0,
  completedSessions: 0,
  focusHours: 0
})

// 计算属性
const sessionDuration = computed(() => {
  switch (currentSessionType.value) {
    case 'work':
      return settings.workDuration * 60
    case 'break':
      return settings.shortBreakDuration * 60
    case 'long_break':
      return settings.longBreakDuration * 60
    default:
      return settings.workDuration * 60
  }
})

const circumference = computed(() => 2 * Math.PI * 140)

const progressOffset = computed(() => {
  const progress = (sessionDuration.value - remainingTime.value) / sessionDuration.value
  return circumference.value * (1 - progress)
})

const progressColor = computed(() => {
  switch (currentSessionType.value) {
    case 'work':
      return '#667eea'
    case 'break':
      return '#10b981'
    case 'long_break':
      return '#f59e0b'
    default:
      return '#667eea'
  }
})

// 方法
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatSessionTime = (time: string) => {
  return dayjs(time).format('HH:mm')
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
  }
}

const getSessionTypeText = (type: string) => {
  const texts = {
    work: '工作时间',
    break: '短休息',
    long_break: '长休息'
  }
  return texts[type] || '工作时间'
}

const startTimer = async () => {
  try {
    isRunning.value = true
    
    // 如果没有会话，创建新会话
    if (currentSession.value === 1 && remainingTime.value === sessionDuration.value) {
      await createPomodoroSession()
    }
    
    timer = setInterval(() => {
      if (remainingTime.value > 0) {
        remainingTime.value--
      } else {
        completeSession()
      }
    }, 1000)
  } catch (error) {
    ElMessage.error('启动失败')
    isRunning.value = false
  }
}

const pauseTimer = () => {
  isRunning.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const resetTimer = () => {
  pauseTimer()
  remainingTime.value = sessionDuration.value
}

const skipSession = () => {
  pauseTimer()
  completeSession()
}

const completeSession = async () => {
  try {
    // 播放提示音
    if (settings.enableSound) {
      playSound()
    }
    
    ElMessage.success(`${getSessionTypeText(currentSessionType.value)}完成！`)
    
    // 更新会话状态
    if (currentSessionType.value === 'work') {
      completedSessions.value++
      currentSession.value++
    }
    
    // 切换到下一个会话类型
    if (currentSessionType.value === 'work') {
      if (currentSession.value % settings.longBreakInterval === 0) {
        currentSessionType.value = 'long_break'
      } else {
        currentSessionType.value = 'break'
      }
    } else {
      currentSessionType.value = 'work'
    }
    
    // 重置计时器
    remainingTime.value = sessionDuration.value
    pauseTimer()
    
    // 更新统计
    await updateStats()
  } catch (error) {
    console.error('Complete session error:', error)
  }
}

const playSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.error('Play sound error:', error)
  }
}

const createPomodoroSession = async () => {
  try {
    const sessionData = {
      task: selectedTask.value,
      work_duration: settings.workDuration,
      break_duration: settings.shortBreakDuration,
      long_break_duration: settings.longBreakDuration
    }
    
    await timeApi.createPomodoroSession(sessionData)
  } catch (error) {
    console.error('Create pomodoro session error:', error)
  }
}

const loadTasks = async () => {
  try {
    const data = await tasksApi.getBoard()
    const tasks = []
    
    // 获取所有状态的任务
    Object.values(data).forEach((taskList: any) => {
      if (Array.isArray(taskList)) {
        tasks.push(...taskList)
      }
    })
    
    availableTasks.value = tasks.filter(task => task.status !== 'completed')
  } catch (error) {
    console.error('Load tasks error:', error)
  }
}

const loadRecentSessions = async () => {
  try {
    recentSessions.value = await timeApi.getPomodoroSessions()
  } catch (error) {
    console.error('Load recent sessions error:', error)
  }
}

const updateStats = async () => {
  try {
    const stats = await timeApi.getTodayEfficiency()
    Object.assign(todayStats, stats)
  } catch (error) {
    console.error('Update stats error:', error)
  }
}

const saveSettings = () => {
  localStorage.setItem('pomodoroSettings', JSON.stringify(settings))
  showSettings.value = false
  ElMessage.success('设置已保存')
  
  // 如果当前不在运行状态，重置计时器
  if (!isRunning.value) {
    resetTimer()
  }
}

const loadSettings = () => {
  const savedSettings = localStorage.getItem('pomodoroSettings')
  if (savedSettings) {
    Object.assign(settings, JSON.parse(savedSettings))
  }
  remainingTime.value = settings.workDuration * 60
}

onMounted(() => {
  loadSettings()
  loadTasks()
  loadRecentSessions()
  updateStats()
})

onUnmounted(() => {
  pauseTimer()
})
</script>

<style lang="scss" scoped>
.pomodoro-view {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.pomodoro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  
  h1 {
    color: white;
    font-size: $font-size-3xl;
    font-weight: 600;
    @include gradient-text;
  }
}

.pomodoro-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  
  @include respond-to(md) {
    grid-template-columns: 1fr;
  }
}

.pomodoro-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  
  .pomodoro-timer {
    .timer-circle {
      position: relative;
      
      .progress-circle {
        transition: stroke-dashoffset 1s linear;
      }
      
      .timer-display {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        
        .time-text {
          font-size: 48px;
          font-weight: 600;
          color: white;
          font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .session-type {
          color: rgba(255, 255, 255, 0.8);
          margin-top: 8px;
          font-size: $font-size-sm;
        }
        
        .session-info {
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4px;
          font-size: $font-size-xs;
        }
      }
    }
  }
  
  .timer-controls {
    display: flex;
    gap: 16px;
    
    .el-button {
      min-width: 120px;
      height: 48px;
    }
  }
  
  .task-selector {
    width: 100%;
    max-width: 300px;
  }
}

.pomodoro-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  
  .today-stats,
  .recent-sessions {
    @include glass-effect;
    border-radius: 12px;
    padding: 20px;
    
    h3 {
      color: white;
      margin-bottom: 16px;
      font-weight: 600;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        color: white;
        font-size: $font-size-2xl;
        font-weight: 600;
        margin-bottom: 4px;
        @include gradient-text;
      }
      
      .stat-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: $font-size-sm;
      }
    }
  }
  
  .session-list {
    max-height: 200px;
    overflow-y: auto;
    
    .session-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      &:last-child {
        border-bottom: none;
      }
      
      .session-info {
        .session-task {
          color: white;
          font-size: $font-size-sm;
          margin-bottom: 2px;
        }
        
        .session-time {
          color: rgba(255, 255, 255, 0.6);
          font-size: $font-size-xs;
        }
      }
      
      .session-duration {
        color: rgba(255, 255, 255, 0.8);
        font-size: $font-size-sm;
      }
    }
  }
}

.pomodoro-settings {
  .settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
}
</style>