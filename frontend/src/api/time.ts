import api from './auth'

// 时间管理API
export const timeApi = {
  // 日历管理
  getCalendars: () => 
    api.get('/api/time/calendars/'),
  
  createCalendar: (data: any) => 
    api.post('/api/time/calendars/', data),
  
  updateCalendar: (id: string, data: any) => 
    api.patch(`/api/time/calendars/${id}/`, data),
  
  deleteCalendar: (id: string) => 
    api.delete(`/api/time/calendars/${id}/`),
  
  // 日程事件
  getEvents: (params?: any) => 
    api.get('/api/time/events/', { params }),
  
  getEvent: (id: string) => 
    api.get(`/api/time/events/${id}/`),
  
  createEvent: (data: any) => 
    api.post('/api/time/events/', data),
  
  updateEvent: (id: string, data: any) => 
    api.patch(`/api/time/events/${id}/`, data),
  
  deleteEvent: (id: string) => 
    api.delete(`/api/time/events/${id}/`),
  
  getTodayEvents: () => 
    api.get('/api/time/events/today/'),
  
  // 时间记录
  getTimeRecords: (params?: any) => 
    api.get('/api/time/time-records/', { params }),
  
  createTimeRecord: (data: any) => 
    api.post('/api/time/time-records/', data),
  
  updateTimeRecord: (id: string, data: any) => 
    api.patch(`/api/time/time-records/${id}/`, data),
  
  deleteTimeRecord: (id: string) => 
    api.delete(`/api/time/time-records/${id}/`),
  
  // 番茄钟
  getPomodoroSessions: () => 
    api.get('/api/time/pomodoro/'),
  
  createPomodoroSession: (data: any) => 
    api.post('/api/time/pomodoro/', data),
  
  updatePomodoroSession: (id: string, data: any) => 
    api.patch(`/api/time/pomodoro/${id}/`, data),
  
  completePomodoroSession: (id: string) => 
    api.post(`/api/time/pomodoro/${id}/complete/`),
  
  // 效率分析
  getEfficiencyRecords: (params?: any) => 
    api.get('/api/time/efficiency/', { params }),
  
  getTodayEfficiency: () => 
    api.get('/api/time/efficiency/today/'),
  
  getWeeklyEfficiency: () => 
    api.get('/api/time/efficiency/weekly/')
}