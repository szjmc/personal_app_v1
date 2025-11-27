import { http } from '@/utils/request'
import { ElMessage } from 'element-plus'

// API适配器基础类
export class ApiAdapter<T = any> {
  protected baseUrl: string
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  
  // 通用GET请求
  async get(
    endpoint: string = '', 
    params: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await http.get<T>(`${this.baseUrl}${endpoint}`, {
        params,
        ...options
      })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }
  
  // 通用POST请求
  async post(
    endpoint: string = '', 
    data: any = {},
    options: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await http.post<T>(`${this.baseUrl}${endpoint}`, data, options)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }
  
  // 通用PUT请求
  async put(
    endpoint: string = '', 
    data: any = {},
    options: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await http.put<T>(`${this.baseUrl}${endpoint}`, data, options)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }
  
  // 通用PATCH请求
  async patch(
    endpoint: string = '', 
    data: any = {},
    options: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await http.patch<T>(`${this.baseUrl}${endpoint}`, data, options)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }
  
  // 通用DELETE请求
  async delete(
    endpoint: string = '', 
    options: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await http.delete<T>(`${this.baseUrl}${endpoint}`, options)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }
  
  // 上传文件
  async upload(
    endpoint: string = '',
    formData: FormData,
    options: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await http.upload<T>(`${this.baseUrl}${endpoint}`, formData, {
        ...options,
        onUploadProgress: options.onUploadProgress
      })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }
  
  // 下载文件
  async download(
    endpoint: string = '',
    params: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<Blob> {
    try {
      const response = await http.download(`${this.baseUrl}${endpoint}`, {
        params,
        ...options
      })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }
  
  // 错误处理
  protected handleError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          return new Error(data?.message || '请求参数错误')
        case 401:
          return new Error('未授权，请重新登录')
        case 403:
          return new Error('权限不足')
        case 404:
          return new Error('请求的资源不存在')
        case 422:
          if (data?.detail && Array.isArray(data.detail)) {
            const errors = data.detail.map((item: any) => item.msg).join('; ')
            return new Error(errors)
          }
          return new Error(data?.message || '数据验证失败')
        case 429:
          return new Error('请求过于频繁，请稍后再试')
        case 500:
          return new Error('服务器内部错误')
        default:
          return new Error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.request) {
      return new Error('网络连接失败，请检查网络设置')
    } else {
      return new Error(error.message || '未知错误')
    }
  }
}

// CRUD操作适配器
export class CrudAdapter<T = any> extends ApiAdapter<T> {
  // 获取列表
  async getList(
    params: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<{ results: T[]; count: number; next?: string; previous?: string }> {
    const config = {
      useCache: true,
      cacheTime: 300000, // 5分钟
      ...options
    }
    
    return this.get('', params, config)
  }
  
  // 获取详情
  async getDetail(
    id: string | number,
    params: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<T> {
    const config = {
      useCache: true,
      cacheTime: 600000, // 10分钟
      ...options
    }
    
    return this.get(`${id}/`, params, config)
  }
  
  // 创建
  async create(
    data: Partial<T>,
    options: Record<string, any> = {}
  ): Promise<T> {
    return this.post('', data, options)
  }
  
  // 更新
  async update(
    id: string | number,
    data: Partial<T>,
    options: Record<string, any> = {}
  ): Promise<T> {
    return this.patch(`${id}/`, data, options)
  }
  
  // 替换
  async replace(
    id: string | number,
    data: Partial<T>,
    options: Record<string, any> = {}
  ): Promise<T> {
    return this.put(`${id}/`, data, options)
  }
  
  // 删除
  async delete(
    id: string | number,
    options: Record<string, any> = {}
  ): Promise<void> {
    return this.delete(`${id}/`, options)
  }
  
  // 批量操作
  async bulkAction(
    action: string,
    data: any,
    options: Record<string, any> = {}
  ): Promise<any> {
    return this.post(`bulk-${action}/`, data, options)
  }
}

// 带缓存的适配器
export class CachedAdapter<T = any> extends CrudAdapter<T> {
  private cachePrefix: string
  
  constructor(baseUrl: string, cachePrefix: string = '') {
    super(baseUrl)
    this.cachePrefix = cachePrefix || baseUrl.replace(/\//g, '_')
  }
  
  // 重写GET方法以支持缓存
  async get(
    endpoint: string = '',
    params: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<any> {
    const config = {
      useCache: true,
      cacheTime: 300000, // 5分钟
      ...options
    }
    
    // 对于某些特定端点，使用更长的缓存时间
    const longCacheEndpoints = ['statistics', 'summary', 'dashboard']
    const isLongCache = longCacheEndpoints.some(ep => endpoint.includes(ep))
    
    if (isLongCache) {
      config.cacheTime = 600000 // 10分钟
    }
    
    return super.get(endpoint, params, config)
  }
  
  // 重写POST/PUT/PATCH/DELETE方法以清除缓存
  private async clearCacheAndExecute(
    method: 'post' | 'put' | 'patch' | 'delete',
    endpoint: string,
    data?: any,
    options: Record<string, any> = {}
  ): Promise<any> {
    // 执行请求
    const result = await super[method](endpoint, data, options)
    
    // 清除相关缓存
    this.clearCache()
    
    return result
  }
  
  async post(endpoint: string = '', data?: any, options?: Record<string, any>): Promise<any> {
    return this.clearCacheAndExecute('post', endpoint, data, options)
  }
  
  async put(endpoint: string = '', data?: any, options?: Record<string, any>): Promise<any> {
    return this.clearCacheAndExecute('put', endpoint, data, options)
  }
  
  async patch(endpoint: string = '', data?: any, options?: Record<string, any>): Promise<any> {
    return this.clearCacheAndExecute('patch', endpoint, data, options)
  }
  
  async delete(endpoint: string = '', options?: Record<string, any>): Promise<any> {
    return this.clearCacheAndExecute('delete', endpoint, undefined, options)
  }
  
  // 清除缓存
  clearCache(): void {
    // 这里可以调用缓存管理器清除相关缓存
    // 例如：cacheManager.clearPattern(`*${this.cachePrefix}*`)
    console.log(`Clearing cache for ${this.cachePrefix}`)
  }
}

// 文件操作适配器
export class FileAdapter<T = any> extends ApiAdapter<T> {
  // 上传文件
  async uploadFile(
    file: File,
    additionalData: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    
    // 添加额外的数据
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key])
    })
    
    const config = {
      onUploadProgress: (progressEvent: any) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress?.(progress)
      },
      ...options
    }
    
    return this.upload('upload/', formData, config)
  }
  
  // 批量上传文件
  async uploadMultipleFiles(
    files: File[],
    additionalData: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<any[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, additionalData, {
        ...options,
        onProgress: (progress: number) => {
          options.onProgress?.(file.name, progress)
        }
      })
    )
    
    return Promise.all(uploadPromises)
  }
  
  // 下载文件
  async downloadFile(
    filename: string,
    params: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<void> {
    try {
      const blob = await this.download(`download/${filename}/`, params, options)
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理URL对象
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      ElMessage.error('文件下载失败')
      throw error
    }
  }
}

// 导出工厂函数
export const createApiAdapter = <T = any>(baseUrl: string): ApiAdapter<T> => {
  return new ApiAdapter<T>(baseUrl)
}

export const createCrudAdapter = <T = any>(baseUrl: string): CrudAdapter<T> => {
  return new CrudAdapter<T>(baseUrl)
}

export const createCachedAdapter = <T = any>(baseUrl: string, cachePrefix?: string): CachedAdapter<T> => {
  return new CachedAdapter<T>(baseUrl, cachePrefix)
}

export const createFileAdapter = <T = any>(baseUrl: string): FileAdapter<T> => {
  return new FileAdapter<T>(baseUrl)
}