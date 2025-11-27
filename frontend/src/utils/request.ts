import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 请求配置接口
interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  showError?: boolean
  useCache?: boolean
  cacheTime?: number
}

// 响应数据接口
interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  timestamp: number
}

// 缓存管理
class RequestCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>
  
  constructor() {
    this.cache = new Map()
    // 定期清理过期缓存
    setInterval(() => this.clearExpired(), 60000) // 每分钟清理一次
  }
  
  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }
  
  private clearExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// 请求队列管理
class RequestQueue {
  private pendingRequests: Map<string, Promise<any>>
  
  constructor() {
    this.pendingRequests = new Map()
  }
  
  // 生成请求键
  private generateKey(config: InternalAxiosRequestConfig): string {
    const { method, url, params, data } = config
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
  }
  
  // 添加到队列
  add(config: InternalAxiosRequestConfig): Promise<any> | null {
    const key = this.generateKey(config)
    const existing = this.pendingRequests.get(key)
    
    if (existing) {
      return existing // 返回已存在的请求Promise
    }
    
    return null
  }
  
  // 创建新请求
  create<T>(config: InternalAxiosRequestConfig, requestFn: () => Promise<T>): Promise<T> {
    const key = this.generateKey(config)
    
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })
    
    this.pendingRequests.set(key, promise)
    return promise
  }
}

// 请求重试管理
class RetryManager {
  private static readonly RETRY_STATUSES = [408, 429, 500, 502, 503, 504]
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 1000
  
  static shouldRetry(error: AxiosError): boolean {
    const status = error.response?.status
    return status ? this.RETRY_STATUSES.includes(status) : false
  }
  
  static async retry<T>(
    requestFn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
    delay: number = this.RETRY_DELAY
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as AxiosError)) {
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.retry(requestFn, retries - 1, delay * 2)
      }
      throw error
    }
  }
}

// 创建axios实例
const createAxiosInstance = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  // 请求缓存
  const requestCache = new RequestCache()
  
  // 请求队列
  const requestQueue = new RequestQueue()
  
  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      const userStore = useUserStore()
      
      // 添加认证token
      if (userStore.token) {
        config.headers.Authorization = `Bearer ${userStore.token}`
      }
      
      // 处理缓存
      const requestConfig = config as RequestConfig
      if (requestConfig.useCache && config.method?.toLowerCase() === 'get') {
        const cacheKey = `${config.baseURL}${config.url}:${JSON.stringify(config.params)}`
        const cachedData = requestCache.get(cacheKey)
        
        if (cachedData) {
          // 返回缓存数据，但不实际发送请求
          return Promise.reject({
            __CANCEL__: true,
            cachedData,
            config
          })
        }
      }
      
      // 检查重复请求
      const existingRequest = requestQueue.add(config)
      if (existingRequest) {
        return Promise.reject({
          __CANCEL__: true,
          duplicate: true,
          config
        })
      }
      
      // 添加请求时间戳
      config.metadata = { startTime: Date.now() }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
  
  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const requestConfig = response.config as RequestConfig
      
      // 计算请求耗时
      const endTime = Date.now()
      const startTime = response.config.metadata?.startTime || endTime
      const duration = endTime - startTime
      
      // 添加调试信息
      if (import.meta.env.DEV) {
        console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          duration: `${duration}ms`,
          status: response.status
        })
      }
      
      // 处理缓存
      if (requestConfig.useCache && response.config.method?.toLowerCase() === 'get') {
        const cacheKey = `${response.config.baseURL}${response.config.url}:${JSON.stringify(response.config.params)}`
        const cacheTime = requestConfig.cacheTime || 300000 // 默认5分钟
        requestCache.set(cacheKey, response.data, cacheTime)
      }
      
      // 统一响应格式
      if (response.data && typeof response.data === 'object') {
        if ('code' in response.data) {
          return response
        }
        
        // 如果不是标准格式，包装成标准格式
        response.data = {
          code: 200,
          data: response.data,
          message: 'success',
          timestamp: Date.now()
        }
      }
      
      return response
    },
    async (error: AxiosError) => {
      const requestConfig = error.config as RequestConfig
      
      // 处理被取消的请求
      if (error.__CANCEL__) {
        if (error.cachedData) {
          // 返回缓存数据
          return Promise.resolve({
            data: error.cachedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: error.config,
            request: {}
          } as AxiosResponse)
        } else if (error.duplicate) {
          // 忽略重复请求
          return Promise.reject(error)
        }
      }
      
      // 处理网络错误
      if (!error.response) {
        if (requestConfig.showError !== false) {
          ElMessage.error('网络连接失败，请检查网络设置')
        }
        return Promise.reject(error)
      }
      
      const { status, data } = error.response
      
      // 处理特定状态码
      switch (status) {
        case 401:
          // 未授权，清除登录状态并跳转到登录页
          const userStore = useUserStore()
          userStore.logout()
          router.push('/login')
          
          if (requestConfig.showError !== false) {
            ElMessage.error('登录已过期，请重新登录')
          }
          break
          
        case 403:
          if (requestConfig.showError !== false) {
            ElMessage.error('权限不足，无法访问该资源')
          }
          break
          
        case 404:
          if (requestConfig.showError !== false) {
            ElMessage.error('请求的资源不存在')
          }
          break
          
        case 422:
          // 表单验证错误，显示具体错误信息
          if (data?.detail && Array.isArray(data.detail)) {
            const errors = data.detail.map((item: any) => item.msg).join('; ')
            if (requestConfig.showError !== false) {
              ElMessage.error(errors)
            }
          } else {
            if (requestConfig.showError !== false) {
              ElMessage.error(data?.message || '请求参数有误')
            }
          }
          break
          
        case 429:
          if (requestConfig.showError !== false) {
            ElMessage.error('请求过于频繁，请稍后再试')
          }
          break
          
        case 500:
          if (requestConfig.showError !== false) {
            ElMessage.error('服务器内部错误，请稍后再试')
          }
          break
          
        default:
          if (requestConfig.showError !== false) {
            ElMessage.error(data?.message || `请求失败 (${status})`)
          }
      }
      
      // 重试机制
      if (RetryManager.shouldRetry(error) && requestConfig.retry !== false) {
        try {
          const retryConfig = {
            ...requestConfig,
            retry: false // 避免无限重试
          }
          
          return await RetryManager.retry(
            () => instance(retryConfig),
            3,
            1000
          )
        } catch (retryError) {
          return Promise.reject(retryError)
        }
      }
      
      return Promise.reject(error)
    }
  )
  
  return instance
}

// 创建axios实例
const request = createAxiosInstance()

// 导出请求方法
export const http = {
  get<T = any>(url: string, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return request.get(url, config)
  },
  
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return request.post(url, data, config)
  },
  
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return request.put(url, data, config)
  },
  
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return request.patch(url, data, config)
  },
  
  delete<T = any>(url: string, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return request.delete(url, config)
  },
  
  // 上传文件
  upload<T = any>(url: string, formData: FormData, config?: RequestConfig): Promise<AxiosResponse<T>> {
    return request.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    })
  },
  
  // 下载文件
  download(url: string, config?: RequestConfig): Promise<AxiosResponse<Blob>> {
    return request.get(url, {
      ...config,
      responseType: 'blob'
    })
  }
}

// 缓存管理工具
export const cacheManager = {
  clearAll: () => {
    // 清除所有缓存
    localStorage.removeItem('api_cache')
  },
  
  clearPattern: (pattern: string) => {
    // 清除匹配模式的缓存
    const cache = new RequestCache()
    cache.clearPattern(pattern)
  }
}

// 导出默认实例
export default request