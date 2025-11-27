<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1 class="register-title">创建账号</h1>
        <p class="register-subtitle">开启您的个人管理之旅</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            type="email"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="请输入密码"
            type="password"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="password_confirm">
          <el-input
            v-model="registerForm.password_confirm"
            placeholder="请确认密码"
            type="password"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="register-btn"
            :loading="userStore.loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="register-footer">
        <span>已有账号？</span>
        <router-link to="/login" class="login-link">
          立即登录
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'

const userStore = useUserStore()
const registerFormRef = ref<FormInstance>()

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  password_confirm: ''
})

const validatePasswordConfirm = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度至少3位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  password_confirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePasswordConfirm, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await userStore.register(registerForm)
      } catch (error) {
        console.error('Register error:', error)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: $bg-gradient;
}

.register-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  @include glass-effect;
  border-radius: 16px;
  @include fade-in;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
  
  .register-title {
    font-size: $font-size-3xl;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
    @include gradient-text;
  }
  
  .register-subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: $font-size-base;
  }
}

.register-form {
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
  
  .register-btn {
    width: 100%;
    height: 48px;
    font-size: $font-size-lg;
    font-weight: 500;
    border-radius: 8px;
    @include button-variant($primary-color, white);
  }
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  
  .login-link {
    color: white;
    margin-left: 4px;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>