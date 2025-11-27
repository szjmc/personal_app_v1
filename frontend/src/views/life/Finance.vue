<template>
  <div class="finance-container">
    <!-- 头部工具栏 -->
    <div class="finance-header">
      <div class="header-left">
        <h1 class="page-title">财务管理</h1>
        <div class="period-selector">
          <el-radio-group v-model="period" @change="loadFinancialData">
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="year">本年</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
          
          <el-date-picker
            v-if="period === 'custom'"
            v-model="customDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="loadFinancialData"
            class="custom-date-picker"
          />
        </div>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="showAddTransactionDialog">
          <el-icon><Plus /></el-icon>
          记账
        </el-button>
        
        <el-button @click="showSyncDialog">
          <el-icon><Refresh /></el-icon>
          同步账单
        </el-button>
        
        <el-dropdown @command="handleExport" trigger="click">
          <el-button>
            <el-icon><Download /></el-icon>
            导出
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="excel">导出Excel</el-dropdown-item>
              <el-dropdown-item command="csv">导出CSV</el-dropdown-item>
              <el-dropdown-item command="pdf">导出PDF</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 财务概览 -->
    <div class="financial-overview">
      <div class="overview-card income">
        <div class="card-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-title">总收入</div>
          <div class="card-amount">¥{{ formatAmount(summary.total_income) }}</div>
          <div class="card-change" :class="{ positive: monthIncomeChange > 0 }">
            <el-icon><TrendUp v-if="monthIncomeChange > 0" /><TrendDown v-else /></el-icon>
            {{ Math.abs(monthIncomeChange) }}%
          </div>
        </div>
      </div>
      
      <div class="overview-card expense">
        <div class="card-icon">
          <el-icon><ShoppingCart /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-title">总支出</div>
          <div class="card-amount">¥{{ formatAmount(summary.total_expense) }}</div>
          <div class="card-change" :class="{ negative: monthExpenseChange > 0 }">
            <el-icon><TrendUp v-if="monthExpenseChange > 0" /><TrendDown v-else /></el-icon>
            {{ Math.abs(monthExpenseChange) }}%
          </div>
        </div>
      </div>
      
      <div class="overview-card balance">
        <div class="card-icon">
          <el-icon><Wallet /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-title">结余</div>
          <div class="card-amount">¥{{ formatAmount(summary.balance) }}</div>
          <div class="card-subtitle">本月结余 ¥{{ formatAmount(summary.month_balance) }}</div>
        </div>
      </div>
      
      <div class="overview-card budget">
        <div class="card-icon">
          <el-icon><PieChart /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-title">预算使用</div>
          <div class="card-amount">{{ budgetUsage }}%</div>
          <div class="card-subtitle">{{ budgetStatus }}</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="finance-content">
      <!-- 支出分类分析 -->
      <div class="expense-analysis">
        <div class="section-header">
          <h3>支出分析</h3>
          <el-radio-group v-model="viewType" size="small">
            <el-radio-button label="category">分类</el-radio-button>
            <el-radio-button label="trend">趋势</el-radio-button>
            <el-radio-button label="ranking">排行</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 分类饼图 -->
        <div v-if="viewType === 'category'" class="chart-container">
          <div ref="categoryChart" class="chart"></div>
        </div>
        
        <!-- 趋势图 -->
        <div v-if="viewType === 'trend'" class="chart-container">
          <div ref="trendChart" class="chart"></div>
        </div>
        
        <!-- 分类排行 -->
        <div v-if="viewType === 'ranking'" class="ranking-list">
          <div
            v-for="(item, index) in categoryRanking"
            :key="item.category"
            class="ranking-item"
          >
            <div class="ranking-number">{{ index + 1 }}</div>
            <div class="ranking-info">
              <div class="ranking-category">{{ item.category }}</div>
              <div class="ranking-count">{{ item.count }}笔</div>
            </div>
            <div class="ranking-amount">¥{{ formatAmount(item.amount) }}</div>
            <div class="ranking-bar">
              <div 
                class="bar-fill" 
                :style="{ width: `${(item.amount / maxCategoryAmount) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近交易记录 -->
      <div class="recent-transactions">
        <div class="section-header">
          <h3>最近交易</h3>
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索交易..."
              prefix-icon="Search"
              clearable
              size="small"
              class="search-input"
            />
            
            <el-button size="small" @click="showAllTransactions">
              查看全部
            </el-button>
          </div>
        </div>
        
        <div class="transactions-list">
          <div
            v-for="transaction in filteredTransactions"
            :key="transaction.id"
            class="transaction-item"
            @click="editTransaction(transaction)"
          >
            <div class="transaction-icon" :class="transaction.type">
              <el-icon>
                <component :is="getCategoryIcon(transaction.category)" />
              </el-icon>
            </div>
            
            <div class="transaction-details">
              <div class="transaction-category">{{ transaction.category }}</div>
              <div class="transaction-description">{{ transaction.description }}</div>
              <div class="transaction-meta">
                <span class="transaction-date">{{ formatTimeShort(transaction.date) }}</span>
                <span v-if="transaction.account" class="transaction-account">{{ transaction.account }}</span>
              </div>
            </div>
            
            <div class="transaction-amount" :class="transaction.type">
              {{ transaction.type === 'income' ? '+' : '-' }}¥{{ formatAmount(transaction.amount) }}
            </div>
            
            <div class="transaction-actions">
              <el-dropdown @command="(cmd) => handleTransactionAction(cmd, transaction)" trigger="click">
                <el-button size="small" text @click.stop>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="duplicate">
                      <el-icon><DocumentCopy /></el-icon>
                      复制
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
          
          <!-- 加载更多 -->
          <div v-if="hasMore" class="load-more">
            <el-button @click="loadMoreTransactions" :loading="loading">
              加载更多
            </el-button>
          </div>
          
          <!-- 空状态 -->
          <el-empty
            v-if="filteredTransactions.length === 0"
            description="暂无交易记录"
            :image-size="150"
          >
            <el-button type="primary" @click="showAddTransactionDialog">
              记账
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 添加交易弹窗 -->
    <TransactionForm
      v-model="addTransactionDialogVisible"
      :transaction="editingTransaction"
      @save="handleSaveTransaction"
    />

    <!-- 同步账单弹窗 -->
    <SyncDialog
      v-model="syncDialogVisible"
      @synced="handleBillsSynced"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Download, ArrowDown, TrendCharts, ShoppingCart, Wallet,
  PieChart, TrendUp, TrendDown, Search, MoreFilled, Edit,
  DocumentCopy, Delete, Food, Home, Car, ShoppingBag,
  User, Gamepad, Book, Monitor
} from '@element-plus/icons-vue'
import { financeApi, type Transaction, type FinancialSummary } from '@/api/life'
import { formatTimeShort, formatAmount } from '@/utils/format'
import * as echarts from 'echarts'
import TransactionForm from '@/components/life/TransactionForm.vue'
import SyncDialog from '@/components/life/SyncDialog.vue'

// 响应式数据
const period = ref('month')
const customDateRange = ref<[Date, Date] | null>(null)
const viewType = ref('category')
const searchQuery = ref('')
const summary = ref<FinancialSummary>({
  total_income: 0,
  total_expense: 0,
  balance: 0,
  month_income: 0,
  month_expense: 0,
  categories_breakdown: [],
  daily_trend: []
})
const transactions = ref<Transaction[]>([])
const categories = ref<any[]>([])
const addTransactionDialogVisible = ref(false)
const syncDialogVisible = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const loading = ref(false)
const page = ref(1)
const pageSize = 20

// 图表实例
let categoryChartInstance: echarts.ECharts | null = null
let trendChartInstance: echarts.ECharts | null = null

// 模拟变化数据
const monthIncomeChange = ref(15.5)
const monthExpenseChange = ref(-8.2)

// 计算属性
const budgetUsage = computed(() => {
  // 假设月预算为10000元
  const budget = 10000
  const usage = (summary.value.month_expense / budget) * 100
  return Math.min(Math.round(usage), 100)
})

const budgetStatus = computed(() => {
  const usage = budgetUsage.value
  if (usage >= 90) return '预算即将用完'
  if (usage >= 70) return '预算使用较多'
  if (usage >= 50) return '预算使用正常'
  return '预算使用较少'
})

const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query)
    )
  }

  return filtered.slice(0, page.value * pageSize)
})

const hasMore = computed(() => {
  return filteredTransactions.value.length < transactions.value.length
})

const categoryRanking = computed(() => {
  return summary.value.categories_breakdown
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
})

const maxCategoryAmount = computed(() => {
  return Math.max(...categoryRanking.value.map(item => item.amount))
})

// 方法
const loadFinancialData = async () => {
  try {
    const params: any = {}
    if (period.value === 'custom' && customDateRange.value) {
      params.start_date = formatDate(customDateRange.value[0])
      params.end_date = formatDate(customDateRange.value[1])
    } else {
      params.period = period.value
    }

    // 加载汇总数据
    const summaryResponse = await financeApi.getSummary(params)
    summary.value = summaryResponse.data

    // 加载交易记录
    loadTransactions()

    // 加载分类数据
    const categoryResponse = await financeApi.getCategories()
    categories.value = categoryResponse.data

    // 延迟加载图表
    nextTick(() => {
      loadCharts()
    })
  } catch (error) {
    ElMessage.error('加载财务数据失败')
  }
}

const loadTransactions = async () => {
  try {
    const params: any = {
      page: 1,
      page_size: 100
    }

    if (period.value === 'custom' && customDateRange.value) {
      params.start_date = formatDate(customDateRange.value[0])
      params.end_date = formatDate(customDateRange.value[1])
    }

    const response = await financeApi.getTransactions(params)
    transactions.value = response.data.results || []
  } catch (error) {
    ElMessage.error('加载交易记录失败')
  }
}

const loadCharts = () => {
  loadCategoryChart()
  loadTrendChart()
}

const loadCategoryChart = () => {
  if (!document.querySelector('.chart') || viewType.value !== 'category') return

  const chartDom = document.querySelector('#category-chart') as HTMLElement
  if (!chartDom) return

  if (categoryChartInstance) {
    categoryChartInstance.dispose()
  }

  categoryChartInstance = echarts.init(chartDom)
  
  const data = summary.value.categories_breakdown.map(item => ({
    name: item.category,
    value: item.amount
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'rgba(255, 255, 255, 0.8)'
      }
    },
    series: [
      {
        name: '支出分类',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.3)'
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      }
    ]
  }

  categoryChartInstance.setOption(option)
}

const loadTrendChart = () => {
  if (!document.querySelector('.chart') || viewType.value !== 'trend') return

  const chartDom = document.querySelector('#trend-chart') as HTMLElement
  if (!chartDom) return

  if (trendChartInstance) {
    trendChartInstance.dispose()
  }

  trendChartInstance = echarts.init(chartDom)
  
  const dates = summary.value.daily_trend.map(item => item.date)
  const incomeData = summary.value.daily_trend.map(item => item.income)
  const expenseData = summary.value.daily_trend.map(item => item.expense)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['收入', '支出'],
      textStyle: {
        color: 'rgba(255, 255, 255, 0.8)'
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
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
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        data: incomeData,
        smooth: true,
        lineStyle: {
          color: '#67c23a'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
            ]
          }
        }
      },
      {
        name: '支出',
        type: 'line',
        data: expenseData,
        smooth: true,
        lineStyle: {
          color: '#f56c6c'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
            ]
          }
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

  trendChartInstance.setOption(option)
}

const showAddTransactionDialog = () => {
  editingTransaction.value = null
  addTransactionDialogVisible.value = true
}

const editTransaction = (transaction: Transaction) => {
  editingTransaction.value = transaction
  addTransactionDialogVisible.value = true
}

const handleSaveTransaction = async (transactionData: any) => {
  try {
    if (editingTransaction.value) {
      // 更新交易
      await financeApi.update(editingTransaction.value.id, transactionData)
      const index = transactions.value.findIndex(t => t.id === editingTransaction.value!.id)
      if (index > -1) {
        transactions.value[index] = { ...transactions.value[index], ...transactionData }
      }
      ElMessage.success('交易更新成功')
    } else {
      // 创建交易
      const response = await financeApi.create(transactionData)
      transactions.value.unshift(response.data)
      ElMessage.success('记账成功')
    }
    
    addTransactionDialogVisible.value = false
    loadFinancialData() // 重新加载数据
  } catch (error) {
    ElMessage.error(editingTransaction.value ? '更新失败' : '记账失败')
  }
}

const showSyncDialog = () => {
  syncDialogVisible.value = true
}

const handleBillsSynced = () => {
  loadFinancialData()
}

const handleTransactionAction = async (command: string, transaction: Transaction) => {
  switch (command) {
    case 'edit':
      editTransaction(transaction)
      break
    case 'duplicate':
      const duplicateData = { ...transaction, id: undefined }
      editingTransaction.value = null
      addTransactionDialogVisible.value = true
      // 这里可以传递复制的数据
      break
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这笔交易吗？', '确认删除', {
          type: 'warning'
        })
        await financeApi.delete(transaction.id)
        transactions.value = transactions.value.filter(t => t.id !== transaction.id)
        ElMessage.success('删除成功')
        loadFinancialData()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
      break
  }
}

const showAllTransactions = () => {
  // 跳转到完整交易列表页面
  ElMessage.info('完整交易列表功能开发中')
}

const loadMoreTransactions = () => {
  page.value++
  // 这里加载更多数据
}

const handleExport = async (format: string) => {
  try {
    const params: any = {
      format,
      start_date: period.value === 'custom' && customDateRange.value 
        ? formatDate(customDateRange.value[0]) 
        : undefined,
      end_date: period.value === 'custom' && customDateRange.value 
        ? formatDate(customDateRange.value[1]) 
        : undefined
    }

    const response = await financeApi.export(params)
    
    // 创建下载链接
    const blob = new Blob([response])
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `财务数据_${formatDate(new Date())}.${format}`
    link.click()
    
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    '餐饮': Food,
    '住房': Home,
    '交通': Car,
    '购物': ShoppingBag,
    '娱乐': Gamepad,
    '学习': Book,
    '医疗': User,
    '数码': Monitor
  }
  return iconMap[category] || ShoppingCart
}

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0]
}

// 生命周期
onMounted(() => {
  loadFinancialData()
  
  // 响应式处理
  window.addEventListener('resize', () => {
    categoryChartInstance?.resize()
    trendChartInstance?.resize()
  })
})

// 清理图表实例
watch(() => viewType.value, () => {
  nextTick(() => {
    if (viewType.value === 'category') {
      loadCategoryChart()
    } else if (viewType.value === 'trend') {
      loadTrendChart()
    }
  })
})
</script>

<style lang="scss" scoped>
.finance-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.finance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
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
    
    .period-selector {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .custom-date-picker {
        width: 240px;
      }
    }
  }
}

// 财务概览
.financial-overview {
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
      
      .income & {
        background: linear-gradient(135deg, #67c23a, #85ce61);
      }
      
      .expense & {
        background: linear-gradient(135deg, #f56c6c, #f78989);
      }
      
      .balance & {
        background: linear-gradient(135deg, #409eff, #66b1ff);
      }
      
      .budget & {
        background: linear-gradient(135deg, #e6a23c, #ebb563);
      }
    }
    
    .card-info {
      flex: 1;
      
      .card-title {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      
      .card-amount {
        font-size: 24px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      
      .card-change {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        
        &.positive {
          color: #67c23a;
        }
        
        &.negative {
          color: #f56c6c;
        }
      }
      
      .card-subtitle {
        font-size: 12px;
        color: var(--text-tertiary);
      }
    }
  }
}

// 主要内容区
.finance-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 0;
  
  .expense-analysis {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    
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
    
    .chart-container {
      height: 300px;
      
      .chart {
        width: 100%;
        height: 100%;
      }
    }
    
    .ranking-list {
      .ranking-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--glass-border);
        
        &:last-child {
          border-bottom: none;
        }
        
        .ranking-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }
        
        .ranking-info {
          flex: 1;
          
          .ranking-category {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
          }
          
          .ranking-count {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
        
        .ranking-amount {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-right: 12px;
        }
        
        .ranking-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          
          .bar-fill {
            height: 100%;
            background: var(--primary-color);
            border-radius: 3px;
            transition: width 0.3s ease;
          }
        }
      }
    }
  }
  
  .recent-transactions {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    
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
      
      .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        
        .search-input {
          width: 200px;
        }
      }
    }
    
    .transactions-list {
      flex: 1;
      overflow-y: auto;
      
      .transaction-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--glass-border);
        cursor: pointer;
        transition: background 0.2s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .transaction-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          
          &.income {
            background: linear-gradient(135deg, #67c23a, #85ce61);
          }
          
          &.expense {
            background: linear-gradient(135deg, #f56c6c, #f78989);
          }
        }
        
        .transaction-details {
          flex: 1;
          
          .transaction-category {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 2px;
          }
          
          .transaction-description {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 4px;
          }
          
          .transaction-meta {
            display: flex;
            gap: 12px;
            font-size: 11px;
            color: var(--text-tertiary);
          }
        }
        
        .transaction-amount {
          font-size: 16px;
          font-weight: 600;
          margin-right: 8px;
          
          &.income {
            color: #67c23a;
          }
          
          &.expense {
            color: #f56c6c;
          }
        }
        
        .transaction-actions {
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }
      
      .transaction-item:hover .transaction-actions {
        opacity: 1;
      }
      
      .load-more {
        text-align: center;
        padding: 20px 0;
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .financial-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .finance-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .finance-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    
    .header-left {
      flex-direction: column;
      gap: 12px;
      
      .period-selector {
        flex-direction: column;
        align-items: stretch;
        
        .custom-date-picker {
          width: 100%;
        }
      }
    }
  }
  
  .financial-overview {
    grid-template-columns: 1fr;
  }
  
  .transaction-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    
    .transaction-details {
      text-align: center;
    }
    
    .transaction-amount {
      text-align: center;
    }
  }
}
</style>