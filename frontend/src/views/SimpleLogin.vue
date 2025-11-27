<template>
  <div style="padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); max-width: 400px; width: 100%;">
      <h1 style="text-align: center; margin-bottom: 24px; color: #333;">个人管理应用</h1>
      <p style="text-align: center; margin-bottom: 32px; color: #666;">请登录您的账号</p>
      
      <div style="margin-bottom: 16px;">
        <input 
          v-model="email" 
          placeholder="邮箱" 
          style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;"
        />
      </div>
      
      <div style="margin-bottom: 24px;">
        <input 
          v-model="password" 
          type="password" 
          placeholder="密码" 
          style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;"
        />
      </div>
      
      <button 
        @click="login" 
        @mousedown="console.log('Button mousedown')"
        @mouseup="console.log('Button mouseup')"
        style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;"
      >
        登录
      </button>
      
      <button 
        @click="testClick" 
        style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 10px;"
      >
        测试按钮
      </button>
      
      <p style="text-align: center; margin-top: 20px; color: #666;">
        还没有账号？<a href="#" style="color: #667eea;">立即注册</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')

const login = () => {
  console.log('Login function called!')
  console.log('Email:', email.value)
  console.log('Password:', password.value)
  
  if (email.value && password.value) {
    console.log('Redirecting to dashboard...')
    router.push('/dashboard')
  } else {
    console.log('Validation failed - showing alert')
    alert('请输入邮箱和密码')
  }
}

const testClick = () => {
  console.log('Test button clicked!')
  alert('测试按钮工作正常！')
}
</script>