<template>
  <div style="padding: 20px; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 1200px; margin: 0 auto;">
      <!-- 头部 -->
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="color: #333; margin-bottom: 5px;">🏃‍♂️ 健康管理</h1>
          <p style="color: #666; margin: 0;">记录健康数据和运动习惯</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button @click="showAddHealth = true" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
            + 记录数据
          </button>
          <button @click="backToDashboard" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
            返回仪表盘
          </button>
        </div>
      </div>

      <!-- 健康概览 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #667eea; margin: 0 0 10px 0;">{{ currentWeight }}kg</h3>
          <p style="color: #666; margin: 0;">当前体重</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #10b981; margin: 0 0 10px 0;">{{ weeklyExercise }}次</h3>
          <p style="color: #666; margin: 0;">本周运动</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #f59e0b; margin: 0 0 10px 0;">{{ avgSleep }}小时</h3>
          <p style="color: #666; margin: 0;">平均睡眠</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #ef4444; margin: 0 0 10px 0;">{{ healthScore }}分</h3>
          <p style="color: #666; margin: 0;">健康评分</p>
        </div>
      </div>

      <!-- 筛选器 -->
      <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <select v-model="filterType" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="all">全部类型</option>
          <option value="weight">体重</option>
          <option value="exercise">运动</option>
          <option value="sleep">睡眠</option>
          <option value="meal">饮食</option>
          <option value="checkup">体检</option>
        </select>
        
        <select v-model="timeRange" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="quarter">近3个月</option>
          <option value="year">今年</option>
        </select>
        
        <button @click="viewCharts" style="padding: 8px 16px; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer;">
          查看图表
        </button>
      </div>

      <!-- 健康数据列表 -->
      <div style="display: grid; gap: 20px; margin-bottom: 20px;">
        <div v-for="record in filteredRecords" :key="record.id" style="background: white; padding: 20px; border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div :style="getRecordIconStyle(record.type)" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                {{ getRecordIcon(record.type) }}
              </div>
              <div>
                <h3 style="color: #333; margin: 0 0 5px 0;">{{ getRecordTitle(record.type) }}</h3>
                <p style="color: #666; margin: 0; font-size: 14px;">{{ record.date }} {{ record.time }}</p>
              </div>
            </div>
            <div style="display: flex; gap: 10px;">
              <button @click="editRecord(record)" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                编辑
              </button>
              <button @click="deleteRecord(record)" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                删除
              </button>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <div v-if="record.type === 'weight'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              <div>
                <span style="color: #666; font-size: 12px;">体重</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.weight }}kg</div>
              </div>
              <div v-if="record.data.bodyFat">
                <span style="color: #666; font-size: 12px;">体脂率</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.bodyFat }}%</div>
              </div>
              <div v-if="record.data.bmi">
                <span style="color: #666; font-size: 12px;">BMI</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.bmi }}</div>
              </div>
            </div>
            
            <div v-if="record.type === 'exercise'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              <div>
                <span style="color: #666; font-size: 12px;">运动类型</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.exerciseType }}</div>
              </div>
              <div>
                <span style="color: #666; font-size: 12px;">时长</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.duration }}分钟</div>
              </div>
              <div>
                <span style="color: #666; font-size: 12px;">消耗卡路里</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.calories }}kcal</div>
              </div>
            </div>
            
            <div v-if="record.type === 'sleep'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              <div>
                <span style="color: #666; font-size: 12px;">睡眠时长</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.duration }}小时</div>
              </div>
              <div>
                <span style="color: #666; font-size: 12px;">睡眠质量</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.quality }}</div>
              </div>
            </div>
            
            <div v-if="record.type === 'meal'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              <div>
                <span style="color: #666; font-size: 12px;">餐次</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.mealType }}</div>
              </div>
              <div>
                <span style="color: #666; font-size: 12px;">卡路里</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.calories }}kcal</div>
              </div>
            </div>
            
            <div v-if="record.type === 'checkup'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              <div>
                <span style="color: #666; font-size: 12px;">检查项目</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.checkupType }}</div>
              </div>
              <div>
                <span style="color: #666; font-size: 12px;">结果</span>
                <div style="color: #333; font-weight: 500;">{{ record.data.result }}</div>
              </div>
            </div>
            
            <div v-if="record.notes" style="margin-top: 10px;">
              <span style="color: #666; font-size: 12px;">备注</span>
              <div style="color: #333; margin-top: 5px;">{{ record.notes }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredRecords.length === 0" style="background: white; padding: 40px; border-radius: 12px; text-align: center;">
        <p style="color: #666; font-size: 16px;">📝 暂无健康记录，点击上方按钮开始记录</p>
      </div>
    </div>

    <!-- 添加健康记录弹窗 -->
    <div v-if="showAddHealth" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
        <h2 style="color: #333; margin-top: 0;">记录健康数据</h2>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">记录类型</label>
          <select v-model="newRecord.type" @change="onTypeChange" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            <option value="weight">体重记录</option>
            <option value="exercise">运动记录</option>
            <option value="sleep">睡眠记录</option>
            <option value="meal">饮食记录</option>
            <option value="checkup">体检记录</option>
          </select>
        </div>
        
        <!-- 体重记录表单 -->
        <div v-if="newRecord.type === 'weight'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">体重 (kg)</label>
            <input v-model="newRecord.data.weight" type="number" step="0.1" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入体重">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">体脂率 (%)</label>
            <input v-model="newRecord.data.bodyFat" type="number" step="0.1" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入体脂率">
          </div>
        </div>
        
        <!-- 运动记录表单 -->
        <div v-if="newRecord.type === 'exercise'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">运动类型</label>
            <select v-model="newRecord.data.exerciseType" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="跑步">跑步</option>
              <option value="游泳">游泳</option>
              <option value="健身">健身</option>
              <option value="瑜伽">瑜伽</option>
              <option value="篮球">篮球</option>
              <option value="足球">足球</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">时长 (分钟)</label>
            <input v-model="newRecord.data.duration" type="number" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="运动时长">
          </div>
        </div>
        
        <!-- 睡眠记录表单 -->
        <div v-if="newRecord.type === 'sleep'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">睡眠时长 (小时)</label>
            <input v-model="newRecord.data.duration" type="number" step="0.5" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="睡眠时长">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">睡眠质量</label>
            <select v-model="newRecord.data.quality" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="很好">很好</option>
              <option value="好">好</option>
              <option value="一般">一般</option>
              <option value="差">差</option>
            </select>
          </div>
        </div>
        
        <!-- 饮食记录表单 -->
        <div v-if="newRecord.type === 'meal'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">餐次</label>
            <select v-model="newRecord.data.mealType" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="早餐">早餐</option>
              <option value="午餐">午餐</option>
              <option value="晚餐">晚餐</option>
              <option value="加餐">加餐</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">卡路里</label>
            <input v-model="newRecord.data.calories" type="number" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="摄入卡路里">
          </div>
        </div>
        
        <!-- 体检记录表单 -->
        <div v-if="newRecord.type === 'checkup'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">检查项目</label>
            <select v-model="newRecord.data.checkupType" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="血常规">血常规</option>
              <option value="尿常规">尿常规</option>
              <option value="肝功能">肝功能</option>
              <option value="肾功能">肾功能</option>
              <option value="心电图">心电图</option>
              <option value="X光">X光</option>
              <option value="B超">B超</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">检查结果</label>
            <input v-model="newRecord.data.result" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="检查结果">
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">日期</label>
          <input v-model="newRecord.date" type="date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">备注</label>
          <textarea v-model="newRecord.notes" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 60px;" placeholder="输入备注信息"></textarea>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button @click="closeHealthModal" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
            取消
          </button>
          <button @click="saveRecord" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
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
      showAddHealth: false,
      filterType: 'all',
      timeRange: 'week',
      newRecord: {
        type: 'weight',
        data: {},
        date: '',
        notes: ''
      },
      healthRecords: [
        {
          id: 1,
          type: 'weight',
          data: {
            weight: 68.5,
            bodyFat: 18.5,
            bmi: 22.8
          },
          date: '2024-12-18',
          time: '07:30',
          notes: '早晨空腹体重'
        },
        {
          id: 2,
          type: 'exercise',
          data: {
            exerciseType: '跑步',
            duration: 45,
            calories: 320
          },
          date: '2024-12-17',
          time: '18:00',
          notes: '夜跑5公里'
        },
        {
          id: 3,
          type: 'sleep',
          data: {
            duration: 7.5,
            quality: '好'
          },
          date: '2024-12-16',
          time: '23:30',
          notes: '睡眠质量不错'
        },
        {
          id: 4,
          type: 'meal',
          data: {
            mealType: '午餐',
            calories: 680
          },
          date: '2024-12-18',
          time: '12:30',
          notes: '营养均衡的午餐'
        },
        {
          id: 5,
          type: 'checkup',
          data: {
            checkupType: '血常规',
            result: '正常'
          },
          date: '2024-12-15',
          time: '09:00',
          notes: '年度体检'
        }
      ]
    }
  },
  computed: {
    filteredRecords() {
      let filtered = this.healthRecords
      
      if (this.filterType !== 'all') {
        filtered = filtered.filter(r => r.type === this.filterType)
      }
      
      // 时间筛选
      const now = new Date()
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.date)
        if (this.timeRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return recordDate >= weekAgo
        } else if (this.timeRange === 'month') {
          return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear()
        } else if (this.timeRange === 'quarter') {
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          return recordDate >= quarterAgo
        } else if (this.timeRange === 'year') {
          return recordDate.getFullYear() === now.getFullYear()
        }
        return true
      })
      
      return filtered.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
    },
    currentWeight() {
      const weightRecords = this.healthRecords.filter(r => r.type === 'weight')
      return weightRecords.length > 0 ? weightRecords[0].data.weight : 0
    },
    weeklyExercise() {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return this.healthRecords.filter(r => 
        r.type === 'exercise' && 
        new Date(r.date + ' ' + r.time) >= weekAgo
      ).length
    },
    avgSleep() {
      const sleepRecords = this.healthRecords.filter(r => r.type === 'sleep')
      if (sleepRecords.length === 0) return 0
      const total = sleepRecords.reduce((sum, r) => sum + r.data.duration, 0)
      return (total / sleepRecords.length).toFixed(1)
    },
    healthScore() {
      // 简单的健康评分算法
      let score = 70 // 基础分
      
      // 体重是否在正常范围
      const weight = this.currentWeight
      if (weight > 50 && weight < 80) score += 10
      
      // 本周运动次数
      if (this.weeklyExercise >= 3) score += 10
      else if (this.weeklyExercise >= 1) score += 5
      
      // 平均睡眠
      const sleep = parseFloat(this.avgSleep)
      if (sleep >= 7 && sleep <= 9) score += 10
      else if (sleep >= 6) score += 5
      
      return Math.min(score, 100)
    }
  },
  methods: {
    saveRecord() {
      if (!this.newRecord.date) {
        alert('请选择日期')
        return
      }
      
      if (this.newRecord.type === 'weight' && !this.newRecord.data.weight) {
        alert('请输入体重')
        return
      }
      
      const record = {
        id: Date.now(),
        ...this.newRecord,
        time: new Date().toTimeString().substring(0, 5)
      }
      
      this.healthRecords.unshift(record)
      this.closeHealthModal()
    },
    editRecord(record) {
      this.newRecord = {
        type: record.type,
        data: { ...record.data },
        date: record.date,
        notes: record.notes || ''
      }
      this.showAddHealth = true
    },
    deleteRecord(record) {
      if (confirm(`确定要删除这条${this.getRecordTitle(record.type)}记录吗？`)) {
        this.healthRecords = this.healthRecords.filter(r => r.id !== record.id)
      }
    },
    closeHealthModal() {
      this.showAddHealth = false
      this.newRecord = {
        type: 'weight',
        data: {},
        date: '',
        notes: ''
      }
    },
    onTypeChange() {
      this.newRecord.data = {}
    },
    getRecordIcon(type) {
      const icons = {
        weight: '⚖️',
        exercise: '🏃‍♂️',
        sleep: '😴',
        meal: '🍽',
        checkup: '🏥'
      }
      return icons[type] || '📊'
    },
    getRecordIconStyle(type) {
      const colors = {
        weight: '#3b82f6',
        exercise: '#10b981',
        sleep: '#8b5cf6',
        meal: '#f59e0b',
        checkup: '#ef4444'
      }
      return {
        background: colors[type] + '20',
        color: colors[type]
      }
    },
    getRecordTitle(type) {
      const titles = {
        weight: '体重记录',
        exercise: '运动记录',
        sleep: '睡眠记录',
        meal: '饮食记录',
        checkup: '体检记录'
      }
      return titles[type] || '健康记录'
    },
    viewCharts() {
      alert('图表功能开发中...')
    },
    backToDashboard() {
      this.$router.push('/dashboard')
    }
  },
  mounted() {
    this.newRecord.date = this.formatDate(new Date())
  }
}
</script>