<template>
  <div style="padding: 20px; min-height: 100vh; background: #f0f0f0;">
    <h1>测试页面</h1>
    <p>如果你能看到这个页面，说明Vue应用正常运行</p>
    
    <input v-model="message" placeholder="输入一些文字" style="padding: 10px; margin: 10px; width: 300px;">
    <p>你输入了: {{ message }}</p>
    
    <button @click="showAlert" style="padding: 10px 20px; background: blue; color: white; border: none; cursor: pointer;">
      点击我测试
    </button>
    
    <br><br>
    
    <button @click="goToDashboard" style="padding: 10px 20px; background: green; color: white; border: none; cursor: pointer;">
      跳转到仪表盘
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: ''
    }
  },
  methods: {
    showAlert() {
      alert('按钮点击成功！')
      console.log('按钮被点击了')
    },
    goToDashboard() {
      console.log('准备跳转到仪表盘')
      this.$router.push('/dashboard')
    }
  }
}
</script>