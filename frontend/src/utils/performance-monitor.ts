/**
 * 性能监控服务
 * 监控页面加载、API请求、用户交互等性能指标
 */

interface PerformanceMetrics {
  // 页面加载性能
  pageLoad: {
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    firstInputDelay: number
    cumulativeLayoutShift: number
  }
  
  // API 性能
  api: {
    totalRequests: number
    averageResponseTime: number
    successRate: number
    errorRate: number
    cacheHitRate: number
  }
  
  // 用户交互性能
  interaction: {
    totalInteractions: number
    averageResponseTime: number
    slowInteractions: number
  }
  
  // 资源加载性能
  resources: {
    totalResources: number
    totalSize: number
    cachedResources: number
    slowResources: string[]
  }
  
  // 内存使用
  memory: {
    used: number
    total: number
    limit: number
  }
}

interface PerformanceEntry {
  type: 'api' | 'navigation' | 'resource' | 'interaction' | 'custom'
  name: string
  startTime: number
  duration: number
  success?: boolean
  size?: number
  cached?: boolean
  metadata?: any
}

class PerformanceMonitor {
  private entries: PerformanceEntry[] = []
  private observers: Map<string, PerformanceObserver> = new Map()
  private metrics: PerformanceMetrics
  private startTime: number
  private isRecording = false
  private thresholds = {
    apiSlow: 2000, // 2秒
    interactionSlow: 100, // 100ms
    resourceSlow: 3000, // 3秒
    lcpSlow: 2500, // 2.5秒
    fidSlow: 100, // 100ms
    clsPoor: 0.25
  }

  constructor() {
    this.metrics = this.initializeMetrics()
    this.startTime = Date.now()
    this.setupPerformanceObservers()
    this.startRecording()
  }

  /**
   * 初始化性能指标
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      pageLoad: {
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0
      },
      api: {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 100,
        errorRate: 0,
        cacheHitRate: 0
      },
      interaction: {
        totalInteractions: 0,
        averageResponseTime: 0,
        slowInteractions: 0
      },
      resources: {
        totalResources: 0,
        totalSize: 0,
        cachedResources: 0,
        slowResources: []
      },
      memory: {
        used: 0,
        total: 0,
        limit: 0
      }
    }
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    // 观察导航性能
    if ('PerformanceObserver' in window) {
      this.setupNavigationObserver()
      this.setupResourceObserver()
      this.setupPaintObserver()
      this.setupLCPObserver()
      this.setupFIDObserver()
      this.setupCLSObserver()
      this.setupLongTaskObserver()
    }
  }

  private setupNavigationObserver(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          this.metrics.pageLoad.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.navigationStart
          this.metrics.pageLoad.loadComplete = navEntry.loadEventEnd - navEntry.navigationStart
        }
      })
    })
    observer.observe({ entryTypes: ['navigation'] })
    this.observers.set('navigation', observer)
  }

  private setupResourceObserver(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming
          const size = this.estimateResourceSize(resource)
          const duration = resource.responseEnd - resource.requestStart
          const cached = this.isResourceCached(resource)

          this.metrics.resources.totalResources++
          this.metrics.resources.totalSize += size

          if (cached) {
            this.metrics.resources.cachedResources++
          }

          if (duration > this.thresholds.resourceSlow) {
            this.metrics.resources.slowResources.push(resource.name)
          }

          this.addEntry({
            type: 'resource',
            name: resource.name,
            startTime: resource.startTime,
            duration,
            size,
            cached
          })
        }
      })
    })
    observer.observe({ entryTypes: ['resource'] })
    this.observers.set('resource', observer)
  }

  private setupPaintObserver(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'paint') {
          const paintEntry = entry as PerformancePaintTiming
          if (paintEntry.name === 'first-paint') {
            this.metrics.pageLoad.firstPaint = paintEntry.startTime
          } else if (paintEntry.name === 'first-contentful-paint') {
            this.metrics.pageLoad.firstContentfulPaint = paintEntry.startTime
          }
        }
      })
    })
    observer.observe({ entryTypes: ['paint'] })
    this.observers.set('paint', observer)
  }

  private setupLCPObserver(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.metrics.pageLoad.largestContentfulPaint = lastEntry.startTime
    })
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
    this.observers.set('lcp', observer)
  }

  private setupFIDObserver(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming
          this.metrics.pageLoad.firstInputDelay = fidEntry.processingStart - fidEntry.startTime
        }
      })
    })
    observer.observe({ entryTypes: ['first-input'] })
    this.observers.set('fid', observer)
  }

  private setupCLSObserver(): void {
    let clsValue = 0
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      })
      this.metrics.pageLoad.cumulativeLayoutShift = clsValue
    })
    observer.observe({ entryTypes: ['layout-shift'] })
    this.observers.set('cls', observer)
  }

  private setupLongTaskObserver(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.entryType === 'longtask') {
          console.warn(`⚠️ Long task detected: ${entry.duration}ms`)
        }
      })
    })
    observer.observe({ entryTypes: ['longtask'] })
    this.observers.set('longtask', observer)
  }

  /**
   * 估算资源大小
   */
  private estimateResourceSize(resource: PerformanceResourceTiming): number {
    if (resource.transferSize) {
      return resource.transferSize
    }
    return 0 // 无法确定大小
  }

  /**
   * 检查资源是否缓存
   */
  private isResourceCached(resource: PerformanceResourceTiming): boolean {
    return resource.transferSize === 0 && resource.decodedBodySize > 0
  }

  /**
   * 记录API请求性能
   */
  public recordApiRequest(
    url: string,
    method: string,
    startTime: number,
    endTime: number,
    success: boolean,
    size: number = 0,
    cached: boolean = false
  ): void {
    const duration = endTime - startTime

    this.metrics.api.totalRequests++
    this.updateAverageResponseTime(duration)

    if (success) {
      this.metrics.api.successRate = 
        ((this.metrics.api.successRate * (this.metrics.api.totalRequests - 1)) + 100) / 
        this.metrics.api.totalRequests
    } else {
      this.metrics.api.errorRate = 
        ((this.metrics.api.errorRate * (this.metrics.api.totalRequests - 1)) + 100) / 
        this.metrics.api.totalRequests
    }

    if (cached) {
      this.metrics.api.cacheHitRate = 
        ((this.metrics.api.cacheHitRate * (this.metrics.api.totalRequests - 1)) + 100) / 
        this.metrics.api.totalRequests
    }

    if (duration > this.thresholds.apiSlow) {
      console.warn(`🐌 Slow API request: ${method} ${url} (${duration}ms)`)
    }

    this.addEntry({
      type: 'api',
      name: `${method} ${url}`,
      startTime,
      duration,
      success,
      size,
      cached,
      metadata: { method, url }
    })
  }

  /**
   * 更新平均响应时间
   */
  private updateAverageResponseTime(newDuration: number): void {
    const total = this.metrics.api.totalRequests
    const current = this.metrics.api.averageResponseTime
    this.metrics.api.averageResponseTime = ((current * (total - 1)) + newDuration) / total
  }

  /**
   * 记录用户交互性能
   */
  public recordInteraction(
    type: string,
    startTime: number,
    endTime: number
  ): void {
    const duration = endTime - startTime

    this.metrics.interaction.totalInteractions++
    this.updateAverageInteractionTime(duration)

    if (duration > this.thresholds.interactionSlow) {
      this.metrics.interaction.slowInteractions++
      console.warn(`🐌 Slow interaction: ${type} (${duration}ms)`)
    }

    this.addEntry({
      type: 'interaction',
      name: type,
      startTime,
      duration,
      metadata: { interactionType: type }
    })
  }

  /**
   * 更新平均交互时间
   */
  private updateAverageInteractionTime(newDuration: number): void {
    const total = this.metrics.interaction.totalInteractions
    const current = this.metrics.interaction.averageResponseTime
    this.metrics.interaction.averageResponseTime = ((current * (total - 1)) + newDuration) / total
  }

  /**
   * 记录自定义性能事件
   */
  public recordCustomEvent(
    name: string,
    startTime: number,
    endTime: number,
    metadata?: any
  ): void {
    this.addEntry({
      type: 'custom',
      name,
      startTime,
      duration: endTime - startTime,
      metadata
    })
  }

  /**
   * 添加性能条目
   */
  private addEntry(entry: PerformanceEntry): void {
    this.entries.push(entry)
    
    // 限制条目数量，避免内存泄漏
    if (this.entries.length > 1000) {
      this.entries = this.entries.slice(-500)
    }
  }

  /**
   * 更新内存使用情况
   */
  public updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }
    }
  }

  /**
   * 开始记录
   */
  public startRecording(): void {
    this.isRecording = true
    this.startTime = Date.now()
  }

  /**
   * 停止记录
   */
  public stopRecording(): void {
    this.isRecording = false
  }

  /**
   * 获取性能指标
   */
  public getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage()
    return { ...this.metrics }
  }

  /**
   * 获取性能评分
   */
  public getPerformanceScore(): {
    overall: number
    pageLoad: number
    api: number
    interaction: number
    resources: number
  } {
    const scores = {
      pageLoad: this.calculatePageLoadScore(),
      api: this.calculateApiScore(),
      interaction: this.calculateInteractionScore(),
      resources: this.calculateResourceScore()
    }

    const overall = (scores.pageLoad + scores.api + scores.interaction + scores.resources) / 4

    return {
      overall: Math.round(overall),
      pageLoad: Math.round(scores.pageLoad),
      api: Math.round(scores.api),
      interaction: Math.round(scores.interaction),
      resources: Math.round(scores.resources)
    }
  }

  /**
   * 计算页面加载评分
   */
  private calculatePageLoadScore(): number {
    let score = 100

    if (this.metrics.pageLoad.largestContentfulPaint > this.thresholds.lcpSlow) {
      score -= 30
    }
    if (this.metrics.pageLoad.firstInputDelay > this.thresholds.fidSlow) {
      score -= 20
    }
    if (this.metrics.pageLoad.cumulativeLayoutShift > this.thresholds.clsPoor) {
      score -= 25
    }
    if (this.metrics.pageLoad.firstContentfulPaint > 1800) {
      score -= 25
    }

    return Math.max(0, score)
  }

  /**
   * 计算API评分
   */
  private calculateApiScore(): number {
    let score = 100

    if (this.metrics.api.averageResponseTime > 1000) {
      score -= 30
    }
    if (this.metrics.api.successRate < 95) {
      score -= 40
    }
    if (this.metrics.api.cacheHitRate < 50) {
      score -= 30
    }

    return Math.max(0, score)
  }

  /**
   * 计算交互评分
   */
  private calculateInteractionScore(): number {
    if (this.metrics.interaction.totalInteractions === 0) return 100

    const slowInteractionRate = this.metrics.interaction.slowInteractions / this.metrics.interaction.totalInteractions
    let score = 100

    if (this.metrics.interaction.averageResponseTime > 50) {
      score -= 30
    }
    if (slowInteractionRate > 0.1) {
      score -= 40
    }

    return Math.max(0, score)
  }

  /**
   * 计算资源评分
   */
  private calculateResourceScore(): number {
    let score = 100

    if (this.metrics.resources.slowResources.length > 0) {
      score -= this.metrics.resources.slowResources.length * 10
    }

    const cacheRate = this.metrics.resources.cachedResources / this.metrics.resources.totalResources
    if (cacheRate < 0.5) {
      score -= 30
    }

    return Math.max(0, score)
  }

  /**
   * 生成性能报告
   */
  public generateReport(): {
    timestamp: number
    duration: number
    metrics: PerformanceMetrics
    scores: ReturnType<typeof this.getPerformanceScore>
    recommendations: string[]
  } {
    const now = Date.now()
    const duration = now - this.startTime
    const metrics = this.getMetrics()
    const scores = this.getPerformanceScore()
    const recommendations = this.generateRecommendations(metrics, scores)

    return {
      timestamp: now,
      duration,
      metrics,
      scores,
      recommendations
    }
  }

  /**
   * 生成性能建议
   */
  private generateRecommendations(metrics: PerformanceMetrics, scores: any): string[] {
    const recommendations: string[] = []

    // 页面加载建议
    if (scores.pageLoad < 70) {
      if (metrics.pageLoad.largestContentfulPaint > this.thresholds.lcpSlow) {
        recommendations.push('优化最大内容绘制时间：压缩图片、使用CDN、懒加载')
      }
      if (metrics.pageLoad.firstInputDelay > this.thresholds.fidSlow) {
        recommendations.push('减少主线程工作：拆分JavaScript任务、使用Web Workers')
      }
      if (metrics.pageLoad.cumulativeLayoutShift > this.thresholds.clsPoor) {
        recommendations.push('减少累积布局偏移：为图片和广告设置尺寸、避免动态插入内容')
      }
    }

    // API建议
    if (scores.api < 70) {
      if (metrics.api.averageResponseTime > 1000) {
        recommendations.push('优化API响应时间：使用缓存、减少数据传输、优化数据库查询')
      }
      if (metrics.api.successRate < 95) {
        recommendations.push('提高API成功率：改进错误处理、增加重试机制')
      }
      if (metrics.api.cacheHitRate < 50) {
        recommendations.push('增加缓存命中率：实现智能缓存策略、使用Service Worker')
      }
    }

    // 交互建议
    if (scores.interaction < 70) {
      recommendations.push('优化用户交互响应：使用事件委托、减少DOM操作、使用CSS动画')
    }

    // 资源建议
    if (scores.resources < 70) {
      recommendations.push('优化资源加载：压缩文件、使用CDN、启用Gzip压缩')
      if (metrics.resources.slowResources.length > 0) {
        recommendations.push(`以下资源加载过慢：${metrics.resources.slowResources.slice(0, 3).join(', ')}`)
      }
    }

    return recommendations
  }

  /**
   * 导出性能数据
   */
  public exportData(): {
    entries: PerformanceEntry[]
    metrics: PerformanceMetrics
    scores: ReturnType<typeof this.getPerformanceScore>
    report: ReturnType<typeof this.generateReport>
  } {
    return {
      entries: [...this.entries],
      metrics: this.getMetrics(),
      scores: this.getPerformanceScore(),
      report: this.generateReport()
    }
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.stopRecording()
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.entries.length = 0
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor()

// 组合式函数
export function usePerformanceMonitor() {
  const recordApi = (
    url: string, 
    method: string, 
    startTime: number, 
    endTime: number, 
    success: boolean
  ) => {
    performanceMonitor.recordApiRequest(url, method, startTime, endTime, success)
  }

  const recordInteraction = (type: string, startTime: number, endTime: number) => {
    performanceMonitor.recordInteraction(type, startTime, endTime)
  }

  const recordCustom = (name: string, startTime: number, endTime: number, metadata?: any) => {
    performanceMonitor.recordCustomEvent(name, startTime, endTime, metadata)
  }

  return {
    metrics: performanceMonitor.getMetrics(),
    scores: performanceMonitor.getPerformanceScore(),
    report: performanceMonitor.generateReport(),
    recordApi,
    recordInteraction,
    recordCustom,
    exportData: performanceMonitor.exportData.bind(performanceMonitor)
  }
}

export default performanceMonitor