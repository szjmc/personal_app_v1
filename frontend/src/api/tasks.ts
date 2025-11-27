import api from './auth'

// 任务管理API
export const tasksApi = {
  // 获取任务列表
  getTasks: (params?: any) => 
    api.get('/api/tasks/tasks/', { params }),
  
  // 获取任务详情
  getTask: (id: string) => 
    api.get(`/api/tasks/tasks/${id}/`),
  
  // 创建任务
  createTask: (data: any) => 
    api.post('/api/tasks/tasks/', data),
  
  // 更新任务
  updateTask: (id: string, data: any) => 
    api.patch(`/api/tasks/tasks/${id}/`, data),
  
  // 删除任务
  deleteTask: (id: string) => 
    api.delete(`/api/tasks/tasks/${id}/`),
  
  // 获取看板数据
  getBoard: () => 
    api.get('/api/tasks/tasks/board/'),
  
  // 更新任务状态
  updateStatus: (id: string, status: string) => 
    api.post(`/api/tasks/tasks/${id}/update_status/`, { status }),
  
  // 添加评论
  addComment: (id: string, content: string) => 
    api.post(`/api/tasks/tasks/${id}/add_comment/`, { content }),
  
  // 上传文件
  uploadFile: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/api/tasks/tasks/${id}/upload_file/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 添加依赖
  addDependency: (id: string, dependsOnId: string) => 
    api.post(`/api/tasks/tasks/${id}/add_dependency/`, { depends_on_id: dependsOnId }),
  
  // 获取任务统计
  getStatistics: () => 
    api.get('/api/tasks/statistics/'),
  
  // 获取子任务列表
  getSubtasks: (taskId: string) => 
    api.get(`/api/tasks/tasks/${taskId}/subtasks/`),
  
  // 获取评论列表
  getComments: (taskId: string) => 
    api.get(`/api/tasks/tasks/${taskId}/comments/`),
  
  // 获取今日任务
  getTodayTasks: () => 
    api.get('/api/tasks/tasks/today/'),
  
  // 获取待办任务
  getTodoTasks: () => 
    api.get('/api/tasks/tasks/todo/'),
  
  // 获取已完成任务
  getCompletedTasks: () => 
    api.get('/api/tasks/tasks/completed/')
}

// 项目管理API
export const projectsApi = {
  // 获取项目列表
  getProjects: (params?: any) => 
    api.get('/api/tasks/projects/', { params }),
  
  // 获取项目详情
  getProject: (id: string) => 
    api.get(`/api/tasks/projects/${id}/`),
  
  // 创建项目
  createProject: (data: any) => 
    api.post('/api/tasks/projects/', data),
  
  // 更新项目
  updateProject: (id: string, data: any) => 
    api.patch(`/api/tasks/projects/${id}/`, data),
  
  // 删除项目
  deleteProject: (id: string) => 
    api.delete(`/api/tasks/projects/${id}/`),
  
  // 添加成员
  addMember: (id: string, email: string) => 
    api.post(`/api/tasks/projects/${id}/add_member/`, { email }),
  
  // 移除成员
  removeMember: (id: string, email: string) => 
    api.post(`/api/tasks/projects/${id}/remove_member/`, { email })
}