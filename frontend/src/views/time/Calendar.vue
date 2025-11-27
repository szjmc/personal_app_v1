<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <div class="header-left">
        <h1>日历管理</h1>
        <div class="view-switcher">
          <el-segmented
            v-model="currentView"
            :options="viewOptions"
            @change="handleViewChange"
          />
        </div>
      </div>
      
      <div class="header-center">
        <el-button-group>
          <el-button @click="prevPeriod">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button @click="goToToday">今天</el-button>
          <el-button @click="nextPeriod">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
        
        <h2 class="current-period">{{ currentPeriodText }}</h2>
      </div>
      
      <div class="header-right">
        <el-button type="primary" @click="showEventDialog = true">
          <el-icon><Plus /></el-icon>
          新建日程
        </el-button>
      </div>
    </div>

    <!-- 日历主体 -->
    <div class="calendar-content">
      <!-- 月视图 -->
      <div v-if="currentView === 'month'" class="month-view">
        <div class="weekdays">
          <div
            v-for="day in weekDays"
            :key="day"
            class="weekday"
          >
            {{ day }}
          </div>
        </div>
        <div class="month-grid">
          <div
            v-for="(day, index) in monthDays"
            :key="index"
            class="day-cell"
            :class="{
              'other-month': !isCurrentMonth(day),
              'today': isToday(day),
              'selected': isDateSelected(day)
            }"
            @click="selectDate(day)"
            @contextmenu="showDayMenu(day, $event)"
          >
            <div class="day-header">
              <span class="day-number">{{ day.getDate() }}</span>
              <div v-if="getEventsForDate(day).length > 0" class="event-dots">
                <div
                  v-for="event in getEventsForDate(day).slice(0, 3)"
                  :key="event.id"
                  class="event-dot"
                  :style="{ backgroundColor: getEventTypeColor(event.event_type) }"
                />
              </div>
            </div>
            
            <!-- 事件列表 -->
            <div class="day-events">
              <div
                v-for="event in getEventsForDate(day).slice(0, 2)"
                :key="event.id"
                class="event-item"
                :style="{ 
                  backgroundColor: getEventTypeColor(event.event_type),
                  color: 'white'
                }"
                @click.stop="showEventDetail(event)"
              >
                <span class="event-time">{{ formatEventTime(event.start_time) }}</span>
                <span class="event-title">{{ event.title }}</span>
              </div>
              
              <div
                v-if="getEventsForDate(day).length > 2"
                class="more-events"
              >
                +{{ getEventsForDate(day).length - 2 }} 更多
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 周视图 -->
      <div v-else-if="currentView === 'week'" class="week-view">
        <div class="week-grid">
          <div class="time-column">
            <div
              v-for="hour in hours"
              :key="hour"
              class="time-slot"
            >
              {{ hour }}:00
            </div>
          </div>
          
          <div
            v-for="day in weekDays"
            :key="day.getTime()"
            class="day-column"
          >
            <div class="day-header">
              {{ formatDate(day) }}
            </div>
            <div class="day-content">
              <div
                v-for="hour in hours"
                :key="hour"
                class="hour-slot"
                @click="createEventAtTime(day, hour)"
              />
              
              <!-- 事件块 -->
              <div
                v-for="event in getWeekEventsForDate(day)"
                :key="event.id"
                class="week-event"
                :style="{
                  top: getEventTop(event.start_time),
                  height: getEventHeight(event.start_time, event.end_time),
                  backgroundColor: getEventTypeColor(event.event_type)
                }"
                @click="showEventDetail(event)"
              >
                <div class="event-content">
                  <div class="event-time">{{ formatEventTime(event.start_time) }}</div>
                  <div class="event-title">{{ event.title }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 日视图 -->
      <div v-else-if="currentView === 'day'" class="day-view">
        <div class="day-schedule">
          <div class="time-column">
            <div
              v-for="hour in hours"
              :key="hour"
              class="time-slot"
            >
              {{ hour }}:00
            </div>
          </div>
          
          <div class="events-column">
            <div
              v-for="hour in hours"
              :key="hour"
              class="hour-slot"
              @click="createEventAtTime(selectedDate, hour)"
            />
            
            <!-- 事件块 -->
            <div
              v-for="event in getDayEvents(selectedDate)"
              :key="event.id"
              class="day-event"
              :style="{
                top: getEventTop(event.start_time),
                height: getEventHeight(event.start_time, event.end_time),
                backgroundColor: getEventTypeColor(event.event_type)
              }"
              @click="showEventDetail(event)"
            >
              <div class="event-content">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-details">
                  <span>{{ formatEventTime(event.start_time) }} - {{ formatEventTime(event.end_time) }}</span>
                  <span v-if="event.location">{{ event.location }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑日程对话框 -->
    <el-dialog
      v-model="showEventDialog"
      :title="editingEvent ? '编辑日程' : '新建日程'"
      width="600px"
    >
      <EventForm
        v-if="showEventDialog"
        :event="editingEvent"
        :selected-date="selectedDate"
        @submit="handleEventSubmit"
        @cancel="closeEventDialog"
      />
    </el-dialog>

    <!-- 日程详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="currentEvent?.title"
      width="600px"
    >
      <EventDetail
        v-if="showDetailDialog && currentEvent"
        :event="currentEvent"
        @edit="editEvent"
        @delete="deleteEvent"
        @close="showDetailDialog = false"
      />
    </el-dialog>

    <!-- 快速菜单 -->
    <el-menu
      ref="contextMenuRef"
      :model-value="false"
      class="day-context-menu"
      @select="handleContextMenuSelect"
    >
      <el-menu-item index="create">
        <el-icon><Plus /></el-icon>
        新建日程
      </el-menu-item>
      <el-menu-item index="view">
        <el-icon><View /></el-icon>
        查看日程
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  View
} from '@element-plus/icons-vue'
import { timeApi } from '@/api/time'
import EventForm from '@/components/time/EventForm.vue'
import EventDetail from '@/components/time/EventDetail.vue'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import 'dayjs/locale/zh-cn'

dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.locale('zh-cn')

// 响应式数据
const currentView = ref('month')
const currentDate = ref(dayjs())
const selectedDate = ref(new Date())
const events = ref([])
const showEventDialog = ref(false)
const showDetailDialog = ref(false)
const editingEvent = ref(null)
const currentEvent = ref(null)
const contextMenuRef = ref()
const contextMenuPosition = reactive({ x: 0, y: 0 })

// 配置
const viewOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' }
]

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const hours = Array.from({ length: 24 }, (_, i) => i)

// 计算属性
const currentPeriodText = computed(() => {
  switch (currentView.value) {
    case 'day':
      return currentDate.value.format('YYYY年MM月DD日')
    case 'week':
      const start = currentDate.value.startOf('week')
      const end = currentDate.value.endOf('week')
      return `${start.format('MM月DD日')} - ${end.format('MM月DD日')}`
    case 'month':
      return currentDate.value.format('YYYY年MM月')
    default:
      return ''
  }
})

const monthDays = computed(() => {
  const start = currentDate.value.startOf('month').startOf('week')
  const end = currentDate.value.endOf('month').endOf('week')
  const days = []
  
  let current = start
  while (current.isBefore(end) || current.isSame(end)) {
    days.push(current.toDate())
    current = current.add(1, 'day')
  }
  
  return days
})

const weekDaysData = computed(() => {
  const start = currentDate.value.startOf('week')
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').toDate())
})

// 方法
const loadEvents = async () => {
  try {
    const params = {
      start_date: currentDate.value.startOf(currentView.value).format('YYYY-MM-DD'),
      end_date: currentDate.value.endOf(currentView.value).format('YYYY-MM-DD')
    }
    events.value = await timeApi.getEvents(params)
  } catch (error) {
    ElMessage.error('加载日程失败')
  }
}

const handleViewChange = (view: string) => {
  currentView.value = view
  loadEvents()
}

const prevPeriod = () => {
  currentDate.value = currentDate.value.subtract(1, currentView.value === 'month' ? 'month' : 'week')
  loadEvents()
}

const nextPeriod = () => {
  currentDate.value = currentDate.value.add(1, currentView.value === 'month' ? 'month' : 'week')
  loadEvents()
}

const goToToday = () => {
  currentDate.value = dayjs()
  selectedDate.value = new Date()
  loadEvents()
}

const isCurrentMonth = (date: Date) => {
  return dayjs(date).month() === currentDate.value.month()
}

const isToday = (date: Date) => {
  return dayjs(date).isSame(dayjs(), 'day')
}

const isDateSelected = (date: Date) => {
  return dayjs(date).isSame(selectedDate.value, 'day')
}

const selectDate = (date: Date) => {
  selectedDate.value = date
  if (currentView.value === 'day') {
    currentDate.value = dayjs(date)
    loadEvents()
  }
}

const getEventsForDate = (date: Date) => {
  return events.value.filter(event => 
    dayjs(event.start_time).isSame(date, 'day')
  )
}

const getWeekEventsForDate = (date: Date) => {
  return events.value.filter(event => 
    dayjs(event.start_time).isSame(date, 'day')
  )
}

const getDayEvents = (date: Date) => {
  return events.value.filter(event => 
    dayjs(event.start_time).isSame(date, 'day')
  )
}

const formatDate = (date: Date) => {
  return dayjs(date).format('MM月DD日')
}

const formatEventTime = (time: string) => {
  return dayjs(time).format('HH:mm')
}

const getEventTypeColor = (type: string) => {
  const colors = {
    work: '#667eea',
    life: '#10b981',
    health: '#ef4444'
  }
  return colors[type] || '#666'
}

const getEventTop = (startTime: string) => {
  const hour = dayjs(startTime).hour()
  const minute = dayjs(startTime).minute()
  return (hour + minute / 60) * 60 + 'px'
}

const getEventHeight = (startTime: string, endTime: string) => {
  const duration = dayjs(endTime).diff(dayjs(startTime), 'minute')
  return (duration / 60) * 60 + 'px'
}

const showEventDetail = (event: any) => {
  currentEvent.value = event
  showDetailDialog.value = true
}

const createEventAtTime = (date: Date, hour: number) => {
  const startTime = dayjs(date).hour(hour).minute(0).second(0)
  editingEvent.value = null
  selectedDate.value = startTime.toDate()
  showEventDialog.value = true
}

const showDayMenu = (date: Date, event: MouseEvent) => {
  event.preventDefault()
  selectedDate.value = date
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  
  nextTick(() => {
    if (contextMenuRef.value) {
      contextMenuRef.value.open(event)
    }
  })
}

const handleContextMenuSelect = (command: string) => {
  switch (command) {
    case 'create':
      createEventAtTime(selectedDate.value, 9)
      break
    case 'view':
      // 切换到日视图
      currentView.value = 'day'
      currentDate.value = dayjs(selectedDate.value)
      loadEvents()
      break
  }
}

const handleEventSubmit = async (eventData: any) => {
  try {
    if (editingEvent.value) {
      await timeApi.updateEvent(editingEvent.value.id, eventData)
      ElMessage.success('日程更新成功')
    } else {
      await timeApi.createEvent(eventData)
      ElMessage.success('日程创建成功')
    }
    closeEventDialog()
    loadEvents()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const editEvent = (event: any) => {
  editingEvent.value = event
  currentEvent.value = null
  showDetailDialog.value = false
  showEventDialog.value = true
}

const deleteEvent = async (event: any) => {
  try {
    await timeApi.deleteEvent(event.id)
    ElMessage.success('日程删除成功')
    showDetailDialog.value = false
    loadEvents()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const closeEventDialog = () => {
  showEventDialog.value = false
  editingEvent.value = null
}

onMounted(() => {
  loadEvents()
})
</script>

<style lang="scss" scoped>
.calendar-view {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
    
    h1 {
      color: white;
      font-size: $font-size-2xl;
      font-weight: 600;
      @include gradient-text;
    }
  }
  
  .header-center {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .current-period {
      color: white;
      font-size: $font-size-lg;
      font-weight: 500;
      min-width: 200px;
      text-align: center;
    }
  }
}

.calendar-content {
  flex: 1;
  min-height: 0;
  @include glass-effect;
  border-radius: 12px;
  padding: 20px;
  overflow: hidden;
}

// 月视图样式
.month-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 8px;
    
    .weekday {
      text-align: center;
      color: white;
      font-weight: 500;
      padding: 8px;
    }
  }
  
  .month-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    gap: 1px;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .day-cell {
    background: rgba(255, 255, 255, 0.05);
    padding: 8px;
    cursor: pointer;
    transition: background $transition-fast ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    &.other-month {
      opacity: 0.5;
    }
    
    &.today {
      background: rgba(var(--el-color-primary-rgb), 0.2);
    }
    
    &.selected {
      background: rgba(var(--el-color-primary-rgb), 0.3);
    }
    
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      
      .day-number {
        color: white;
        font-weight: 500;
      }
      
      .event-dots {
        display: flex;
        gap: 2px;
        
        .event-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
      }
    }
    
    .day-events {
      flex: 1;
      overflow: hidden;
      
      .event-item {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 2px 4px;
        margin-bottom: 2px;
        font-size: $font-size-xs;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
        .event-time {
          opacity: 0.8;
        }
      }
      
      .more-events {
        color: rgba(255, 255, 255, 0.6);
        font-size: $font-size-xs;
        text-align: center;
      }
    }
  }
}

// 周视图样式
.week-view {
  height: 100%;
  
  .week-grid {
    display: grid;
    grid-template-columns: 60px repeat(7, 1fr);
    height: 100%;
    
    .time-column {
      .time-slot {
        height: 60px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        font-size: $font-size-sm;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
    }
    
    .day-column {
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      
      .day-header {
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .day-content {
        position: relative;
        height: calc(100% - 40px);
        
        .hour-slot {
          height: 60px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          
          &:hover {
            background: rgba(255, 255, 255, 0.05);
          }
        }
        
        .week-event {
          position: absolute;
          left: 2px;
          right: 2px;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          z-index: 1;
          
          .event-content {
            color: white;
            
            .event-title {
              font-weight: 500;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }
    }
  }
}

// 日视图样式
.day-view {
  height: 100%;
  
  .day-schedule {
    display: grid;
    grid-template-columns: 60px 1fr;
    height: 100%;
    
    .time-column {
      .time-slot {
        height: 60px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        font-size: $font-size-sm;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
    }
    
    .events-column {
      position: relative;
      
      .hour-slot {
        height: 60px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
        
        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      }
      
      .day-event {
        position: absolute;
        left: 10px;
        right: 10px;
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        z-index: 1;
        
        .event-content {
          color: white;
          
          .event-title {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .event-details {
            font-size: $font-size-sm;
            opacity: 0.8;
            
            span {
              &:not(:last-child)::after {
                content: ' • ';
              }
            }
          }
        }
      }
    }
  }
}

.day-context-menu {
  position: fixed;
  z-index: 1000;
  
  :deep(.el-menu-item) {
    color: white;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>