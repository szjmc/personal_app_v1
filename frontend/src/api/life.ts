import request from '@/utils/request'

// 快递相关接口
export interface Express {
  id: number
  tracking_number: string
  courier: string
  description: string
  current_status: string
  current_location: string
  estimated_delivery: string
  created_at: string
  updated_at: string
  user: number
}

export interface TrackingInfo {
  time: string
  location: string
  status: string
  description: string
}

export const expressApi = {
  // 获取快递列表
  getList: (params?: { status?: string; courier?: string }) =>
    request.get('/api/life/express/', { params }),
  
  // 添加快递
  create: (data: Partial<Express>) =>
    request.post('/api/life/express/', data),
  
  // 更新快递信息
  update: (id: number, data: Partial<Express>) =>
    request.put(`/api/life/express/${id}/`, data),
  
  // 删除快递
  delete: (id: number) =>
    request.delete(`/api/life/express/${id}/`),
  
  // 获取物流详情
  getTracking: (id: number) =>
    request.get(`/api/life/express/${id}/tracking/`),
  
  // 刷新物流信息
  refreshTracking: (id: number) =>
    request.post(`/api/life/express/${id}/refresh-tracking/`),
  
  // 搜索快递公司
  searchCourier: (query: string) =>
    request.get('/api/life/express/search-courier/', { params: { query } })
}

// 习惯打卡相关接口
export interface Habit {
  id: number
  name: string
  description: string
  icon: string
  color: string
  target_count: number
  unit: string
  time_of_day: string
  is_active: boolean
  created_at: string
  user: number
}

export interface HabitRecord {
  id: number
  habit: number
  date: string
  completed: boolean
  notes: string
  created_at: string
  user: number
}

export interface HabitStats {
  total_days: number
  completed_days: number
  streak_days: number
  completion_rate: number
  this_week_records: Array<{
    date: string
    completed: boolean
  }>
}

export const habitApi = {
  // 获取习惯列表
  getList: () =>
    request.get('/api/life/habits/'),
  
  // 创建习惯
  create: (data: Partial<Habit>) =>
    request.post('/api/life/habits/', data),
  
  // 更新习惯
  update: (id: number, data: Partial<Habit>) =>
    request.put(`/api/life/habits/${id}/`, data),
  
  // 删除习惯
  delete: (id: number) =>
    request.delete(`/api/life/habits/${id}/`),
  
  // 获取打卡记录
  getRecords: (habitId: number, params?: { start_date?: string; end_date?: string }) =>
    request.get(`/api/life/habits/${habitId}/records/`, { params }),
  
  // 添加打卡记录
  checkIn: (habitId: number, data: { date: string; notes?: string }) =>
    request.post(`/api/life/habits/${habitId}/check-in/`, data),
  
  // 取消打卡
  cancelCheckIn: (habitId: number, date: string) =>
    request.delete(`/api/life/habits/${habitId}/check-in/?date=${date}`),
  
  // 获取习惯统计
  getStats: (habitId: number) =>
    request.get(`/api/life/habits/${habitId}/stats/`),
  
  // 获取今日打卡状态
  getTodayStatus: () =>
    request.get('/api/life/habits/today-status/')
}

// 财务记录相关接口
export interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  subcategory: string
  description: string
  date: string
  account: string
  tags: string[]
  receipt_image?: string
  created_at: string
  user: number
}

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
  subcategories: string[]
  is_active: boolean
  user: number
}

export interface FinancialSummary {
  total_income: number
  total_expense: number
  balance: number
  month_income: number
  month_expense: number
  categories_breakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
  daily_trend: Array<{
    date: string
    income: number
    expense: number
  }>
}

export const financeApi = {
  // 获取交易记录
  getTransactions: (params?: { 
    type?: string; 
    category?: string; 
    start_date?: string; 
    end_date?: string;
    page?: number;
  }) =>
    request.get('/api/life/transactions/', { params }),
  
  // 创建交易记录
  create: (data: Partial<Transaction>) =>
    request.post('/api/life/transactions/', data),
  
  // 更新交易记录
  update: (id: number, data: Partial<Transaction>) =>
    request.put(`/api/life/transactions/${id}/`, data),
  
  // 删除交易记录
  delete: (id: number) =>
    request.delete(`/api/life/transactions/${id}/`),
  
  // 获取分类列表
  getCategories: (type?: 'income' | 'expense') =>
    request.get('/api/life/categories/', { params: { type } }),
  
  // 创建分类
  createCategory: (data: Partial<Category>) =>
    request.post('/api/life/categories/', data),
  
  // 获取财务汇总
  getSummary: (params?: { period?: 'month' | 'year'; start_date?: string; end_date?: string }) =>
    request.get('/api/life/transactions/summary/', { params }),
  
  // 导出数据
  export: (params: { format: string; start_date?: string; end_date?: string }) =>
    request.get('/api/life/transactions/export/', { 
      params,
      responseType: 'blob'
    }),
  
  // 同步支付宝/微信账单
  syncBills: (platform: 'alipay' | 'wechat') =>
    request.post(`/api/life/transactions/sync-${platform}/`)
}

// 物品管理相关接口
export interface Item {
  id: number
  name: string
  category: string
  quantity: number
  unit: string
  expiry_date?: string
  location: string
  notes: string
  image?: string
  created_at: string
  user: number
}

export const itemApi = {
  // 获取物品列表
  getList: (params?: { 
    category?: string; 
    location?: string; 
    expiring_soon?: boolean;
  }) =>
    request.get('/api/life/items/', { params }),
  
  // 添加物品
  create: (data: Partial<Item>) =>
    request.post('/api/life/items/', data),
  
  // 更新物品
  update: (id: number, data: Partial<Item>) =>
    request.put(`/api/life/items/${id}/`, data),
  
  // 删除物品
  delete: (id: number) =>
    request.delete(`/api/life/items/${id}/`),
  
  // 获取即将过期的物品
  getExpiringSoon: () =>
    request.get('/api/life/items/expiring-soon/'),
  
  // 获取分类统计
  getCategoryStats: () =>
    request.get('/api/life/items/category-stats/')
}