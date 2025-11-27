<template>
  <div class="event-detail">
    <div class="event-header">
      <div class="event-type-badge" :style="{ backgroundColor: getEventTypeColor(event.event_type) }">
        {{ getEventTypeText(event.event_type) }}
      </div>
      
      <div class="event-actions">
        <el-button @click="editEvent">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </div>
    </div>

    <div class="event-content">
      <h2 class="event-title">{{ event.title }}</h2>
      
      <el-descriptions :column="1" border class="event-info">
        <el-descriptions-item label="时间">
          <div class="time-display">
            <div v-if="event.is_all_day">
              {{ formatDate(event.start_time) }} - {{ formatDate(event.end_time) }}
              <el-tag size="small" type="info">全天</el-tag>
            </div>
            <div v-else>
              {{ formatDateTime(event.start_time) }} - {{ formatDateTime(event.end_time) }}
              <div class="duration">时长: {{ getDuration(event.start_time, event.end_time) }}</div>
            </div>
            <div v-if="event.timezone !== 'Asia/Shanghai'" class="timezone-info">
              <el-icon><Clock /></el-icon>
              {{ getTimezoneText(event.timezone) }} 
              ({{ getTimezoneOffset(event.timezone) }})
            </div>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item label="地点">
          <div class="location-display">
            <span v-if="event.location">{{ event.location }}</span>
            <span v-else class="no-location">未设置地点</span>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item label="参与人">
          <div class="participants-display">
            <div v-if="event.participants && event.participants.length > 0">
              <el-avatar
                v-for="participant in event.participants"
                :key="participant.id"
                :size="32"
                :title="participant.username"
                class="participant-avatar"
              >
                {{ participant.username?.charAt(0) }}
              </el-avatar>
            </div>
            <span v-else class="no-participants">无参与人</span>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item label="日历">
          <div class="calendar-display">
            <span
              class="calendar-color"
              :style="{ backgroundColor: event.calendar_color }"
            />
            {{ event.calendar_name }}
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item label="提醒" v-if="event.reminder_minutes > 0">
          <el-tag size="small">
            {{ getReminderText(event.reminder_minutes) }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="创建者">
          {{ event.creator_name }}
        </el-descriptions-item>
        
        <el-descriptions-item label="创建时间">
          {{ formatDateTime(event.created_at) }}
        </el-descriptions-item>
        
        <el-descriptions-item label="最后更新">
          {{ formatDateTime(event.updated_at) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <div v-if="event.description" class="event-description">
        <h3>描述</h3>
        <div class="description-content">
          {{ event.description }}
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="event-footer">
      <el-button @click="shareEvent">
        <el-icon><Share /></el-icon>
        分享
      </el-button>
      
      <el-button @click="duplicateEvent">
        <el-icon><CopyDocument /></el-icon>
        复制
      </el-button>
      
      <el-button type="danger" @click="confirmDelete">
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Edit,
  Clock,
  Share,
  CopyDocument,
  Delete
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

interface Props {
  event: any
}

const props = defineProps<Props>()
const emit = defineEmits(['edit', 'delete', 'close'])

// 方法
const getEventTypeColor = (type: string) => {
  const colors = {
    work: '#667eea',
    life: '#10b981',
    health: '#ef4444'
  }
  return colors[type] || '#666'
}

const getEventTypeText = (type: string) => {
  const texts = {
    work: '工作',
    life: '生活',
    health: '健康'
  }
  return texts[type] || '其他'
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY年MM月DD日')
}

const formatDateTime = (date: string) => {
  return dayjs(date).format('YYYY年MM月DD日 HH:mm')
}

const getDuration = (start: string, end: string) => {
  const diff = dayjs(end).diff(dayjs(start))
  const dur = dayjs.duration(diff)
  
  const hours = Math.floor(dur.asHours())
  const minutes = dur.minutes()
  
  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`
  } else {
    return `${minutes}分钟`
  }
}

const getTimezoneText = (timezone: string) => {
  const texts = {
    'Asia/Shanghai': '北京时间',
    'Asia/Tokyo': '东京时间',
    'America/New_York': '纽约时间',
    'Europe/London': '伦敦时间'
  }
  return texts[timezone] || timezone
}

const getTimezoneOffset = (timezone: string) => {
  const offsets = {
    'Asia/Shanghai': 'GMT+8',
    'Asia/Tokyo': 'GMT+9',
    'America/New_York': 'GMT-5',
    'Europe/London': 'GMT+0'
  }
  return offsets[timezone] || 'GMT'
}

const getReminderText = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟前提醒`
  } else if (minutes < 1440) {
    return `${Math.floor(minutes / 60)}小时前提醒`
  } else {
    return `${Math.floor(minutes / 1440)}天前提醒`
  }
}

const editEvent = () => {
  emit('edit', props.event)
}

const shareEvent = () => {
  const shareText = `📅 ${props.event.title}\n` +
    `📍 ${props.event.location || '无地点'}\n` +
    `⏰ ${formatDateTime(props.event.start_time)} - ${formatDateTime(props.event.end_time)}\n` +
    `📝 ${props.event.description || '无描述'}`
  
  navigator.clipboard.writeText(shareText).then(() => {
    ElMessage.success('日程信息已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const duplicateEvent = () => {
  const duplicatedEvent = {
    title: props.event.title + ' (复制)',
    event_type: props.event.event_type,
    start_time: dayjs(props.event.start_time).add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    end_time: dayjs(props.event.end_time).add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    is_all_day: props.event.is_all_day,
    location: props.event.location,
    description: props.event.description,
    calendar: props.event.calendar,
    reminder_minutes: props.event.reminder_minutes,
    timezone: props.event.timezone,
    participants: props.event.participants?.map(p => p.id) || []
  }
  
  // 这里应该调用API创建事件
  ElMessage.success('日程已复制')
}

const confirmDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个日程吗？删除后无法恢复。',
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )
    
    emit('delete', props.event)
  } catch (error) {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.event-detail {
  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .event-type-badge {
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: $font-size-sm;
      font-weight: 500;
    }
  }
  
  .event-content {
    .event-title {
      color: white;
      font-size: $font-size-xl;
      font-weight: 600;
      margin-bottom: 24px;
      @include gradient-text;
    }
    
    .event-info {
      margin-bottom: 24px;
      
      :deep(.el-descriptions__label) {
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
      }
      
      :deep(.el-descriptions__content) {
        color: white;
      }
      
      .time-display {
        .duration {
          color: rgba(255, 255, 255, 0.6);
          font-size: $font-size-sm;
          margin-top: 4px;
        }
        
        .timezone-info {
          display: flex;
          align-items: center;
          gap: 4px;
          color: rgba(255, 255, 255, 0.6);
          font-size: $font-size-sm;
          margin-top: 4px;
        }
      }
      
      .location-display {
        .no-location {
          color: rgba(255, 255, 255, 0.6);
        }
      }
      
      .participants-display {
        .participant-avatar {
          margin-right: 8px;
        }
        
        .no-participants {
          color: rgba(255, 255, 255, 0.6);
        }
      }
      
      .calendar-display {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .calendar-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      }
    }
    
    .event-description {
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
        white-space: pre-wrap;
      }
    }
  }
  
  .event-footer {
    display: flex;
    gap: 12px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>