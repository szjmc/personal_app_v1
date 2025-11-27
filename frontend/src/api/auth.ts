import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token过期，尝试刷新
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh/', {
            refresh: refreshToken
          })
          
          const newToken = response.data.access
          localStorage.setItem('token', newToken)
          
          // 重新发送原请求
          error.config.headers.Authorization = `Bearer ${newToken}`
          return api.request(error.config)
        } catch (refreshError) {
          // 刷新失败，跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    
    const message = error.response?.data?.detail || error.response?.data?.message || '请求失败'
    ElMessage.error(message)
    
    return Promise.reject(error)
  }
)

// 用户认证API
export const userApi = {
  // 登录
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login/', credentials),
  
  // 注册
  register: (userData: any) => 
    api.post('/auth/register/', userData),
  
  // 登出
  logout: () => 
    api.post('/auth/logout/', { refresh: localStorage.getItem('refreshToken') }),
  
  // 获取当前用户信息
  getCurrentUser: () => 
    api.get('/auth/me/'),
  
  // 更新用户信息
  updateUser: (data: any) => 
    api.patch('/auth/details/', data),
  
  // 修改密码
  changePassword: (data: any) => 
    api.post('/auth/change-password/', data),
  
  // 获取用户配置
  getProfile: () => 
    api.get('/auth/profile/'),
  
  // 更新用户配置
  updateProfile: (data: any) => 
    api.patch('/auth/profile/', data)
}

export default api