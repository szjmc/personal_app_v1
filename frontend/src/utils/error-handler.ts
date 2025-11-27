import { ref, defineComponent, h, getCurrentInstance, onErrorCaptured } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

// 错误类型定义
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

// 错误级别定义
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 自定义错误类
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly level: ErrorLevel
  public readonly code?: string
  public readonly details?: any
  public readonly timestamp: number
  public readonly userFriendly: boolean
  
  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    level: ErrorLevel = ErrorLevel.ERROR,
    code?: string,
    details?: any,
    userFriendly: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.level = level
    this.code = code
    this.details = details
    this.timestamp = Date.now()
    this.userFriendly = userFriendly
    
    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

// 网络错误处理
export class NetworkErrorHandler {
  static handle(error: any): AppError {
    if (!error.response) {
      return new AppError(
        '网络连接失败，请检查网络设置',
        ErrorType.NETWORK,
        ErrorLevel.ERROR,
        'NETWORK_ERROR',
        { originalError: error }
      )
    }
    
    const { status, data } = error.response
    
    switch (status) {
      case 400:
        return new AppError(
          this.getValidationMessage(data),
          ErrorType.VALIDATION,
          ErrorLevel.WARNING,
          'VALIDATION_ERROR',
          data
        )
      
      case 401:
        return new AppError(
          '登录已过期，请重新登录',
          ErrorType.AUTHENTICATION,
          ErrorLevel.WARNING,
          'AUTH_ERROR',
          data
        )
      
      case 403:
        return new AppError(
          '权限不足，无法访问该资源',
          ErrorType.AUTHORIZATION,
          ErrorLevel.WARNING,
          'AUTHORIZATION_ERROR',
          data
        )
      
      case 404:
        return new AppError(
          '请求的资源不存在',
          ErrorType.BUSINESS,
          ErrorLevel.WARNING,
          'NOT_FOUND',
          data
        )
      
      case 422:
        return new AppError(
          this.getValidationMessage(data),
          ErrorType.VALIDATION,
          ErrorLevel.WARNING,
          'VALIDATION_ERROR',
          data
        )
      
      case 429:
        return new AppError(
          '请求过于频繁，请稍后再试',
          ErrorType.BUSINESS,
          ErrorLevel.WARNING,
          'RATE_LIMIT',
          data
        )
      
      case 500:
        return new AppError(
          '服务器内部错误，请稍后再试',
          ErrorType.SYSTEM,
          ErrorLevel.ERROR,
          'SERVER_ERROR',
          data
        )
      
      default:
        return new AppError(
          data?.message || `请求失败 (${status})`,
          ErrorType.UNKNOWN,
          ErrorLevel.ERROR,
          `HTTP_${status}`,
          data
        )
    }
  }
  
  private static getValidationMessage(data: any): string {
    if (data?.detail && Array.isArray(data.detail)) {
      return data.detail.map((item: any) => item.msg).join('; ')
    }
    return data?.message || '请求参数有误'
  }
}

// 错误处理器
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorQueue: AppError[] = []
  private maxQueueSize = 100
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }
  
  // 处理错误
  handle(error: Error | AppError | any): void {
    let appError: AppError
    
    if (error instanceof AppError) {
      appError = error
    } else if (error?.response) {
      appError = NetworkErrorHandler.handle(error)
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message,
        ErrorType.SYSTEM,
        ErrorLevel.ERROR,
        'SYSTEM_ERROR',
        { originalError: error }
      )
    } else {
      appError = new AppError(
        '未知错误',
        ErrorType.UNKNOWN,
        ErrorLevel.ERROR,
        'UNKNOWN_ERROR',
        { originalError: error }
      )
    }
    
    // 记录错误
    this.logError(appError)
    
    // 处理错误
    this.processError(appError)
  }
  
  // 记录错误
  private logError(error: AppError): void {
    // 添加到错误队列
    this.errorQueue.push(error)
    
    // 限制队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
    
    // 控制台输出（开发环境）
    if (import.meta.env.DEV) {
      console.group(`🚨 ${error.level.toUpperCase()}: ${error.type}`)
      console.error('Message:', error.message)
      console.error('Code:', error.code)
      console.error('Details:', error.details)
      console.error('Timestamp:', new Date(error.timestamp))
      console.error('Stack:', error.stack)
      console.groupEnd()
    }
    
    // 发送到错误监控服务（生产环境）
    if (!import.meta.env.DEV && error.level === ErrorLevel.CRITICAL) {
      this.reportToMonitoringService(error)
    }
  }
  
  // 处理错误
  private processError(error: AppError): void {
    // 根据错误类型和级别进行不同的处理
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        this.handleAuthenticationError(error)
        break
      
      case ErrorType.AUTHORIZATION:
        this.handleAuthorizationError(error)
        break
      
      case ErrorType.VALIDATION:
        this.handleValidationError(error)
        break
      
      case ErrorType.NETWORK:
        this.handleNetworkError(error)
        break
      
      case ErrorType.BUSINESS:
        this.handleBusinessError(error)
        break
      
      case ErrorType.SYSTEM:
        this.handleSystemError(error)
        break
      
      default:
        this.handleUnknownError(error)
    }
  }
  
  // 认证错误处理
  private handleAuthenticationError(error: AppError): void {
    // 清除登录状态
    const authStore = useAuthStore()
    authStore.logout()
    
    // 跳转到登录页
    if (router.currentRoute.value.path !== '/login') {
      router.push('/login')
    }
    
    // 显示错误提示
    ElMessage.warning(error.message)
  }
  
  // 权限错误处理
  private handleAuthorizationError(error: AppError): void {
    ElMessage.error(error.message)
    
    // 可以跳转到403页面或显示权限不足提示
    if (router.currentRoute.value.path !== '/403') {
      router.push('/403')
    }
  }
  
  // 验证错误处理
  private handleValidationError(error: AppError): void {
    // 显示详细的验证错误信息
    if (error.details?.detail && Array.isArray(error.details.detail)) {
      error.details.detail.forEach((item: any) => {
        ElMessage.error(`${item.loc?.join('.') || '字段'}: ${item.msg}`)
      })
    } else {
      ElMessage.error(error.message)
    }
  }
  
  // 网络错误处理
  private handleNetworkError(error: AppError): void {
    ElMessage.error({
      message: error.message,
      duration: 5000,
      showClose: true
    })
    
    // 可以添加重试机制
    this.showRetryDialog(error)
  }
  
  // 业务错误处理
  private handleBusinessError(error: AppError): void {
    ElMessage.warning(error.message)
  }
  
  // 系统错误处理
  private handleSystemError(error: AppError): void {
    if (error.level === ErrorLevel.CRITICAL) {
      ElNotification.error({
        title: '严重错误',
        message: error.message,
        duration: 0, // 不自动关闭
        showClose: true
      })
    } else {
      ElMessage.error(error.message)
    }
  }
  
  // 未知错误处理
  private handleUnknownError(error: AppError): void {
    ElMessage.error('发生未知错误，请稍后再试')
  }
  
  // 显示重试对话框
  private showRetryDialog(error: AppError): void {
    ElMessageBox.confirm(
      '网络连接失败，是否重试？',
      '连接错误',
      {
        confirmButtonText: '重试',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      // 这里可以触发重试逻辑
      window.location.reload()
    }).catch(() => {
      // 用户取消重试
    })
  }
  
  // 上报错误到监控服务
  private reportToMonitoringService(error: AppError): void {
    try {
      // 这里可以集成Sentry、LogRocket等错误监控服务
      const errorData = {
        type: error.type,
        level: error.level,
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      
      // 示例：发送到错误收集API
      console.log('Reporting error to monitoring service:', errorData)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }
  
  // 获取错误历史
  getErrorHistory(): AppError[] {
    return [...this.errorQueue]
  }
  
  // 清除错误历史
  clearErrorHistory(): void {
    this.errorQueue = []
  }
  
  // 获取错误统计
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    this.errorQueue.forEach(error => {
      const key = `${error.type}_${error.level}`
      stats[key] = (stats[key] || 0) + 1
    })
    
    return stats
  }
}

// 全局错误处理函数
export const handleError = (error: any): void => {
  ErrorHandler.getInstance().handle(error)
}

// Vue错误处理器
export const createVueErrorHandler = () => {
  return (error: any, instance: any, info: string) => {
    const appError = new AppError(
      `Vue组件错误: ${error.message}`,
      ErrorType.SYSTEM,
      ErrorLevel.ERROR,
      'VUE_ERROR',
      { error, instance, info }
    )
    
    handleError(appError)
  }
}

// Promise错误处理器
export const createPromiseErrorHandler = () => {
  return (event: PromiseRejectionEvent) => {
    const appError = new AppError(
      `Promise未处理错误: ${event.reason}`,
      ErrorType.SYSTEM,
      ErrorLevel.ERROR,
      'PROMISE_ERROR',
      { reason: event.reason }
    )
    
    handleError(appError)
    
    // 防止错误在控制台显示
    event.preventDefault()
  }
}

// 错误边界组件（Vue 3）
export const ErrorBoundary = defineComponent({
  name: 'ErrorBoundary',
  
  props: {
    fallback: {
      type: Function,
      default: () => h('div', { class: 'error-boundary' }, [
        h('h2', '出错了'),
        h('p', '页面发生了错误，请刷新重试')
      ])
    }
  },
  
  setup(props, { slots }) {
    const error = ref<Error | null>(null)
    
    const handleError = (err: Error) => {
      error.value = err
      handleError(err)
    }
    
    onErrorCaptured(handleError)
    
    return () => {
      if (error.value) {
        return props.fallback(error.value)
      }
      return slots.default?.()
    }
  }
})

// 初始化全局错误处理
export const initGlobalErrorHandling = (): void => {
  // Vue错误处理
  const app = getCurrentInstance()?.appContext.app
  if (app) {
    app.config.errorHandler = createVueErrorHandler()
  }
  
  // Promise错误处理
  window.addEventListener('unhandledrejection', createPromiseErrorHandler())
  
  // 全局错误处理
  window.addEventListener('error', (event) => {
    const appError = new AppError(
      `全局错误: ${event.message}`,
      ErrorType.SYSTEM,
      ErrorLevel.ERROR,
      'GLOBAL_ERROR',
      { event }
    )
    
    handleError(appError)
  })
}