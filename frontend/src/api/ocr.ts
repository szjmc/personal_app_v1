import request from './request'

export interface OCRImage {
  id: string
  title: string
  image_url: string
  original_filename: string
  file_size: number
  file_size_display: string
  extracted_text: string
  confidence_score: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  ocr_provider: string
  processing_time?: number
  tags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface OCRUploadData {
  title: string
  image: File
  tags?: string[]
  metadata?: Record<string, any>
}

export interface OCRFilterParams {
  status?: string
  tags?: string
  keyword?: string
  page?: number
  page_size?: number
}

export const ocrApi = {
  // 获取OCR图片列表
  getImages(params?: OCRFilterParams) {
    return request.get<{
      results: OCRImage[]
      count: number
      next: string
      previous: string
    }>('/api/ocr/', { params })
  },

  // 上传图片进行OCR识别
  uploadImage(formData: FormData) {
    return request.post<OCRImage>('/api/ocr/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取单个OCR图片详情
  getImage(id: string) {
    return request.get<OCRImage>(`/api/ocr/${id}/`)
  },

  // 更新OCR图片信息
  updateImage(id: string, data: Partial<OCRImage>) {
    return request.patch<OCRImage>(`/api/ocr/${id}/`, data)
  },

  // 删除OCR图片
  deleteImage(id: string) {
    return request.delete(`/api/ocr/${id}/`)
  },

  // 手动重新处理OCR识别
  processImage(id: string) {
    return request.post<OCRImage>(`/api/ocr/${id}/process/`)
  },

  // 导出OCR识别文本
  exportText(id: string, format: 'txt' | 'json' = 'txt') {
    return request.get(`/api/ocr/${id}/export/?format=${format}`, {
      responseType: 'blob'
    })
  },

  // 批量OCR处理
  batchProcess(imageIds: string[]) {
    return request.post<{
      processed: number
      errors: number
      results: Array<{
        id: string
        success: boolean
        status: string
      }>
      error_details: Array<{
        id: string
        error: string
      }>
    }>('/api/ocr/batch-process/', { image_ids: imageIds })
  },

  // 获取OCR统计信息
  getStatistics() {
    return request.get<{
      total: number
      completed: number
      processing: number
      failed: number
      pending: number
    }>('/api/ocr/statistics/')
  }
}