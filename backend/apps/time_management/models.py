from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Calendar(models.Model):
    """日历模型"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='日历名称')
    description = models.TextField(blank=True, verbose_name='描述')
    color = models.CharField(max_length=7, default='#1890ff', verbose_name='颜色')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calendars')
    is_default = models.BooleanField(default=False, verbose_name='是否默认')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'calendars'
        verbose_name = '日历'
        verbose_name_plural = '日历'

    def __str__(self):
        return self.name


class Event(models.Model):
    """日程事件模型"""
    EVENT_TYPES = [
        ('work', '工作'),
        ('life', '生活'),
        ('health', '健康'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name='标题')
    description = models.TextField(blank=True, verbose_name='描述')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='work', verbose_name='类型')
    
    # 时间相关
    start_time = models.DateTimeField(verbose_name='开始时间')
    end_time = models.DateTimeField(verbose_name='结束时间')
    timezone_offset = models.IntegerField(default=0, verbose_name='时区偏移（分钟）')
    is_all_day = models.BooleanField(default=False, verbose_name='是否全天')
    
    # 位置和参与人
    location = models.CharField(max_length=200, blank=True, verbose_name='地点')
    participants = models.ManyToManyField(User, related_name='participated_events', blank=True)
    
    # 关联
    calendar = models.ForeignKey(Calendar, on_delete=models.CASCADE, related_name='events')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    
    # 提醒设置
    reminder_minutes = models.IntegerField(default=15, verbose_name='提醒时间（分钟）')
    reminder_sent = models.BooleanField(default=False, verbose_name='是否已提醒')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'events'
        verbose_name = '日程事件'
        verbose_name_plural = '日程事件'
        ordering = ['start_time']

    def __str__(self):
        return self.title


class TimeRecord(models.Model):
    """时间追踪记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='time_records')
    task = models.ForeignKey(
        'tasks.Task', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='time_records'
    )
    description = models.CharField(max_length=200, verbose_name='描述')
    start_time = models.DateTimeField(verbose_name='开始时间')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='结束时间')
    duration_minutes = models.IntegerField(null=True, blank=True, verbose_name='时长（分钟）')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'time_records'
        verbose_name = '时间记录'
        verbose_name_plural = '时间记录'
        ordering = ['-start_time']

    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            from datetime import timedelta
            self.duration_minutes = int((self.end_time - self.start_time).total_seconds() / 60)
        super().save(*args, **kwargs)


class PomodoroSession(models.Model):
    """番茄钟会话"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pomodoro_sessions')
    task = models.ForeignKey(
        'tasks.Task', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='pomodoro_sessions'
    )
    
    # 番茄钟设置
    work_duration = models.IntegerField(default=25, verbose_name='工作时长（分钟）')
    break_duration = models.IntegerField(default=5, verbose_name='休息时长（分钟）')
    long_break_duration = models.IntegerField(default=15, verbose_name='长休息时长（分钟）')
    
    # 会话状态
    sessions_completed = models.IntegerField(default=0, verbose_name='已完成会话数')
    current_session_type = models.CharField(
        max_length=20,
        choices=[
            ('work', '工作时间'),
            ('break', '短休息'),
            ('long_break', '长休息'),
        ],
        default='work',
        verbose_name='当前会话类型'
    )
    
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, verbose_name='是否活跃')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pomodoro_sessions'
        verbose_name = '番茄钟会话'
        verbose_name_plural = '番茄钟会话'
        ordering = ['-created_at']


class EfficiencyRecord(models.Model):
    """效率记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='efficiency_records')
    date = models.DateField(verbose_name='日期')
    focus_hours = models.FloatField(default=0, verbose_name='专注时长（小时）')
    tasks_completed = models.IntegerField(default=0, verbose_name='完成任务数')
    tasks_planned = models.IntegerField(default=0, verbose_name='计划任务数')
    efficiency_score = models.FloatField(default=0, verbose_name='效率评分')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'efficiency_records'
        verbose_name = '效率记录'
        verbose_name_plural = '效率记录'
        unique_together = ['user', 'date']
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if self.tasks_planned > 0:
            # 效率评分计算：(专注时长/8小时×50% + 完成任务数/计划任务数×50%)×100
            time_score = min(self.focus_hours / 8, 1) * 50  # 最高50分
            task_score = (self.tasks_completed / self.tasks_planned) * 50  # 最高50分
            self.efficiency_score = time_score + task_score
        super().save(*args, **kwargs)