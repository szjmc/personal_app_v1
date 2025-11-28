import api from './auth'

// 时间管理API
export const timeApi = {
  // 日历管理
  getCalendars: () => 
    api.get('/time/calendars/'),
  
  createCalendar: (data: any) => 
    api.post('/time/calendars/', data),
  
  updateCalendar: (id: string, data: any) => 
    api.patch(`/time/calendars/${id}/`, data),
  
  deleteCalendar: (id: string) => 
    api.delete(`/time/calendars/${id}/`),
  
  // 日程事件
  getEvents: (params?: any) => 
    api.get('/time/events/', { params }),
  
  getEvent: (id: string) => 
    api.get(`/time/events/${id}/`),
  
  createEvent: (data: any) => 
    api.post('/time/events/', data),
  
  updateEvent: (id: string, data: any) => 
    api.patch(`/time/events/${id}/`, data),
  
  deleteEvent: (id: string) => 
    api.delete(`/time/events/${id}/`),
  
  getTodayEvents: () => 
    api.get('/time/events/today/'),
  
  // 时间记录
  getTimeRecords: (params?: any) => 
    api.get('/time/time-records/', { params }),
  
  createTimeRecord: (data: any) => 
    api.post('/time/time-records/', data),
  
  updateTimeRecord: (id: string, data: any) => 
    api.patch(`/time/time-records/${id}/`, data),
  
  deleteTimeRecord: (id: string) => 
    api.delete(`/time/time-records/${id}/`),
  
  // 番茄钟
  getPomodoroSessions: () => 
    api.get('/time/pomodoro/'),
  
  createPomodoroSession: (data: any) => 
    api.post('/time/pomodoro/', data),
  
  updatePomodoroSession: (id: string, data: any) => 
    api.patch(`/time/pomodoro/${id}/`, data),
  
  completePomodoroSession: (id: string) => 
    api.post(`/time/pomodoro/${id}/complete/`),
  
  // 效率分析
  getEfficiencyRecords: (params?: any) => 
    api.get('/time/efficiency/', { params }),
  
  getTodayEfficiency: () => 
    api.get('/time/efficiency/today/'),
  
  getWeeklyEfficiency: () => 
    api.get('/time/efficiency/weekly/')
}