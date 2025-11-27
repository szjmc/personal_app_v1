<template>
  <div style="padding: 20px; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 800px; margin: 0 auto;">
      <!-- 头部 -->
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="color: #333; margin-bottom: 5px;">⚙️ 个人设置</h1>
          <p style="color: #666; margin: 0;">管理您的个人偏好和设置</p>
        </div>
        <button @click="backToDashboard" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
          返回仪表盘
        </button>
      </div>

      <!-- 个人信息 -->
      <div style="background: white; padding: 25px; border-radius: 16px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
          📋 个人信息
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">用户名</label>
            <input v-model="userInfo.username" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;" placeholder="输入用户名">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">邮箱</label>
            <input v-model="userInfo.email" type="email" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;" placeholder="输入邮箱">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">手机号</label>
            <input v-model="userInfo.phone" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;" placeholder="输入手机号">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">生日</label>
            <input v-model="userInfo.birthday" type="date" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">个人简介</label>
          <textarea v-model="userInfo.bio" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; min-height: 80px;" placeholder="介绍一下自己..."></textarea>
        </div>
        
        <button @click="saveUserInfo" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          保存个人信息
        </button>
      </div>

      <!-- 通知设置 -->
      <div style="background: white; padding: 25px; border-radius: 16px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
          🔔 通知设置
        </h2>
        
        <div style="display: grid; gap: 15px;">
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" v-model="notifications.email" style="width: 18px; height: 18px;">
            <div>
              <div style="color: #374151; font-weight: 500;">邮件通知</div>
              <div style="color: #6b7280; font-size: 14px;">接收重要更新的邮件通知</div>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" v-model="notifications.taskReminder" style="width: 18px; height: 18px;">
            <div>
              <div style="color: #374151; font-weight: 500;">任务提醒</div>
              <div style="color: #6b7280; font-size: 14px;">任务截止前的提醒通知</div>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" v-model="notifications.calendarAlert" style="width: 18px; height: 18px;">
            <div>
              <div style="color: #374151; font-weight: 500;">日程提醒</div>
              <div style="color: #6b7280; font-size: 14px;">日程开始前的提醒通知</div>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" v-model="notifications.healthReminder" style="width: 18px; height: 18px;">
            <div>
              <div style="color: #374151; font-weight: 500;">健康提醒</div>
              <div style="color: #6b7280; font-size: 14px;">运动和健康相关提醒</div>
            </div>
          </label>
        </div>
        
        <button @click="saveNotifications" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          保存通知设置
        </button>
      </div>

      <!-- 界面设置 -->
      <div style="background: white; padding: 25px; border-radius: 16px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
          🎨 界面设置
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">主题颜色</label>
            <select v-model="appearance.theme" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
              <option value="blue">蓝色主题</option>
              <option value="green">绿色主题</option>
              <option value="purple">紫色主题</option>
              <option value="dark">深色主题</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">语言设置</label>
            <select v-model="appearance.language" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; gap: 15px; margin-bottom: 20px;">
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" v-model="appearance.darkMode" style="width: 18px; height: 18px;">
            <div>
              <div style="color: #374151; font-weight: 500;">深色模式</div>
              <div style="color: #6b7280; font-size: 14px;">启用深色界面模式</div>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" v-model="appearance.compactMode" style="width: 18px; height: 18px;">
            <div>
              <div style="color: #374151; font-weight: 500;">紧凑模式</div>
              <div style="color: #6b7280; font-size: 14px;">使用更紧凑的界面布局</div>
            </div>
          </label>
        </div>
        
        <button @click="saveAppearance" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          保存界面设置
        </button>
      </div>

      <!-- 隐私与安全 -->
      <div style="background: white; padding: 25px; border-radius: 16px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
          🔒 隐私与安全
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">当前密码</label>
            <input v-model="security.currentPassword" type="password" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;" placeholder="输入当前密码">
          </div>
          <div>
            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500;">新密码</label>
            <input v-model="security.newPassword" type="password" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;" placeholder="输入新密码">
          </div>
        </div>
        
        <div style="display: grid; gap: 15px; margin-bottom: 20px;">
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" v-model="security.twoFactorAuth" style="width: 18px; height: 18px;">
            <div>
              <div style="color: #374151; font-weight: 500;">双因素认证</div>
              <div style="color: #6b7280; font-size: 14px;">启用额外的安全验证</div>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" v-model="privacy.dataAnalytics" style="width: 18px; height: 18px;">
            <div>
              <div style="color: #374151; font-weight: 500;">数据分析</div>
              <div style="color: #6b7280; font-size: 14px;">允许系统收集使用数据以改进服务</div>
            </div>
          </label>
        </div>
        
        <button @click="saveSecurity" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          保存安全设置
        </button>
      </div>

      <!-- 数据管理 -->
      <div style="background: white; padding: 25px; border-radius: 16px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
          💾 数据管理
        </h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <button @click="exportData" style="padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">
            📤 导出数据
          </button>
          
          <button @click="importData" style="padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
            📥 导入数据
          </button>
          
          <button @click="backupData" style="padding: 12px; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer;">
            💾 备份数据
          </button>
          
          <button @click="clearData" style="padding: 12px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
            🗑️ 清除数据
          </button>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>数据提示：</strong>建议定期备份您的数据，以防数据丢失。导出的数据采用JSON格式，便于在其他设备上恢复。
          </p>
        </div>
      </div>

      <!-- 关于 -->
      <div style="background: white; padding: 25px; border-radius: 16px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
          ℹ️ 关于应用
        </h2>
        
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 20px;">🏠</div>
          <h3 style="color: #333; margin-bottom: 10px;">个人管理应用</h3>
          <p style="color: #666; margin-bottom: 20px;">版本 1.0.0</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px;">
            <div style="padding: 10px; background: #f9fafb; border-radius: 8px;">
              <div style="color: #667eea; font-weight: 500; margin-bottom: 5px;">📋 任务</div>
              <div style="color: #666; font-size: 14px;">{{ taskCount }} 个</div>
            </div>
            <div style="padding: 10px; background: #f9fafb; border-radius: 8px;">
              <div style="color: #667eea; font-weight: 500; margin-bottom: 5px;">📅 日程</div>
              <div style="color: #666; font-size: 14px;">{{ eventCount }} 个</div>
            </div>
            <div style="padding: 10px; background: #f9fafb; border-radius: 8px;">
              <div style="color: #667eea; font-weight: 500; margin-bottom: 5px;">📚 笔记</div>
              <div style="color: #666; font-size: 14px;">{{ noteCount }} 篇</div>
            </div>
            <div style="padding: 10px; background: #f9fafb; border-radius: 8px;">
              <div style="color: #667eea; font-weight: 500; margin-bottom: 5px;">💰 交易</div>
              <div style="color: #666; font-size: 14px;">{{ transactionCount }} 笔</div>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
            © 2024 个人管理应用. 保留所有权利.
          </p>
          
          <div style="display: flex; justify-content: center; gap: 15px;">
            <button @click="showHelp" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
              帮助中心
            </button>
            <button @click="contactSupport" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
              联系支持
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        username: '张三',
        email: 'zhangsan@example.com',
        phone: '13800138000',
        birthday: '1990-01-01',
        bio: '这是一个功能强大的个人管理应用，帮助您更好地管理生活和工作。'
      },
      notifications: {
        email: true,
        taskReminder: true,
        calendarAlert: true,
        healthReminder: false
      },
      appearance: {
        theme: 'blue',
        language: 'zh-CN',
        darkMode: false,
        compactMode: false
      },
      security: {
        currentPassword: '',
        newPassword: '',
        twoFactorAuth: false,
        dataAnalytics: true
      },
      privacy: {
        dataAnalytics: true,
        publicProfile: false
      },
      taskCount: 4,
      eventCount: 8,
      noteCount: 15,
      transactionCount: 23
    }
  },
  methods: {
    saveUserInfo() {
      alert('个人信息已保存！')
    },
    saveNotifications() {
      alert('通知设置已保存！')
    },
    saveAppearance() {
      alert('界面设置已保存！')
    },
    saveSecurity() {
      if (!this.security.currentPassword || !this.security.newPassword) {
        alert('请输入当前密码和新密码')
        return
      }
      alert('安全设置已保存！')
      this.security.currentPassword = ''
      this.security.newPassword = ''
    },
    exportData() {
      const data = {
        userInfo: this.userInfo,
        notifications: this.notifications,
        appearance: this.appearance,
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `personal-app-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('数据已导出！')
    },
    importData() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result)
              alert('数据导入成功！')
              console.log('导入的数据:', data)
            } catch (error) {
              alert('导入失败，请检查文件格式！')
            }
          }
          reader.readAsText(file)
        }
      }
      input.click()
    },
    backupData() {
      alert('数据备份功能开发中...')
    },
    clearData() {
      if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        if (confirm('请再次确认：真的要清除所有数据吗？')) {
          alert('所有数据已清除！')
          // 这里可以清除本地存储的数据
          localStorage.clear()
          location.reload()
        }
      }
    },
    showHelp() {
      alert('帮助中心功能开发中...')
    },
    contactSupport() {
      alert('联系支持：support@personal-app.com')
    },
    backToDashboard() {
      this.$router.push('/dashboard')
    }
  }
}
</script>