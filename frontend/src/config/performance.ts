/**
 * 性能优化配置
 * 集中管理所有性能相关的配置参数
 */

export const PERFORMANCE_CONFIG = {
  // 路由预加载配置
  routerPreload: {
    // 预加载延迟（毫秒）
    delay: 1000,
    // 高优先级路由自动预加载
    autoPreloadHighPriority: true,
    // 中优先级路由预加载延迟
    mediumPriorityDelay: 2000,
    // 低优先级路由预加载延迟
    lowPriorityDelay: 5000,
    // 网络慢时是否预加载
    preloadOnSlowNetwork: false,
    // 数据节省模式时是否预加载
    preloadOnDataSaver: false
  },

  // 数据预加载配置
  dataPreload: {
    // 自动预加载
    autoPreload: true,
    // 预加载缓存时间（毫秒）
    defaultCacheTime: 5 * 60 * 1000, // 5分钟
    // 最大预加载队列大小
    maxQueueSize: 20,
    // 预加载超时时间
    timeout: 5000,
    // 重试次数
    retryCount: 2,
    // 重试延迟
    retryDelay: 1000,
    // 用户行为追踪
    trackUserBehavior: true,
    // 基于时间的预加载配置
    timeBasedPreload: {
      // 工作时间预加载任务数据
      workHours: {
        start: 9,
        end: 18,
        preloadTasks: true,
        preloadProjects: true,
        preloadEvents: true
      },
      // 早晨预加载习惯数据
      morningHours: {
        start: 6,
        end: 10,
        preloadHabits: true
      },
      // 晚上预加载总结数据
      eveningHours: {
        start: 20,
        end: 2,
        preloadSummary: true
      }
    }
  },

  // 图片懒加载配置
  imageLazyLoad: {
    // 默认占位符
    placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPjx0ZXh0IGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzc3NyI+5Y+356uZ5piv5ZKM5L2cPC90ZXh0Pjwvc3ZnPg==',
    // 根边距
    rootMargin: '50px',
    // 阈值
    threshold: 0.1,
    // 重试次数
    retryCount: 3,
    // 重试延迟
    retryDelay: 1000,
    // 淡入动画
    fadeIn: true,
    // 低质量占位符
    lowQualityPlaceholder: true,
    // 预加载策略
    preloadStrategy: 'viewport' // 'viewport' | 'all' | 'none'
  },

  // API 优化配置
  apiOptimizer: {
    // 默认缓存
    defaultCache: true,
    // 默认缓存时间
    defaultCacheTime: 5 * 60 * 1000, // 5分钟
    // 请求去重
    deduplication: true,
    // 默认重试次数
    defaultRetry: 2,
    // 默认重试延迟
    defaultRetryDelay: 1000,
    // 默认超时时间
    defaultTimeout: 10000,
    // 请求队列优先级
    priorityLevels: {
      high: 3,
      medium: 2,
      low: 1
    },
    // 并发请求数限制
    maxConcurrentRequests: 6,
    // 请求大小限制（字节）
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    // 响应大小限制（字节）
    maxResponseSize: 50 * 1024 * 1024, // 50MB
    // 智能预加载
    smartPreload: true,
    // 网络自适应
    networkAdaptive: true
  },

  // 加载状态管理配置
  loadingManager: {
    // 默认加载文本
    defaultText: '加载中...',
    // 默认背景色
    defaultBackground: 'rgba(0, 0, 0, 0.7)',
    // 默认锁定屏幕
    defaultLock: true,
    // 默认显示加载动画
    defaultSpinner: true,
    // 防抖延迟
    debounceDelay: 300,
    // 最大加载时间
    maxLoadingTime: 30000, // 30秒
    // 自动隐藏延迟
    autoHideDelay: 1000,
    // 全局加载状态
    globalLoading: true,
    // 进度条更新间隔
    progressUpdateInterval: 100
  },

  // 性能监控配置
  performanceMonitor: {
    // 是否启用监控
    enabled: true,
    // 采样率（0-1）
    sampleRate: 1.0,
    // 最大条目数
    maxEntries: 1000,
    // 性能阈值
    thresholds: {
      // API 请求慢阈值（毫秒）
      apiSlow: 2000,
      // 用户交互慢阈值（毫秒）
      interactionSlow: 100,
      // 资源加载慢阈值（毫秒）
      resourceSlow: 3000,
      // LCP 慢阈值（毫秒）
      lcpSlow: 2500,
      // FID 慢阈值（毫秒）
      fidSlow: 100,
      // CLS 差阈值
      clsPoor: 0.25
    },
    // 监控事件类型
    eventTypes: [
      'navigation',
      'resource',
      'paint',
      'largest-contentful-paint',
      'first-input',
      'layout-shift',
      'longtask'
    ],
    // 自动报告间隔（毫秒）
    reportInterval: 60000, // 1分钟
    // 本地存储
    localStorage: true,
    // 远程上报
    remoteReporting: false,
    // 远端上报 URL
    reportUrl: '/api/performance/report'
  },

  // 缓存管理配置
  cacheManager: {
    // 默认缓存前缀
    prefix: 'app_cache_',
    // 默认 TTL（毫秒）
    defaultTTL: 24 * 60 * 60 * 1000, // 24小时
    // 最大缓存大小（字节）
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    // 清理间隔（毫秒）
    cleanupInterval: 5 * 60 * 1000, // 5分钟
    // 压缩缓存
    compressCache: true,
    // 加密缓存
    encryptCache: false,
    // 版本管理
    versionedCache: true
  },

  // 内存管理配置
  memoryManager: {
    // 内存使用警告阈值（字节）
    warningThreshold: 100 * 1024 * 1024, // 100MB
    // 内存使用危险阈值（字节）
    criticalThreshold: 200 * 1024 * 1024, // 200MB
    // 自动清理间隔（毫秒）
    cleanupInterval: 30000, // 30秒
    // 监控对象
    monitorObjects: true,
    // 监控事件监听器
    monitorEventListeners: true,
    // 监控定时器
    monitorTimers: true
  },

  // 网络优化配置
  networkOptimizer: {
    // 离线支持
    offlineSupport: true,
    // Service Worker
    serviceWorker: {
      enabled: true,
      scriptUrl: '/sw.js',
      scope: '/'
    },
    // 请求优先级
    requestPriority: {
      critical: 'high',
      high: 'high',
      normal: 'medium',
      low: 'low'
    },
    // 资源预连接
    preconnect: [
      'https://fonts.googleapis.com',
      'https://api.example.com'
    ],
    // DNS 预解析
    dnsPrefetch: [
      '//fonts.gstatic.com',
      '//cdn.example.com'
    ]
  },

  // 组件优化配置
  componentOptimizer: {
    // 组件懒加载
    lazyLoading: true,
    // 组件预加载
    preloading: true,
    // 组件缓存
    caching: true,
    // 组件卸载清理
    cleanupOnUnmount: true,
    // 虚拟滚动
    virtualScrolling: {
      enabled: true,
      itemSize: 50,
      buffer: 10
    },
    // 组件分析
    profiling: false
  }
}

// 环境特定配置
export const getPerformanceConfig = () => {
  const isDevelopment = import.meta.env.DEV
  const isProduction = import.meta.env.PROD
  const isTest = import.meta.env.MODE === 'test'

  if (isDevelopment) {
    return {
      ...PERFORMANCE_CONFIG,
      // 开发环境配置
      performanceMonitor: {
        ...PERFORMANCE_CONFIG.performanceMonitor,
        enabled: true,
        sampleRate: 1.0,
        remoteReporting: false
      },
      // 开发时不启用某些优化以便调试
      apiOptimizer: {
        ...PERFORMANCE_CONFIG.apiOptimizer,
        defaultCache: false
      }
    }
  }

  if (isProduction) {
    return {
      ...PERFORMANCE_CONFIG,
      // 生产环境配置
      performanceMonitor: {
        ...PERFORMANCE_CONFIG.performanceMonitor,
        enabled: true,
        sampleRate: 0.1, // 10% 采样率
        remoteReporting: true
      },
      // 生产环境启用所有优化
      apiOptimizer: {
        ...PERFORMANCE_CONFIG.apiOptimizer,
        defaultCache: true,
        smartPreload: true
      }
    }
  }

  if (isTest) {
    return {
      ...PERFORMANCE_CONFIG,
      // 测试环境配置
      performanceMonitor: {
        ...PERFORMANCE_CONFIG.performanceMonitor,
        enabled: false
      },
      routerPreload: {
        ...PERFORMANCE_CONFIG.routerPreload,
        autoPreloadHighPriority: false
      }
    }
  }

  return PERFORMANCE_CONFIG
}

// 用户设备适配配置
export const getDeviceOptimizedConfig = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const isSlowNetwork = (navigator as any).connection?.effectiveType === 'slow-2g' || 
                       (navigator as any).connection?.effectiveType === '2g'
  const isDataSaver = (navigator as any).connection?.saveData === true

  const config = getPerformanceConfig()

  if (isMobile) {
    return {
      ...config,
      // 移动端优化
      imageLazyLoad: {
        ...config.imageLazyLoad,
        rootMargin: '100px', // 更早预加载
        lowQualityPlaceholder: true
      },
      // 减少并发请求
      apiOptimizer: {
        ...config.apiOptimizer,
        maxConcurrentRequests: 3
      }
    }
  }

  if (isSlowNetwork) {
    return {
      ...config,
      // 慢网络优化
      routerPreload: {
        ...config.routerPreload,
        preloadOnSlowNetwork: false
      },
      imageLazyLoad: {
        ...config.imageLazyLoad,
        lowQualityPlaceholder: true,
        preloadStrategy: 'none'
      },
      apiOptimizer: {
        ...config.apiOptimizer,
        defaultTimeout: 15000, // 增加超时时间
        networkAdaptive: true
      }
    }
  }

  if (isDataSaver) {
    return {
      ...config,
      // 数据节省模式
      routerPreload: {
        ...config.routerPreload,
        preloadOnDataSaver: false
      },
      imageLazyLoad: {
        ...config.imageLazyLoad,
        preloadStrategy: 'none'
      },
      dataPreload: {
        ...config.dataPreload,
        autoPreload: false
      }
    }
  }

  return config
}

export default PERFORMANCE_CONFIG