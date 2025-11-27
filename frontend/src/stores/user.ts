import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const router = useRouter()
  
  // 状态
  const user = ref<any>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)

  // 方法
  const login = async (credentials: { email: string; password: string }) => {
    try {
      loading.value = true
      const response = await userApi.login(credentials)
      
      token.value = response.access
      user.value = response.user
      
      localStorage.setItem('token', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      
      ElMessage.success('登录成功')
      router.push({ name: 'Dashboard' })
      
      return response
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: any) => {
    try {
      loading.value = true
      const response = await userApi.register(userData)
      
      token.value = response.access
      user.value = response.user
      
      localStorage.setItem('token', response.access)
      localStorage.setItem('refreshToken', response.refresh)
      
      ElMessage.success('注册成功')
      router.push({ name: 'Dashboard' })
      
      return response
    } catch (error: any) {
      ElMessage.error(error.message || '注册失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await userApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      router.push({ name: 'Login' })
      ElMessage.success('登出成功')
    }
  }

  const checkAuth = async () => {
    if (!token.value) return
    
    try {
      const response = await userApi.getCurrentUser()
      user.value = response
    } catch (error) {
      console.log('Token validation failed:', error)
      // Token无效，清除本地存储
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  }

  const updateProfile = async (profileData: any) => {
    try {
      loading.value = true
      const response = await userApi.updateProfile(profileData)
      user.value = { ...user.value, ...response }
      ElMessage.success('更新成功')
      return response
    } catch (error: any) {
      ElMessage.error(error.message || '更新失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    updateProfile
  }
})