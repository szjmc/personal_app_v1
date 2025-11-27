<template>
  <div class="pomodoro-stats">
    <div class="stats-header">
      <h3>番茄钟统计</h3>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="loadStats"
      />
    </div>

    <div class="stats-content">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(102, 126, 234, 0.2);">
            <el-icon :size="24" color="#667eea"><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalSessions }}</div>
            <div class="stat-label">总轮数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.2);">
            <el-icon :size="24" color="#10b981"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalMinutes }}</div>
            <div class="stat-label">总时长(分钟)</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(245, 158, 11, 0.2);">
            <el-icon :size="24" color="#f59e0b"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.avgSessionsPerDay }}</div>
            <div class="stat-label">日均轮数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(239, 68, 68, 0.2);">
            <el-icon :size="24" color="#ef4444"><Medal /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.maxConsecutiveDays }}</div>
            <div class="stat-label">最长连续天数</div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <el-tabs v-model="activeChart">
          <el-tab-pane label="每日趋势" name="daily">
            <div class="chart-container">
              <div ref="dailyChartRef" class="chart"></div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="时段分布" name="hourly">
            <div class="chart-container">
              <div ref="hourlyChartRef" class="chart"></div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="任务统计" name="tasks">
            <div class="chart-container">
              <div ref="taskChartRef" class="chart"></div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 详细记录 -->
      <div class="records-section">
        <h4>详细记录</h4>
        <el-table
          :data="detailedRecords"
          stripe
          :max-height="400"
        >
          <el-table-column prop="date" label="日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="task_title" label="关联任务">
            <template #default="{ row }">
              <span v-if="row.task_title">{{ row.task_title }}</span>
              <el-tag v-else size="small" type="info">无任务</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="sessions_completed" label="完成轮数" width="100" />
          
          <el-table-column prop="duration_minutes" label="总时长" width="100">
            <template #default="{ row }">
              {{ formatDuration(row.duration_minutes) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="start_time" label="开始时间" width="100">
            <template #default="{ row }">
              {{ formatTime(row.start_time) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="efficiency_score" label="效率评分" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getEfficiencyType(row.efficiency_score)"
                size="small"
              >
                {{ row.efficiency_score?.toFixed(1) || '-' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  Timer,
  Clock,
  TrendCharts,
  Medal
} from '@element-plus/icons-vue'
import { timeApi } from '@/api/time'
import dayjs from 'dayjs'

// 响应式数据
const dateRange = ref<[string, string] | null>(null)
const activeChart = ref('daily')
const dailyChartRef = ref()
const hourlyChartRef = ref()
const taskChartRef = ref()

const stats = reactive({
  totalSessions: 0,
  totalMinutes: 0,
  avgSessionsPerDay: 0,
  maxConsecutiveDays: 0
})

const detailedRecords = ref([])

let dailyChart: echarts.ECharts | null = null
let hourlyChart: echarts.ECharts | null = null
let taskChart: echarts.ECharts | null = null

// 方法
const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
}

const formatTime = (time: string) => {
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

const getEfficiencyType = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

const loadStats = async () => {
  try {
    const params = dateRange.value
      ? {
          start_date: dateRange.value[0],
          end_date: dateRange.value[1]
        }
      : {}
    
    const records = await timeApi.getPomodoroSessions()
    
    // 计算统计数据
    calculateStats(records)
    detailedRecords.value = records.slice(0, 100) // 显示最近100条记录
    
    // 设置默认日期范围为最近30天
    if (!dateRange.value) {
      const end = dayjs().format('YYYY-MM-DD')
      const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
      dateRange.value = [start, end]
    }
    
    // 绘制图表
    await nextTick()
    drawCharts(records)
  } catch (error) {
    console.error('Load stats error:', error)
  }
}

const calculateStats = (records: any[]) => {
  stats.totalSessions = records.length
  stats.totalMinutes = records.reduce((sum, record) => sum + (record.duration_minutes || 0), 0)
  
  // 计算日均轮数
  if (dateRange.value) {
    const days = dayjs(dateRange.value[1]).diff(dayjs(dateRange.value[0]), 'day') + 1
    stats.avgSessionsPerDay = (stats.totalSessions / days).toFixed(1)
  }
  
  // 计算最长连续天数（简化版）
  stats.maxConsecutiveDays = calculateConsecutiveDays(records)
}

const calculateConsecutiveDays = (records: any[]) => {
  const dates = [...new Set(records.map(r => dayjs(r.start_time).format('YYYY-MM-DD')))]
    .sort()
  
  let maxStreak = 0
  let currentStreak = 0
  let lastDate = null
  
  for (const dateStr of dates) {
    const currentDate = dayjs(dateStr)
    
    if (lastDate) {
      const daysDiff = currentDate.diff(lastDate, 'day')
      if (daysDiff === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
    } else {
      currentStreak = 1
    }
    
    maxStreak = Math.max(maxStreak, currentStreak)
    lastDate = currentDate
  }
  
  return maxStreak
}

const drawCharts = (records: any[]) => {
  drawDailyChart(records)
  drawHourlyChart(records)
  drawTaskChart(records)
}

const drawDailyChart = (records: any[]) => {
  if (!dailyChartRef.value) return
  
  if (dailyChart) {
    dailyChart.dispose()
  }
  
  dailyChart = echarts.init(dailyChartRef.value)
  
  // 按日期分组统计
  const dailyData = {}
  records.forEach(record => {
    const date = dayjs(record.start_time).format('YYYY-MM-DD')
    if (!dailyData[date]) {
      dailyData[date] = { sessions: 0, minutes: 0 }
    }
    dailyData[date].sessions++
    dailyData[date].minutes += record.duration_minutes || 0
  })
  
  const dates = Object.keys(dailyData).sort()
  const sessionsData = dates.map(date => dailyData[date].sessions)
  const minutesData = dates.map(date => (dailyData[date].minutes / 60).toFixed(1))
  
  const option = {
    title: {
      text: '每日番茄钟使用情况',
      left: 'center',
      textStyle: { color: 'white' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['轮数', '时长(小时)'],
      top: 30,
      textStyle: { color: 'white' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates.map(date => dayjs(date).format('MM-DD')),
      axisLabel: { color: 'white' },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '轮数',
        position: 'left',
        axisLabel: { color: 'white' },
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } }
      },
      {
        type: 'value',
        name: '时长(小时)',
        position: 'right',
        axisLabel: { color: 'white' },
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } }
      }
    ],
    series: [
      {
        name: '轮数',
        type: 'line',
        data: sessionsData,
        smooth: true,
        itemStyle: { color: '#667eea' }
      },
      {
        name: '时长(小时)',
        type: 'line',
        yAxisIndex: 1,
        data: minutesData,
        smooth: true,
        itemStyle: { color: '#10b981' }
      }
    ]
  }
  
  dailyChart.setOption(option)
}

const drawHourlyChart = (records: any[]) => {
  if (!hourlyChartRef.value) return
  
  if (hourlyChart) {
    hourlyChart.dispose()
  }
  
  hourlyChart = echarts.init(hourlyChartRef.value)
  
  // 按小时分组统计
  const hourlyData = Array(24).fill(0)
  records.forEach(record => {
    const hour = dayjs(record.start_time).hour()
    hourlyData[hour]++
  })
  
  const option = {
    title: {
      text: '时间段分布',
      left: 'center',
      textStyle: { color: 'white' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}:00 - {c} 轮'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}`),
      axisLabel: {
        color: 'white',
        formatter: '{value}:00'
      },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'white' },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } }
    },
    series: [
      {
        type: 'bar',
        data: hourlyData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      }
    ]
  }
  
  hourlyChart.setOption(option)
}

const drawTaskChart = (records: any[]) => {
  if (!taskChartRef.value) return
  
  if (taskChart) {
    taskChart.dispose()
  }
  
  taskChart = echarts.init(taskChartRef.value)
  
  // 按任务分组统计
  const taskData = {}
  records.forEach(record => {
    const taskName = record.task_title || '无任务'
    if (!taskData[taskName]) {
      taskData[taskName] = 0
    }
    taskData[taskName] += record.sessions_completed || 1
  })
  
  const sortedTasks = Object.entries(taskData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // 只显示前10个任务
  
  const option = {
    title: {
      text: '任务统计 Top 10',
      left: 'center',
      textStyle: { color: 'white' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 轮'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        data: sortedTasks.map(([name, value]) => ({ name, value }))
      }
    ]
  }
  
  taskChart.setOption(option)
}

onMounted(() => {
  loadStats()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    dailyChart?.resize()
    hourlyChart?.resize()
    taskChart?.resize()
  })
})
</script>

<style lang="scss" scoped>
.pomodoro-stats {
  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h3 {
      color: white;
      font-weight: 600;
    }
  }
  
  .stats-content {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    
    .stat-card {
      @include glass-effect;
      border-radius: 12px;
      padding: 20px;
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
  }
  
  .charts-section {
    @include glass-effect;
    border-radius: 12px;
    padding: 24px;
    
    :deep(.el-tabs__nav) {
      &::after {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
    
    :deep(.el-tabs__item) {
      color: rgba(255, 255, 255, 0.7);
      
      &.is-active {
        color: white;
      }
    }
    
    .chart-container {
      height: 400px;
      margin-top: 24px;
      
      .chart {
        width: 100%;
        height: 100%;
      }
    }
  }
  
  .records-section {
    h4 {
      color: white;
      margin-bottom: 16px;
    }
    
    :deep(.el-table) {
      background: transparent;
      
      .el-table__header {
        background: rgba(255, 255, 255, 0.05);
        
        th {
          color: white;
          background: transparent;
          border-color: rgba(255, 255, 255, 0.1);
        }
      }
      
      .el-table__body {
        tr {
          background: transparent;
          
          &:hover {
            background: rgba(255, 255, 255, 0.05);
          }
          
          td {
            color: white;
            border-color: rgba(255, 255, 255, 0.1);
          }
        }
      }
    }
  }
}
</style>