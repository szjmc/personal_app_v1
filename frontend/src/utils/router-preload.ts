/**
 * 路由预加载管理器
 * 智能预加载可能访问的页面组件，提升用户体验
 */

interface RoutePreloadConfig {
  priority: 'high' | 'medium' | 'low'
  timeout?: number
}

interface PreloadTask {
  routeName: string
  component: () => Promise<any>
  priority: 'high' | 'medium' | 'low'
  timeout: number
}

class RouterPreloader {
  private preloadQueue: Map<string, PreloadTask> = new Map()
  private preloadedComponents: Set<string> = new Set()
  private isPreloading = false
  private intersectionObserver?: IntersectionObserver
  private networkInfo: {
    isSlow: boolean
    isDataSaver: boolean
  }

  constructor() {
    this.networkInfo = this.getNetworkInfo()
    this.setupIntersectionObserver()
    this.setupVisibilityChangeListener()
  }

  /**
   * 获取网络信息
   */
  private getNetworkInfo() {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (!connection) {
      return { isSlow: false, isDataSaver: false }
    }

    const isSlow = connection.effectiveType === 'slow-2g' || 
                   connection.effectiveType === '2g'
    const isDataSaver = connection.saveData === true

    return { isSlow, isDataSaver }
  }

  /**
   * 设置 Intersection Observer 用于预加载
   */
  private setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const routeName = entry.target.getAttribute('data-route-name')
          if (routeName) {
            this.preloadRoute(routeName)
          }
        }
      })
    }, {
      rootMargin: '50px' // 提前 50px 开始预加载
    })
  }

  /**
   * 设置页面可见性变化监听
   */
  private setupVisibilityChangeListener() {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // 页面变为可见时，预加载高优先级页面
        this.preloadHighPriorityRoutes()
      }
    })
  }

  /**
   * 添加预加载任务
   */
  public addPreloadTask(routeName: string, component: () => Promise<any>, config: RoutePreloadConfig) {
    // 检查是否已经预加载
    if (this.preloadedComponents.has(routeName)) {
      return
    }

    // 网络状况不佳时，只预加载高优先级内容
    if (this.networkInfo.isSlow || this.networkInfo.isDataSaver) {
      if (config.priority !== 'high') {
        return
      }
    }

    const task: PreloadTask = {
      routeName,
      component,
      priority: config.priority,
      timeout: config.timeout || 5000
    }

    this.preloadQueue.set(routeName, task)
  }

  /**
   * 预加载指定路由
   */
  public async preloadRoute(routeName: string): Promise<boolean> {
    const task = this.preloadQueue.get(routeName)
    if (!task) {
      return false
    }

    if (this.preloadedComponents.has(routeName)) {
      return true
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Preload timeout')), task.timeout)
      })

      await Promise.race([task.component(), timeoutPromise])
      this.preloadedComponents.add(routeName)
      this.preloadQueue.delete(routeName)
      
      console.log(`✅ Preloaded route: ${routeName}`)
      return true
    } catch (error) {
      console.warn(`❌ Failed to preload route: ${routeName}`, error)
      this.preloadQueue.delete(routeName)
      return false
    }
  }

  /**
   * 预加载高优先级路由
   */
  public async preloadHighPriorityRoutes() {
    const highPriorityTasks = Array.from(this.preloadQueue.values())
      .filter(task => task.priority === 'high')

    await Promise.allSettled(
      highPriorityTasks.map(task => this.preloadRoute(task.routeName))
    )
  }

  /**
   * 开始预加载队列
   */
  public startPreloading() {
    if (this.isPreloading) return

    this.isPreloading = true

    // 立即预加载高优先级组件
    this.preloadHighPriorityRoutes()

    // 延迟预加载中优先级组件
    setTimeout(() => {
      this.preloadMediumPriorityRoutes()
    }, 2000)

    // 空闲时预加载低优先级组件
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.preloadLowPriorityRoutes()
      })
    } else {
      setTimeout(() => {
        this.preloadLowPriorityRoutes()
      }, 5000)
    }
  }

  /**
   * 预加载中优先级路由
   */
  private async preloadMediumPriorityRoutes() {
    const mediumPriorityTasks = Array.from(this.preloadQueue.values())
      .filter(task => task.priority === 'medium')

    await Promise.allSettled(
      mediumPriorityTasks.map(task => this.preloadRoute(task.routeName))
    )
  }

  /**
   * 预加载低优先级路由
   */
  private async preloadLowPriorityRoutes() {
    const lowPriorityTasks = Array.from(this.preloadQueue.values())
      .filter(task => task.priority === 'low')

    await Promise.allSettled(
      lowPriorityTasks.map(task => this.preloadRoute(task.routeName))
    )
  }

  /**
   * 监听导航链接进行预加载
   */
  public observeLink(element: HTMLElement, routeName: string) {
    if (!this.intersectionObserver) return

    element.setAttribute('data-route-name', routeName)
    this.intersectionObserver.observe(element)
  }

  /**
   * 取消观察链接
   */
  public unobserveLink(element: HTMLElement) {
    if (!this.intersectionObserver) return

    this.intersectionObserver.unobserve(element)
  }

  /**
   * 获取预加载状态
   */
  public getPreloadStatus() {
    return {
      preloaded: Array.from(this.preloadedComponents),
      pending: Array.from(this.preloadQueue.keys()),
      networkInfo: this.networkInfo
    }
  }

  /**
   * 清理资源
   */
  public cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    this.preloadQueue.clear()
    this.preloadedComponents.clear()
  }
}

// 创建全局实例
export const routerPreloader = new RouterPreloader()

// Vue 插件
export const RouterPreloaderPlugin = {
  install(app: any) {
    app.config.globalProperties.$routerPreloader = routerPreloader
  }
}

// 自定义指令用于预加载
export const vPreload = {
  mounted(el: HTMLElement, binding: any) {
    const routeName = binding.value
    if (routeName) {
      routerPreloader.observeLink(el, routeName)
    }
  },
  unmounted(el: HTMLElement) {
    routerPreloader.unobserveLink(el)
  }
}

export default routerPreloader