/**
 * API 请求优化器
 * 提供请求去重、缓存、重试、批量请求等功能
 */

import { http } from './request'
import { dataPreloader } from './data-preloader'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  params?: any
  data?: any
  timeout?: number
  retry?: number
  retryDelay?: number
  cache?: boolean
  cacheTime?: number
  priority?: 'high' | 'medium' | 'low'
  deduplication?: boolean
}

interface PendingRequest {
  config: RequestConfig
  resolve: (value: any) => void
  reject: (reason: any) => void
  timestamp: number
}

interface CacheEntry {
  data: any
  timestamp: number
  expires: number
}

class ApiOptimizer {
  private pendingRequests: Map<string, PendingRequest[]> = new Map()
  private cache: Map<string, CacheEntry> = new Map()
  private requestQueue: Array<{ config: RequestConfig; priority: number; timestamp: number }> = []
  private isProcessingQueue = false
  private networkStatus: { online: boolean; slowNetwork: boolean }
  private requestStats: {
    total: number
    success: number
    failed: number
    cached: number
    duplicated: number
  }

  constructor() {
    this.networkStatus = {
      online: navigator.onLine,
      slowNetwork: false
    }

    this.requestStats = {
      total: 0,
      success: 0,
      failed: 0,
      cached: 0,
      duplicated: 0
    }

    this.setupNetworkListeners()
    this.startCacheCleanup()
  }

  /**
   * 设置网络状态监听
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.networkStatus.online = true
      this.processRequestQueue()
    })

    window.addEventListener('offline', () => {
      this.networkStatus.online = false
    })

    // 检测网络速度
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.networkStatus.slowNetwork = 
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g'
    }
  }

  /**
   * 生成请求键
   */
  private generateRequestKey(config: RequestConfig): string {
    const { method = 'GET', url, params = {} } = config
    const paramStr = new URLSearchParams(params).toString()
    return `${method}:${url}:${paramStr}`
  }

  /**
   * 请求去重
   */
  private async deduplicateRequest(config: RequestConfig): Promise<any> {
    const key = this.generateRequestKey(config)
    
    if (!config.deduplication) {
      return null
    }

    // 检查是否有相同的请求正在进行
    if (this.pendingRequests.has(key)) {
      this.requestStats.duplicated++
      
      return new Promise((resolve, reject) => {
        this.pendingRequests.get(key)!.push({
          config,
          resolve,
          reject,
          timestamp: Date.now()
        })
      })
    }

    return null
  }

  /**
   * 缓存检查
   */
  private checkCache(config: RequestConfig): any | null {
    if (!config.cache) {
      return null
    }

    const key = this.generateRequestKey(config)
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    // 检查缓存是否过期
    if (cached.expires <= Date.now()) {
      this.cache.delete(key)
      return null
    }

    this.requestStats.cached++
    return cached.data
  }

  /**
   * 设置缓存
   */
  private setCache(config: RequestConfig, data: any): void {
    if (!config.cache) {
      return
    }

    const key = this.generateRequestKey(config)
    const cacheTime = config.cacheTime || 5 * 60 * 1000 // 默认5分钟

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + cacheTime
    })
  }

  /**
   * 执行请求
   */
  private async executeRequest(config: RequestConfig): Promise<any> {
    this.requestStats.total++
    const key = this.generateRequestKey(config)

    try {
      const response = await this.makeHttpRequest(config)
      this.requestStats.success++

      // 缓存成功响应
      if (config.cache && response.data) {
        this.setCache(config, response.data)
      }

      // 解析所有等待的请求
      const pending = this.pendingRequests.get(key) || []
      pending.forEach(p => p.resolve(response.data))
      this.pendingRequests.delete(key)

      return response.data

    } catch (error) {
      this.requestStats.failed++

      // 重试逻辑
      if (config.retry && config.retry > 0) {
        const retryDelay = config.retryDelay || 1000
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        
        config.retry--
        return this.executeRequest(config)
      }

      // 错误处理
      const pending = this.pendingRequests.get(key) || []
      pending.forEach(p => p.reject(error))
      this.pendingRequests.delete(key)

      throw error
    }
  }

  /**
   * 发送HTTP请求
   */
  private async makeHttpRequest(config: RequestConfig): Promise<any> {
    const { method = 'GET', url, params, data, timeout = 10000 } = config

    const requestConfig: any = {
      method,
      url,
      timeout,
      headers: {
        'X-Request-ID': this.generateRequestId(),
        'X-Optimized': 'true'
      }
    }

    if (params) {
      requestConfig.params = params
    }

    if (data) {
      requestConfig.data = data
    }

    return http(requestConfig)
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 添加请求到队列
   */
  private addToQueue(config: RequestConfig): void {
    const priorityMap = { high: 3, medium: 2, low: 1 }
    const priority = priorityMap[config.priority || 'medium']

    this.requestQueue.push({
      config,
      priority,
      timestamp: Date.now()
    })

    // 按优先级排序
    this.requestQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return a.timestamp - b.timestamp
    })

    this.processRequestQueue()
  }

  /**
   * 处理请求队列
   */
  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.networkStatus.online) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const { config } = this.requestQueue.shift()!
      
      try {
        await this.request(config)
      } catch (error) {
        console.warn('Request failed in queue:', error)
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * 主请求方法
   */
  public async request(config: RequestConfig): Promise<any> {
    // 检查缓存
    const cached = this.checkCache(config)
    if (cached !== null) {
      return cached
    }

    // 请求去重
    const duplicated = await this.deduplicateRequest(config)
    if (duplicated !== null) {
      return duplicated
    }

    // 网络状态检查
    if (!this.networkStatus.online) {
      throw new Error('Network is offline')
    }

    // 网络慢时降低优先级
    if (this.networkStatus.slowNetwork && config.priority === 'low') {
      this.addToQueue(config)
      return new Promise(() => {}) // 返回不resolve的Promise
    }

    // 立即执行请求
    const key = this.generateRequestKey(config)
    this.pendingRequests.set(key, [])

    return this.executeRequest(config)
  }

  /**
   * 批量请求
   */
  public async batchRequest(configs: RequestConfig[]): Promise<Array<{ success: boolean; data?: any; error?: any }>> {
    const promises = configs.map(config => 
      this.request(config)
        .then(data => ({ success: true, data }))
        .catch(error => ({ success: false, error }))
    )

    return Promise.all(promises)
  }

  /**
   * 并行请求（只取最快的结果）
   */
  public async raceRequest(configs: RequestConfig[]): Promise<any> {
    const promises = configs.map(config => this.request(config))
    
    try {
      return await Promise.race(promises)
    } catch (error) {
      // 如果所有请求都失败，抛出最后一个错误
      throw error
    }
  }

  /**
   * 预加载请求
   */
  public async preloadRequest(config: RequestConfig): Promise<void> {
    const preloadConfig = { ...config, priority: 'low' }
    
    if (!this.networkStatus.online) {
      return
    }

    try {
      await this.request(preloadConfig)
      console.log(`✅ Preloaded: ${config.url}`)
    } catch (error) {
      console.warn(`❌ Failed to preload: ${config.url}`, error)
    }
  }

  /**
   * 智能预加载
   */
  public smartPreload(): void {
    // 预加载用户可能需要的数据
    this.preloadRequest({
      url: '/api/dashboard/stats/',
      cache: true,
      cacheTime: 10 * 60 * 1000,
      priority: 'high'
    })

    this.preloadRequest({
      url: '/api/tasks/today/',
      cache: true,
      cacheTime: 5 * 60 * 1000,
      priority: 'high'
    })

    // 预加载用户偏好设置
    this.preloadRequest({
      url: '/api/user/preferences/',
      cache: true,
      cacheTime: 60 * 60 * 1000,
      priority: 'medium'
    })
  }

  /**
   * 清理过期缓存
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now()
      let cleaned = 0

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expires <= now) {
          this.cache.delete(key)
          cleaned++
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired cache entries`)
      }
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }

  /**
   * 获取请求统计
   */
  public getStats(): any {
    return {
      ...this.requestStats,
      successRate: this.requestStats.total > 0 
        ? (this.requestStats.success / this.requestStats.total * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRate: this.requestStats.total > 0 
        ? (this.requestStats.cached / this.requestStats.total * 100).toFixed(2) + '%'
        : '0%',
      networkStatus: this.networkStatus,
      queueSize: this.requestQueue.length,
      cacheSize: this.cache.size
    }
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * 清除请求队列
   */
  public clearQueue(): void {
    this.requestQueue.length = 0
  }

  /**
   * 重置统计
   */
  public resetStats(): void {
    this.requestStats = {
      total: 0,
      success: 0,
      failed: 0,
      cached: 0,
      duplicated: 0
    }
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.clearCache()
    this.clearQueue()
    this.pendingRequests.clear()
  }
}

// 创建全局实例
export const apiOptimizer = new ApiOptimizer()

// 增强的请求函数
export const optimizedRequest = (config: RequestConfig) => {
  return apiOptimizer.request({
    cache: true,
    deduplication: true,
    retry: 2,
    retryDelay: 1000,
    priority: 'medium',
    ...config
  })
}

export default apiOptimizer