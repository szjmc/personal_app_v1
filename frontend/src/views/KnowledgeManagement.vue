<template>
  <div style="padding: 20px; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 1200px; margin: 0 auto;">
      <!-- 头部 -->
      <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="color: #333; margin-bottom: 5px;">📚 知识库</h1>
          <p style="color: #666; margin: 0;">记录和管理您的知识笔记</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button @click="showAddNote = true" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
            + 新建笔记
          </button>
          <button @click="backToDashboard" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
            返回仪表盘
          </button>
        </div>
      </div>

      <!-- 筛选和搜索 -->
      <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
        <select v-model="filterCategory" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="all">全部分类</option>
          <option value="技术">技术</option>
          <option value="学习">学习</option>
          <option value="工作">工作</option>
          <option value="生活">生活</option>
          <option value="创意">创意</option>
        </select>
        
        <select v-model="sortBy" style="padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="updated">最近更新</option>
          <option value="created">创建时间</option>
          <option value="title">标题</option>
        </select>
        
        <input v-model="searchText" placeholder="搜索笔记..." style="padding: 8px; border: 1px solid #ddd; border-radius: 6px; flex: 1; min-width: 200px;">
        
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="display: flex; align-items: center; gap: 5px;">
            <input type="checkbox" v-model="viewMode" value="grid">
            <span>网格</span>
          </label>
          <label style="display: flex; align-items: center; gap: 5px;">
            <input type="checkbox" v-model="viewMode" value="list">
            <span>列表</span>
          </label>
        </div>
      </div>

      <!-- 笔记统计 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #667eea; margin: 0 0 10px 0;">{{ totalNotes }}</h3>
          <p style="color: #666; margin: 0;">总笔记数</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #10b981; margin: 0 0 10px 0;">{{ categories }}</h3>
          <p style="color: #666; margin: 0;">分类数量</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #f59e0b; margin: 0 0 10px 0;">{{ favoriteNotes }}</h3>
          <p style="color: #666; margin: 0;">收藏笔记</p>
        </div>
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="color: #8b5cf6; margin: 0 0 10px 0;">{{ recentNotes }}</h3>
          <p style="color: #666; margin: 0;">最近7天</p>
        </div>
      </div>

      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
        <div v-for="note in filteredNotes" :key="note.id" @click="viewNote(note)" style="background: white; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; border: 2px solid transparent;" 
             @mouseover="$event.currentTarget.style.borderColor = '#667eea'" 
             @mouseleave="$event.currentTarget.style.borderColor = 'transparent'">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <span :style="{ color: getCategoryColor(note.category) }" style="padding: 4px 8px; background: #f3f4f6; border-radius: 12px; font-size: 12px;">
              {{ note.category }}
            </span>
            <div style="display: flex; gap: 5px;">
              <button @click.stop="toggleFavorite(note)" style="background: none; border: none; cursor: pointer; font-size: 16px;">
                {{ note.isFavorite ? '⭐' : '☆' }}
              </button>
              <button @click.stop="deleteNote(note)" style="background: none; border: none; cursor: pointer; color: #ef4444;">
                ×
              </button>
            </div>
          </div>
          
          <h3 style="color: #333; margin: 0 0 8px 0; font-size: 16px;">{{ note.title }}</h3>
          <p style="color: #666; margin: 0 0 10px 0; font-size: 14px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            {{ note.content }}
          </p>
          <div style="color: #9ca3af; font-size: 12px; display: flex; justify-content: space-between;">
            <span>📅 {{ note.updatedAt }}</span>
            <span v-if="note.tags">🏷️ {{ note.tags.slice(0, 2).join(', ') }}{{ note.tags.length > 2 ? '...' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else style="display: grid; gap: 15px;">
        <div v-for="note in filteredNotes" :key="note.id" @click="viewNote(note)" style="background: white; padding: 20px; border-radius: 12px; cursor: pointer; display: flex; gap: 20px; align-items: center;">
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <h3 style="color: #333; margin: 0; font-size: 18px;">{{ note.title }}</h3>
              <div style="display: flex; gap: 10px; align-items: center;">
                <span :style="{ color: getCategoryColor(note.category) }" style="padding: 4px 8px; background: #f3f4f6; border-radius: 12px; font-size: 12px;">
                  {{ note.category }}
                </span>
                <button @click.stop="toggleFavorite(note)" style="background: none; border: none; cursor: pointer; font-size: 16px;">
                  {{ note.isFavorite ? '⭐' : '☆' }}
                </button>
                <button @click.stop="deleteNote(note)" style="background: none; border: none; cursor: pointer; color: #ef4444;">
                  ×
                </button>
              </div>
            </div>
            <p style="color: #666; margin: 0 0 10px 0; line-height: 1.4;">{{ note.content }}</p>
            <div style="color: #9ca3af; font-size: 12px; display: flex; gap: 20px;">
              <span>📅 创建: {{ note.createdAt }}</span>
              <span>🔄 更新: {{ note.updatedAt }}</span>
              <span v-if="note.tags">🏷️ {{ note.tags.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredNotes.length === 0" style="background: white; padding: 40px; border-radius: 12px; text-align: center;">
        <p style="color: #666; font-size: 16px;">📝 暂无笔记，点击上方按钮创建您的第一篇笔记</p>
      </div>
    </div>

    <!-- 添加/编辑笔记弹窗 -->
    <div v-if="showAddNote" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h2 style="color: #333; margin-top: 0;">{{ editingNote ? '编辑笔记' : '新建笔记' }}</h2>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">标题</label>
          <input v-model="newNote.title" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入笔记标题">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">内容</label>
          <textarea v-model="newNote.content" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 200px;" placeholder="输入笔记内容（支持Markdown格式）"></textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">分类</label>
            <select v-model="newNote.category" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
              <option value="技术">技术</option>
              <option value="学习">学习</option>
              <option value="工作">工作</option>
              <option value="生活">生活</option>
              <option value="创意">创意</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">标签（用逗号分隔）</label>
            <input v-model="tagsInput" @input="updateTags" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="输入标签">
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button @click="closeNoteModal" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
            取消
          </button>
          <button @click="saveNote" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
            {{ editingNote ? '更新' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showAddNote: false,
      editingNote: null,
      filterCategory: 'all',
      sortBy: 'updated',
      searchText: '',
      viewMode: 'grid',
      tagsInput: '',
      newNote: {
        title: '',
        content: '',
        category: '技术',
        tags: []
      },
      notes: [
        {
          id: 1,
          title: 'Vue.js 学习笔记',
          content: 'Vue.js 是一个渐进式的JavaScript框架，易于上手且功能强大。主要特性包括：响应式数据绑定、组件化开发、虚拟DOM等。适合构建单页面应用程序。',
          category: '技术',
          tags: ['Vue.js', '前端', 'JavaScript'],
          isFavorite: true,
          createdAt: '2024-12-15',
          updatedAt: '2024-12-18'
        },
        {
          id: 2,
          title: '项目管理经验',
          content: '项目管理的关键要素：1. 明确目标和范围 2. 合理分配资源 3. 建立有效沟通机制 4. 定期跟踪进度 5. 风险评估和应对策略',
          category: '工作',
          tags: ['管理', '项目', '经验'],
          isFavorite: false,
          createdAt: '2024-12-10',
          updatedAt: '2024-12-16'
        },
        {
          id: 3,
          title: '健康生活方式',
          content: '保持健康的生活习惯：1. 规律作息，保证充足睡眠 2. 均衡饮食，多吃蔬菜水果 3. 适量运动，每周至少3次 4. 保持良好心态，学会放松',
          category: '生活',
          tags: ['健康', '生活', '习惯'],
          isFavorite: true,
          createdAt: '2024-12-08',
          updatedAt: '2024-12-15'
        },
        {
          id: 4,
          title: '设计模式总结',
          content: '常用设计模式：单例模式、工厂模式、观察者模式、策略模式、适配器模式等。掌握设计模式能够提高代码的可维护性和扩展性。',
          category: '技术',
          tags: ['设计模式', '编程', '架构'],
          isFavorite: false,
          createdAt: '2024-12-05',
          updatedAt: '2024-12-14'
        }
      ]
    }
  },
  computed: {
    filteredNotes() {
      let filtered = this.notes
      
      if (this.filterCategory !== 'all') {
        filtered = filtered.filter(note => note.category === this.filterCategory)
      }
      
      if (this.searchText) {
        filtered = filtered.filter(note => 
          note.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
          note.content.toLowerCase().includes(this.searchText.toLowerCase()) ||
          (note.tags && note.tags.some(tag => tag.toLowerCase().includes(this.searchText.toLowerCase())))
        )
      }
      
      // 排序
      filtered.sort((a, b) => {
        if (this.sortBy === 'updated') {
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        } else if (this.sortBy === 'created') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        } else if (this.sortBy === 'title') {
          return a.title.localeCompare(b.title)
        }
        return 0
      })
      
      return filtered
    },
    totalNotes() {
      return this.notes.length
    },
    categories() {
      return [...new Set(this.notes.map(note => note.category))].length
    },
    favoriteNotes() {
      return this.notes.filter(note => note.isFavorite).length
    },
    recentNotes() {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return this.notes.filter(note => new Date(note.updatedAt) >= sevenDaysAgo).length
    }
  },
  methods: {
    saveNote() {
      if (!this.newNote.title) {
        alert('请输入笔记标题')
        return
      }
      
      if (this.editingNote) {
        // 更新笔记
        const index = this.notes.findIndex(n => n.id === this.editingNote.id)
        if (index !== -1) {
          this.notes[index] = {
            ...this.notes[index],
            ...this.newNote,
            updatedAt: this.formatDate(new Date())
          }
        }
      } else {
        // 添加新笔记
        const note = {
          id: Date.now(),
          ...this.newNote,
          isFavorite: false,
          createdAt: this.formatDate(new Date()),
          updatedAt: this.formatDate(new Date())
        }
        this.notes.unshift(note)
      }
      
      this.closeNoteModal()
    },
    editNote(note) {
      this.editingNote = note
      this.newNote = {
        title: note.title,
        content: note.content,
        category: note.category,
        tags: note.tags ? [...note.tags] : []
      }
      this.tagsInput = this.newNote.tags.join(', ')
      this.showAddNote = true
    },
    viewNote(note) {
      alert(`查看笔记: ${note.title}\n\n${note.content}`)
    },
    deleteNote(note) {
      if (confirm(`确定要删除笔记"${note.title}"吗？`)) {
        this.notes = this.notes.filter(n => n.id !== note.id)
      }
    },
    toggleFavorite(note) {
      note.isFavorite = !note.isFavorite
    },
    closeNoteModal() {
      this.showAddNote = false
      this.editingNote = null
      this.newNote = {
        title: '',
        content: '',
        category: '技术',
        tags: []
      }
      this.tagsInput = ''
    },
    updateTags() {
      this.newNote.tags = this.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
    },
    getCategoryColor(category) {
      const colors = {
        技术: '#3b82f6',
        学习: '#8b5cf6',
        工作: '#f59e0b',
        生活: '#10b981',
        创意: '#ef4444'
      }
      return colors[category] || '#667eea'
    },
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    backToDashboard() {
      this.$router.push('/dashboard')
    }
  }
}
</script>