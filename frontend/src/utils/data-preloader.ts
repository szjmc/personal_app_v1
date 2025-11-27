/**
 * 数据预加载服务
 * 根据用户行为和模式预加载相关数据
 */

import { http } from './request'
import { useStorage } from '@/composables/useStorage'
import { useUserStore } from '@/stores/user'

interface PreloadConfig {
  key: string
  apiEndpoint: string
  priority: 'high' | 'medium' | 'low'
  cacheTime: number
  condition?: () => boolean
  dependencies?: string[]
}

interface PreloadTask {
  key: string
  apiEndpoint: string
  priority: 'high' | 'medium' | 'low'
  cacheTime: number
  condition?: () => boolean
  dependencies?: string[]
  retryCount: number
  lastAttempt: number
}

class DataPreloader {
  private preloadQueue: Map<string, PreloadTask> = new Map()
  private preloadedData: Map<string, { data: any; timestamp: number; expires: number }> = new Map()
  private isPreloading = false
  private storage = useStorage('data-cache', {}, localStorage)
  private userPatterns: Map<string, any> = new Map()

  constructor() {
    this.restoreCachedData()
    this.trackUserBehavior()
  }

  /**
   * 恢复缓存数据
   */
  private restoreCachedData() {
    const cached = this.storage.get()
    Object.entries(cached).forEach(([key, entry]: [string, any]) => {
      if (entry.expires > Date.now()) {
        this.preloadedData.set(key, {
          data: entry.data,
          timestamp: entry.timestamp,
          expires: entry.expires
        })
      }
    })
  }

  /**
   * 追踪用户行为模式
   */
  private trackUserBehavior() {
    // 追踪页面访问模式
    if (typeof window !== 'undefined') {
      const visitedPages = this.getUserPattern('visitedPages', [])
      
      // 记录当前页面访问
      const currentPath = window.location.pathname
      if (!visitedPages.includes(currentPath)) {
        visitedPages.push(currentPath)
        this.setUserPattern('visitedPages', visitedPages.slice(-10)) // 只保留最近10个页面
      }

      // 追踪时间模式
      const hour = new Date().getHours()
      const timePattern = this.getUserPattern('timePattern', {})
      timePattern[hour] = (timePattern[hour] || 0) + 1
      this.setUserPattern('timePattern', timePattern)
    }
  }

  /**
   * 获取用户行为模式
   */
  private getUserPattern(key: string, defaultValue: any) {
    return this.userPatterns.get(key) || defaultValue
  }

  /**
   * 设置用户行为模式
   */
  private setUserPattern(key: string, value: any) {
    this.userPatterns.set(key, value)
  }

  /**
   * 添加预加载配置
   */
  public addPreloadConfig(config: PreloadConfig) {
    const task: PreloadTask = {
      ...config,
      retryCount: 0,
      lastAttempt: 0
    }
    this.preloadQueue.set(config.key, task)
  }

  /**
   * 智能预加载基于用户行为
   */
  public smartPreload() {
    const userStore = useUserStore()
    if (!userStore.isAuthenticated) return

    const currentHour = new Date().getHours()
    const currentPath = window.location.pathname
    const visitedPages = this.getUserPattern('visitedPages', [])
    const timePattern = this.getUserPattern('timePattern', {})

    // 基于时间模式的预加载
    this.preloadByTimePattern(currentHour, timePattern)

    // 基于页面路径的预加载
    this.preloadByPath(currentPath, visitedPages)

    // 开始预加载队列
    this.startPreloading()
  }

  /**
   * 基于时间模式的预加载
   */
  private preloadByTimePattern(hour: number, timePattern: any) {
    // 工作时间：预加载任务和项目管理
    if (hour >= 9 && hour <= 18) {
      this.addPreloadConfig({
        key: 'today-tasks',
        apiEndpoint: '/tasks/today/',
        priority: 'high',
        cacheTime: 5 * 60 * 1000 // 5分钟
      })

      this.addPreloadConfig({
        key: 'upcoming-events',
        apiEndpoint: '/time/events/upcoming/',
        priority: 'high',
        cacheTime: 15 * 60 * 1000 // 15分钟
      })
    }

    // 早上：预加载习惯打卡
    if (hour >= 6 && hour <= 10) {
      this.addPreloadConfig({
        key: 'today-habits',
        apiEndpoint: '/life/habits/today/',
        priority: 'high',
        cacheTime: 30 * 60 * 1000 // 30分钟
      })
    }

    // 晚上：预加载今日总结数据
    if (hour >= 20 || hour <= 2) {
      this.addPreloadConfig({
        key: 'today-summary',
        apiEndpoint: '/dashboard/summary/',
        priority: 'medium',
        cacheTime: 60 * 60 * 1000 // 1小时
      })
    }
  }

  /**
   * 基于页面路径的预加载
   */
  private preloadByPath(currentPath: string, visitedPages: string[]) {
    // 在仪表盘页面，预加载所有模块的统计数据
    if (currentPath === '/' || currentPath.includes('/dashboard')) {
      this.addPreloadConfig({
        key: 'dashboard-stats',
        apiEndpoint: '/dashboard/stats/',
        priority: 'high',
        cacheTime: 10 * 60 * 1000 // 10分钟
      })

      this.addPreloadConfig({
        key: 'recent-notes',
        apiEndpoint: '/knowledge/notes/recent/',
        priority: 'medium',
        cacheTime: 15 * 60 * 1000 // 15分钟
      })
    }

    // 在任务页面，预加载项目数据
    if (currentPath.includes('/tasks')) {
      this.addPreloadConfig({
        key: 'projects',
        apiEndpoint: '/tasks/projects/',
        priority: 'high',
        cacheTime: 30 * 60 * 1000 // 30分钟
      })
    }

    // 在日历页面，预加载最近的日程
    if (currentPath.includes('/calendar')) {
      this.addPreloadConfig({
        key: 'recent-events',
        apiEndpoint: '/time/events/recent/',
        priority: 'high',
        cacheTime: 5 * 60 * 1000 // 5分钟
      })
    }

    // 预加载用户最近访问页面的相关数据
    visitedPages.forEach(path => {
      if (path.includes('/knowledge')) {
        this.addPreloadConfig({
          key: 'recent-files',
          apiEndpoint: '/knowledge/files/recent/',
          priority: 'low',
          cacheTime: 30 * 60 * 1000 // 30分钟
        })
      }
    })
  }

  /**
   * 开始预加载
   */
  private async startPreloading() {
    if (this.isPreloading) return

    this.isPreloading = true
    const tasks = Array.from(this.preloadQueue.values())
    
    // 按优先级排序
    tasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    // 分批预加载
    await this.preloadInBatches(tasks)
    this.isPreloading = false
  }

  /**
   * 分批预加载
   */
  private async preloadInBatches(tasks: PreloadTask[]) {
    const highPriority = tasks.filter(t => t.priority === 'high')
    const mediumPriority = tasks.filter(t => t.priority === 'medium')
    const lowPriority = tasks.filter(t => t.priority === 'low')

    // 立即加载高优先级数据
    await Promise.allSettled(highPriority.map(task => this.preloadData(task)))

    // 延迟加载中优先级数据
    setTimeout(async () => {
      await Promise.allSettled(mediumPriority.map(task => this.preloadData(task)))
    }, 1000)

    // 空闲时加载低优先级数据
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(async () => {
        await Promise.allSettled(lowPriority.map(task => this.preloadData(task)))
      })
    } else {
      setTimeout(async () => {
        await Promise.allSettled(lowPriority.map(task => this.preloadData(task)))
      }, 3000)
    }
  }

  /**
   * 预加载单个数据
   */
  private async preloadData(task: PreloadTask): Promise<boolean> {
    // 检查是否已缓存且未过期
    const cached = this.preloadedData.get(task.key)
    if (cached && cached.expires > Date.now()) {
      return true
    }

    // 检查依赖是否满足
    if (task.dependencies) {
      const dependenciesMet = task.dependencies.every(dep => 
        this.preloadedData.has(dep)
      )
      if (!dependenciesMet) {
        return false
      }
    }

    // 检查条件
    if (task.condition && !task.condition()) {
      return false
    }

    // 限流：避免频繁重试
    const now = Date.now()
    if (now - task.lastAttempt < 5000 && task.retryCount > 2) {
      return false
    }

    try {
      task.lastAttempt = now
      const response = await http.get(task.apiEndpoint, {
        timeout: 5000,
        headers: {
          'X-Preload': 'true'
        }
      })

      // 缓存数据
      this.preloadedData.set(task.key, {
        data: response.data,
        timestamp: now,
        expires: now + task.cacheTime
      })

      // 持久化缓存
      this.saveToStorage(task.key, response.data, now + task.cacheTime)

      console.log(`✅ Preloaded data: ${task.key}`)
      return true

    } catch (error) {
      task.retryCount++
      console.warn(`❌ Failed to preload data: ${task.key}`, error)
      return false
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(key: string, data: any, expires: number) {
    const cached = this.storage.get()
    cached[key] = {
      data,
      timestamp: Date.now(),
      expires
    }
    this.storage.set(cached)
  }

  /**
   * 获取预加载的数据
   */
  public getPreloadedData(key: string): any | null {
    const cached = this.preloadedData.get(key)
    if (!cached) return null

    if (cached.expires <= Date.now()) {
      this.preloadedData.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * 设置预加载数据
   */
  public setPreloadedData(key: string, data: any, cacheTime: number = 5 * 60 * 1000) {
    const now = Date.now()
    this.preloadedData.set(key, {
      data,
      timestamp: now,
      expires: now + cacheTime
    })
    
    this.saveToStorage(key, data, now + cacheTime)
  }

  /**
   * 清除过期缓存
   */
  public clearExpiredCache() {
    const now = Date.now()
    for (const [key, cached] of this.preloadedData.entries()) {
      if (cached.expires <= now) {
        this.preloadedData.delete(key)
      }
    }
  }

  /**
   * 获取预加载状态
   */
  public getPreloadStatus() {
    return {
      cached: Array.from(this.preloadedData.keys()),
      pending: Array.from(this.preloadQueue.keys()),
      patterns: Object.fromEntries(this.userPatterns)
    }
  }

  /**
   * 预加载用户可能需要的数据
   */
  public preloadUserData() {
    const userStore = useUserStore()
    if (!userStore.isAuthenticated) return

    // 基础用户数据
    this.addPreloadConfig({
      key: 'user-profile',
      apiEndpoint: '/auth/profile/',
      priority: 'high',
      cacheTime: 30 * 60 * 1000
    })

    // 用户偏好设置
    this.addPreloadConfig({
      key: 'user-preferences',
      apiEndpoint: '/auth/preferences/',
      priority: 'medium',
      cacheTime: 60 * 60 * 1000
    })
  }

  /**
   * 手动触发预加载
   */
  public async manualPreload(key: string): Promise<boolean> {
    const task = this.preloadQueue.get(key)
    if (!task) return false

    return await this.preloadData(task)
  }

  /**
   * 清理资源
   */
  public cleanup() {
    this.preloadQueue.clear()
    this.preloadedData.clear()
    this.userPatterns.clear()
  }
}

// 创建全局实例
export const dataPreloader = new DataPreloader()

export default dataPreloader