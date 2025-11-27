<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <el-aside class="sidebar" :width="isCollapse ? '64px' : '240px'">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon :size="28" v-if="isCollapse">
            <House />
          </el-icon>
          <span v-else>个人管理</span>
        </div>
      </div>
      
      <el-menu
        :default-active="$route.name as string"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="Dashboard">
          <el-icon><House /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        
        <el-sub-menu index="tasks">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>任务管理</span>
          </template>
          <el-menu-item index="Tasks">任务看板</el-menu-item>
          <el-menu-item index="TaskList">任务列表</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="time">
          <template #title>
            <el-icon><Clock /></el-icon>
            <span>时间管理</span>
          </template>
          <el-menu-item index="Calendar">日历管理</el-menu-item>
          <el-menu-item index="Pomodoro">番茄钟</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="knowledge">
          <template #title>
            <el-icon><Reading /></el-icon>
            <span>知识管理</span>
          </template>
          <el-menu-item index="Knowledge">知识库</el-menu-item>
        </el-sub-menu>
        </el-sub-menu>
        
        <el-sub-menu index="life">
          <template #title>
            <el-icon><Operation /></el-icon>
            <span>生活管理</span>
          </template>
          <el-menu-item index="Express">快递管理</el-menu-item>
          <el-menu-item index="Health">健康管理</el-menu-item>
          <el-menu-item index="Finance">财务管理</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="Profile">
          <el-icon><Setting /></el-icon>
          <template #title>个人设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            type="text"
            @click="toggleSidebar"
            class="collapse-btn"
          >
            <el-icon :size="20">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </el-button>
          
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ name: 'Dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRouteTitle">
              {{ currentRouteTitle }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- 通知 -->
          <el-badge :value="3" class="notification-badge">
            <el-button type="text" class="header-btn">
              <el-icon :size="18">
                <Bell />
              </el-icon>
            </el-button>
          </el-badge>
          
          <!-- 用户菜单 -->
          <el-dropdown @command="handleUserCommand" class="user-dropdown">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.user?.avatar" />
              <span class="username">{{ userStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

// 计算属性
const currentRouteTitle = computed(() => route.meta.title as string)

// 方法
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push({ name: 'Profile' })
      break
    case 'logout':
      userStore.logout()
      break
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
  display: flex;
}

.sidebar {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: width 0.3s ease;
  overflow: hidden;
  
  .sidebar-header {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .logo {
      display: flex;
      align-items: center;
      color: white;
      font-size: 18px;
      font-weight: 600;
      
      span {
        margin-left: 10px;
      }
    }
  }
  
  .sidebar-menu {
    border: none;
    background: transparent;
    
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
      }
    }
    
    :deep(.el-menu-item.is-active) {
      color: white;
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .collapse-btn {
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
    
    .breadcrumb {
      :deep(.el-breadcrumb__inner) {
        color: rgba(255, 255, 255, 0.8);
        
        &:hover {
          color: white;
        }
      }
      
      :deep(.el-breadcrumb__separator) {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .notification-badge {
      .header-btn {
        color: white;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
    
    .user-dropdown {
      cursor: pointer;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        
        .username {
          font-size: 14px;
        }
      }
    }
  }
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>