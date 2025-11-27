/**
 * 图片懒加载服务
 * 支持 Intersection Observer、渐进式加载、错误处理等功能
 */

interface ImageLazyLoadOptions {
  root?: HTMLElement | null
  rootMargin?: string
  threshold?: number
  placeholder?: string
  retryCount?: number
  retryDelay?: number
  fadeIn?: boolean
  lowQualityPlaceholder?: boolean
}

interface ImageLoadState {
  element: HTMLImageElement
  src: string
  placeholder?: string
  lowQualitySrc?: string
  retryCount: number
  loaded: boolean
  error: boolean
  observer?: IntersectionObserver
}

class ImageLazyLoader {
  private imageStates: WeakMap<HTMLImageElement, ImageLoadState> = new WeakMap()
  private defaultOptions: Required<ImageLazyLoadOptions>
  private observer: IntersectionObserver | null = null

  constructor() {
    this.defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      placeholder: this.generatePlaceholder(),
      retryCount: 3,
      retryDelay: 1000,
      fadeIn: true,
      lowQualityPlaceholder: true
    }

    this.setupIntersectionObserver()
  }

  /**
   * 生成占位符图片
   */
  private generatePlaceholder(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial" font-size="14">
          加载中...
        </text>
      </svg>
    `)
  }

  /**
   * 生成低质量占位符
   */
  private generateLowQualityPlaceholder(src: string): string {
    // 这里可以实现图片压缩逻辑，暂时返回原图
    return src
  }

  /**
   * 设置 Intersection Observer
   */
  private setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver is not supported, all images will load immediately')
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            this.loadImage(img)
          }
        })
      },
      {
        rootMargin: this.defaultOptions.rootMargin,
        threshold: this.defaultOptions.threshold
      }
    )
  }

  /**
   * 懒加载图片
   */
  public observe(img: HTMLImageElement, options: Partial<ImageLazyLoadOptions> = {}): void {
    const config = { ...this.defaultOptions, ...options }
    
    // 设置占位符
    if (!img.src || img.src === window.location.href) {
      img.src = config.placeholder
    }

    const state: ImageLoadState = {
      element: img,
      src: img.dataset.src || img.src,
      placeholder: config.placeholder,
      lowQualitySrc: config.lowQualityPlaceholder && img.dataset.src 
        ? this.generateLowQualityPlaceholder(img.dataset.src)
        : undefined,
      retryCount: 0,
      loaded: false,
      error: false
    }

    this.imageStates.set(img, state)

    // 如果有低质量占位符，先加载
    if (state.lowQualitySrc && state.lowQualitySrc !== state.src) {
      this.loadLowQualityImage(img, state)
    }

    // 观察图片元素
    if (this.observer) {
      this.observer.observe(img)
    } else {
      // 不支持 Intersection Observer，直接加载
      this.loadImage(img)
    }
  }

  /**
   * 加载低质量图片
   */
  private loadLowQualityImage(img: HTMLImageElement, state: ImageLoadState): void {
    if (!state.lowQualitySrc) return

    const lowQualityImg = new Image()
    lowQualityImg.onload = () => {
      img.src = state.lowQualitySrc!
      if (this.defaultOptions.fadeIn) {
        img.style.transition = 'opacity 0.3s ease'
        img.style.opacity = '0.7'
      }
    }
    lowQualityImg.src = state.lowQualitySrc
  }

  /**
   * 加载目标图片
   */
  private loadImage(img: HTMLImageElement): void {
    const state = this.imageStates.get(img)
    if (!state || state.loaded) return

    // 停止观察
    if (this.observer) {
      this.observer.unobserve(img)
    }

    const targetImg = new Image()
    
    targetImg.onload = () => {
      this.onImageLoad(img, state, targetImg.src)
    }

    targetImg.onerror = () => {
      this.onImageError(img, state)
    }

    // 开始加载
    img.src = state.src
    targetImg.src = state.src

    // 添加加载状态
    img.classList.add('image-loading')
  }

  /**
   * 图片加载成功
   */
  private onImageLoad(img: HTMLImageElement, state: ImageLoadState, src: string): void {
    img.src = src
    img.classList.remove('image-loading')
    img.classList.add('image-loaded')
    
    if (this.defaultOptions.fadeIn) {
      img.style.transition = 'opacity 0.5s ease'
      img.style.opacity = '1'
    }

    state.loaded = true
    state.error = false

    // 触发自定义事件
    img.dispatchEvent(new CustomEvent('imageLoad', {
      detail: { img, src }
    }))
  }

  /**
   * 图片加载失败
   */
  private onImageError(img: HTMLImageElement, state: ImageLoadState): void {
    state.retryCount++
    state.error = true

    if (state.retryCount <= this.defaultOptions.retryCount) {
      // 重试
      setTimeout(() => {
        const retryImg = new Image()
        retryImg.onload = () => {
          this.onImageLoad(img, state, state.src)
        }
        retryImg.onerror = () => {
          this.onImageError(img, state)
        }
        retryImg.src = state.src
      }, this.defaultOptions.retryDelay * state.retryCount)
    } else {
      // 显示错误占位符
      img.src = this.generateErrorPlaceholder()
      img.classList.remove('image-loading')
      img.classList.add('image-error')

      // 触发错误事件
      img.dispatchEvent(new CustomEvent('imageError', {
        detail: { img, src: state.src }
      }))
    }
  }

  /**
   * 生成错误占位符
   */
  private generateErrorPlaceholder(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffcccc"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#cc0000" font-family="Arial" font-size="14">
          加载失败
        </text>
      </svg>
    `)
  }

  /**
   * 取消观察
   */
  public unobserve(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.unobserve(img)
    }
    this.imageStates.delete(img)
  }

  /**
   * 预加载图片
   */
  public preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
      img.src = src
    })
  }

  /**
   * 批量预加载图片
   */
  public preloadImages(urls: string[]): Promise<Array<{ url: string; success: boolean; error?: any }>> {
    const results = Promise.allSettled(
      urls.map(url => 
        this.preloadImage(url).then(
          () => ({ url, success: true }),
          error => ({ url, success: false, error })
        )
      )
    )

    return results.then(results => 
      results.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : { url: 'unknown', success: false, error: result.reason }
      )
    )
  }

  /**
   * 获取图片加载状态
   */
  public getImageState(img: HTMLImageElement): ImageLoadState | undefined {
    return this.imageStates.get(img)
  }

  /**
   * 更新配置
   */
  public updateOptions(options: Partial<ImageLazyLoadOptions>): void {
    Object.assign(this.defaultOptions, options)
    
    // 重新设置观察器
    if (this.observer) {
      this.observer.disconnect()
      this.setupIntersectionObserver()
    }
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}

// 创建全局实例
export const imageLazyLoader = new ImageLazyLoader()

// Vue 指令
export const vLazyLoad = {
  mounted(el: HTMLElement, binding: any) {
    if (el.tagName !== 'IMG') {
      console.warn('v-lazy-load directive can only be used on img elements')
      return
    }

    const img = el as HTMLImageElement
    const options = binding.value || {}
    
    // 如果有 data-src 属性，使用它作为图片源
    if (!img.dataset.src && !img.src) {
      console.warn('v-lazy-load requires src or data-src attribute')
      return
    }

    imageLazyLoader.observe(img, options)
  },

  unmounted(el: HTMLElement) {
    if (el.tagName === 'IMG') {
      imageLazyLoader.unobserve(el as HTMLImageElement)
    }
  }
}

// 响应式图片组件
export const ResponsiveImage = {
  props: {
    src: String,
    alt: String,
    lazy: {
      type: Boolean,
      default: true
    },
    placeholder: String,
    aspectRatio: String,
    sizes: {
      type: Object,
      default: () => ({})
    }
  },

  setup(props: any) {
    return () => {
      if (props.lazy) {
        return h('img', {
          'data-src': props.src,
          alt: props.alt,
          loading: 'lazy'
        })
      } else {
        return h('img', {
          src: props.src,
          alt: props.alt
        })
      }
    }
  }
}

// CSS 样式
export const imageLazyLoadStyles = `
  .image-loading {
    filter: blur(5px);
    opacity: 0.7;
  }

  .image-loaded {
    filter: none;
    opacity: 1;
  }

  .image-error {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .lazy-image-container {
    position: relative;
    overflow: hidden;
  }

  .lazy-image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease, filter 0.3s ease;
  }
`

export default imageLazyLoader