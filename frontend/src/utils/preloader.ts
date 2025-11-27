import { ref, reactive } from 'vue'
import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

// 预加载任务类型
export interface PreloadTask {
  id: string
  name: string
  priority: number // 优先级，数字越大优先级越高
  executor: () => Promise<any>
  dependencies?: string[] // 依赖的任务ID
  timeout?: number // 超时时间（毫秒）
  retry?: number // 重试次数
  cacheKey?: string // 缓存键
  cacheTime?: number // 缓存时间（毫秒）
  immediate?: boolean // 是否立即执行
  condition?: () => boolean // 执行条件
}

// 预加载状态
export interface PreloadStatus {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  progress: number
  startTime?: number
  endTime?: number
  duration?: number
  error?: string
  retryCount: number
}

// 预加载配置
interface PreloaderConfig {
  maxConcurrent: number // 最大并发数
  retryAttempts: number // 默认重试次数
  timeout: number // 默认超时时间
  cacheSize: number // 缓存大小
  enablePriority: boolean // 是否启用优先级调度
  showLoading: boolean // 是否显示加载提示
}

export class DataPreloader {
  private static instance: DataPreloader
  private tasks: Map<string, PreloadTask> = new Map()
  private status: Map<string, PreloadStatus> = new Map()
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private running: Set<string> = new Set()
  private config: PreloaderConfig
  private loadingInstance: LoadingInstance | null = null
  
  private constructor() {
    this.config = {
      maxConcurrent: 3,
      retryAttempts: 2,
      timeout: 10000,
      cacheSize: 100,
      enablePriority: true,
      showLoading: true
    }
  }
  
  static getInstance(): DataPreloader {
    if (!DataPreloader.instance) {
      DataPreloader.instance = new DataPreloader()
    }
    return DataPreloader.instance
  }
  
  // 添加预加载任务
  addTask(task: PreloadTask): void {
    this.tasks.set(task.id, task)
    this.status.set(task.id, {
      id: task.id,
      name: task.name,
      status: 'pending',
      progress: 0,
      retryCount: 0
    })
  }
  
  // 批量添加任务
  addTasks(tasks: PreloadTask[]): void {
    tasks.forEach(task => this.addTask(task))
  }
  
  // 移除任务
  removeTask(taskId: string): void {
    this.tasks.delete(taskId)
    this.status.delete(taskId)
    this.running.delete(taskId)
  }
  
  // 获取任务状态
  getTaskStatus(taskId: string): PreloadStatus | undefined {
    return this.status.get(taskId)
  }
  
  // 获取所有状态
  getAllStatus(): PreloadStatus[] {
    return Array.from(this.status.values())
  }
  
  // 清除缓存
  clearCache(taskId?: string): void {
    if (taskId) {
      const task = this.tasks.get(taskId)
      if (task?.cacheKey) {
        this.cache.delete(task.cacheKey)
      }
    } else {
      this.cache.clear()
    }
  }
  
  // 检查缓存
  private checkCache(task: PreloadTask): any | null {
    if (!task.cacheKey) return null
    
    const cached = this.cache.get(task.cacheKey)
    if (!cached) return null
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(task.cacheKey)
      return null
    }
    
    return cached.data
  }
  
  // 设置缓存
  private setCache(task: PreloadTask, data: any): void {
    if (!task.cacheKey) return
    
    // 清理过期缓存
    this.cleanExpiredCache()
    
    // 限制缓存大小
    if (this.cache.size >= this.config.cacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(task.cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: task.cacheTime || 300000 // 默认5分钟
    })
  }
  
  // 清理过期缓存
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key)
      }
    }
  }
  
  // 检查依赖
  private checkDependencies(task: PreloadTask): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true
    }
    
    return task.dependencies.every(depId => {
      const depStatus = this.status.get(depId)
      return depStatus?.status === 'completed'
    })
  }
  
  // 获取可执行的任务
  private getRunnableTasks(): PreloadTask[] {
    const runnableTasks: PreloadTask[] = []
    
    for (const [id, task] of this.tasks.entries()) {
      // 跳过已完成的任务
      if (this.status.get(id)?.status === 'completed') {
        continue
      }
      
      // 检查是否在运行中
      if (this.running.has(id)) {
        continue
      }
      
      // 检查执行条件
      if (task.condition && !task.condition()) {
        continue
      }
      
      // 检查依赖
      if (!this.checkDependencies(task)) {
        continue
      }
      
      // 检查缓存
      if (this.checkCache(task)) {
        // 缓存命中，标记为完成
        const status = this.status.get(id)
        if (status) {
          status.status = 'completed'
          status.progress = 100
          status.endTime = Date.now()
          status.duration = 0
        }
        continue
      }
      
      runnableTasks.push(task)
    }
    
    // 按优先级排序
    if (this.config.enablePriority) {
      runnableTasks.sort((a, b) => b.priority - a.priority)
    }
    
    return runnableTasks
  }
  
  // 执行任务
  private async executeTask(task: PreloadTask): Promise<void> {
    const taskId = task.id
    const status = this.status.get(taskId)
    
    if (!status || this.running.has(taskId)) {
      return
    }
    
    this.running.add(taskId)
    status.status = 'running'
    status.startTime = Date.now()
    status.progress = 0
    
    try {
      // 设置超时
      const timeout = task.timeout || this.config.timeout
      const executor = task.executor()
      
      // 创建超时Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      })
      
      // 执行任务
      const result = await Promise.race([executor, timeoutPromise])
      
      // 缓存结果
      this.setCache(task, result)
      
      // 更新状态
      status.status = 'completed'
      status.progress = 100
      status.endTime = Date.now()
      status.duration = status.endTime - status.startTime
      
    } catch (error: any) {
      status.status = 'failed'
      status.endTime = Date.now()
      status.duration = status.endTime - status.startTime
      status.error = error.message
      status.retryCount += 1
      
      // 检查是否需要重试
      const maxRetries = task.retry !== undefined ? task.retry : this.config.retryAttempts
      if (status.retryCount <= maxRetries) {
        status.status = 'pending'
        console.warn(`Task ${taskId} failed, retrying (${status.retryCount}/${maxRetries}): ${error.message}`)
      } else {
        console.error(`Task ${taskId} failed after ${maxRetries} retries: ${error.message}`)
      }
      
    } finally {
      this.running.delete(taskId)
    }
  }
  
  // 预加载调度器
  private async schedule(): Promise<void> {
    while (true) {
      // 获取可执行的任务
      const runnableTasks = this.getRunnableTasks()
      
      if (runnableTasks.length === 0) {
        // 没有可执行的任务，检查是否全部完成
        const allCompleted = Array.from(this.status.values()).every(
          status => status.status === 'completed' || status.status === 'failed'
        )
        
        if (allCompleted) {
          this.hideLoading()
          break
        }
        
        // 等待一段时间再检查
        await new Promise(resolve => setTimeout(resolve, 100))
        continue
      }
      
      // 限制并发数
      const tasksToRun = runnableTasks.slice(0, this.config.maxConcurrent - this.running.size)
      
      // 并发执行任务
      const promises = tasksToRun.map(task => this.executeTask(task))
      await Promise.allSettled(promises)
      
      // 等待一段时间再检查
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
  
  // 显示加载提示
  private showLoading(): void {
    if (!this.config.showLoading || this.loadingInstance) {
      return
    }
    
    this.loadingInstance = ElLoading.service({
      lock: true,
      text: '正在预加载数据...',
      background: 'rgba(0, 0, 0, 0.7)',
      customClass: 'preloader-loading'
    })
  }
  
  // 隐藏加载提示
  private hideLoading(): void {
    if (this.loadingInstance) {
      this.loadingInstance.close()
      this.loadingInstance = null
    }
  }
  
  // 开始预加载
  async start(showLoading: boolean = this.config.showLoading): Promise<void> {
    if (showLoading) {
      this.showLoading()
    }
    
    // 标记立即执行的任务
    for (const [id, task] of this.tasks.entries()) {
      if (task.immediate) {
        const status = this.status.get(id)
        if (status?.status === 'pending') {
          this.executeTask(task)
        }
      }
    }
    
    // 启动调度器
    await this.schedule()
  }
  
  // 等待特定任务完成
  waitForTask(taskId: string, timeout: number = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      const status = this.status.get(taskId)
      if (!status) {
        reject(new Error(`Task ${taskId} not found`))
        return
      }
      
      if (status.status === 'completed') {
        const task = this.tasks.get(taskId)
        if (task?.cacheKey) {
          resolve(this.checkCache(task))
        }
        resolve(null)
        return
      }
      
      if (status.status === 'failed') {
        reject(new Error(status.error || 'Task failed'))
        return
      }
      
      // 轮询等待
      const startTime = Date.now()
      const checkInterval = setInterval(() => {
        const currentStatus = this.status.get(taskId)
        
        if (!currentStatus) {
          clearInterval(checkInterval)
          reject(new Error(`Task ${taskId} not found`))
          return
        }
        
        if (currentStatus.status === 'completed') {
          clearInterval(checkInterval)
          const task = this.tasks.get(taskId)
          if (task?.cacheKey) {
            resolve(this.checkCache(task))
          }
          resolve(null)
          return
        }
        
        if (currentStatus.status === 'failed') {
          clearInterval(checkInterval)
          reject(new Error(currentStatus.error || 'Task failed'))
          return
        }
        
        // 检查超时
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval)
          reject(new Error('Wait timeout'))
        }
      }, 100)
    })
  }
  
  // 重置状态
  reset(): void {
    this.running.clear()
    this.status.forEach(status => {
      status.status = 'pending'
      status.progress = 0
      status.retryCount = 0
      status.error = undefined
    })
  }
  
  // 获取配置
  getConfig(): PreloaderConfig {
    return { ...this.config }
  }
  
  // 更新配置
  updateConfig(config: Partial<PreloaderConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// 预加载任务工厂函数
export const createPreloadTask = (
  id: string,
  name: string,
  executor: () => Promise<any>,
  options: Partial<PreloadTask> = {}
): PreloadTask => ({
  id,
  name,
  executor,
  priority: 0,
  ...options
})

// 创建预加载实例
export const preloader = DataPreloader.getInstance()

// Vue组合式函数
export const usePreloader = () => {
  const preloaderStatus = reactive<{
    tasks: PreloadStatus[]
    isRunning: boolean
    progress: number
  }>({
    tasks: [],
    isRunning: false,
    progress: 0
  })
  
  // 更新状态
  const updateStatus = () => {
    preloaderStatus.tasks = preloader.getAllStatus()
    const total = preloaderStatus.tasks.length
    const completed = preloaderStatus.tasks.filter(t => t.status === 'completed').length
    const failed = preloaderStatus.tasks.filter(t => t.status === 'failed').length
    
    preloaderStatus.progress = total > 0 ? (completed / total) * 100 : 0
    preloaderStatus.isRunning = preloaderStatus.tasks.some(t => 
      t.status === 'running' || t.status === 'pending'
    )
  }
  
  // 添加任务
  const addTask = (task: PreloadTask) => {
    preloader.addTask(task)
    updateStatus()
  }
  
  // 开始预加载
  const start = async (showLoading?: boolean) => {
    preloaderStatus.isRunning = true
    updateStatus()
    
    try {
      await preloader.start(showLoading)
    } finally {
      preloaderStatus.isRunning = false
      updateStatus()
    }
  }
  
  // 等待任务
  const waitForTask = (taskId: string, timeout?: number) => {
    return preloader.waitForTask(taskId, timeout)
  }
  
  // 重置
  const reset = () => {
    preloader.reset()
    updateStatus()
  }
  
  return {
    status: preloaderStatus,
    addTask,
    start,
    waitForTask,
    reset,
    updateStatus
  }
}