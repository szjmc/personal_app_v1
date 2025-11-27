<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="formRules"
    label-position="top"
  >
    <el-form-item label="日程标题" prop="title">
      <el-input
        v-model="form.title"
        placeholder="请输入日程标题"
        @input="validateTitle"
      />
    </el-form-item>

    <el-form-item label="日程类型" prop="event_type">
      <el-select v-model="form.event_type" placeholder="选择类型">
        <el-option
          v-for="type in eventTypeOptions"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        >
          <div class="type-option">
            <span
              class="type-color"
              :style="{ backgroundColor: type.color }"
            />
            {{ type.label }}
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <el-row :gutter="16">
      <el-col :span="6">
        <el-form-item label="全天日程">
          <el-switch
            v-model="form.is_all_day"
            @change="handleAllDayChange"
          />
        </el-form-item>
      </el-col>
      
      <el-col :span="9" v-if="!form.is_all_day">
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="form.start_time"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
      
      <el-col :span="9" v-if="!form.is_all_day">
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="form.end_time"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="16" v-if="form.is_all_day">
      <el-col :span="12">
        <el-form-item label="开始日期" prop="start_time">
          <el-date-picker
            v-model="form.start_time"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
      
      <el-col :span="12">
        <el-form-item label="结束日期" prop="end_time">
          <el-date-picker
            v-model="form.end_time"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="地点" prop="location">
      <el-input
        v-model="form.location"
        placeholder="请输入地点（支持自动联想）"
      >
        <template #append>
          <el-button @click="showLocationPicker">
            <el-icon><Location /></el-icon>
          </el-button>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item label="参与人">
      <div class="participants">
        <el-select
          v-model="form.participants"
          multiple
          filterable
          placeholder="搜索并添加参与人"
          remote
          :remote-method="searchUsers"
          :loading="userSearchLoading"
        >
          <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="user.username"
            :value="user.id"
          >
            <div class="user-option">
              <el-avatar :size="24">{{ user.username.charAt(0) }}</el-avatar>
              <span>{{ user.username }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
    </el-form-item>

    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="请输入日程描述"
      />
    </el-form-item>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item label="所属日历" prop="calendar">
          <el-select v-model="form.calendar" placeholder="选择日历">
            <el-option
              v-for="calendar in calendars"
              :key="calendar.id"
              :label="calendar.name"
              :value="calendar.id"
            >
              <div class="calendar-option">
                <span
                  class="calendar-color"
                  :style="{ backgroundColor: calendar.color }"
                />
                {{ calendar.name }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
      
      <el-col :span="8">
        <el-form-item label="提醒时间">
          <el-select v-model="form.reminder_minutes" placeholder="选择提醒时间">
            <el-option label="不提醒" :value="0" />
            <el-option label="5分钟前" :value="5" />
            <el-option label="15分钟前" :value="15" />
            <el-option label="30分钟前" :value="30" />
            <el-option label="1小时前" :value="60" />
            <el-option label="1天前" :value="1440" />
          </el-select>
        </el-form-item>
      </el-col>
      
      <el-col :span="8">
        <el-form-item label="时区">
          <el-select v-model="form.timezone" placeholder="选择时区">
            <el-option
              v-for="timezone in timezones"
              :key="timezone.value"
              :label="timezone.label"
              :value="timezone.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 冲突检测 -->
    <el-alert
      v-if="conflictEvents.length > 0"
      title="时间冲突提醒"
      type="warning"
      :closable="false"
      class="conflict-alert"
    >
      <div class="conflict-list">
        <div
          v-for="event in conflictEvents"
          :key="event.id"
          class="conflict-item"
        >
          <span>{{ formatEventTime(event.start_time) }} - {{ formatEventTime(event.end_time) }}</span>
          <span>{{ event.title }}</span>
          <div class="conflict-actions">
            <el-button size="small" @click="adjustTime(event)">调整时间</el-button>
            <el-button size="small" type="primary" @click="forceCreate">强制添加</el-button>
          </div>
        </div>
      </div>
    </el-alert>

    <el-form-item>
      <div class="form-actions">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ event ? '更新' : '创建' }}日程
        </el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { timeApi } from '@/api/time'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'

interface Props {
  event?: any
  selectedDate?: Date
}

const props = defineProps<Props>()
const emit = defineEmits(['submit', 'cancel'])

const formRef = ref<FormInstance>()
const submitting = ref(false)
const userSearchLoading = ref(false)
const calendars = ref([])
const userOptions = ref([])
const conflictEvents = ref([])

const eventTypeOptions = [
  { label: '工作', value: 'work', color: '#667eea' },
  { label: '生活', value: 'life', color: '#10b981' },
  { label: '健康', value: 'health', color: '#ef4444' }
]

const timezones = [
  { label: '北京时间 (GMT+8)', value: 'Asia/Shanghai' },
  { label: '东京时间 (GMT+9)', value: 'Asia/Tokyo' },
  { label: '纽约时间 (GMT-5)', value: 'America/New_York' },
  { label: '伦敦时间 (GMT+0)', value: 'Europe/London' }
]

const form = reactive({
  title: '',
  event_type: 'work',
  start_time: '',
  end_time: '',
  is_all_day: false,
  location: '',
  participants: [],
  description: '',
  calendar: '',
  reminder_minutes: 15,
  timezone: 'Asia/Shanghai'
})

const formRules: FormRules = {
  title: [
    { required: true, message: '请输入日程标题', trigger: 'blur' },
    { min: 2, message: '标题至少2个字符', trigger: 'blur' }
  ],
  event_type: [
    { required: true, message: '请选择日程类型', trigger: 'change' }
  ],
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  end_time: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
}

// 监听props变化
watch(() => props.event, (newEvent) => {
  if (newEvent) {
    Object.assign(form, {
      title: newEvent.title,
      event_type: newEvent.event_type,
      start_time: newEvent.start_time,
      end_time: newEvent.end_time,
      is_all_day: newEvent.is_all_day,
      location: newEvent.location,
      participants: newEvent.participants?.map(p => p.id) || [],
      description: newEvent.description,
      calendar: newEvent.calendar,
      reminder_minutes: newEvent.reminder_minutes,
      timezone: newEvent.timezone
    })
  }
}, { immediate: true })

watch(() => props.selectedDate, (newDate) => {
  if (newDate && !props.event) {
    const date = dayjs(newDate)
    form.start_time = date.hour(9).minute(0).format('YYYY-MM-DD HH:mm:ss')
    form.end_time = date.hour(10).minute(0).format('YYYY-MM-DD HH:mm:ss')
  }
}, { immediate: true })

// 方法
const validateTitle = () => {
  if (formRef.value) {
    formRef.value.validateField('title')
  }
}

const handleAllDayChange = (isAllDay: boolean) => {
  if (isAllDay) {
    // 全天日程的结束时间应该是当天的23:59
    const startTime = dayjs(form.start_time)
    form.start_time = startTime.startOf('day').format('YYYY-MM-DD HH:mm:ss')
    form.end_time = startTime.endOf('day').format('YYYY-MM-DD HH:mm:ss')
  } else {
    // 非全天日程，默认设置2小时时长
    const startTime = dayjs(form.start_time)
    form.start_time = startTime.format('YYYY-MM-DD HH:mm:ss')
    form.end_time = startTime.add(2, 'hour').format('YYYY-MM-DD HH:mm:ss')
  }
}

const searchUsers = async (query: string) => {
  if (!query) return
  
  try {
    userSearchLoading.value = true
    // 这里应该调用API搜索用户
    // userOptions.value = await userApi.searchUsers(query)
    
    // 模拟数据
    userOptions.value = [
      { id: '1', username: '张三' },
      { id: '2', username: '李四' },
      { id: '3', username: '王五' }
    ].filter(user => user.username.includes(query))
  } catch (error) {
    console.error('Search users error:', error)
  } finally {
    userSearchLoading.value = false
  }
}

const showLocationPicker = () => {
  // 这里可以集成地图API
  ElMessage.info('地图功能开发中')
}

const checkConflicts = async () => {
  if (!form.start_time || !form.end_time) return
  
  try {
    const params = {
      start_date: form.start_time,
      end_date: form.end_time,
      exclude_id: props.event?.id
    }
    const events = await timeApi.getEvents(params)
    conflictEvents.value = events.filter(event => event.id !== props.event?.id)
  } catch (error) {
    console.error('Check conflicts error:', error)
  }
}

const formatEventTime = (time: string) => {
  return dayjs(time).format('HH:mm')
}

const adjustTime = (conflictEvent: any) => {
  // 自动调整时间到冲突事件的下一个时间段
  const conflictEnd = dayjs(conflictEvent.end_time)
  const duration = dayjs(form.end_time).diff(dayjs(form.start_time), 'minute')
  
  form.start_time = conflictEnd.format('YYYY-MM-DD HH:mm:ss')
  form.end_time = conflictEnd.add(duration, 'minute').format('YYYY-MM-DD HH:mm:ss')
  
  conflictEvents.value = []
  ElMessage.success('时间已调整')
}

const forceCreate = () => {
  conflictEvents.value = []
  handleSubmit()
}

const loadCalendars = async () => {
  try {
    calendars.value = await timeApi.getCalendars()
    if (calendars.value.length > 0 && !form.calendar) {
      form.calendar = calendars.value[0].id
    }
  } catch (error) {
    console.error('Load calendars error:', error)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 检查时间逻辑
        if (dayjs(form.end_time).isBefore(dayjs(form.start_time))) {
          ElMessage.error('结束时间不能早于开始时间')
          return
        }
        
        // 检查冲突
        if (conflictEvents.value.length === 0) {
          await checkConflicts()
        }
        
        if (conflictEvents.value.length > 0) {
          ElMessage.warning('检测到时间冲突，请查看详情')
          return
        }
        
        submitting.value = true
        
        const eventData = { ...form }
        if (props.event) {
          emit('submit', { id: props.event.id, ...eventData })
        } else {
          emit('submit', eventData)
        }
      } catch (error) {
        ElMessage.error('保存失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadCalendars()
  watch([form.start_time, form.end_time], checkConflicts)
})
</script>

<style lang="scss" scoped>
:deep(.el-form-item__label) {
  color: white;
}

.type-option,
.calendar-option,
.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .type-color,
  .calendar-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
}

.participants {
  .el-select {
    width: 100%;
  }
}

.conflict-alert {
  margin-bottom: 24px;
  
  .conflict-list {
    margin-top: 12px;
    
    .conflict-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      &:last-child {
        border-bottom: none;
      }
      
      .conflict-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>