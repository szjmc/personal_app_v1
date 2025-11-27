from django.contrib import admin
from .models import Calendar, Event, TimeRecord, PomodoroSession, EfficiencyRecord


@admin.register(Calendar)
class CalendarAdmin(admin.ModelAdmin):
    list_display = ('name', 'creator', 'is_default', 'created_at')
    list_filter = ('is_default', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('is_default',)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'event_type', 'start_time', 'end_time', 'calendar')
    list_filter = ('event_type', 'is_all_day', 'calendar')
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'start_time'
    raw_id_fields = ('creator', 'calendar')
    filter_horizontal = ('participants',)


@admin.register(TimeRecord)
class TimeRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'description', 'start_time', 'end_time', 'duration_minutes')
    list_filter = ('start_time',)
    search_fields = ('description',)
    date_hierarchy = 'start_time'
    raw_id_fields = ('user', 'task')


@admin.register(PomodoroSession)
class PomodoroSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_session_type', 'sessions_completed', 'start_time', 'is_active')
    list_filter = ('current_session_type', 'is_active')
    date_hierarchy = 'start_time'
    raw_id_fields = ('user', 'task')


@admin.register(EfficiencyRecord)
class EfficiencyRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'focus_hours', 'tasks_completed', 'efficiency_score')
    list_filter = ('date',)
    date_hierarchy = 'date'
    raw_id_fields = ('user',)