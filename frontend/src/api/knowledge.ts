import request from '@/utils/request'

export interface Note {
  id: number
  title: string
  content: string
  format_type: 'rich' | 'markdown'
  tags: string[]
  created_at: string
  updated_at: string
  linked_notes: number[]
  author: number
}

export interface FileResource {
  id: number
  name: string
  file_type: string
  file_size: number
  file_path: string
  uploaded_at: string
  uploader: number
}

export interface NoteVersion {
  id: number
  note: number
  version_number: number
  content: string
  modified_by: number
  modified_at: string
  change_summary: string
}

export interface NoteLink {
  id: number
  source_note: number
  target_note: number
  link_text: string
  created_at: string
}

// 笔记管理
export const noteApi = {
  // 获取笔记列表
  getList: (params?: { search?: string; tags?: string[]; page?: number }) =>
    request.get('/api/knowledge/notes/', { params }),
  
  // 获取笔记详情
  getDetail: (id: number) =>
    request.get(`/api/knowledge/notes/${id}/`),
  
  // 创建笔记
  create: (data: Partial<Note>) =>
    request.post('/api/knowledge/notes/', data),
  
  // 更新笔记
  update: (id: number, data: Partial<Note>) =>
    request.put(`/api/knowledge/notes/${id}/`, data),
  
  // 删除笔记
  delete: (id: number) =>
    request.delete(`/api/knowledge/notes/${id}/`),
  
  // 搜索双向链接
  searchLinks: (query: string) =>
    request.get('/api/knowledge/notes/search-links/', { params: { query } }),
  
  // 获取链接笔记
  getLinkedNotes: (id: number) =>
    request.get(`/api/knowledge/notes/${id}/links/`),
  
  // 创建双向链接
  createLink: (sourceId: number, targetId: number, linkText: string) =>
    request.post('/api/knowledge/notes/create-link/', {
      source_note: sourceId,
      target_note: targetId,
      link_text: linkText
    })
}

// 文件资源管理
export const fileApi = {
  // 获取文件列表
  getList: (params?: { file_type?: string; page?: number }) =>
    request.get('/api/knowledge/files/', { params }),
  
  // 上传文件
  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return request.post('/api/knowledge/files/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  },
  
  // 删除文件
  delete: (id: number) =>
    request.delete(`/api/knowledge/files/${id}/`),
  
  // 获取文件URL
  getUrl: (id: number) =>
    request.get(`/api/knowledge/files/${id}/url/`)
}

// 版本管理
export const versionApi = {
  // 获取笔记版本历史
  getHistory: (noteId: number) =>
    request.get(`/api/knowledge/notes/${noteId}/versions/`),
  
  // 获取版本详情
  getVersion: (noteId: number, versionId: number) =>
    request.get(`/api/knowledge/notes/${noteId}/versions/${versionId}/`),
  
  // 恢复版本
  restore: (noteId: number, versionId: number) =>
    request.post(`/api/knowledge/notes/${noteId}/versions/${versionId}/restore/`)
}

// OCR识别
export const ocrApi = {
  // 上传图片进行OCR识别
  recognize: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    
    return request.post('/api/knowledge/ocr/recognize/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 搜索OCR内容
  search: (query: string) =>
    request.get('/api/knowledge/ocr/search/', { params: { query } })
}