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
          @keyup.enter="handleLogin"
        />
      </div>
      
      <button 
        @click="handleLogin" 
        style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;"
      >
        登录
      </button>
      
      <p style="text-align: center; margin-top: 20px; color: #666;">
        还没有账号？<a href="#" @click.prevent="showRegister" style="color: #667eea;">立即注册</a>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: ''
    }
  },
  methods: {
    handleLogin() {
      console.log('登录点击 - 邮箱:', this.email, '密码:', this.password)
      
      if (!this.email || !this.password) {
        this.$message?.error('请输入邮箱和密码') || alert('请输入邮箱和密码')
        return
      }
      
      // 简单的模拟登录
      if (this.email && this.password) {
        console.log('登录成功，跳转到仪表盘')
        this.$router.push('/dashboard')
      }
    },
    showRegister() {
      console.log('注册功能暂未实现')
      alert('注册功能开发中...')
    }
  }
}
</script>