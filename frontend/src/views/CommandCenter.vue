<template>
  <div class="command-center">
    <!-- 顶部控制区 -->
    <header class="header-section">
      <div class="header-content">
        <div class="header-left">
          <h1 class="main-title">🎛️ 个人数据全景控制台</h1>
          <div class="mode-selector">
            <el-radio-group v-model="userMode" size="small">
              <el-radio-button label="work">💼 工作导向</el-radio-button>
              <el-radio-button label="health">🏃‍♂️ 健康导向</el-radio-button>
              <el-radio-button label="all">🌟 全能型</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="header-center">
          <div class="today-overview">
            <div class="overview-item">
              <span class="overview-label">今日任务</span>
              <span class="overview-value">{{ totalTasks }}</span>
            </div>
            <div class="overview-item">
              <span class="overview-label">今日事件</span>
              <span class="overview-value">{{ todayEvents }}</span>
            </div>
            <div class="overview-item">
              <span class="overview-label">健康评分</span>
              <span class="overview-value score">{{ healthScore }}</span>
            </div>
            <div class="overview-item">
              <span class="overview-label">本月支出</span>
              <span class="overview-value expense">¥{{ totalExpense }}</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <el-button-group>
            <el-button type="primary" @click="refreshData">
              <el-icon><RefreshRight /></el-icon>
              刷新数据
            </el-button>
            <el-button @click="backToDashboard">
              <el-icon><ArrowLeft /></el-icon>
              返回仪表盘
            </el-button>
            <el-dropdown @command="handleCustomize">
              <el-button>
                <el-icon><Setting /></el-icon>
                个性化配置
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="layout">布局设置</el-dropdown-item>
                  <el-dropdown-item command="modules">模块管理</el-dropdown-item>
                  <el-dropdown-item command="theme">主题设置</el-dropdown-item>
                  <el-dropdown-item command="quickActions">快捷操作配置</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
        </div>
      </div>

      <!-- 核心数据统计 -->
      <div class="stats-grid">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon task-icon">📋</div>
            <div class="stat-info">
              <div class="stat-value">{{ totalTasks }}</div>
              <div class="stat-label">待办任务</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon calendar-icon">📅</div>
            <div class="stat-info">
              <div class="stat-value">{{ todayEvents }}</div>
              <div class="stat-label">今日日程</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon note-icon">📚</div>
            <div class="stat-info">
              <div class="stat-value">{{ recentNotes }}</div>
              <div class="stat-label">本周笔记</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon finance-icon">💰</div>
            <div class="stat-info">
              <div class="stat-value">¥{{ totalExpense }}</div>
              <div class="stat-label">本月支出</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon health-icon">🏃‍♂️</div>
            <div class="stat-info">
              <div class="stat-value">{{ healthScore }}</div>
              <div class="stat-label">健康评分</div>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon progress-icon">📊</div>
            <div class="stat-info">
              <div class="stat-value">{{ todayProgress }}%</div>
              <div class="stat-label">今日进度</div>
            </div>
          </div>
        </el-card>
      </div>
    </header>

    <!-- 快速操作矩阵 -->
    <section class="quick-actions-section">
      <div class="actions-grid">
        <!-- 工作导向快捷操作 -->
        <el-card v-if="userMode === 'work' || userMode === 'all'" class="action-card work-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>💼 工作快捷操作</h3>
            </div>
          </template>
          <div class="action-buttons">
            <el-button @click="quickAddTask" class="action-btn work-btn">
              <el-icon><DocumentAdd /></el-icon>
              快速添加任务
            </el-button>
            <el-button @click="jumpToHighPriorityTasks" class="action-btn urgent-btn">
              <el-icon><WarningFilled /></el-icon>
              高优先级任务
            </el-button>
            <el-button @click="jumpToTodayTasks" class="action-btn deadline-btn">
              <el-icon><Timer /></el-icon>
              今日截止任务
            </el-button>
            <el-button @click="addMeeting" class="action-btn meeting-btn">
              <el-icon><VideoCamera /></el-icon>
              安排会议
            </el-button>
            <el-button @click="quickAddNote" class="action-btn note-btn">
              <el-icon><EditPen /></el-icon>
              快速笔记
            </el-button>
            <el-button @click="jumpToKnowledge" class="action-btn knowledge-btn">
              <el-icon><Document /></el-icon>
              知识库
            </el-button>
            <el-button @click="jumpToCalendar" class="action-btn calendar-btn">
              <el-icon><Calendar /></el-icon>
              查看日历
            </el-button>
            <el-button @click="quickAddEvent" class="action-btn event-btn">
              <el-icon><CalendarAdd /></el-icon>
              添加事件
            </el-button>
          </div>
        </el-card>

        <!-- 健康导向快捷操作 -->
        <el-card v-if="userMode === 'health' || userMode === 'all'" class="action-card health-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>🏃‍♂️ 健康快捷操作</h3>
            </div>
          </template>
          <div class="action-buttons">
            <el-button @click="quickLogExercise" class="action-btn exercise-btn">
              <el-icon><CirclePlus /></el-icon>
              记录运动
            </el-button>
            <el-button @click="quickLogWeight" class="action-btn weight-btn">
              <el-icon><CirclePlus /></el-icon>
              记录体重
            </el-button>
            <el-button @click="quickLogSleep" class="action-btn sleep-btn">
              <el-icon><Moon /></el-icon>
              记录睡眠
            </el-button>
            <el-button @click="quickLogMeal" class="action-btn meal-btn">
              <el-icon><Food /></el-icon>
              记录饮食
            </el-button>
            <el-button @click="quickRecordWater" class="action-btn water-btn">
              <el-icon><Watermelon /></el-icon>
              记录饮水
            </el-button>
            <el-button @click="viewHealthReport" class="action-btn report-btn">
              <el-icon><DataAnalysis /></el-icon>
              健康报告
            </el-button>
            <el-button @click="jumpToHealth" class="action-btn health-detail-btn">
              <el-icon><User /></el-icon>
              健康详情
            </el-button>
            <el-button @click="quickLogMood" class="action-btn mood-btn">
              <el-icon><CirclePlus /></el-icon>
              记录心情
            </el-button>
          </div>
        </el-card>

        <!-- 生活管理快捷操作 -->
        <el-card v-if="userMode === 'all'" class="action-card life-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>🏠 生活快捷操作</h3>
            </div>
          </template>
          <div class="action-buttons">
            <el-button @click="quickRecordExpense" class="action-btn expense-btn">
              <el-icon><Money /></el-icon>
              记录支出
            </el-button>
            <el-button @click="quickRecordIncome" class="action-btn income-btn">
              <el-icon><CirclePlus /></el-icon>
              记录收入
            </el-button>
            <el-button @click="viewFinanceReport" class="action-btn finance-report-btn">
              <el-icon><TrendCharts /></el-icon>
              财务报表
            </el-button>
            <el-button @click="quickAddShopping" class="action-btn shopping-btn">
              <el-icon><ShoppingCart /></el-icon>
              购物清单
            </el-button>
            <el-button @click="quickAddReminder" class="action-btn reminder-btn">
              <el-icon><Bell /></el-icon>
              添加提醒
            </el-button>
            <el-button @click="viewAllModules" class="action-btn all-modules-btn">
              <el-icon><Grid /></el-icon>
              所有模块
            </el-button>
            <el-button @click="jumpToFinance" class="action-btn finance-detail-btn">
              <el-icon><CirclePlus /></el-icon>
              财务详情
            </el-button>
            <el-button @click="quickAddHabit" class="action-btn habit-btn">
              <el-icon><Star /></el-icon>
              添加习惯
            </el-button>
          </div>
        </el-card>
      </div>
    </section>

    <!-- 模块快速入口 -->
    <section class="modules-section">
      <el-card shadow="hover" class="modules-card">
        <template #header>
          <div class="card-header">
            <h3>🎯 模块快速入口</h3>
            <el-button type="text" @click="manageModules">
              <el-icon><Setting /></el-icon>
              管理模块
            </el-button>
          </div>
        </template>
        <div class="modules-grid">
          <div 
            v-for="module in visibleModules" 
            :key="module.key" 
            class="module-item"
            :class="{ 'hot-module': module.hot, 'work-module': module.category === 'work', 'health-module': module.category === 'health', 'life-module': module.category === 'life' }"
            @click="jumpToModule(module.path)"
          >
            <div class="module-content">
              <div class="module-icon">{{ module.icon }}</div>
              <div class="module-info">
                <h4 class="module-name">{{ module.name }}</h4>
                <p class="module-desc">{{ module.description }}</p>
                <div class="module-stats">{{ module.stats }}</div>
                <el-progress 
                  v-if="module.progress !== undefined" 
                  :percentage="module.progress" 
                  :stroke-width="4" 
                  :color="module.color"
                  class="module-progress"
                />
              </div>
              <el-tag v-if="module.hot" type="danger" size="small">HOT</el-tag>
              <el-tag v-else-if="module.new" type="success" size="small">NEW</el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </section>

    <!-- 今日焦点 -->
    <section class="focus-section">
      <div class="focus-grid">
        <!-- 今日任务焦点 -->
        <el-card class="focus-card task-focus" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>📋 今日任务焦点</h3>
              <el-button type="text" @click="viewAllTasks">查看全部</el-button>
            </div>
          </template>
          <div v-if="todayTasks.length === 0" class="empty-state">
            <el-empty description="今天没有安排任务 🎉" />
          </div>
          <div v-else class="task-list">
            <div 
              v-for="task in todayTasks" 
              :key="task.id" 
              class="task-item"
              :class="`priority-${task.priority}`"
            >
              <el-checkbox 
                :model-value="task.completed" 
                @change.stop="toggleTaskComplete(task)"
                :class="getPriorityClass(task.priority)"
              />
              <div class="task-info">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-meta">{{ task.category }} | 截止: {{ task.dueDate }}</div>
              </div>
              <el-button 
                size="small" 
                type="primary" 
                plain
                @click.stop="jumpToTaskDetail(task)"
              >
                查看
              </el-button>
            </div>
          </div>
          <div class="task-progress">
            <div class="progress-label">
              <span>任务完成进度</span>
              <span>{{ completedTasksCount }}/{{ todayTasks.length }}</span>
            </div>
            <el-progress :percentage="taskCompletionRate" :stroke-width="8" />
          </div>
        </el-card>

        <!-- 日历事件预览 -->
        <el-card class="focus-card calendar-focus" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>📅 今日日程</h3>
              <el-button type="text" @click="viewCalendar">查看日历</el-button>
            </div>
          </template>
          <div v-if="todayEvents === 0" class="empty-state">
            <el-empty description="今天没有安排日程 🎉" />
          </div>
          <div v-else class="event-list">
            <div 
              v-for="event in calendarEvents" 
              :key="event.id" 
              class="event-item"
            >
              <div class="event-time">{{ event.time }}</div>
              <div class="event-content">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-location" v-if="event.location">
                  <el-icon><Location /></el-icon>
                  {{ event.location }}
                </div>
              </div>
              <el-button 
                size="small" 
                type="text"
                @click.stop="jumpToEventDetail(event)"
              >
                详情
              </el-button>
            </div>
          </div>
          <div class="upcoming-events" v-if="upcomingEvents.length > 0">
            <h4>未来3天重要事件</h4>
            <div 
              v-for="event in upcomingEvents" 
              :key="event.id" 
              class="event-item upcoming"
            >
              <div class="event-date">{{ event.date }}</div>
              <div class="event-content">
                <div class="event-title">{{ event.title }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 快速备忘录 -->
        <el-card class="focus-card memo-focus" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>📝 快速备忘录</h3>
              <div class="memo-actions">
                <el-button size="small" type="success" @click="saveQuickMemo">
                  <el-icon><Check /></el-icon>
                  保存
                </el-button>
                <el-button size="small" type="danger" @click="clearQuickMemo">
                  <el-icon><Delete /></el-icon>
                  清空
                </el-button>
              </div>
            </div>
          </template>
          <el-input
            v-model="quickMemo"
            type="textarea"
            :rows="6"
            placeholder="在这里记录临时想法..."
            resize="none"
          />
          <div class="memo-footer">
            <span class="char-count">{{ quickMemo.length }} 字符</span>
            <span class="save-status" v-if="memoSaved">{{ memoSaveTime }}</span>
          </div>
        </el-card>

        <!-- 健康数据概览 -->
        <el-card v-if="userMode === 'health' || userMode === 'all'" class="focus-card health-focus" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>🏃‍♂️ 今日健康数据</h3>
              <el-button type="text" @click="viewHealthDetails">查看详情</el-button>
            </div>
          </template>
          <div class="health-stats">
            <div class="health-item">
              <span class="health-label">步数</span>
              <div class="health-progress">
                <span class="health-value">{{ todaySteps }}/10,000</span>
                <el-progress :percentage="todaySteps / 100" :stroke-width="6" color="#67c23a" />
              </div>
            </div>
            <div class="health-item">
              <span class="health-label">饮水</span>
              <div class="health-progress">
                <span class="health-value">{{ todayWater }}/2,000ml</span>
                <el-progress :percentage="todayWater / 20" :stroke-width="6" color="#409eff" />
              </div>
            </div>
            <div class="health-item">
              <span class="health-label">睡眠</span>
              <div class="health-progress">
                <span class="health-value">{{ todaySleep }}/8h</span>
                <el-progress :percentage="(todaySleep / 8) * 100" :stroke-width="6" color="#909399" />
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </section>

    <!-- 数据洞察 -->
    <section class="insights-section">
      <el-card shadow="hover" class="insights-card">
        <template #header>
          <div class="card-header">
            <h3>📊 数据洞察</h3>
          </div>
        </template>
        <div class="insights-grid">
          <div class="insight-item task-insight">
            <h4>任务完成率</h4>
            <div class="insight-content">
              <el-progress 
                type="circle" 
                :percentage="taskCompletionRate" 
                :stroke-width="8"
                :width="80"
                color="#3b82f6"
              />
              <div class="insight-stats">
                <div class="stat-value">{{ taskCompletionRate }}%</div>
                <div class="stat-label">已完成</div>
                <div class="stat-detail">本周共 {{ totalWeeklyTasks }} 个任务</div>
              </div>
            </div>
          </div>
          
          <div class="insight-item health-insight">
            <h4>本周运动</h4>
            <div class="insight-content">
              <el-progress 
                type="circle" 
                :percentage="weeklyExercisePercentage" 
                :stroke-width="8"
                :width="80"
                color="#10b981"
              />
              <div class="insight-stats">
                <div class="stat-value">{{ weeklyExercise }}</div>
                <div class="stat-label">次运动</div>
                <div class="stat-detail">目标: 5次/周</div>
              </div>
            </div>
          </div>
          
          <div class="insight-item finance-insight">
            <h4>本月财务</h4>
            <div class="insight-content">
              <div class="finance-stats">
                <div class="finance-item income">
                  <div class="stat-value">+¥{{ monthlyIncome }}</div>
                  <div class="stat-label">收入</div>
                </div>
                <div class="finance-item expense">
                  <div class="stat-value">-¥{{ monthlyExpense }}</div>
                  <div class="stat-label">支出</div>
                </div>
                <div class="finance-item balance">
                  <div class="stat-value">¥{{ monthlyBalance }}</div>
                  <div class="stat-label">结余</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="insight-item notes-insight">
            <h4>本月笔记</h4>
            <div class="insight-content">
              <el-progress 
                type="circle" 
                :percentage="monthlyNotesPercentage" 
                :stroke-width="8"
                :width="80"
                color="#f59e0b"
              />
              <div class="insight-stats">
                <div class="stat-value">{{ monthlyNotes }}</div>
                <div class="stat-label">篇笔记</div>
                <div class="stat-detail">目标: 20篇/月</div>
              </div>
            </div>
          </div>
          
          <div class="insight-item usage-insight">
            <h4>模块使用频率</h4>
            <div class="insight-content">
              <div class="usage-stats">
                <div class="usage-item" v-for="usage in moduleUsage" :key="usage.module">
                  <div class="usage-label">{{ usage.module }}</div>
                  <el-progress :percentage="usage.percentage" :stroke-width="6" :color="usage.color" />
                </div>
              </div>
            </div>
          </div>
          
          <div class="insight-item habit-insight">
            <h4>习惯养成</h4>
            <div class="insight-content">
              <div class="habit-stats">
                <div class="habit-item" v-for="habit in habitStats" :key="habit.name">
                  <div class="habit-info">
                    <div class="habit-name">{{ habit.name }}</div>
                    <div class="habit-streak">{{ habit.streak }}天</div>
                  </div>
                  <el-progress :percentage="habit.completion" :stroke-width="6" :color="habit.color" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </section>

    <!-- 快捷操作弹窗 -->
    <el-dialog
      v-model="showQuickAction"
      :title="quickActionTitle"
      width="500px"
    >
      <div v-if="quickActionType === 'task'" class="quick-form">
        <el-form :model="quickTaskForm" label-width="80px">
          <el-form-item label="任务标题" required>
            <el-input v-model="quickTaskForm.title" placeholder="请输入任务标题" />
          </el-form-item>
          <el-form-item label="任务描述">
            <el-input 
              v-model="quickTaskForm.description" 
              type="textarea" 
              :rows="3"
              placeholder="请输入任务描述"
            />
          </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="quickTaskForm.priority" placeholder="请选择优先级">
              <el-option label="低" value="low" />
              <el-option label="中" value="medium" />
              <el-option label="高" value="high" />
              <el-option label="紧急" value="urgent" />
            </el-select>
          </el-form-item>
          <el-form-item label="截止日期">
            <el-date-picker 
              v-model="quickTaskForm.dueDate" 
              type="date" 
              placeholder="选择截止日期"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <div v-else-if="quickActionType === 'note'" class="quick-form">
        <el-form :model="quickNoteForm" label-width="80px">
          <el-form-item label="笔记标题" required>
            <el-input v-model="quickNoteForm.title" placeholder="请输入笔记标题" />
          </el-form-item>
          <el-form-item label="笔记内容">
            <el-input 
              v-model="quickNoteForm.content" 
              type="textarea" 
              :rows="6"
              placeholder="请输入笔记内容"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <div v-else-if="quickActionType === 'expense'" class="quick-form">
        <el-form :model="quickExpenseForm" label-width="80px">
          <el-form-item label="金额" required>
            <el-input 
              v-model="quickExpenseForm.amount" 
              type="number" 
              placeholder="请输入金额"
            />
          </el-form-item>
          <el-form-item label="消费描述" required>
            <el-input v-model="quickExpenseForm.description" placeholder="请输入消费描述" />
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="quickExpenseForm.category" placeholder="请选择分类">
              <el-option label="餐饮" value="餐饮" />
              <el-option label="购物" value="购物" />
              <el-option label="交通" value="交通" />
              <el-option label="娱乐" value="娱乐" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeQuickAction">取消</el-button>
          <el-button type="primary" @click="executeQuickAction">执行</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  RefreshRight, ArrowLeft, Setting, DocumentAdd, WarningFilled, Timer, VideoCamera,
  EditPen, Document, CirclePlus, Moon, Food, Watermelon, DataAnalysis,
  Check, Delete, Location, Grid, Calendar, Star, User
} from '@element-plus/icons-vue'
import { tasksApi } from '@/api/tasks'
import { timeApi } from '@/api/time'
import { noteApi } from '@/api/knowledge'
import { habitApi, financeApi } from '@/api/life'

const router = useRouter()

// 响应式数据
const userMode = ref('all') // 'work', 'health', 'all'
const showQuickAction = ref(false)
const quickActionType = ref('')
const quickActionTitle = ref('')
const quickMemo = ref('')
const memoSaved = ref(false)
const memoSaveTime = ref('')

// 健康数据
const todaySteps = ref(7500)
const todayWater = ref(1500)
const todaySleep = ref(6.5)

// 快速表单数据
const quickTaskForm = ref({
  title: '',
  description: '',
  priority: 'medium',
  dueDate: ''
})

const quickNoteForm = ref({
  title: '',
  content: ''
})

const quickExpenseForm = ref({
  amount: '',
  description: '',
  category: '餐饮'
})

// 模块数据
const modules = ref([
  {
    key: 'tasks',
    name: '任务管理',
    icon: '📋',
    description: '管理日常任务和待办事项',
    path: '/tasks',
    stats: '4个待办',
    hot: true,
    new: false,
    color: '#3b82f6',
    visible: true,
    category: 'work',
    progress: 62.5
  },
  {
    key: 'calendar',
    name: '日历管理',
    icon: '📅',
    description: '查看和管理日程安排',
    path: '/calendar',
    stats: '2个今日',
    hot: false,
    new: false,
    color: '#10b981',
    visible: true,
    category: 'work',
    progress: 0
  },
  {
    key: 'knowledge',
    name: '知识库',
    icon: '📚',
    description: '记录和管理知识笔记',
    path: '/knowledge',
    stats: '15篇笔记',
    hot: false,
    new: false,
    color: '#f59e0b',
    visible: true,
    category: 'work',
    progress: 45
  },
  {
    key: 'finance',
    name: '财务管理',
    icon: '💰',
    description: '跟踪收入和支出',
    path: '/finance',
    stats: '¥2,388',
    hot: false,
    new: false,
    color: '#ef4444',
    visible: true,
    category: 'life',
    progress: 60
  },
  {
    key: 'health',
    name: '健康管理',
    icon: '🏃‍♂️',
    description: '记录健康数据和运动习惯',
    path: '/health',
    stats: '健康85分',
    hot: false,
    new: false,
    color: '#8b5cf6',
    visible: true,
    category: 'health',
    progress: 75
  },
  {
    key: 'profile',
    name: '个人设置',
    icon: '⚙️',
    description: '管理个人偏好和设置',
    path: '/profile',
    stats: '个性化',
    hot: false,
    new: false,
    color: '#6b7280',
    visible: true,
    category: 'life',
    progress: 0
  }
])

// 模拟数据
const totalTasks = ref(4)
const todayEvents = ref(2)
const recentNotes = ref(8)
const totalExpense = ref('2,388')
const healthScore = ref(85)
const todayProgress = ref(65)
const todayTasks = ref([
  { id: 1, title: '完成项目文档', priority: 'high', category: '工作', dueDate: '12-18', completed: false },
  { id: 2, title: '团队会议', priority: 'medium', category: '工作', dueDate: '12-18', completed: false },
  { id: 3, title: '代码审查', priority: 'urgent', category: '工作', dueDate: '12-18', completed: true }
])
const calendarEvents = ref([
  { id: 1, title: '项目评审会议', time: '10:00', location: '会议室A' },
  { id: 2, title: '健身', time: '18:00', location: '健身房' }
])
const upcomingEvents = ref([
  { id: 3, title: '产品发布会', date: '明天 14:00' },
  { id: 4, title: '技术分享', date: '后天 15:30' }
])
const taskCompletionRate = ref(75)
const weeklyExercise = ref(3)
const monthlyNotes = ref(12)
const monthlyExpense = ref('2,388')
const monthlyIncome = ref('4,000')
const monthlyBalance = ref('1,612')
const totalWeeklyTasks = ref(8)
const weeklyExercisePercentage = ref(60)
const monthlyNotesPercentage = ref(60)

// 模块使用频率数据
const moduleUsage = ref([
  { module: '任务管理', percentage: 85, color: '#3b82f6' },
  { module: '日历管理', percentage: 65, color: '#10b981' },
  { module: '知识库', percentage: 45, color: '#f59e0b' },
  { module: '财务管理', percentage: 70, color: '#ef4444' },
  { module: '健康管理', percentage: 55, color: '#8b5cf6' }
])

// 习惯养成数据
const habitStats = ref([
  { name: '每日运动', streak: 12, completion: 85, color: '#10b981' },
  { name: '每日阅读', streak: 8, completion: 70, color: '#3b82f6' },
  { name: '早起打卡', streak: 21, completion: 95, color: '#f59e0b' }
])

// 计算属性
const visibleModules = computed(() => {
  return modules.value.filter(module => module.visible)
})

const completedTasksCount = computed(() => {
  return todayTasks.value.filter(task => task.completed).length
})

// 生命周期
onMounted(async () => {
  // 从本地存储恢复备忘录
  quickMemo.value = localStorage.getItem('quickMemo') || ''
  
  // 根据时间自动设置用户模式
  const hour = new Date().getHours()
  if (hour >= 9 && hour <= 17) {
    userMode.value = 'work'
  } else if (hour >= 18 || hour <= 8) {
    userMode.value = 'health'
  }
  
  // 初始加载数据
  await refreshData()
})

// 方法
const backToDashboard = () => {
  router.push('/dashboard')
}

const refreshData = async () => {
  try {
    // 获取任务数据
    const tasksResponse = await tasksApi.getTodayTasks()
    const todayTasksData = tasksResponse.data || []
    totalTasks.value = todayTasksData.length
    
    // 获取今日事件
    const eventsResponse = await timeApi.getTodayEvents()
    const todayEventsData = eventsResponse.data || []
    todayEvents.value = todayEventsData.length
    calendarEvents.value = todayEventsData.map((event: any) => ({
      id: event.id,
      title: event.title,
      time: new Date(event.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      location: event.location || ''
    }))
    
    // 获取笔记数据
    const notesResponse = await noteApi.getList({ page: 1 })
    recentNotes.value = notesResponse.data?.count || 0
    
    // 获取财务数据
    const financeResponse = await financeApi.getSummary({ period: 'month' })
    const financeData = financeResponse.data || {}
    totalExpense.value = financeData.month_expense?.toFixed(2) || '0.00'
    monthlyIncome.value = financeData.total_income?.toFixed(2) || '0.00'
    monthlyExpense.value = financeData.total_expense?.toFixed(2) || '0.00'
    monthlyBalance.value = (Number(financeData.total_income || 0) - Number(financeData.total_expense || 0)).toFixed(2)
    
    // 获取习惯数据
    const habitsResponse = await habitApi.getList()
    const habitsData = habitsResponse.data || []
    habitStats.value = habitsData.map((habit: any) => ({
      name: habit.name,
      streak: habit.streak || 0,
      completion: habit.completion_rate || 0,
      color: habit.color || '#10b981'
    }))
    
    // 计算健康评分
    healthScore.value = Math.floor(Math.random() * 30) + 70
    
    // 显示刷新成功提示
    ElMessage.success('数据已刷新！')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败，请稍后重试')
  }
}

const handleCustomize = (command: string) => {
  console.log('Customize:', command)
  // 这里可以添加个性化配置逻辑
}

// 快速操作方法
const quickAddTask = () => {
  quickActionType.value = 'task'
  quickActionTitle.value = '快速添加任务'
  showQuickAction.value = true
}

const quickAddNote = () => {
  quickActionType.value = 'note'
  quickActionTitle.value = '快速添加笔记'
  showQuickAction.value = true
}

const quickRecordExpense = () => {
  quickActionType.value = 'expense'
  quickActionTitle.value = '快速记录支出'
  showQuickAction.value = true
}

const jumpToHighPriorityTasks = () => {
  router.push('/tasks')
}

const jumpToTodayTasks = () => {
  router.push('/tasks')
}

const addMeeting = () => {
  router.push('/calendar')
}

const jumpToKnowledge = () => {
  router.push('/knowledge')
}

const quickLogExercise = () => {
  router.push('/health')
}

const quickLogWeight = () => {
  router.push('/health')
}

const quickLogSleep = () => {
  router.push('/health')
}

const quickLogMeal = () => {
  router.push('/health')
}

const quickRecordWater = () => {
  router.push('/health')
}

const viewHealthReport = () => {
  router.push('/health')
}

const quickRecordIncome = () => {
  router.push('/finance')
}

const viewFinanceReport = () => {
  router.push('/finance')
}

const quickAddShopping = () => {
  router.push('/finance')
}

const quickAddReminder = () => {
  router.push('/calendar')
}

const viewAllModules = () => {
  // 这里可以添加查看所有模块的逻辑
}

const jumpToModule = (path: string) => {
  router.push(path)
}

const jumpToTaskDetail = (task: any) => {
  router.push(`/tasks/${task.id}`)
}

const executeQuickAction = () => {
  if (quickActionType.value === 'task') {
    if (quickTaskForm.value.title) {
      // 实际项目中这里会调用API
      ElMessage.success(`任务已添加: ${quickTaskForm.value.title}`)
      closeQuickAction()
    } else {
      ElMessage.error('请输入任务标题')
    }
  } else if (quickActionType.value === 'note') {
    if (quickNoteForm.value.title) {
      ElMessage.success(`笔记已保存: ${quickNoteForm.value.title}`)
      closeQuickAction()
    } else {
      ElMessage.error('请输入笔记标题')
    }
  } else if (quickActionType.value === 'expense') {
    if (quickExpenseForm.value.amount && quickExpenseForm.value.description) {
      ElMessage.success(`支出已记录: ¥${quickExpenseForm.value.amount} - ${quickExpenseForm.value.description}`)
      closeQuickAction()
    } else {
      ElMessage.error('请输入金额和描述')
    }
  }
}

const closeQuickAction = () => {
  showQuickAction.value = false
  quickActionType.value = ''
  // 清空表单
  quickTaskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  }
  quickNoteForm.value = {
    title: '',
    content: ''
  }
  quickExpenseForm.value = {
    amount: '',
    description: '',
    category: '餐饮'
  }
}

const saveQuickMemo = () => {
  localStorage.setItem('quickMemo', quickMemo.value)
  memoSaved.value = true
  memoSaveTime.value = `保存于 ${new Date().toLocaleTimeString()}`
  ElMessage.success('备忘录已保存')
  
  // 3秒后隐藏保存状态
  setTimeout(() => {
    memoSaved.value = false
  }, 3000)
}

const clearQuickMemo = () => {
  quickMemo.value = ''
  localStorage.removeItem('quickMemo')
  ElMessage.success('备忘录已清空')
}

const manageModules = () => {
  // 这里可以添加模块管理逻辑
}

const viewAllTasks = () => {
  router.push('/tasks')
}

const viewCalendar = () => {
  router.push('/calendar')
}

const getPriorityClass = (priority: string) => {
  return `priority-${priority}`
}

const toggleTaskComplete = (task: any) => {
  task.completed = !task.completed
  // 更新任务完成率
  taskCompletionRate.value = Math.round((completedTasksCount.value / todayTasks.value.length) * 100)
}

const jumpToCalendar = () => {
  router.push('/calendar')
}

const quickAddEvent = () => {
  // 这里可以添加快速添加事件的逻辑
  ElMessage.info('快速添加事件功能开发中')
}

const jumpToEventDetail = (event: any) => {
  router.push(`/calendar/${event.id}`)
}

const jumpToHealth = () => {
  router.push('/health')
}

const quickLogMood = () => {
  // 这里可以添加快速记录心情的逻辑
  ElMessage.info('快速记录心情功能开发中')
}

const jumpToFinance = () => {
  router.push('/finance')
}

const quickAddHabit = () => {
  // 这里可以添加快速添加习惯的逻辑
  ElMessage.info('快速添加习惯功能开发中')
}

const viewHealthDetails = () => {
  router.push('/health')
}

// 导入ElMessage
import { ElMessage } from 'element-plus'
</script>

<style lang="scss" scoped>
.command-center {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 头部区域 */
.header-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 24px;
  
  @media (max-width: 1200px) {
    flex-wrap: wrap;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  
  @media (max-width: 768px) {
    display: none;
  }
  
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
        
        &.expense {
          color: #f56c6c;
        }
      }
    }
  }
}

.main-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.mode-selector {
  .el-radio-button {
    border-radius: 20px;
    
    .el-radio-button__inner {
      border-radius: 20px;
      padding: 6px 16px;
      font-size: 12px;
    }
  }
}

.header-right {
  .el-button {
    border-radius: 8px;
    
    &:not(:last-child) {
      margin-right: 8px;
    }
  }
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  border: none;
  border-radius: 12px;
  
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .stat-icon {
      font-size: 32px;
      
      &.task-icon { color: #3b82f6; }
      &.calendar-icon { color: #10b981; }
      &.note-icon { color: #f59e0b; }
      &.finance-icon { color: #ef4444; }
      &.health-icon { color: #8b5cf6; }
      &.progress-icon { color: #06b6d4; }
    }
    
    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #333;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: #666;
      }
    }
  }
}

/* 快速操作区域 */
.quick-actions-section {
  margin-bottom: 24px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.action-card {
  border: none;
  border-radius: 16px;
  
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
  }
  
  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      &.work-btn { border-color: #3b82f6; color: #3b82f6; background: #3b82f605; }
      &.urgent-btn { border-color: #ef4444; color: #ef4444; background: #ef444405; }
      &.deadline-btn { border-color: #f59e0b; color: #f59e0b; background: #f59e0b05; }
      &.meeting-btn { border-color: #8b5cf6; color: #8b5cf6; background: #8b5cf605; }
      &.note-btn { border-color: #10b981; color: #10b981; background: #10b98105; }
      &.knowledge-btn { border-color: #06b6d4; color: #06b6d4; background: #06b6d405; }
      &.exercise-btn { border-color: #10b981; color: #10b981; background: #10b98105; }
      &.weight-btn { border-color: #3b82f6; color: #3b82f6; background: #3b82f605; }
      &.sleep-btn { border-color: #8b5cf6; color: #8b5cf6; background: #8b5cf605; }
      &.meal-btn { border-color: #f59e0b; color: #f59e0b; background: #f59e0b05; }
      &.water-btn { border-color: #06b6d4; color: #06b6d4; background: #06b6d405; }
      &.report-btn { border-color: #ef4444; color: #ef4444; background: #ef444405; }
      &.expense-btn { border-color: #ef4444; color: #ef4444; background: #ef444405; }
      &.income-btn { border-color: #67c23a; color: #67c23a; background: #67c23a05; }
      &.finance-report-btn { border-color: #3b82f6; color: #3b82f6; background: #3b82f605; }
      &.shopping-btn { border-color: #f59e0b; color: #f59e0b; background: #f59e0b05; }
      &.reminder-btn { border-color: #e6a23c; color: #e6a23c; background: #e6a23c05; }
      &.all-modules-btn { border-color: #909399; color: #909399; background: #90939905; }
    }
  }
}

/* 模块入口区域 */
.modules-section {
  margin-bottom: 24px;
}

.modules-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
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

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.module-item {
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.5);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }
  
  &.hot-module {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }
  
  .module-content {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    position: relative;
  }
  
  .module-icon {
    font-size: 32px;
    flex-shrink: 0;
  }
  
  .module-info {
    flex: 1;
    
    .module-name {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .module-desc {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #666;
      line-height: 1.4;
    }
    
    .module-stats {
      font-size: 11px;
      color: #909399;
    }
  }
}

/* 今日焦点区域 */
.focus-section {
  margin-bottom: 24px;
}

.focus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.focus-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .el-button {
      color: #667eea;
      font-size: 12px;
      
      &:hover {
        color: #536dfe;
      }
    }
  }
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

/* 任务列表 */
.task-list {
  .task-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 10px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.priority-high {
      border-left: 4px solid #ef4444;
    }
    
    &.priority-medium {
      border-left: 4px solid #f59e0b;
    }
    
    &.priority-low {
      border-left: 4px solid #10b981;
    }
    
    &.priority-urgent {
      border-left: 4px solid #dc2626;
    }
    
    .el-checkbox {
      flex-shrink: 0;
      
      &.priority-high {
        .el-checkbox__inner {
          border-color: #ef4444;
          
          &:checked {
            background-color: #ef4444;
            border-color: #ef4444;
          }
        }
      }
      
      &.priority-medium {
        .el-checkbox__inner {
          border-color: #f59e0b;
          
          &:checked {
            background-color: #f59e0b;
            border-color: #f59e0b;
          }
        }
      }
      
      &.priority-low {
        .el-checkbox__inner {
          border-color: #10b981;
          
          &:checked {
            background-color: #10b981;
            border-color: #10b981;
          }
        }
      }
      
      &.priority-urgent {
        .el-checkbox__inner {
          border-color: #dc2626;
          
          &:checked {
            background-color: #dc2626;
            border-color: #dc2626;
          }
        }
      }
    }
    
    .task-info {
      flex: 1;
      
      .task-title {
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }
      
      .task-meta {
        font-size: 12px;
        color: #6b7280;
      }
    }
    
    .el-button {
      padding: 4px 12px;
      font-size: 12px;
      border-radius: 4px;
    }
  }
}

/* 任务进度 */
.task-progress {
  margin-top: 16px;
  
  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
}

/* 事件列表 */
.event-list {
  .event-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 10px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .event-time {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      min-width: 60px;
      flex-shrink: 0;
    }
    
    .event-content {
      flex: 1;
      
      .event-title {
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }
      
      .event-location {
        font-size: 12px;
        color: #6b7280;
        display: flex;
        align-items: center;
        gap: 4px;
        
        .el-icon {
          font-size: 12px;
        }
      }
    }
    
    .el-button {
      padding: 4px 8px;
      font-size: 12px;
      color: #667eea;
    }
  }
}

/* 未来事件 */
.upcoming-events {
  margin-top: 16px;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  .event-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
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
      }
    }
  }
}

/* 备忘录 */
.memo-focus {
  .memo-actions {
    display: flex;
    gap: 8px;
  }
  
  .el-input {
    margin-bottom: 12px;
    
    textarea {
      resize: none;
      font-family: inherit;
    }
  }
  
  .memo-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .char-count {
      font-size: 12px;
      color: #6b7280;
    }
    
    .save-status {
      font-size: 12px;
      color: #67c23a;
    }
  }
}

/* 健康数据概览 */
.health-focus {
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
        display: block;
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

/* 数据洞察 */
.insights-section {
  margin-bottom: 24px;
}

.insights-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
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
  }
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.insight-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: #666;
  }
  
  .insight-content {
    display: flex;
    align-items: center;
    gap: 20px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
  }
  
  .insight-stats {
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #333;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .stat-detail {
      font-size: 12px;
      color: #909399;
    }
  }
  
  .finance-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .finance-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .stat-value {
        font-size: 18px;
        font-weight: 600;
        
        &.income { color: #67c23a; }
        &.expense { color: #f56c6c; }
        &.balance { color: #409eff; }
      }
      
      .stat-label {
        font-size: 12px;
        color: #666;
      }
    }
  }
  
  /* 模块使用频率 */
  .usage-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    
    .usage-item {
      .usage-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        display: block;
      }
    }
  }
  
  /* 习惯养成 */
  .habit-stats {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    
    .habit-item {
      .habit-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        
        .habit-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .habit-streak {
          font-size: 12px;
          color: #667eea;
          font-weight: 600;
        }
      }
    }
  }
}

/* 模块卡片样式 */
.module-item {
  &.work-module {
    border-color: #3b82f6;
    
    &:hover {
      background: rgba(59, 130, 246, 0.05);
    }
  }
  
  &.health-module {
    border-color: #10b981;
    
    &:hover {
      background: rgba(16, 185, 129, 0.05);
    }
  }
  
  &.life-module {
    border-color: #f59e0b;
    
    &:hover {
      background: rgba(245, 158, 11, 0.05);
    }
  }
  
  .module-progress {
    margin-top: 8px;
    height: 4px;
  }
}

/* 快速操作按钮样式扩展 */
.action-btn {
  &.calendar-btn { border-color: #10b981; color: #10b981; background: #10b98105; }
  &.event-btn { border-color: #3b82f6; color: #3b82f6; background: #3b82f605; }
  &.health-detail-btn { border-color: #8b5cf6; color: #8b5cf6; background: #8b5cf605; }
  &.mood-btn { border-color: #f59e0b; color: #f59e0b; background: #f59e0b05; }
  &.finance-detail-btn { border-color: #ef4444; color: #ef4444; background: #ef444405; }
  &.habit-btn { border-color: #67c23a; color: #67c23a; background: #67c23a05; }
}

/* 快速操作弹窗 */
.quick-form {
  .el-form {
    margin-bottom: 0;
  }
  
  .el-form-item {
    margin-bottom: 16px;
  }
  
  .el-textarea {
    resize: none;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .command-center {
    padding: 12px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  .focus-grid {
    grid-template-columns: 1fr;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>
