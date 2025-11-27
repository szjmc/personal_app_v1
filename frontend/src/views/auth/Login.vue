<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">欢迎回来</h1>
        <p class="login-subtitle">登录您的个人管理应用</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入邮箱"
            type="email"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            placeholder="请输入密码"
            type="password"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="userStore.loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="register-link">
          立即注册
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  email: '',
  password: ''
})

const loginRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await userStore.login(loginForm)
      } catch (error) {
        console.error('Login error:', error)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: $bg-gradient;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  @include glass-effect;
  border-radius: 16px;
  @include fade-in;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
  
  .login-title {
    font-size: $font-size-3xl;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
    @include gradient-text;
  }
  
  .login-subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: $font-size-base;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
    
    :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: none;
      border-radius: 8px;
      
      &.is-focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.4);
      }
    }
    
    :deep(.el-input__inner) {
      color: white;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    font-size: $font-size-lg;
    font-weight: 500;
    border-radius: 8px;
    @include button-variant($primary-color, white);
  }
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  
  .register-link {
    color: white;
    margin-left: 4px;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>