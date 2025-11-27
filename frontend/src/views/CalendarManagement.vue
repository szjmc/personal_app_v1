<template>
  <div style="padding: 20px; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 1200px; margin: 0 auto;">
      <!-- 头部 -->
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <h1 style="color: #333; margin: 0;">📅 日历管理</h1>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button @click="previousMonth" style="padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
              ←
            </button>
            <span style="color: #333; font-weight: 500; min-width: 150px; text-align: center;">
              {{ currentYear }}年 {{ currentMonth + 1 }}月
            </span>
            <button @click="nextMonth" style="padding: 8px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
              →
            </button>
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button @click="today" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">
            今天
          </button>
          <button @click="showAddEvent = true" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
            + 添加日程
          </button>
          <button @click="backToDashboard" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
            返回仪表盘
          </button>
        </div>
      </div>

      <!-- 日历网格 -->
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
        <!-- 星期标题 -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e5e7eb; margin-bottom: 1px;">
          <div v-for="day in weekDays" :key="day" style="background: #f9fafb; padding: 15px; text-align: center; font-weight: 500; color: #374151;">
            {{ day }}
          </div>
        </div>
        
        <!-- 日期格子 -->
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e5e7eb;">
          <div 
            v-for="day in calendarDays" 
            :key="day.date"
            :style="getDayStyle(day)"
            @click="selectDate(day)"
            style="min-height: 80px; padding: 8px; cursor: pointer; position: relative;"
          >
            <div :style="day.isCurrentMonth ? 'color: #374151; font-weight: 500;' : 'color: #9ca3af;'" style="margin-bottom: 4px;">
              {{ day.day }}
            </div>
            
            <!-- 事件指示器 -->
            <div v-if="day.events && day.events.length > 0" style="font-size: 11px;">
              <div v-for="(event, index) in day.events.slice(0, 3)" :key="index" :style="getEventStyle(event.type)" style="padding: 2px 4px; margin-bottom: 2px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ event.time }} {{ event.title }}
              </div>
              <div v-if="day.events.length > 3" style="color: #6b7280; font-size: 10px;">
                +{{ day.events.length - 3 }} 更多
              </div>
            </div>
            
            <!-- 今天标记 -->
            <div v-if="day.isToday" style="position: absolute; top: 5px; right: 5px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></div>
          </div>
        </div>
      </div>

      <!-- 选中日期的事件列表 -->
      <div v-if="selectedDate" style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">
          {{ selectedDate.month }}月{{ selectedDate.day }}日 的日程
        </h3>
        
        <div v-if="selectedDateEvents.length === 0" style="text-align: center; padding: 40px; color: #666;">
          当天暂无日程安排
        </div>
        
        <div v-else>
          <div v-for="event in selectedDateEvents" :key="event.id" style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid;" :style="`border-left-color: ${getEventTypeColor(event.type)}`">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1;">
                <h4 style="color: #333; margin: 0 0 5px 0;">{{ event.title }}</h4>
                <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">{{ event.description }}</p>
                <div style="color: #666; font-size: 12px; display: flex; gap: 15px;">
                  <span>🕒 {{ event.startTime }} - {{ event.endTime }}</span>
                  <span>📍 {{ event.location }}</span>
                  <span :style="{ color: getEventTypeColor(event.type) }">{{ getEventTypeText(event.type) }}</span>
                </div>
              </div>
              <div style="display: flex; gap: 5px;">
                <button @click="editEvent(event)" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                  编辑
                </button>
                <button @click="deleteEvent(event)" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加事件弹窗 -->
    <div v-if="showAddEvent" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 500px;">
        <h2 style="color: #333; margin-top: 0;">{{ editingEvent ? '编辑日程' : '添加日程' }}</h2>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">事件标题</label>
          <input v-model="newEvent.title" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入事件标题">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">事件描述</label>
          <textarea v-model="newEvent.description" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 80px;" placeholder="输入事件描述"></textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">类型</label>
            <select v-model="newEvent.type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="work">工作</option>
              <option value="study">学习</option>
              <option value="life">生活</option>
              <option value="meeting">会议</option>
              <option value="entertainment">娱乐</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">开始时间</label>
            <input v-model="newEvent.startTime" type="time" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">结束时间</label>
            <input v-model="newEvent.endTime" type="time" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">地点</label>
          <input v-model="newEvent.location" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入地点">
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button @click="closeEventModal" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
            取消
          </button>
          <button @click="saveEvent" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            {{ editingEvent ? '更新' : '添加' }}
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
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      selectedDate: null,
      showAddEvent: false,
      editingEvent: null,
      newEvent: {
        title: '',
        description: '',
        type: 'work',
        startTime: '09:00',
        endTime: '10:00',
        location: ''
      },
      events: [
        {
          id: 1,
          title: '团队会议',
          description: '讨论项目进展和下一步计划',
          type: 'meeting',
          date: '2024-12-18',
          startTime: '10:00',
          endTime: '11:30',
          location: '会议室A'
        },
        {
          id: 2,
          title: '项目截止',
          description: '前端开发项目交付',
          type: 'work',
          date: '2024-12-20',
          startTime: '18:00',
          endTime: '18:00',
          location: '办公室'
        },
        {
          id: 3,
          title: '健身',
          description: '每周例行健身',
          type: 'life',
          date: '2024-12-19',
          startTime: '19:00',
          endTime: '20:30',
          location: '健身房'
        },
        {
          id: 4,
          title: '学习Vue.js',
          description: 'Vue.js高级课程',
          type: 'study',
          date: '2024-12-21',
          startTime: '20:00',
          endTime: '22:00',
          location: '家'
        }
      ],
      weekDays: ['日', '一', '二', '三', '四', '五', '六']
    }
  },
  computed: {
    calendarDays() {
      const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay()
      const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate()
      const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate()
      
      const days = []
      
      // 上个月的日期
      for (let i = firstDay - 1; i >= 0; i--) {
        days.push({
          day: daysInPrevMonth - i,
          date: `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
          isCurrentMonth: false,
          events: []
        })
      }
      
      // 当前月的日期
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        days.push({
          day,
          date,
          isCurrentMonth: true,
          events: this.events.filter(event => event.date === date),
          isToday: this.isToday(day)
        })
      }
      
      // 下个月的日期
      const remainingDays = 42 - days.length
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          day,
          date: `${this.currentYear}-${String(this.currentMonth + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          isCurrentMonth: false,
          events: []
        })
      }
      
      return days
    },
    selectedDateEvents() {
      if (!this.selectedDate) return []
      return this.events.filter(event => event.date === this.selectedDate.date)
    }
  },
  methods: {
    isToday(day) {
      const today = new Date()
      return day === today.getDate() && 
             this.currentMonth === today.getMonth() && 
             this.currentYear === today.getFullYear()
    },
    getDayStyle(day) {
      if (!day.isCurrentMonth) {
        return 'background: #f9fafb;'
      }
      if (day.isToday) {
        return 'background: #fef3c7;'
      }
      return 'background: white;'
    },
    getEventStyle(type) {
      const colors = {
        work: '#3b82f6',
        study: '#8b5cf6',
        life: '#10b981',
        meeting: '#f59e0b',
        entertainment: '#ef4444'
      }
      return {
        background: colors[type] + '20',
        color: colors[type],
        border: `1px solid ${colors[type] + '40'}`
      }
    },
    getEventTypeColor(type) {
      const colors = {
        work: '#3b82f6',
        study: '#8b5cf6',
        life: '#10b981',
        meeting: '#f59e0b',
        entertainment: '#ef4444'
      }
      return colors[type] || '#667eea'
    },
    getEventTypeText(type) {
      const texts = {
        work: '工作',
        study: '学习',
        life: '生活',
        meeting: '会议',
        entertainment: '娱乐'
      }
      return texts[type] || type
    },
    previousMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11
        this.currentYear--
      } else {
        this.currentMonth--
      }
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0
        this.currentYear++
      } else {
        this.currentMonth++
      }
    },
    today() {
      const today = new Date()
      this.currentMonth = today.getMonth()
      this.currentYear = today.getFullYear()
      const day = {
        day: today.getDate(),
        date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
        isCurrentMonth: true
      }
      this.selectDate(day)
    },
    selectDate(day) {
      if (day.isCurrentMonth) {
        this.selectedDate = day
      }
    },
    saveEvent() {
      if (!this.newEvent.title) {
        alert('请输入事件标题')
        return
      }
      
      if (this.editingEvent) {
        // 更新事件
        const index = this.events.findIndex(e => e.id === this.editingEvent.id)
        if (index !== -1) {
          this.events[index] = {
            ...this.editingEvent,
            ...this.newEvent,
            date: this.selectedDate.date
          }
        }
      } else {
        // 添加新事件
        const event = {
          id: Date.now(),
          ...this.newEvent,
          date: this.selectedDate ? this.selectedDate.date : this.formatDate(new Date())
        }
        this.events.push(event)
      }
      
      this.closeEventModal()
    },
    editEvent(event) {
      this.editingEvent = event
      this.newEvent = {
        title: event.title,
        description: event.description,
        type: event.type,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location
      }
      this.showAddEvent = true
    },
    deleteEvent(event) {
      if (confirm(`确定要删除日程"${event.title}"吗？`)) {
        this.events = this.events.filter(e => e.id !== event.id)
      }
    },
    closeEventModal() {
      this.showAddEvent = false
      this.editingEvent = null
      this.newEvent = {
        title: '',
        description: '',
        type: 'work',
        startTime: '09:00',
        endTime: '10:00',
        location: ''
      }
    },
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    backToDashboard() {
      this.$router.push('/dashboard')
    }
  }
}
</script>