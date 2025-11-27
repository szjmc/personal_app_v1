/**
 * 加载状态管理器
 * 提供全局加载状态、进度追踪、防抖等功能
 */

import { ref, reactive, computed } from 'vue'
import { ElLoading } from 'element-plus'

interface LoadingConfig {
  text?: string
  target?: string | HTMLElement
  background?: string
  customClass?: string
  lock?: boolean
  spinner?: boolean
  delay?: number
}

interface LoadingInstance {
  id: string
  config: LoadingConfig
  instance: any
  startTime: number
  resolve?: () => void
  reject?: (error: any) => void
}

interface ProgressInfo {
  id: string
  label: string
  value: number
  total: number
  startTime: number
}

class LoadingManager {
  private loadingInstances: Map<string, LoadingInstance> = new Map()
  private activeLoadings: Set<string> = new Set()
  private progressTrackers: Map<string, ProgressInfo> = new Map()
  private debouncedLoadings: Map<string, NodeJS.Timeout> = new Map()
  private globalLoading = ref(false)
  private globalLoadingText = ref('')
  private requestCounter = 0

  // 响应式状态
  private state = reactive({
    isLoading: false,
    loadingText: '',
    activeCount: 0,
    loadingStack: [] as string[],
    progress: {} as Record<string, ProgressInfo>
  })

  /**
   * 获取全局状态
   */
  getGlobalState() {
    return computed(() => ({
      isLoading: this.state.isLoading,
      loadingText: this.state.loadingText,
      activeCount: this.state.activeCount,
      loadingStack: [...this.state.loadingStack],
      progress: { ...this.state.progress }
    }))
  }

  /**
   * 显示加载状态
   */
  public show(config: LoadingConfig = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.generateId()
      
      const loadingConfig: LoadingConfig = {
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
        lock: true,
        spinner: true,
        delay: 0,
        ...config
      }

      // 延迟显示
      if (loadingConfig.delay && loadingConfig.delay > 0) {
        const timeout = setTimeout(() => {
          this.executeLoading(id, loadingConfig, resolve, reject)
        }, loadingConfig.delay)
        
        this.debouncedLoadings.set(id, timeout)
        return
      }

      this.executeLoading(id, loadingConfig, resolve, reject)
    })
  }

  /**
   * 执行加载
   */
  private executeLoading(
    id: string,
    config: LoadingConfig,
    resolve?: () => void,
    reject?: (error: any) => void
  ): void {
    try {
      const instance = ElLoading.service({
        text: config.text,
        target: config.target,
        background: config.background,
        customClass: config.customClass,
        lock: config.lock,
        spinner: config.spinner
      })

      const loadingInstance: LoadingInstance = {
        id,
        config,
        instance,
        startTime: Date.now(),
        resolve,
        reject
      }

      this.loadingInstances.set(id, loadingInstance)
      this.activeLoadings.add(id)
      this.updateGlobalState()

      console.log(`📀 Loading started: ${id}`)
    } catch (error) {
      console.error('Failed to show loading:', error)
      reject?.(error)
    }
  }

  /**
   * 隐藏加载状态
   */
  public hide(id?: string): void {
    if (id) {
      // 隐藏指定的加载状态
      this.hideSpecific(id)
    } else {
      // 隐藏最新的加载状态
      const instances = Array.from(this.loadingInstances.values())
      if (instances.length > 0) {
        const latest = instances[instances.length - 1]
        this.hideSpecific(latest.id)
      }
    }
  }

  /**
   * 隐藏指定的加载状态
   */
  private hideSpecific(id: string): void {
    // 检查防抖加载
    const debouncedTimeout = this.debouncedLoadings.get(id)
    if (debouncedTimeout) {
      clearTimeout(debouncedTimeout)
      this.debouncedLoadings.delete(id)
      return
    }

    const instance = this.loadingInstances.get(id)
    if (!instance) return

    try {
      instance.instance.close()
      this.loadingInstances.delete(id)
      this.activeLoadings.delete(id)
      this.updateGlobalState()

      const duration = Date.now() - instance.startTime
      console.log(`✅ Loading completed: ${id} (${duration}ms)`)

      // 执行resolve回调
      if (instance.resolve) {
        instance.resolve()
      }
    } catch (error) {
      console.error('Failed to hide loading:', error)
      if (instance.reject) {
        instance.reject(error)
      }
    }
  }

  /**
   * 隐藏所有加载状态
   */
  public hideAll(): void {
    const ids = Array.from(this.loadingInstances.keys())
    ids.forEach(id => this.hideSpecific(id))

    // 清除所有防抖加载
    this.debouncedLoadings.forEach(timeout => clearTimeout(timeout))
    this.debouncedLoadings.clear()
  }

  /**
   * 防抖加载
   */
  public debounceShow(config: LoadingConfig & { debounceId: string }): Promise<void> {
    const { debounceId, ...loadingConfig } = config

    // 清除之前的防抖
    const existingTimeout = this.debouncedLoadings.get(debounceId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // 设置新的防抖
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.executeLoading(debounceId, loadingConfig, resolve, reject)
      }, 300) // 300ms 防抖

      this.debouncedLoadings.set(debounceId, timeout)
    })
  }

  /**
   * 包装异步函数，自动显示/隐藏加载状态
   */
  public async wrapAsync<T>(
    asyncFn: () => Promise<T>,
    config: LoadingConfig = {}
  ): Promise<T> {
    const loadingId = this.generateId()
    
    try {
      await this.show({ ...config, delay: config.delay || 200 })
      const result = await asyncFn()
      this.hide(loadingId)
      return result
    } catch (error) {
      this.hide(loadingId)
      throw error
    }
  }

  /**
   * 包装多个异步函数
   */
  public async wrapMultipleAsync<T>(
    asyncFns: Array<() => Promise<T>>,
    config: LoadingConfig = {}
  ): Promise<T[]> {
    const loadingId = this.generateId()
    
    try {
      await this.show({ 
        ...config, 
        text: config.text || `处理 ${asyncFns.length} 项任务...`,
        delay: config.delay || 200
      })
      
      const results = await Promise.all(asyncFns.map(fn => fn()))
      this.hide(loadingId)
      return results
    } catch (error) {
      this.hide(loadingId)
      throw error
    }
  }

  /**
   * 开始追踪进度
   */
  public startProgress(id: string, label: string, total: number): void {
    const progress: ProgressInfo = {
      id,
      label,
      value: 0,
      total,
      startTime: Date.now()
    }

    this.progressTrackers.set(id, progress)
    this.state.progress[id] = progress

    console.log(`📊 Progress started: ${label} (0/${total})`)
  }

  /**
   * 更新进度
   */
  public updateProgress(id: string, value: number): void {
    const progress = this.progressTrackers.get(id)
    if (!progress) return

    progress.value = Math.min(value, progress.total)
    this.state.progress[id] = { ...progress }

    const percentage = Math.round((progress.value / progress.total) * 100)
    console.log(`📊 Progress: ${progress.label} (${progress.value}/${progress.total}) - ${percentage}%`)
  }

  /**
   * 完成进度追踪
   */
  public completeProgress(id: string): void {
    const progress = this.progressTrackers.get(id)
    if (!progress) return

    progress.value = progress.total
    this.state.progress[id] = { ...progress }

    const duration = Date.now() - progress.startTime
    console.log(`📊 Progress completed: ${progress.label} (${duration}ms)`)

    // 延迟清理进度
    setTimeout(() => {
      this.progressTrackers.delete(id)
      delete this.state.progress[id]
    }, 2000)
  }

  /**
   * 请求级别加载管理
   */
  public startRequest(): string {
    const requestId = `req_${++this.requestCounter}`
    this.activeLoadings.add(requestId)
    this.updateGlobalState()
    return requestId
  }

  public completeRequest(requestId: string): void {
    this.activeLoadings.delete(requestId)
    this.updateGlobalState()
  }

  /**
   * 更新全局状态
   */
  private updateGlobalState(): void {
    const activeCount = this.activeLoadings.size
    const loadingStack = Array.from(this.loadingInstances.keys())
    
    this.state.isLoading = activeCount > 0
    this.state.activeCount = activeCount
    this.state.loadingStack = loadingStack

    // 更新全局加载文本
    if (loadingStack.length > 0) {
      const latestInstance = this.loadingInstances.get(loadingStack[loadingStack.length - 1])
      this.state.loadingText = latestInstance?.config.text || '加载中...'
    } else {
      this.state.loadingText = ''
    }

    // 更新响应式引用
    this.globalLoading.value = this.state.isLoading
    this.globalLoadingText.value = this.state.loadingText
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取加载统计
   */
  public getStats(): any {
    const currentLoadings = Array.from(this.loadingInstances.values())
    const currentProgress = Array.from(this.progressTrackers.values())

    return {
      activeLoadings: this.activeLoadings.size,
      loadingInstances: currentLoadings.length,
      progressTrackers: currentProgress.length,
      globalLoading: this.state.isLoading,
      loadingStack: [...this.state.loadingStack],
      activeRequests: this.activeLoadings.size,
      stats: {
        totalRequests: this.requestCounter,
        averageLoadTime: this.calculateAverageLoadTime(currentLoadings)
      }
    }
  }

  /**
   * 计算平均加载时间
   */
  private calculateAverageLoadTime(instances: LoadingInstance[]): number {
    if (instances.length === 0) return 0

    const total = instances.reduce((sum, instance) => {
      return sum + (Date.now() - instance.startTime)
    }, 0)

    return Math.round(total / instances.length)
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.hideAll()
    this.progressTrackers.clear()
    this.debouncedLoadings.clear()
    this.updateGlobalState()
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.cleanup()
    this.requestCounter = 0
  }

  /**
   * 检查是否有活跃的加载状态
   */
  public hasActiveLoading(): boolean {
    return this.activeLoadings.size > 0
  }

  /**
   * 获取加载状态实例
   */
  public getLoadingInstance(id: string): LoadingInstance | undefined {
    return this.loadingInstances.get(id)
  }
}

// 创建全局实例
export const loadingManager = new LoadingManager()

// 便捷方法
export const showLoading = (config?: LoadingConfig) => loadingManager.show(config)
export const hideLoading = (id?: string) => loadingManager.hide(id)
export const hideAllLoading = () => loadingManager.hideAll()

// 组合式函数
export function useLoading() {
  const globalState = loadingManager.getGlobalState()

  const show = (config?: LoadingConfig) => loadingManager.show(config)
  const hide = (id?: string) => loadingManager.hide(id)
  const wrapAsync = <T>(fn: () => Promise<T>, config?: LoadingConfig) => 
    loadingManager.wrapAsync(fn, config)

  return {
    ...globalState,
    show,
    hide,
    hideAll: hideAllLoading,
    wrapAsync,
    startProgress: loadingManager.startProgress.bind(loadingManager),
    updateProgress: loadingManager.updateProgress.bind(loadingManager),
    completeProgress: loadingManager.completeProgress.bind(loadingManager),
    getStats: loadingManager.getStats.bind(loadingManager)
  }
}

export default loadingManager