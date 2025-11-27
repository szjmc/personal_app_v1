/**
 * 异步组件管理器
 * 提供组件懒加载、错误边界、加载状态等功能
 */

import { defineAsyncComponent, type Component } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'

interface AsyncComponentOptions {
  loadingComponent?: Component
  errorComponent?: Component
  delay?: number
  timeout?: number
  retryCount?: number
  retryDelay?: number
  preloaded?: boolean
}

interface LoadingContext {
  isLoading: boolean
  error: Error | null
  retry: () => void
}

class AsyncComponentManager {
  private loadingComponents: Map<string, Component> = new Map()
  private errorComponents: Map<string, Component> = new Map()
  private retryAttempts: Map<string, number> = new Map()

  /**
   * 创建默认加载组件
   */
  private createDefaultLoadingComponent(size: 'small' | 'medium' | 'large' = 'medium'): Component {
    const sizeConfig = {
      small: { width: 40, height: 40 },
      medium: { width: 60, height: 60 },
      large: { width: 80, height: 80 }
    }

    return {
      template: `
        <div class="async-component-loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 20px;">
          <div class="loading-spinner" style="width: ${sizeConfig[size].width}px; height: ${sizeConfig[size].height}px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 12px; color: rgba(255,255,255,0.6); font-size: 14px;">加载中...</p>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </div>
      `
    }
  }

  /**
   * 创建默认错误组件
   */
  private createDefaultErrorComponent(): Component {
    return {
      template: `
        <div class="async-component-error" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 20px;">
          <div style="width: 60px; height: 60px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p style="color: white; margin-bottom: 12px;">组件加载失败</p>
          <button @click="retry" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">重试</button>
        </div>
      `,
      setup(props: any, { emit }: any) {
        const retry = () => emit('retry')
        return { retry }
      }
    }
  }

  /**
   * 创建骨架屏组件
   */
  private createSkeletonComponent(type: 'card' | 'list' | 'table' = 'card'): Component {
    const skeletonTemplates = {
      card: `
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <div class="skeleton" style="width: 60%; height: 20px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 4px; margin-bottom: 12px;"></div>
          <div class="skeleton" style="width: 40%; height: 16px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 4px;"></div>
        </div>
      `,
      list: `
        <div style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div class="skeleton" style="width: 80%; height: 16px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 4px; margin-bottom: 8px;"></div>
          <div class="skeleton" style="width: 60%; height: 14px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 4px;"></div>
        </div>
      `,
      table: `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          ${Array(4).fill(0).map(() => `
            <div class="skeleton" style="height: 16px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 4px;"></div>
          `).join('')}
        </div>
      `
    }

    return {
      template: `
        <div class="skeleton-container">
          ${skeletonTemplates[type]}
          <style>
            @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          </style>
        </div>
      `
    }
  }

  /**
   * 创建异步组件
   */
  public createAsyncComponent(
    componentLoader: () => Promise<Component>,
    options: AsyncComponentOptions = {}
  ): Component {
    const {
      loadingComponent = this.createDefaultLoadingComponent(),
      errorComponent = this.createDefaultErrorComponent(),
      delay = 200,
      timeout = 10000,
      retryCount = 3,
      retryDelay = 1000
    } = options

    return defineAsyncComponent({
      loader: async () => {
        const componentName = componentLoader.toString()
        let attempts = 0

        while (attempts <= retryCount) {
          try {
            const component = await componentLoader()
            // 清理重试计数
            this.retryAttempts.delete(componentName)
            return component
          } catch (error) {
            attempts++
            this.retryAttempts.set(componentName, attempts)

            if (attempts > retryCount) {
              ElMessage.error(`组件加载失败，已重试 ${retryCount} 次`)
              throw error
            }

            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempts))
          }
        }

        throw new Error('Component loading failed after maximum retries')
      },
      loadingComponent,
      errorComponent,
      delay,
      timeout
    })
  }

  /**
   * 创建带骨架屏的异步组件
   */
  public createAsyncWithSkeleton(
    componentLoader: () => Promise<Component>,
    skeletonType: 'card' | 'list' | 'table' = 'card',
    options: Partial<AsyncComponentOptions> = {}
  ): Component {
    return this.createAsyncComponent(componentLoader, {
      ...options,
      loadingComponent: this.createSkeletonComponent(skeletonType)
    })
  }

  /**
   * 预加载组件
   */
  public async preloadComponent(
    componentLoader: () => Promise<Component>,
    componentName: string
  ): Promise<boolean> {
    try {
      await componentLoader()
      console.log(`✅ Preloaded component: ${componentName}`)
      return true
    } catch (error) {
      console.warn(`❌ Failed to preload component: ${componentName}`, error)
      return false
    }
  }

  /**
   * 批量预加载组件
   */
  public async preloadComponents(
    components: Array<{ loader: () => Promise<Component>; name: string }>
  ): Promise<Array<{ name: string; success: boolean; error?: any }>> {
    const results = await Promise.allSettled(
      components.map(async ({ loader, name }) => {
        const success = await this.preloadComponent(loader, name)
        return { name, success }
      })
    )

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { name: 'unknown', success: false, error: result.reason }
    )
  }

  /**
   * 获取组件加载状态
   */
  public getComponentLoadStatus(): Record<string, number> {
    return Object.fromEntries(this.retryAttempts)
  }

  /**
   * 清理加载状态
   */
  public clearLoadStatus(): void {
    this.retryAttempts.clear()
  }

  /**
   * 创建智能懒加载指令
   */
  public createLazyLoadDirective() {
    return {
      mounted(el: HTMLElement, binding: any) {
        const { component, options = {} } = binding.value
        
        if (!component) {
          console.warn('Lazy load directive requires component')
          return
        }

        // 使用 Intersection Observer 实现懒加载
        const observer = new IntersectionObserver(
          async (entries) => {
            const entry = entries[0]
            if (entry.isIntersecting) {
              try {
                const loadedComponent = await component()
                // 这里需要将组件动态渲染到元素中
                // 实际使用时需要配合 Vue 的动态组件功能
                console.log('Component lazy loaded:', loadedComponent)
              } catch (error) {
                console.error('Failed to lazy load component:', error)
              }
              
              observer.disconnect()
            }
          },
          {
            rootMargin: '50px' // 提前 50px 开始加载
          }
        )

        observer.observe(el)

        // 存储观察器以便清理
        ;(el as any)._lazyLoadObserver = observer
      },

      unmounted(el: HTMLElement) {
        const observer = (el as any)._lazyLoadObserver
        if (observer) {
          observer.disconnect()
        }
      }
    }
  }
}

// 创建全局实例
export const asyncComponentManager = new AsyncComponentManager()

// 常用的异步组件创建函数
export const createAsyncComponent = (
  loader: () => Promise<Component>,
  options?: AsyncComponentOptions
) => asyncComponentManager.createAsyncComponent(loader, options)

export const createAsyncWithSkeleton = (
  loader: () => Promise<Component>,
  skeletonType?: 'card' | 'list' | 'table',
  options?: Partial<AsyncComponentOptions>
) => asyncComponentManager.createAsyncWithSkeleton(loader, skeletonType, options)

export const vLazyLoad = asyncComponentManager.createLazyLoadDirective()

export default asyncComponentManager