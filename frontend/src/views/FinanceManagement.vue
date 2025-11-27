<template>
  <div style="padding: 20px; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 1200px; margin: 0 auto;">
      <!-- 头部 -->
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="color: #333; margin-bottom: 5px;">💰 财务管理</h1>
          <p style="color: #666; margin: 0;">跟踪您的收入和支出</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button @click="showAddTransaction = true" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
            + 记账
          </button>
          <button @click="backToDashboard" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
            返回仪表盘
          </button>
        </div>
      </div>

      <!-- 财务概览 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #10b981; margin: 0 0 10px 0;">¥{{ totalIncome.toFixed(2) }}</h3>
          <p style="color: #666; margin: 0;">总收入</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #ef4444; margin: 0 0 10px 0;">¥{{ totalExpense.toFixed(2) }}</h3>
          <p style="color: #666; margin: 0;">总支出</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #667eea; margin: 0 0 10px 0;">¥{{ balance.toFixed(2) }}</h3>
          <p style="color: #666; margin: 0;">当前余额</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #f59e0b; margin: 0 0 10px 0;">¥{{ monthlyAverage.toFixed(2) }}</h3>
          <p style="color: #666; margin: 0;">月均支出</p>
        </div>
      </div>

      <!-- 筛选和统计 -->
      <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <select v-model="filterType" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="all">全部类型</option>
          <option value="income">收入</option>
          <option value="expense">支出</option>
        </select>
        
        <select v-model="filterCategory" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="all">全部分类</option>
          <option value="工资">工资</option>
          <option value="奖金">奖金</option>
          <option value="投资">投资</option>
          <option value="餐饮">餐饮</option>
          <option value="购物">购物</option>
          <option value="交通">交通</option>
          <option value="娱乐">娱乐</option>
          <option value="住房">住房</option>
          <option value="医疗">医疗</option>
          <option value="其他">其他</option>
        </select>
        
        <input v-model="searchText" placeholder="搜索交易记录..." style="padding: 8px; border: 1px solid #ddd; border-radius: 6px; flex: 1; min-width: 200px;">
        
        <select v-model="timeRange" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="all">全部时间</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="year">今年</option>
        </select>
      </div>

      <!-- 支出分类饼图 -->
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-top: 0; margin-bottom: 20px;">支出分类统计</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center;">
          <div style="text-align: center;">
            <div style="width: 200px; height: 200px; margin: 0 auto; background: conic-gradient(from 0deg, #3b82f6 0deg 72deg, #10b981 72deg 144deg, #f59e0b 144deg 216deg, #ef4444 216deg 288deg, #8b5cf6 288deg 360deg); border-radius: 50%; position: relative;">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <span style="color: #667eea; font-weight: bold;">支出分布</span>
              </div>
            </div>
          </div>
          <div>
            <div v-for="(item, index) in categoryStats" :key="item.category" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 8px; background: #f9fafb; border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div :style="{ width: '12px', height: '12px', background: getCategoryColor(item.category), borderRadius: '50%' }"></div>
                <span style="color: #333;">{{ item.category }}</span>
              </div>
              <span style="color: #333; font-weight: 500;">¥{{ item.amount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 交易记录列表 -->
      <div style="background: white; padding: 20px; border-radius: 16px;">
        <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">交易记录</h3>
        
        <div v-if="filteredTransactions.length === 0" style="text-align: center; padding: 40px; color: #666;">
          暂无交易记录，点击上方"记账"按钮添加
        </div>
        
        <div v-else>
          <div v-for="transaction in filteredTransactions" :key="transaction.id" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
              <div :style="{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', background: transaction.type === 'income' ? '#10b981' : '#ef4444' }">
                {{ transaction.type === 'income' ? '收' : '支' }}
              </div>
              <div style="flex: 1;">
                <h4 style="color: #333; margin: 0 0 5px 0;">{{ transaction.description }}</h4>
                <div style="color: #666; font-size: 14px; display: flex; gap: 15px;">
                  <span>🏷️ {{ transaction.category }}</span>
                  <span>📅 {{ transaction.date }}</span>
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div :style="{ color: transaction.type === 'income' ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '18px' }">
                {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount.toFixed(2) }}
              </div>
              <div style="color: #666; font-size: 12px; margin-top: 5px;">
                {{ transaction.time }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加交易记录弹窗 -->
    <div v-if="showAddTransaction" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 500px;">
        <h2 style="color: #333; margin-top: 0;">记账</h2>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">类型</label>
          <select v-model="newTransaction.type" @change="onTypeChange" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">金额</label>
          <input v-model="newTransaction.amount" type="number" step="0.01" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入金额">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">分类</label>
          <select v-model="newTransaction.category" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            <option v-if="newTransaction.type === 'income'" value="工资">工资</option>
            <option v-if="newTransaction.type === 'income'" value="奖金">奖金</option>
            <option v-if="newTransaction.type === 'income'" value="投资">投资</option>
            <option v-if="newTransaction.type === 'income'" value="其他">其他</option>
            
            <option v-if="newTransaction.type === 'expense'" value="餐饮">餐饮</option>
            <option v-if="newTransaction.type === 'expense'" value="购物">购物</option>
            <option v-if="newTransaction.type === 'expense'" value="交通">交通</option>
            <option v-if="newTransaction.type === 'expense'" value="娱乐">娱乐</option>
            <option v-if="newTransaction.type === 'expense'" value="住房">住房</option>
            <option v-if="newTransaction.type === 'expense'" value="医疗">医疗</option>
            <option v-if="newTransaction.type === 'expense'" value="其他">其他</option>
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">描述</label>
          <input v-model="newTransaction.description" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入交易描述">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">日期</label>
          <input v-model="newTransaction.date" type="date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button @click="closeTransactionModal" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
            取消
          </button>
          <button @click="saveTransaction" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            保存
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
      showAddTransaction: false,
      filterType: 'all',
      filterCategory: 'all',
      searchText: '',
      timeRange: 'all',
      newTransaction: {
        type: 'expense',
        amount: '',
        category: '餐饮',
        description: '',
        date: ''
      },
      transactions: [
        {
          id: 1,
          type: 'income',
          amount: 8000,
          category: '工资',
          description: '12月工资',
          date: '2024-12-01',
          time: '09:00'
        },
        {
          id: 2,
          type: 'expense',
          amount: 45.50,
          category: '餐饮',
          description: '午餐',
          date: '2024-12-18',
          time: '12:30'
        },
        {
          id: 3,
          type: 'expense',
          amount: 28.00,
          category: '交通',
          description: '地铁票',
          date: '2024-12-18',
          time: '08:15'
        },
        {
          id: 4,
          type: 'expense',
          amount: 168.90,
          category: '购物',
          description: '日用品采购',
          date: '2024-12-17',
          time: '19:45'
        },
        {
          id: 5,
          type: 'income',
          amount: 500,
          category: '奖金',
          description: '项目奖金',
          date: '2024-12-15',
          time: '15:00'
        },
        {
          id: 6,
          type: 'expense',
          amount: 1200,
          category: '住房',
          description: '房租',
          date: '2024-12-01',
          time: '10:00'
        }
      ]
    }
  },
  computed: {
    filteredTransactions() {
      let filtered = this.transactions
      
      if (this.filterType !== 'all') {
        filtered = filtered.filter(t => t.type === this.filterType)
      }
      
      if (this.filterCategory !== 'all') {
        filtered = filtered.filter(t => t.category === this.filterCategory)
      }
      
      if (this.searchText) {
        filtered = filtered.filter(t => 
          t.description.toLowerCase().includes(this.searchText.toLowerCase()) ||
          t.category.toLowerCase().includes(this.searchText.toLowerCase())
        )
      }
      
      // 时间筛选
      if (this.timeRange !== 'all') {
        const now = new Date()
        filtered = filtered.filter(t => {
          const transDate = new Date(t.date)
          if (this.timeRange === 'today') {
            return transDate.toDateString() === now.toDateString()
          } else if (this.timeRange === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return transDate >= weekAgo
          } else if (this.timeRange === 'month') {
            return transDate.getMonth() === now.getMonth() && transDate.getFullYear() === now.getFullYear()
          } else if (this.timeRange === 'year') {
            return transDate.getFullYear() === now.getFullYear()
          }
          return true
        })
      }
      
      return filtered.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
    },
    totalIncome() {
      return this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    },
    totalExpense() {
      return this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    },
    balance() {
      return this.totalIncome - this.totalExpense
    },
    monthlyAverage() {
      const expenseTransactions = this.transactions.filter(t => t.type === 'expense')
      if (expenseTransactions.length === 0) return 0
      
      const months = [...new Set(expenseTransactions.map(t => t.date.substring(0, 7)))]
      return this.totalExpense / Math.max(months.length, 1)
    },
    categoryStats() {
      const expenses = this.transactions.filter(t => t.type === 'expense')
      const stats = {}
      
      expenses.forEach(t => {
        if (!stats[t.category]) {
          stats[t.category] = 0
        }
        stats[t.category] += t.amount
      })
      
      return Object.entries(stats)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    }
  },
  methods: {
    saveTransaction() {
      if (!this.newTransaction.amount || !this.newTransaction.description) {
        alert('请填写金额和描述')
        return
      }
      
      const transaction = {
        id: Date.now(),
        ...this.newTransaction,
        amount: parseFloat(this.newTransaction.amount),
        date: this.newTransaction.date || this.formatDate(new Date()),
        time: new Date().toTimeString().substring(0, 5)
      }
      
      this.transactions.unshift(transaction)
      this.closeTransactionModal()
    },
    closeTransactionModal() {
      this.showAddTransaction = false
      this.newTransaction = {
        type: 'expense',
        amount: '',
        category: '餐饮',
        description: '',
        date: ''
      }
    },
    onTypeChange() {
      if (this.newTransaction.type === 'income') {
        this.newTransaction.category = '工资'
      } else {
        this.newTransaction.category = '餐饮'
      }
    },
    getCategoryColor(category) {
      const colors = {
        工资: '#10b981',
        奖金: '#10b981',
        投资: '#10b981',
        餐饮: '#3b82f6',
        购物: '#8b5cf6',
        交通: '#f59e0b',
        娱乐: '#ef4444',
        住房: '#dc2626',
        医疗: '#7c3aed',
        其他: '#6b7280'
      }
      return colors[category] || '#667eea'
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
  },
  mounted() {
    this.newTransaction.date = this.formatDate(new Date())
  }
}
</script>