<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${habit?.name} - 统计分析`"
    width="800px"
    top="5vh"
  >
    <div v-if="habit" class="stats-container">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="overview-card">
          <div class="card-icon" :style="{ backgroundColor: habit.color }">
            <el-icon>
              <component :is="getHabitIcon(habit.icon)" />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-title">连续天数</div>
            <div class="card-value">{{ habitStats.streak_days }}天</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon completed">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-title">完成率</div>
            <div class="card-value">{{ habitStats.completion_rate }}%</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon total">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-title">总天数</div>
            <div class="card-value">{{ habitStats.total_days }}天</div>
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon success">
            <el-icon><FinishedCircle /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-title">已完成</div>
            <div class="card-value">{{ habitStats.completed_days }}天</div>
          </div>
        </div>
      </div>

      <!-- 本周完成情况 -->
      <div class="week-stats">
        <h3>本周完成情况</h3>
        <div class="week-grid">
          <div
            v-for="(day, index) in weekDays"
            :key="index"
            class="day-item"
            :class="{
              'completed': day.completed,
              'today': isToday(day.date),
              'future': isFuture(day.date)
            }"
          >
            <div class="day-name">{{ day.name }}</div>
            <div class="day-date">{{ day.date.slice(8, 10) }}</div>
            <div class="day-status">
              <el-icon v-if="day.completed"><Check /></el-icon>
              <el-icon v-else><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 完成趋势图表 -->
      <div class="trend-chart">
        <h3>完成趋势</h3>
        <div class="chart-controls">
          <el-radio-group v-model="chartPeriod" @change="loadChartData">
            <el-radio-button label="week">近7天</el-radio-button>
            <el-radio-button label="month">近30天</el-radio-button>
            <el-radio-button label="quarter">近3个月</el-radio-button>
          </el-radio-group>
        </div>
        
        <div ref="chartContainer" class="chart-container"></div>
      </div>

      <!-- 最佳记录 -->
      <div class="best-records">
        <h3>最佳记录</h3>
        <div class="records-grid">
          <div class="record-item">
            <div class="record-label">最长连续天数</div>
            <div class="record-value">{{ bestRecords.longest_streak }}天</div>
            <div class="record-date">{{ bestRecords.streak_date }}</div>
          </div>
          
          <div class="record-item">
            <div class="record-label">本月完成率</div>
            <div class="record-value">{{ bestRecords.month_rate }}%</div>
            <div class="record-date">本月</div>
          </div>
          
          <div class="record-item">
            <div class="record-label">单周最佳</div>
            <div class="record-value">{{ bestRecords.week_best }}%</div>
            <div class="record-date">{{ bestRecords.week_date }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
        <el-button type="primary" @click="exportStats">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Trophy, Calendar, FinishedCircle, Check, Close, Download
} from '@element-plus/icons-vue'
import { habitApi, type Habit, type HabitStats } from '@/api/life'
import * as echarts from 'echarts'
import { getHabitIcon } from '@/views/life/Health.vue'
import { formatDate, isToday, isFuture } from '@/utils/format'

const props = defineProps<{
  modelValue: boolean
  habit?: Habit | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 响应式数据
const chartPeriod = ref('week')
const habitStats = ref<HabitStats>({
  total_days: 0,
  completed_days: 0,
  streak_days: 0,
  completion_rate: 0,
  this_week_records: []
})
const bestRecords = ref({
  longest_streak: 0,
  streak_date: '',
  month_rate: 0,
  week_best: 0,
  week_date: ''
})
const chartContainer = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const weekDays = computed(() => {
  const days = []
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    
    const dateStr = formatDate(date)
    const record = habitStats.value.this_week_records.find(r => r.date === dateStr)
    
    days.push({
      name: weekNames[i],
      date: dateStr,
      completed: record?.completed || false
    })
  }
  
  return days
})

// 方法
const loadHabitStats = async () => {
  if (!props.habit?.id) return
  
  try {
    const response = await habitApi.getStats(props.habit.id)
    habitStats.value = response.data
    loadBestRecords()
  } catch (error) {
    ElMessage.error('加载统计数据失败')
  }
}

const loadBestRecords = () => {
  // 模拟最佳记录数据
  bestRecords.value = {
    longest_streak: Math.floor(Math.random() * 30) + 10,
    streak_date: '2024-01-15',
    month_rate: Math.floor(Math.random() * 20) + 80,
    week_best: Math.floor(Math.random() * 30) + 70,
    week_date: '2024-01-20'
  }
}

const loadChartData = async () => {
  if (!chartContainer.value) return
  
  // 模拟图表数据
  const data = generateChartData()
  
  nextTick(() => {
    if (chartInstance) {
      chartInstance.dispose()
    }
    
    chartInstance = echarts.init(chartContainer.value)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0]
          return `${data.name}<br/>完成率: ${data.value}%`
        }
      },
      xAxis: {
        type: 'category',
        data: data.dates,
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.6)',
          formatter: '{value}%'
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        }
      },
      series: [
        {
          name: '完成率',
          type: 'line',
          data: data.values,
          smooth: true,
          lineStyle: {
            color: props.habit?.color || '#409EFF',
            width: 3
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: props.habit?.color || '#409EFF'
                },
                {
                  offset: 1,
                  color: 'rgba(64, 158, 255, 0.1)'
                }
              ]
            }
          },
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: props.habit?.color || '#409EFF'
          }
        }
      ],
      grid: {
        left: '10%',
        right: '10%',
        bottom: '10%',
        top: '10%'
      }
    }
    
    chartInstance.setOption(option)
    
    // 响应式处理
    window.addEventListener('resize', () => {
      chartInstance?.resize()
    })
  })
}

const generateChartData = () => {
  const now = new Date()
  let days = 7
  let dates = []
  let values = []
  
  switch (chartPeriod.value) {
    case 'week':
      days = 7
      break
    case 'month':
      days = 30
      break
    case 'quarter':
      days = 90
      break
  }
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    dates.push(formatDate(date))
    // 模拟完成率数据
    values.push(Math.floor(Math.random() * 30) + 70)
  }
  
  return { dates, values }
}

const exportStats = () => {
  if (!props.habit) return
  
  const statsData = {
    habit: props.habit.name,
    export_time: formatDate(new Date()),
    stats: habitStats.value,
    best_records: bestRecords.value,
    chart_period: chartPeriod.value
  }
  
  const dataStr = JSON.stringify(statsData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.habit.name}_统计数据_${formatDate(new Date())}.json`
  link.click()
  
  URL.revokeObjectURL(url)
  ElMessage.success('数据导出成功')
}

const closeDialog = () => {
  dialogVisible.value = false
}

// 监听弹窗打开
watch(() => props.modelValue, (visible) => {
  if (visible && props.habit) {
    loadHabitStats()
    nextTick(() => {
      loadChartData()
    })
  }
})

watch(() => props.habit, (newHabit) => {
  if (newHabit && props.modelValue) {
    loadHabitStats()
    loadChartData()
  }
})

// 清理
watch(dialogVisible, (visible) => {
  if (!visible && chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style lang="scss" scoped>
.stats-container {
  .stats-overview {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
    
    .overview-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      
      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        
        &.completed {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }
        
        &.total {
          background: linear-gradient(135deg, #909399, #b3b7bc);
        }
        
        &.success {
          background: linear-gradient(135deg, #e6a23c, #eebe77);
        }
      }
      
      .card-info {
        .card-title {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        
        .card-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
        }
      }
    }
  }
  
  .week-stats {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: var(--text-primary);
    }
    
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
      
      .day-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        border-radius: 8px;
        padding: 12px 8px;
        text-align: center;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
        }
        
        &.completed {
          background: rgba(103, 194, 58, 0.1);
          border-color: #67c23a;
        }
        
        &.today {
          border-color: var(--primary-color);
          border-width: 2px;
        }
        
        &.future {
          opacity: 0.5;
        }
        
        .day-name {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        
        .day-date {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        
        .day-status {
          display: flex;
          justify-content: center;
          
          .el-icon {
            font-size: 16px;
          }
          
          .el-icon:nth-child(1) {
            color: #67c23a;
          }
          
          .el-icon:nth-child(2) {
            color: var(--text-tertiary);
          }
        }
      }
    }
  }
  
  .trend-chart {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: var(--text-primary);
    }
    
    .chart-controls {
      margin-bottom: 20px;
    }
    
    .chart-container {
      height: 300px;
      width: 100%;
    }
  }
  
  .best-records {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: var(--text-primary);
    }
    
    .records-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      
      .record-item {
        text-align: center;
        
        .record-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        
        .record-value {
          font-size: 28px;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 4px;
        }
        
        .record-date {
          font-size: 12px;
          color: var(--text-tertiary);
        }
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
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .records-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .week-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    
    .day-item {
      padding: 8px 4px;
      
      .day-name {
        font-size: 10px;
      }
      
      .day-date {
        font-size: 14px;
      }
    }
  }
}
</style>