<template>
  <div class="health-container">
    <!-- 头部工具栏 -->
    <div class="health-header">
      <div class="header-left">
        <h1 class="page-title">健康管理</h1>
        <div class="date-selector">
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            @change="handleDateChange"
            :disabled-date="disabledDate"
          />
        </div>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="showAddHabitDialog">
          <el-icon><Plus /></el-icon>
          新建习惯
        </el-button>
        
        <el-button @click="showCalendarView = !showCalendarView">
          <el-icon><Calendar /></el-icon>
          {{ showCalendarView ? '列表视图' : '日历视图' }}
        </el-button>
      </div>
    </div>

    <!-- 日历视图 -->
    <div v-if="showCalendarView" class="calendar-view">
      <div class="calendar-container">
        <div class="calendar-header">
          <h3>{{ currentMonth }} 习惯打卡</h3>
          <div class="calendar-nav">
            <el-button size="small" @click="previousMonth">
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-button size="small" @click="nextMonth">
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="calendar-grid">
          <div class="weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday">
              {{ day }}
            </div>
          </div>
          
          <div class="days-grid">
            <div
              v-for="day in calendarDays"
              :key="day.date"
              class="calendar-day"
              :class="{
                'today': isToday(day.date),
                'other-month': !day.isCurrentMonth,
                'has-habits': day.habits.length > 0
              }"
              @click="selectDate(day.date)"
            >
              <div class="day-number">{{ day.day }}</div>
              <div v-if="day.habits.length > 0" class="habit-dots">
                <div
                  v-for="habit in day.habits.slice(0, 4)"
                  :key="habit.id"
                  class="habit-dot"
                  :style="{ backgroundColor: habit.color }"
                  :title="habit.name"
                ></div>
                <div
                  v-if="day.habits.length > 4"
                  class="more-dots"
                  :title="`还有${day.habits.length - 4}个习惯`"
                >
                  +{{ day.habits.length - 4 }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图例 -->
      <div class="legend">
        <h4>习惯图例</h4>
        <div class="legend-items">
          <div
            v-for="habit in habits"
            :key="habit.id"
            class="legend-item"
          >
            <div class="legend-color" :style="{ backgroundColor: habit.color }"></div>
            <span class="legend-name">{{ habit.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="list-view">
      <!-- 今日概览 -->
      <div class="today-overview">
        <div class="overview-header">
          <h3>今日习惯 ({{ todayHabits.length }})</h3>
          <div class="overview-stats">
            <span class="completed-count">
              已完成 {{ todayCompletedCount }}
            </span>
            <span class="total-count">
              总计 {{ todayHabits.length }}
            </span>
          </div>
        </div>
        
        <div class="habits-grid">
          <div
            v-for="habit in todayHabits"
            :key="habit.id"
            class="habit-card"
            @click="toggleHabitCheckIn(habit)"
          >
            <div class="habit-header">
              <div class="habit-icon" :style="{ backgroundColor: habit.color }">
                <el-icon>
                  <component :is="getHabitIcon(habit.icon)" />
                </el-icon>
              </div>
              <div class="habit-info">
                <h4>{{ habit.name }}</h4>
                <p>{{ habit.description }}</p>
              </div>
            </div>
            
            <div class="habit-check">
              <el-checkbox
                :model-value="isCheckedToday(habit)"
                @change="(checked: boolean) => handleCheckIn(habit, checked)"
                size="large"
              />
            </div>
            
            <div class="habit-streak">
              <el-icon><Trophy /></el-icon>
              <span>{{ (habit as any).streak_days || 0 }}天</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 所有习惯列表 -->
      <div class="all-habits">
        <div class="section-header">
          <h3>所有习惯</h3>
          <el-radio-group v-model="habitFilter" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="active">进行中</el-radio-button>
            <el-radio-button label="inactive">已停用</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="habits-list">
          <div
            v-for="habit in filteredHabits"
            :key="habit.id"
            class="habit-item"
          >
            <div class="habit-main">
              <div class="habit-icon" :style="{ backgroundColor: habit.color }">
                <el-icon>
                  <component :is="getHabitIcon(habit.icon)" />
                </el-icon>
              </div>
              
              <div class="habit-details">
                <div class="habit-name">{{ habit.name }}</div>
                <div class="habit-desc">{{ habit.description }}</div>
                <div class="habit-meta">
                  <span class="target-info">
                    目标：{{ habit.target_count }}{{ habit.unit }}/天
                  </span>
                  <span class="time-info">{{ habit.time_of_day }}</span>
                </div>
              </div>
            </div>
            
            <div class="habit-stats-mini">
              <div class="stat-item">
                <div class="stat-value">{{ getCompletionRate(habit) }}%</div>
                <div class="stat-label">完成率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ (habit as any).streak_days || 0 }}</div>
                <div class="stat-label">连续天数</div>
              </div>
            </div>
            
            <div class="habit-actions">
              <el-dropdown @command="(cmd: string) => handleHabitAction(cmd, habit)" trigger="click">
                <el-button size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="stats">
                      <el-icon><DataAnalysis /></el-icon>
                      统计
                    </el-dropdown-item>
                    <el-dropdown-item 
                      :command="habit.is_active ? 'deactivate' : 'activate'"
                    >
                      <el-icon>
                        <VideoPause v-if="habit.is_active" />
                        <VideoPlay v-else />
                      </el-icon>
                      {{ habit.is_active ? '停用' : '启用' }}
                    </el-dropdown-item>
                    <el-dropdown-item 
                      command="delete"
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
        </div>
      </div>
    </div>

    <!-- 添加习惯弹窗 -->
    <el-dialog
      v-model="addHabitDialogVisible"
      :title="editingHabit ? '编辑习惯' : '新建习惯'"
      width="600px"
    >
      <el-form
        ref="habitForm"
        :model="habitFormData"
        :rules="habitRules"
        label-width="80px"
      >
        <el-form-item label="习惯名称" prop="name">
          <el-input
            v-model="habitFormData.name"
            placeholder="请输入习惯名称"
          />
        </el-form-item>
        
        <el-form-item label="习惯描述" prop="description">
          <el-input
            v-model="habitFormData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入习惯描述"
          />
        </el-form-item>
        
        <el-form-item label="图标" prop="icon">
          <el-select v-model="habitFormData.icon" placeholder="选择图标">
            <el-option
              v-for="icon in habitIcons"
              :key="icon"
              :label="icon"
              :value="icon"
            >
              <el-icon>
                <component :is="getHabitIcon(icon)" />
              </el-icon>
              <span style="margin-left: 8px">{{ icon }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="habitFormData.color" />
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="目标数量" prop="target_count">
              <el-input-number
                v-model="habitFormData.target_count"
                :min="1"
                :max="999"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input
                v-model="habitFormData.unit"
                placeholder="如：个、次、分钟"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="提醒时间" prop="time_of_day">
          <el-select v-model="habitFormData.time_of_day" placeholder="选择提醒时间">
            <el-option label="早晨" value="morning" />
            <el-option label="中午" value="noon" />
            <el-option label="晚上" value="evening" />
            <el-option label="睡前" value="bedtime" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelAddHabit">取消</el-button>
          <el-button 
            type="primary" 
            @click="saveHabit"
            :loading="saving"
          >
            {{ editingHabit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 统计弹窗 -->
    <HabitStats
      v-model="statsDialogVisible"
      :habit="selectedHabit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Calendar, ArrowLeft, ArrowRight,
  MoreFilled, Edit, DataAnalysis, VideoPause, VideoPlay, Delete,
  Sunny, Moon, Apple, Coffee,
  Trophy
} from '@element-plus/icons-vue'
import { habitApi, type Habit, type HabitRecord } from '@/api/life'
import { formatDate } from '@/utils/format'
import HabitStats from '@/components/life/HabitStats.vue'

// 响应式数据
const selectedDate = ref(new Date())
const showCalendarView = ref(false)
const currentDate = ref(new Date())
const habits = ref<Habit[]>([])
const habitRecords = ref<HabitRecord[]>([])
const habitFilter = ref('all')
const addHabitDialogVisible = ref(false)
const statsDialogVisible = ref(false)
const editingHabit = ref<Habit | null>(null)
const selectedHabit = ref<Habit | null>(null)
const saving = ref(false)

// 表单数据
const habitFormData = ref({
  name: '',
  description: '',
  icon: 'Heart',
  color: '#409EFF',
  target_count: 1,
  unit: '次',
  time_of_day: 'morning'
})

const habitRules = {
  name: [
    { required: true, message: '请输入习惯名称', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择图标', trigger: 'change' }
  ],
  color: [
    { required: true, message: '请选择颜色', trigger: 'change' }
  ],
  target_count: [
    { required: true, message: '请输入目标数量', trigger: 'blur' }
  ],
  unit: [
    { required: true, message: '请输入单位', trigger: 'blur' }
  ],
  time_of_day: [
    { required: true, message: '请选择提醒时间', trigger: 'change' }
  ]
}

// 图标列表
const habitIcons = [
  'Sunny', 'Moon', 'Apple', 'Coffee', 'Trophy'
]

// 星期
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 计算属性
const currentMonth = computed(() => {
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const endPadding = 6 - lastDay.getDay()
  
  const days = []
  
  // 上月尾部天数
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date: formatDate(date),
      day: date.getDate(),
      isCurrentMonth: false,
      habits: getHabitsForDate(formatDate(date))
    })
  }
  
  // 当月天数
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date: formatDate(date),
      day: i,
      isCurrentMonth: true,
      habits: getHabitsForDate(formatDate(date))
    })
  }
  
  // 下月开始天数
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: formatDate(date),
      day: i,
      isCurrentMonth: false,
      habits: getHabitsForDate(formatDate(date))
    })
  }
  
  return days
})

const todayHabits = computed(() => {
  return habits.value.filter(habit => 
    habit.is_active && 
    (habitFilter.value === 'all' || 
     (habitFilter.value === 'active' && habit.is_active) ||
     (habitFilter.value === 'inactive' && !habit.is_active))
  )
})

const filteredHabits = computed(() => {
  return habits.value.filter(habit => 
    habitFilter.value === 'all' || 
    (habitFilter.value === 'active' && habit.is_active) ||
    (habitFilter.value === 'inactive' && !habit.is_active)
  )
})

const todayCompletedCount = computed(() => {
  const today = formatDate(selectedDate.value)
  return todayHabits.value.filter(habit => 
    isCheckedToday(habit)
  ).length
})

// 方法
const loadHabits = async () => {
  try {
    const response = await habitApi.getList()
    habits.value = response.data
    
    // 加载今日打卡状态
    loadTodayStatus()
  } catch (error) {
    ElMessage.error('加载习惯列表失败')
  }
}

const loadTodayStatus = async () => {
  try {
    const response = await habitApi.getTodayStatus()
    habitRecords.value = response.data.records || []
  } catch (error) {
    console.error('加载今日打卡状态失败:', error)
  }
}

const getHabitsForDate = (date: string) => {
  return habits.value.filter(habit => {
    const record = habitRecords.value.find(r => 
      r.habit === habit.id && r.date === date
    )
    return habit.is_active && record && record.completed
  })
}

const isToday = (date: string) => {
  return date === formatDate(new Date())
}

const selectDate = (date: string) => {
  selectedDate.value = new Date(date)
  showCalendarView.value = false
}

const handleDateChange = (date: Date) => {
  selectedDate.value = date
}

const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}

const disabledDate = (time: Date) => {
  return time > new Date()
}

const getHabitIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'Sunny': Sunny,
    'Moon': Moon,
    'Apple': Apple,
    'Coffee': Coffee,
    'Trophy': Trophy
  }
  return iconMap[iconName] || Trophy
}

const isCheckedToday = (habit: Habit) => {
  const today = formatDate(selectedDate.value)
  const record = habitRecords.value.find(r => 
    r.habit === habit.id && r.date === today
  )
  return record?.completed || false
}

const toggleHabitCheckIn = (habit: Habit) => {
  const checked = isCheckedToday(habit)
  handleCheckIn(habit, !checked)
}

const handleCheckIn = async (habit: Habit, checked: boolean) => {
  const date = formatDate(selectedDate.value)
  
  try {
    if (checked) {
      await habitApi.checkIn(habit.id, { date })
      // 添加到记录
      habitRecords.value.push({
        id: Date.now(),
        habit: habit.id,
        date,
        completed: true,
        notes: '',
        created_at: new Date().toISOString(),
        user: 1
      })
      ElMessage.success('打卡成功')
    } else {
      await habitApi.cancelCheckIn(habit.id, date)
      // 从记录中移除
      habitRecords.value = habitRecords.value.filter(r => 
        !(r.habit === habit.id && r.date === date)
      )
      ElMessage.success('取消打卡成功')
    }
  } catch (error) {
    ElMessage.error('打卡操作失败')
  }
}

const showAddHabitDialog = () => {
  editingHabit.value = null
  habitFormData.value = {
    name: '',
    description: '',
    icon: 'Heart',
    color: '#409EFF',
    target_count: 1,
    unit: '次',
    time_of_day: 'morning'
  }
  addHabitDialogVisible.value = true
}

const cancelAddHabit = () => {
  addHabitDialogVisible.value = false
  editingHabit.value = null
}

const saveHabit = async () => {
  saving.value = true
  try {
    if (editingHabit.value) {
      // 更新习惯
      await habitApi.update(editingHabit.value.id, habitFormData.value)
      const index = habits.value.findIndex(h => h.id === editingHabit.value!.id)
      if (index > -1) {
        habits.value[index] = { ...habits.value[index], ...habitFormData.value }
      }
      ElMessage.success('习惯更新成功')
    } else {
      // 创建习惯
      const response = await habitApi.create(habitFormData.value)
      habits.value.unshift(response.data)
      ElMessage.success('习惯创建成功')
    }
    
    addHabitDialogVisible.value = false
  } catch (error) {
    ElMessage.error(editingHabit.value ? '更新失败' : '创建失败')
  } finally {
    saving.value = false
  }
}

const handleHabitAction = (command: string, habit: Habit) => {
  switch (command) {
    case 'edit':
      editingHabit.value = habit
      habitFormData.value = { ...habit }
      addHabitDialogVisible.value = true
      break
    case 'stats':
      selectedHabit.value = habit
      statsDialogVisible.value = true
      break
    case 'activate':
    case 'deactivate':
      updateHabitStatus(habit, command === 'activate')
      break
    case 'delete':
      deleteHabit(habit)
      break
  }
}

const updateHabitStatus = async (habit: Habit, isActive: boolean) => {
  try {
    await habitApi.update(habit.id, { is_active: isActive })
    const index = habits.value.findIndex(h => h.id === habit.id)
    if (index > -1) {
      habits.value[index].is_active = isActive
    }
    ElMessage.success(isActive ? '习惯已启用' : '习惯已停用')
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const deleteHabit = async (habit: Habit) => {
  try {
    await ElMessageBox.confirm('确定要删除这个习惯吗？', '确认删除', {
      type: 'warning'
    })
    await habitApi.delete(habit.id)
    habits.value = habits.value.filter(h => h.id !== habit.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const getCompletionRate = (_habit: Habit) => {
  // 简化的完成率计算
  return Math.floor(Math.random() * 30) + 70 // 模拟数据
}

// 生命周期
onMounted(() => {
  loadHabits()
})

watch(selectedDate, () => {
  loadTodayStatus()
})
</script>

<style lang="scss" scoped>
.health-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.health-header {
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
    
    .date-selector {
      .el-date-editor {
        border-radius: 8px;
      }
    }
  }
}

// 日历视图
.calendar-view {
  display: flex;
  gap: 24px;
  
  .calendar-container {
    flex: 1;
    
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--text-primary);
      }
      
      .calendar-nav {
        display: flex;
        gap: 8px;
      }
    }
    
    .calendar-grid {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
      
      .weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
        margin-bottom: 8px;
        
        .weekday {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 8px 0;
        }
      }
      
      .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          border-radius: 8px;
          padding: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          
          &:hover {
            background: rgba(59, 130, 246, 0.1);
          }
          
          &.today {
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid var(--primary-color);
          }
          
          &.other-month {
            opacity: 0.4;
          }
          
          &.has-habits {
            .day-number {
              font-weight: 600;
              color: var(--primary-color);
            }
          }
          
          .day-number {
            font-size: 14px;
            color: var(--text-primary);
            margin-bottom: 4px;
          }
          
          .habit-dots {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            justify-content: center;
            
            .habit-dot {
              width: 4px;
              height: 4px;
              border-radius: 50%;
            }
            
            .more-dots {
              font-size: 8px;
              color: var(--text-tertiary);
            }
          }
        }
      }
    }
  }
  
  .legend {
    width: 200px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .legend-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .legend-name {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
    }
  }
}

// 列表视图
.list-view {
  flex: 1;
  overflow-y: auto;
  
  .today-overview {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    
    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--text-primary);
      }
      
      .overview-stats {
        display: flex;
        gap: 16px;
        font-size: 14px;
        
        .completed-count {
          color: var(--success-color);
          font-weight: 600;
        }
        
        .total-count {
          color: var(--text-secondary);
        }
      }
    }
    
    .habits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      
      .habit-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .habit-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          
          .habit-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
          }
          
          .habit-info {
            flex: 1;
            
            h4 {
              margin: 0 0 4px 0;
              font-size: 16px;
              color: var(--text-primary);
            }
            
            p {
              margin: 0;
              font-size: 12px;
              color: var(--text-secondary);
            }
          }
        }
        
        .habit-check {
          display: flex;
          justify-content: center;
          margin: 16px 0;
          
          :deep(.el-checkbox__inner) {
            width: 24px;
            height: 24px;
          }
        }
        
        .habit-streak {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 14px;
          color: var(--warning-color);
          
          .el-icon {
            font-size: 16px;
          }
        }
      }
    }
  }
  
  .all-habits {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h3 {
        margin: 0;
        font-size: 18px;
        color: var(--text-primary);
      }
    }
    
    .habits-list {
      .habit-item {
        display: flex;
        align-items: center;
        gap: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        
        .habit-main {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          
          .habit-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
          }
          
          .habit-details {
            .habit-name {
              font-size: 16px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 4px;
            }
            
            .habit-desc {
              font-size: 12px;
              color: var(--text-secondary);
              margin-bottom: 8px;
            }
            
            .habit-meta {
              display: flex;
              gap: 16px;
              font-size: 12px;
              color: var(--text-tertiary);
            }
          }
        }
        
        .habit-stats-mini {
          display: flex;
          gap: 24px;
          
          .stat-item {
            text-align: center;
            
            .stat-value {
              font-size: 20px;
              font-weight: 600;
              color: var(--text-primary);
            }
            
            .stat-label {
              font-size: 12px;
              color: var(--text-tertiary);
            }
          }
        }
        
        .habit-actions {
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }
      
      .habit-item:hover .habit-actions {
        opacity: 1;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 1200px) {
  .calendar-view {
    flex-direction: column;
    
    .legend {
      width: 100%;
      margin-top: 20px;
    }
  }
}

@media (max-width: 768px) {
  .health-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .habits-grid {
    grid-template-columns: 1fr !important;
  }
  
  .habit-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .habit-stats-mini {
    justify-content: space-around;
  }
}
</style>