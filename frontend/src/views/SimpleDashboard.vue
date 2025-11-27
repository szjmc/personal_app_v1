<template>
  <div style="padding: 20px; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
        <h1 style="color: #333; margin-bottom: 10px;">个人管理应用仪表盘</h1>
        <p style="color: #666;">欢迎使用个人管理系统！</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 10px;">📋 任务管理</h2>
          <p style="color: #666;">管理您的日常任务和待办事项</p>
          <button style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            查看任务
          </button>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 10px;">📅 日历管理</h2>
          <p style="color: #666;">查看和管理您的日程安排</p>
          <button style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            查看日历
          </button>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 10px;">📚 知识库</h2>
          <p style="color: #666;">记录和管理您的知识笔记</p>
          <button style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            查看知识库
          </button>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 10px;">💰 财务管理</h2>
          <p style="color: #666;">跟踪您的收入和支出</p>
          <button style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            查看财务
          </button>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 10px;">🏃‍♂️ 健康管理</h2>
          <p style="color: #666;">记录健康数据和运动习惯</p>
          <button style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            查看健康
          </button>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 10px;">⚙️ 个人设置</h2>
          <p style="color: #666;">管理您的个人偏好和设置</p>
          <button style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            查看设置
          </button>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <button @click="logout" style="padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  router.push('/login')
}
</script>