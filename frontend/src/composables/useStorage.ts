/**
 * 本地存储管理组合式函数
 * 支持 localStorage 和 sessionStorage
 */

import { ref, watch, Ref } from 'vue'

export function useStorage<T>(
  key: string,
  defaultValue: T,
  storage: Storage = localStorage
): {
  value: Ref<T>
  set: (value: T) => void
  remove: () => void
} {
  // 获取存储的值
  const storedValue = storage.getItem(key)
  let initialValue: T

  try {
    initialValue = storedValue ? JSON.parse(storedValue) : defaultValue
  } catch (error) {
    console.warn(`Failed to parse stored value for key "${key}":`, error)
    initialValue = defaultValue
  }

  // 创建响应式引用
  const value = ref<T>(initialValue) as Ref<T>

  // 监听值变化并保存到存储
  watch(
    value,
    (newValue) => {
      try {
        storage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.warn(`Failed to save value for key "${key}":`, error)
        
        // 如果存储空间不足，尝试清理旧数据
        if (error.name === 'QuotaExceededError') {
          clearExpiredStorage(storage)
          // 重试一次
          try {
            storage.setItem(key, JSON.stringify(newValue))
          } catch (retryError) {
            console.warn(`Retry failed for key "${key}":`, retryError)
          }
        }
      }
    },
    { deep: true }
  )

  // 设置值的方法
  const set = (newValue: T) => {
    value.value = newValue
  }

  // 删除值的方法
  const remove = () => {
    value.value = defaultValue
    storage.removeItem(key)
  }

  return {
    value,
    set,
    remove
  }
}

/**
 * 清理过期的存储数据
 */
function clearExpiredStorage(storage: Storage) {
  const keysToRemove: string[] = []

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key) continue

    try {
      const value = storage.getItem(key)
      if (!value) continue

      const parsed = JSON.parse(value)
      
      // 检查是否有过期时间
      if (parsed && typeof parsed === 'object' && 'expires' in parsed) {
        if (parsed.expires <= Date.now()) {
          keysToRemove.push(key)
        }
      }
    } catch (error) {
      // 无法解析的数据，也删除
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => {
    storage.removeItem(key)
  })

  console.log(`Cleared ${keysToRemove.length} expired items from storage`)
}

/**
 * 会话存储专用
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
) {
  return useStorage<T>(key, defaultValue, sessionStorage)
}

/**
 * 临时存储专用（内存中）
 */
export function useTempStorage<T>(
  key: string,
  defaultValue: T
) {
  const tempStorage: Record<string, any> = {}
  
  return useStorage<T>(key, defaultValue, {
    getItem: (k: string) => tempStorage[k] || null,
    setItem: (k: string, v: string) => { tempStorage[k] = v },
    removeItem: (k: string) => { delete tempStorage[k] },
    clear: () => { Object.keys(tempStorage).forEach(k => delete tempStorage[k]) },
    key: (index: number) => Object.keys(tempStorage)[index] || null,
    length: Object.keys(tempStorage).length
  } as Storage)
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private storage: Storage
  private prefix: string
  private defaultTTL: number

  constructor(storage: Storage = localStorage, prefix: string = 'cache_', defaultTTL: number = 24 * 60 * 60 * 1000) {
    this.storage = storage
    this.prefix = prefix
    this.defaultTTL = defaultTTL
  }

  /**
   * 设置缓存
   */
  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    const cacheKey = this.prefix + key
    const cacheData = {
      value,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    }

    try {
      this.storage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.warn(`Failed to set cache for key "${key}":`, error)
    }
  }

  /**
   * 获取缓存
   */
  get<T = any>(key: string): T | null {
    const cacheKey = this.prefix + key
    const cached = this.storage.getItem(cacheKey)

    if (!cached) return null

    try {
      const cacheData = JSON.parse(cached)
      
      // 检查是否过期
      if (cacheData.expires <= Date.now()) {
        this.storage.removeItem(cacheKey)
        return null
      }

      return cacheData.value
    } catch (error) {
      console.warn(`Failed to get cache for key "${key}":`, error)
      this.storage.removeItem(cacheKey)
      return null
    }
  }

  /**
   * 删除缓存
   */
  remove(key: string): void {
    const cacheKey = this.prefix + key
    this.storage.removeItem(cacheKey)
  }

  /**
   * 清除过期缓存
   */
  clearExpired(): number {
    let clearedCount = 0

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (!key || !key.startsWith(this.prefix)) continue

      try {
        const cached = this.storage.getItem(key)
        if (!cached) continue

        const cacheData = JSON.parse(cached)
        if (cacheData.expires <= Date.now()) {
          this.storage.removeItem(key)
          clearedCount++
        }
      } catch (error) {
        // 无效数据，删除
        this.storage.removeItem(key)
        clearedCount++
      }
    }

    return clearedCount
  }

  /**
   * 清除所有缓存
   */
  clear(): number {
    let clearedCount = 0
    const keysToRemove: string[] = []

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => {
      this.storage.removeItem(key)
      clearedCount++
    })

    return clearedCount
  }

  /**
   * 获取缓存大小（字节）
   */
  getSize(): number {
    let size = 0

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.prefix)) {
        const value = this.storage.getItem(key)
        if (value) {
          size += key.length * 2 // Unicode 字符占2字节
          size += value.length * 2
        }
      }
    }

    return size
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    count: number
    size: number
    hitRate?: number
  } {
    let count = 0

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.prefix)) {
        count++
      }
    }

    return {
      count,
      size: this.getSize()
    }
  }
}

// 创建默认缓存管理器实例
export const cacheManager = new CacheManager()

export default useStorage